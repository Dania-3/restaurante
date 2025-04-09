const express = require('express');
const router = express.Router();
const { connection } = require('../config/config.db');
const { verificarToken } = require('./login');

//Mostrar reservaciones
router.get('/reservaciones', verificarToken, (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    connection.query('SELECT r.pk_id_reservacion, h.hora, CONCAT(u.nombre, " ", u.apellido) AS cliente, CONCAT(m.seccion_mesa, " - ", m.numero_mesa) AS mesa, r.fecha, r.comensales, r.comentario, r.estatus FROM reservaciones AS r JOIN mesas AS m JOIN usuarios AS u JOIN horarios AS h WHERE r.fk_usuario = u.pk_id_usuario AND r.fk_mesa = m.pk_id_mesa AND r.fk_horario = h.pk_id_horario', 
        (error, results) => {
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        res.status(200).json(results);
    });
});

//Agregar reservacion
router.post('/reservaciones', verificarToken, (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { nombre, apellido, telefono, correo, hora, fecha, mesa, comensales, comentario } = req.body;
    if (!nombre || !apellido || !telefono || !correo || !hora || !fecha || !mesa || !comensales || !comentario) {
        return res.status(400).json({ error: 'Faltan datos para agregar la reservación.' });
    }
    const mesaP = mesa.split(' - ');
    const seccion = mesaP[0];
    const numero = mesaP[1];

    connection.query(
        'SELECT pk_id_usuario FROM usuarios WHERE nombre = ? AND telefono = ?',
        [nombre, telefono],
        (error, results) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }

            if (results.length === 0) {

                connection.query(
                    'INSERT INTO usuarios (fk_tipo, nombre, apellido, correo, telefono) VALUES (2, ?, ?, ?, ?)',
                    [nombre, apellido, correo, telefono],
                    (error, results) => {
                        if (error) {
                            res.status(500).json({ error: error.message });
                            return;
                        }
                        usuarioId = results.insertId;
                        crearReservacion(usuarioId);
                    }
                );
            } else {
                usuarioId = results[0].pk_id_usuario;
                crearReservacion(usuarioId);
            }

            function crearReservacion(usuarioId) {
                connection.query(

                    'SELECT pk_id_mesa FROM mesas WHERE numero_mesa = ? AND seccion_mesa  = ?',
                    [numero, seccion],
                    (error, results) => {
                        if (error) {
                            return res.status(500).json({ error: error.message });
                        }

                        if (results.length === 0) {
                            return res.status(400).json({ error: 'La mesa no existe o no esta disponible.' });
                        }
                        const mesaId = results[0].pk_id_mesa;

                        connection.query(
                            'SELECT pk_id_horario FROM horarios WHERE hora = ?',
                            [hora],
                            (error, results) => {
                                if (error) {
                                    return res.status(500).json({ error: error.message });
                                }

                                if (results.length === 0) {
                                    return res.status(400).json({ error: 'El horario no existe o no esta disponible.' });
                                }
                                const horarioId = results[0].pk_id_horario;

                                connection.query(
                                    'INSERT INTO reservaciones (fk_usuario, fk_mesa, fk_horario, fecha, comensales, comentario, estatus) VALUES (?, ?, ?, ?, ?, ?, "Activo")',
                                    [usuarioId, mesaId, horarioId, fecha, comensales, comentario],
                                    (error, results) => {
                                        if (error) {
                                            res.status(500).json({ error: error.message });
                                            return;
                                        }
                                        const reservacionId = results.insertId;

                                        connection.query(
                                            'UPDATE mesas SET estado = "Ocupado" WHERE pk_id_mesa = ?',
                                            [mesaId],
                                            (error, results) => {
                                                if (error) {
                                                    return res.status(500).json({ error: error.message });
                                                }
                                                
                                                connection.query(
                                                    'UPDATE horarios SET estado = "Ocupado" WHERE pk_id_horario = ?',
                                                    [horarioId],
                                                    (error, results) => {
                                                        if (error) {
                                                            return res.status(500).json({ error: error.message });
                                                        }
                                                        
                                                        res.status(201).json({
                                                            message: 'Reservación agregada correctamente y mesa y horario reservados.',
                                                            reservacionId: reservacionId
                                                        });
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        }
    );
});

//actualizar reservacion
router.put('/reservaciones/:id', verificarToken,(req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { id } = req.params;
    const { nombre, telefono, hora, fecha, mesa, comensales, comentario } = req.body;

    const mesaP = mesa.split(' - ');
    const seccion = mesaP[0];
    const numero = mesaP[1];

    connection.query(
        'SELECT pk_id_usuario FROM usuarios WHERE nombre = ? AND telefono = ?',
        [nombre, telefono],
        (error, results) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }

            if (results.length === 0) {
                return res.status(400).json({ error: 'El usuario no existe.' });
            }
            const usuarioId = results[0].pk_id_usuario;

            connection.query(
                'SELECT pk_id_mesa FROM mesas WHERE numero_mesa = ? AND seccion_mesa = ?',
                [numero, seccion],
                (error, results) => {
                    if (error) {
                        return res.status(500).json({ error: error.message });
                    }

                    if (results.length === 0) {
                        return res.status(400).json({ error: 'La mesa no existe o no está disponible.' });
                    }
                    const mesaId = results[0].pk_id_mesa;

                    connection.query(
                        'SELECT pk_id_horario FROM horarios WHERE hora = ?',
                        [hora],
                        (error, results) => {
                            if (error) {
                                return res.status(500).json({ error: error.message });
                            }

                            if (results.length === 0) {
                                return res.status(400).json({ error: 'El horario no existe o no está disponible.' });
                            }
                            const horarioId = results[0].pk_id_horario;

                            connection.query(
                                'UPDATE reservaciones SET fk_usuario = ?, fk_mesa = ?, fk_horario = ?, fecha = ?, comensales = ?, comentario = ?, estatus = "Activo" WHERE pk_id_reservacion = ?',
                                [usuarioId, mesaId, horarioId, fecha, comensales, comentario, id],
                                (error, results) => {
                                    if (error) {
                                        return res.status(500).json({ error: error.message });
                                    }

                                    if (results.affectedRows === 0) {
                                        return res.status(404).json({ error: 'La reservación no fue encontrada.' });
                                    }

                                    res.status(200).json({
                                        message: 'Reservación actualizada correctamente.',
                                        reservacionId: id
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

//Eliminar reservacion
router.delete('/reservaciones/:id', verificarToken,async (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { id } = req.params;
    const query = 'UPDATE reservaciones SET estatus = "Cancelada" WHERE pk_id_reservacion = ?';
    connection.query(
        query,
        [id],
        (err, results) => {
            if (err) {
                console.error('Error al ejecutar la consulta: ' + err.stack);
                return res.status(500).send('Error en la consulta');
            }
            if (results.affectedRows > 0) {
                res.send('Reservación Cancelada correctamente');
            } else {
                res.status(404).send('Reservación no encontrada');
            }
        }
    );
});

module.exports = router;