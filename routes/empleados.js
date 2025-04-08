const express = require('express');
const router = express.Router();
const { connection } = require('../config/config.db');
const { verificarToken } = require('./login');

// Mostrar empleados
router.get('/empleados/:id', verificarToken, (req, res) => {
    const { id } = req.params;

    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }

    // Realizar consulta para obtener los datos del empleado por id
    connection.query(
        `SELECT e.pk_id_empleado, t.nombre AS fk_tipo, CONCAT(u.nombre, " ", u.apellido) AS nombre,
        u.correo, u.telefono, e.fecha_nacimiento, e.direccion, e.curp, e.rfc, e.salario
        FROM empleados e
        JOIN usuarios u ON e.fk_usuario = u.pk_id_usuario
        JOIN tipo_usuario t ON u.fk_tipo = t.pk_id_tipo
        WHERE e.pk_id_empleado = ?`,
        [id],
        (err, results) => {
            if (err) {
                console.error('Error al ejecutar la consulta: ' + err.stack);
                return res.status(500).send('Error en la consulta');
            }

            if (results.length > 0) {
                // Si se encuentra al menos un empleado con ese id, lo retornamos
                res.json(results[0]);
            } else {
                // Si no se encuentra el empleado
                res.status(404).send('Empleado no encontrado');
            }
        }
    );
});


router.get('/empleadosTabla', verificarToken, (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }

    connection.query('SELECT e.pk_id_empleado, CONCAT(u.nombre, " ", u.apellido) AS nombre, t.nombre AS puesto, e.salario, e.estado AS estatus FROM empleados e JOIN usuarios u ON e.fk_usuario = u.pk_id_usuario JOIN tipo_usuario t ON u.fk_tipo = t.pk_id_tipo;',
        (error, results) => {
            if (error) {
                res.status(500).json({ error: error.message });
                return;
            }
            res.status(200).json(results);
        });
});

//Agregar empleado
router.post('/empleados', verificarToken, (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }

    const { fk_tipo, nombre, apellido, correo, telefono, fecha_nacimiento, direccion, curp, rfc, salario } = req.body;
    if (!fk_tipo || !nombre || !apellido || !correo || !telefono || !fecha_nacimiento || !direccion || !curp || !rfc || !salario) {
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
                'INSERT INTO usuarios (fk_tipo, nombre, apellido, correo, telefono) VALUES (?, ?, ?, ?, ?)',
                [tipoId, nombre, apellido, correo, telefono],
                (error, results) => {
                    if (error) {
                        res.status(500).json({ error: error.message });
                        return;
                    }
                    const usuarioId = results.insertId;

                    connection.query(
                        'INSERT INTO empleados (fk_usuario, fecha_nacimiento, direccion, curp, rfc, salario) VALUES (?, ?, ?, ?, ?, ?)',
                        [usuarioId, fecha_nacimiento, direccion, curp, rfc, salario],
                        (error, results) => {
                            if (error) {
                                return res.status(500).json({ error: error.message });
                            }

                            res.status(201).json({
                                message: 'Empleado y usuario agregados correctamente.',
                                empleadoId: results.insertId
                            });
                        }
                    );
                }
            );
        });
});

//Actualizar empleado
router.put('/empleados/:id', verificarToken, (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { id } = req.params;
    const { fk_tipo, correo, telefono, direccion, curp, rfc, salario } = req.body;

    if (!fk_tipo || !correo || !telefono || !direccion || !curp || !rfc || !salario) {
        return res.status(400).json({ error: 'Faltan datos para actualizar el empleado.' });
    }

    connection.query('SELECT pk_id_tipo FROM tipo_usuario WHERE nombre = ?', [fk_tipo], (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        if (results.length === 0) {
            return res.status(400).json({ error: 'El tipo de usuario no existe.' });
        }
        const tipoId = results[0].pk_id_tipo;

        connection.query('SELECT fk_usuario FROM empleados WHERE pk_id_empleado = ?', [id], (error, results) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'Empleado no encontrado.' });
            }
            const usuarioId = results[0].fk_usuario;

            connection.query(
                'UPDATE usuarios SET fk_tipo = ?, correo = ?, telefono = ? WHERE pk_id_usuario = ?',
                [tipoId, correo, telefono, usuarioId],
                (error, results) => {
                    if (error) {
                        return res.status(500).json({ error: error.message });
                    }
                    if (results.affectedRows === 0) {
                        return res.status(404).json({ error: 'Usuario no encontrado.' });
                    }

                    connection.query(
                        'UPDATE empleados SET direccion = ?, curp = ?, rfc = ?, salario = ? WHERE pk_id_empleado = ?',
                        [direccion, curp, rfc, salario, id],
                        (error, results) => {
                            if (error) {
                                return res.status(500).json({ error: error.message });
                            }
                            if (results.affectedRows === 0) {
                                return res.status(404).json({ error: 'Empleado no encontrado.' });
                            }
                            res.status(200).json({
                                message: 'Empleado y usuario actualizados correctamente.',
                            });
                        }
                    );
                }
            );
        });
    });
});

//Eliminar empleado
router.delete('/empleados/:id', verificarToken, (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { id } = req.params;

    // Obtener el usuarioId asociado con el empleado para desactivar ambos
    connection.query(
        'SELECT fk_usuario FROM empleados WHERE pk_id_empleado = ?',
        [id],
        (error, results) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'Empleado no encontrado.' });
            }

            const usuarioId = results[0].fk_usuario;

            // Desactivar el empleado (cambiar estado a 0)
            connection.query(
                'UPDATE empleados SET estado = 0 WHERE pk_id_empleado = ?',
                [id],
                (error, results) => {
                    if (error) {
                        return res.status(500).json({ error: error.message });
                    }
                    if (results.affectedRows === 0) {
                        return res.status(404).json({ error: 'Empleado no encontrado.' });
                    }

                    // Desactivar el usuario (cambiar estado a 0)
                    connection.query(
                        'UPDATE usuarios SET estado = 0 WHERE pk_id_usuario = ?',
                        [usuarioId],
                        (error, results) => {
                            if (error) {
                                return res.status(500).json({ error: error.message });
                            }
                            if (results.affectedRows === 0) {
                                return res.status(404).json({ error: 'Usuario no encontrado.' });
                            }

                            res.status(200).json({
                                message: 'Empleado y usuario desactivados correctamente.',
                            });
                        }
                    );
                }
            );
        }
    );
    // connection.query(
    //     'UPDATE empleados SET estado = 0 WHERE fk_usuario = ?',
    //     [id],
    //     (error, results) => {
    //         if (error) {
    //             return res.status(500).json({ error: error.message });
    //         }
    //         if (results.affectedRows === 0) {
    //             return res.status(404).json({ error: 'Empleado no encontrado.' });
    //         }

    //         connection.query(
    //             'UPDATE usuarios SET estado = 0 WHERE pk_id_usuario = ?',
    //             [id],
    //             (error, results) => {
    //                 if (error) {
    //                     return res.status(500).json({ error: error.message });
    //                 }
    //                 if (results.affectedRows === 0) {
    //                     return res.status(404).json({ error: 'Usuario no encontrado.' });
    //                 }

    //                 res.status(200).json({
    //                     message: 'Empleado y usuario desactivados correctamente.',
    //                 });
    //             }
    //         );
    //     }
    // );
});



module.exports = router;