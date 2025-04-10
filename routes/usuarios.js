const express = require('express');
const router = express.Router();
const { connection } = require('../config/config.db');
const { verificarToken } = require('./login');

/**
 * @swagger
 * tags:
 *   - name: Usuarios
 *     description: Operaciones relacionadas con la gestión de los usuarios
 */

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   pk_id_usuario:
 *                     type: integer
 *                     description: ID del usuario
 *                   fk_tipo:
 *                     type: integer
 *                     description: ID del tipo de usuario
 *                   nombre:
 *                     type: string
 *                     description: Nombre del usuario
 *                   apellido:
 *                     type: string
 *                     description: Apellido del usuario
 *                   correo:
 *                     type: string
 *                     description: Correo electrónico del usuario
 *                   telefono:
 *                     type: string
 *                     description: Teléfono del usuario
 *                   usuario:
 *                     type: string
 *                     description: nombre de usuario del usuario
 *                   contrasena:
 *                     type: string
 *                     description: contraseña del usuario
 *                   estado:
 *                     type: integer
 *                     description: Estado del usuario
 *       400:
 *         description: Solicitud incorrecta. Parámetros inválidos.
 *       404:
 *         description: No se encontraron usuarios.
 *       500:
 *         description: Error en el servidor al intentar obtener los usuarios.
 */

router.get('/usuarios', verificarToken ,(req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }

    connection.query('SELECT * FROM usuarios', (error, results) => {
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        res.status(200).json(results);
    });
});

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fk_tipo
 *               - nombre
 *               - correo
 *               - telefono
 *               - usuario
 *               - contrasena
 *             properties:
 *               fk_tipo:
 *                 type: string
 *                 description: El tipo de usuario (ej. admin, cliente)
 *               nombre:
 *                 type: string
 *                 description: Nombre del usuario
 *               apellido:
 *                 type: string
 *                 description: Apellido del usuario
 *               correo:
 *                 type: string
 *                 description: Correo electrónico del usuario
 *               telefono:
 *                 type: string
 *                 description: Teléfono del usuario
 *               usuario:
 *                 type: string
 *                 description: Nombre de usuario único
 *               contrasena:
 *                 type: string
 *                 description: Contraseña del usuario (se recomienda almacenarla de forma segura)
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de éxito
 *                 usuarioId:
 *                   type: integer
 *                   description: ID del nuevo usuario creado
 *       400:
 *         description: Faltan datos para crear el usuario o el tipo de usuario no existe
 *       500:
 *         description: Error interno del servidor
 */

router.post('/usuarios', verificarToken ,(req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }

    const { fk_tipo, nombre, correo, telefono, usuario, contrasena } = req.body;
    if (!fk_tipo || !nombre || !correo || !telefono || !usuario || !contrasena) {
        return res.status(400).json({ error: 'Faltan datos para agregar al usuario.' });
    }

    connection.query(
        'SELECT pk_id_tipo FROM tipo_usuario WHERE nombre = ?',
        [fk_tipo],
        (error, results) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }

            if (results.length === 0) {
                return res.status(400).json({ error: 'El tipo de usuario no existe.' });
            }

            const tipoId = results[0].pk_id_tipo;

            connection.query(
                'INSERT INTO usuarios (fk_tipo, nombre, correo, telefono, usuario, contrasena) VALUES (?, ?, ?, ?, ?, ?)',
                [tipoId, nombre, correo, telefono, usuario, contrasena],
                (error, results) => {
                    if (error) {
                        res.status(500).json({ error: error.message });
                        return;
                    }
                    res.status(201).json({
                        message: 'Usuario agregado correctamente.',
                        usuarioId: results.insertId
                    });
                }
            );
        }
    );
});

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar usuario por ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fk_tipo:
 *                 type: string
 *                 description: Tipo de usuario
 *               nombre:
 *                 type: string
 *                 description: Nombre del usuario
 *               apellido:
 *                 type: string
 *                 description: Apellido del usuario
 *               correo:
 *                 type: string
 *                 description: Correo electrónico del usuario
 *               telefono:
 *                 type: string
 *                 description: Teléfono del usuario
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al actualizar el usuario
 */
router.put('/usuarios/:id', verificarToken ,(req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { id } = req.params;
    const { fk_tipo, nombre, correo, telefono, usuario, contrasena } = req.body;
    connection.query(
        'SELECT pk_id_tipo FROM tipo_usuario WHERE nombre = ?',
        [fk_tipo],
        (error, results) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            if (results.length === 0) {
                return res.status(400).json({ error: 'El tipo de usuario no existe.' });
            }
            const tipoId = results[0].pk_id_tipo;

            const query = `UPDATE usuarios SET fk_tipo = ?, nombre = ?, correo = ?, telefono = ?, usuario = ?, contrasena = ? WHERE pk_id_usuario = ?`;
            connection.query(
                query,
                [tipoId, nombre, correo, telefono, usuario, contrasena, id],
                (err, results) => {
                    if (err) {
                        console.error('Error al ejecutar la consulta: ' + err.stack);
                        return res.status(500).send('Error en la consulta');
                    }
                    if (results.affectedRows > 0) {
                        res.send('Usuario actualizado correctamente');
                    } else {
                        res.status(404).send('Usuario no encontrado');
                    }
                }
            );
        }
    );
});

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Eliminar usuario por ID (cambio de estado)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a eliminar
 *     responses:
 *       200:
 *         description: Usuario eliminado correctamente
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al eliminar el usuario
 */
router.delete('/usuarios/:id', verificarToken ,async (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { id } = req.params;
    const query = `UPDATE usuarios SET estado = 0 WHERE pk_id_usuario = ?`;
    connection.query(
        query,
        [id],
        (err, results) => {
            if (err) {
                console.error('Error al ejecutar la consulta: ' + err.stack);
                return res.status(500).send('Error en la consulta');
            }
            if (results.affectedRows > 0) {
                res.send('Usuario eliminado correctamente');
            } else {
                res.status(404).send('Usuario no encontrado');
            }
        }
    );
});

module.exports = router;