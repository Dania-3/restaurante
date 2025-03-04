const express = require('express');
const router = express.Router();
const { connection } = require('../config/config.db');
const { verificarToken } = require('./login');

//Mostrar horarios
router.get('/horarios', verificarToken,(req, res) => {
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

//Agregar horario
router.post('/horarios', verificarToken,(req, res) => {
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

//Actualizar horario
router.put('/horarios/:id', verificarToken,(req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { id } = req.params;
    const { hora , estado  } = req.body;
    const query = ` UPDATE horarios SET hora = ?, estado = ? WHERE pk_id_horario = ?`;
    connection.query(query, [hora, estado, id], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta: ' + err.stack);
            return res.status(500).send('Error en la consulta');
        }
        if (results.affectedRows > 0) {
            res.send('Horario actualizado correctamente');
        } else {
            res.status(404).send('Horario no encontrado');
        }
    });
});

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