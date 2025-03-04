const express = require('express');
const router = express.Router();
const { connection } = require('../config/config.db');
const { verificarToken } = require('./login')

//Mostrar usuarios
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

//Agregar usuario
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

//Actualizar usuario
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

//Eliminar usuario
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