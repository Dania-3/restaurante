const express = require('express');
const router = express.Router();
const { connection } = require('../config/config.db');
const { verificarToken } = require('./login');

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
            res.send('Mesa actualizada correctamente');
        } else {
            res.status(404).send('Mesa no encontrada');
        }
    });
});

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