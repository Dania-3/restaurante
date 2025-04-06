const express = require('express');
const router = express.Router();
const { connection } = require('../config/config.db');

//perfil del admin

//Mostrar administradorS
router.get('/administrador', (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }

    connection.query('SELECT nombre, apellido, correo, telefono, usuario FROM usuarios WHERE usuario = "admin"',
        (error, results) => {
            if (error) {
                res.status(500).json({ error: error.message });
                return;
            }
            res.status(200).json(results);
        });
});

//Actualizar administrador
router.put('/administrador/:id', (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { id } = req.params;
    const { nombre, apellido, correo, telefono, usuario } = req.body;
    const query = `UPDATE usuarios SET nombre = ?, apellido = ?, correo = ?, telefono = ?, usuario = ? WHERE pk_id_usuario = ?`;
    connection.query(
        query,
        [nombre, apellido, correo, telefono, usuario, id],
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
});
module.exports = router;