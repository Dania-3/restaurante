const express = require('express');
const router = express.Router();
const { connection } = require('../config/config.db');
const { verificarToken } = require('./login');

/**
 * @swagger
 * tags:
 *   name: Mesas
 *   description: Operaciones relacionadas con la gestión de las mesas
 */

/**
 * @swagger
 * /api/mesas:
 *   get:
 *     summary: Mostrar todas las mesas
 *     tags: [Mesas]
 *     responses:
 *       200:
 *         description: Lista de todas las mesas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   pk_id_mesa:
 *                     type: integer
 *                     description: ID de la mesa
 *                   numero_mesa:
 *                     type: integer
 *                     description: Número de la mesa
 *                   seccion_mesa:
 *                     type: string
 *                     description: Sección de la mesa
 *                   capacidad:
 *                     type: integer
 *                     description: Capacidad de la mesa
 *                   estado:
 *                     type: string
 *                     description: Estado de la mesa
 *       500:
 *         description: Error al obtener las mesas
 */
//Mostrar mesas
router.get('/mesas', verificarToken,(req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }

    connection.query('SELECT * FROM mesas', (error, results) => {
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        res.status(200).json(results);
    });
});

/**
 * @swagger
 * /api/mesasDisp:
 *   get:
 *     summary: Obtener todas las mesas disponibles
 *     tags: [Mesas]
 *     responses:
 *       200:
 *         description: Lista de mesas disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   seccion_mesa:
 *                     type: string
 *                     example: A
 *                   numero_mesa:
 *                     type: integer
 *                     example: 5
 *                   capacidad:
 *                     type: integer
 *                     example: 4
 *       500:
 *         description: Error al conectar con la base de datos o ejecutar la consulta
 */

// Obtener todas las mesas
router.get('/mesasDisp', verificarToken, (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }

    connection.query('SELECT seccion_mesa, numero_mesa, capacidad FROM mesas WHERE estado = "Disponible"',
        (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json(results);
    });
});

/**
 * @swagger
 * /api/mesas:
 *   post:
 *     summary: Agregar una nueva mesa
 *     tags: [Mesas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero_mesa:
 *                 type: integer
 *                 description: Número de la mesa
 *               seccion_mesa:
 *                 type: string
 *                 description: Sección de la mesa
 *               capacidad:
 *                 type: integer
 *                 description: Capacidad de la mesa
 *     responses:
 *       201:
 *         description: Mesa agregada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de confirmación
 *                 mesaId:
 *                   type: integer
 *                   description: ID de la mesa agregada
 *       400:
 *         description: Faltan datos para agregar la mesa
 *       500:
 *         description: Error al agregar la mesa
 */
//Agregar mesas
router.post('/mesas', verificarToken,(req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { numero_mesa, seccion_mesa, capacidad } = req.body;
    if (!numero_mesa || !seccion_mesa || !capacidad) {
        return res.status(400).json({ error: 'Faltan datos para agregar la mesa.' });
    }

    connection.query(
        'INSERT INTO mesas (numero_mesa, seccion_mesa, capacidad) VALUES (?, ?, ?)',
        [numero_mesa, seccion_mesa, capacidad],
        (error, results) => {
            if (error) {
                res.status(500).json({ error: error.message });
                return;
            }
            res.status(201).json({
                message: 'Mesa agregada correctamente.',
                mesaId: results.insertId
            });
        }
    );
});

/**
 * @swagger
 * /api/mesas/{id}:
 *   put:
 *     summary: Actualizar una mesa existente
 *     tags: [Mesas]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la mesa a actualizar
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero_mesa:
 *                 type: integer
 *                 description: Número de la mesa
 *               seccion_mesa:
 *                 type: string
 *                 description: Sección de la mesa
 *               capacidad:
 *                 type: integer
 *                 description: Capacidad de la mesa
 *               estado:
 *                 type: string
 *                 description: Estado de la mesa (Disponible, Ocupado, Eliminada)
 *     responses:
 *       200:
 *         description: Mesa actualizada correctamente
 *       400:
 *         description: Datos inválidos o mesa no encontrada
 *       500:
 *         description: Error al actualizar la mesa
 */
//Actualizar mesa
router.put('/mesas/:id', verificarToken,(req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { id } = req.params;
    const { numero_mesa, seccion_mesa, capacidad, estado } = req.body;
    const query = ` UPDATE mesas SET numero_mesa = ?, seccion_mesa = ?, capacidad = ?, estado = ? WHERE pk_id_mesa = ?`;
    connection.query(query, [numero_mesa, seccion_mesa, capacidad, estado, id], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta: ' + err.stack);
            return res.status(500).send('Error en la consulta');
        }
        if (results.affectedRows > 0) {
            res.status(200).json({
                message: 'Mesa actualizada correctamente',
                mesaId: id
            });
        } else {
            res.status(404).send('Mesa no encontrada');
        }
    });
});

/**
 * @swagger
 * /api/mesas/{id}:
 *   delete:
 *     summary: Eliminar una mesa
 *     tags: [Mesas]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la mesa a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Mesa eliminada correctamente
 *       404:
 *         description: Mesa no encontrada
 *       500:
 *         description: Error al eliminar la mesa
 */
//Eliminar mesa
router.delete('/mesas/:id', verificarToken,async (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { id } = req.params;
    const query = `UPDATE mesas SET estado = "Eliminada" WHERE pk_id_mesa = ?`;
    connection.query(
        query,
        [id],
        (err, results) => {
            if (err) {
                console.error('Error al ejecutar la consulta: ' + err.stack);
                return res.status(500).send('Error en la consulta');
            }
            if (results.affectedRows > 0) {
                res.send('Mesa eliminada correctamente');
            } else {
                res.status(404).send('Mesa no encontrada');
            }
        }
    );
});

module.exports = router;