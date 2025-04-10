const express = require('express');
const router = express.Router();
const { connection } = require('../config/config.db');
const { verificarToken } = require('./login');

/**
 * @swagger
 * tags:
 *   name: Horarios
 *   description: Operaciones relacionadas con la gestión de los horarios
 */

/**
 * @swagger
 * /api/horarios:
 *   get:
 *     summary: Mostrar todos los horarios
 *     tags: [Horarios]
 *     responses:
 *       200:
 *         description: Lista de todos los horarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   pk_id_horario:
 *                     type: integer
 *                     description: ID del horario
 *                   hora:
 *                     type: string
 *                     description: Hora del horario
 *                   estado:
 *                     type: string
 *                     description: Estado del horario
 *       500:
 *         description: Error al obtener los horarios
 */
//Mostrar horarios
router.get('/horarios', verificarToken, (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }

    connection.query('SELECT * FROM horarios', (error, results) => {
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        res.status(200).json(results);
    });
});

/**
 * @swagger
 * /api/horariosDisp:
 *   get:
 *     summary: Obtener todas las horas disponibles
 *     tags: [Horarios]
 *     responses:
 *       200:
 *         description: Lista de horas disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   hora:
 *                     type: string
 *                     description: Hora disponible
 *       500:
 *         description: Error al obtener las horas disponibles
 */
// Obtener todas las horas disponibles
router.get('/horariosDisp', verificarToken, (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }

    connection.query('SELECT hora FROM horarios WHERE estado = "Disponible"', (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json(results); // Devolver las horas disponibles al frontend
    });
});

/**
 * @swagger
 * /api/horarios:
 *   post:
 *     summary: Agregar un nuevo horario
 *     tags: [Horarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hora:
 *                 type: string
 *                 description: Hora del nuevo horario
 *     responses:
 *       201:
 *         description: Horario agregado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de confirmación
 *                 horarioId:
 *                   type: integer
 *                   description: ID del horario agregado
 *       400:
 *         description: Faltan datos para agregar el horario
 *       500:
 *         description: Error al agregar el horario
 */
//Agregar horario
router.post('/horarios', verificarToken, (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { hora } = req.body;
    if (!hora) {
        return res.status(400).json({ error: 'Faltan datos para agregar el horario.' });
    }

    connection.query(
        'INSERT INTO horarios (hora) VALUES (?)',
        [hora],
        (error, results) => {
            if (error) {
                res.status(500).json({ error: error.message });
                return;
            }
            res.status(201).json({
                message: 'Horario agregado correctamente.',
                horarioId: results.insertId
            });
        }
    );
});

/**
 * @swagger
 * /api/horarios/{id}:
 *   get:
 *     summary: Mostrar un horario específico
 *     tags: [Horarios]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del horario a obtener
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles del horario específico
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pk_id_horario:
 *                   type: integer
 *                   description: ID del horario
 *                 hora:
 *                   type: string
 *                   description: Hora del horario
 *                 estado:
 *                   type: string
 *                   description: Estado del horario
 *       404:
 *         description: Horario no encontrado
 *       500:
 *         description: Error al obtener el horario
 */
// Mostrar un horario específico
router.get('/horarios/:id', verificarToken, (req, res) => {
    const { id } = req.params;
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }

    connection.query('SELECT * FROM horarios WHERE pk_id_horario = ?', [id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Horario no encontrado' });
        }
        res.status(200).json(results[0]);
    });
});

/**
 * @swagger
 * /api/horarios/{id}:
 *   put:
 *     summary: Actualizar un horario existente
 *     tags: [Horarios]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del horario a actualizar
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hora:
 *                 type: string
 *                 description: Nueva hora del horario
 *               estado:
 *                 type: string
 *                 description: Nuevo estado del horario
 *     responses:
 *       200:
 *         description: Horario actualizado correctamente
 *       400:
 *         description: Datos inválidos o horario no encontrado
 *       500:
 *         description: Error al actualizar el horario
 */
//Actualizar horario
router.put('/horarios/:id', verificarToken, (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { id } = req.params;
    const { hora, estado } = req.body;
    const query = ` UPDATE horarios SET hora = ?, estado = ? WHERE pk_id_horario = ?`;
    connection.query(query, [hora, estado, id], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta: ' + err.stack);
            return res.status(500).send('Error en la consulta');
        }
        if (results.affectedRows > 0) {
            res.status(200).json({
                message: 'Horario actualizada correctamente',
                mesaId: id
            });
        } else {
            res.status(404).send('Horario no encontrada');
        }
    });
});

/**
 * @swagger
 * /api/horarios/{id}:
 *   delete:
 *     summary: Eliminar un horario
 *     tags: [Horarios]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del horario a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Horario eliminado correctamente
 *       404:
 *         description: Horario no encontrado
 *       500:
 *         description: Error al eliminar el horario
 */
//Eliminar horario
router.delete('/horarios/:id', verificarToken, async (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { id } = req.params;
    const query = 'UPDATE horarios SET estado = "Eliminado" WHERE pk_id_horario = ?';
    connection.query(
        query,
        [id],
        (err, results) => {
            if (err) {
                console.error('Error al ejecutar la consulta: ' + err.stack);
                return res.status(500).send('Error en la consulta');
            }
            if (results.affectedRows > 0) {
                res.send('Horario eliminado correctamente');
            } else {
                res.status(404).send('Horario no encontrado');
            }
        }
    );
});

module.exports = router;