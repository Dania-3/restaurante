const express = require('express');
const router = express.Router();
const { connection } = require('../config/config.db');

//Mostrar empleados
router.get('/empleados', (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }

    connection.query('SELECT e.pk_id_empleado, u.pk_id_usuario, t.nombre AS fk_tipo, u.nombre AS nombre, u.apellido, u.correo, u.telefono, e.fecha_nacimiento, e.direccion, e.curp, e.rfc, e.salario, u.usuario, u.contrasena FROM empleados e JOIN usuarios u ON e.fk_usuario = u.pk_id_usuario JOIN tipo_usuario t ON u.fk_tipo = t.pk_id_tipo', 
        (error, results) => {
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        res.status(200).json(results);
    });
});

//Agregar empleado
router.post('/empleados', (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }

    const { fk_tipo, nombre, apellido, correo, telefono, fecha_nacimiento, direccion, curp, rfc, salario, usuario, contrasena } = req.body;
    if (!fk_tipo || !nombre || !apellido || !correo || !telefono || !fecha_nacimiento || !direccion || !curp || !rfc || !salario || !usuario || !contrasena) {
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
                'INSERT INTO usuarios (fk_tipo, nombre, apellido, correo, telefono, usuario, contrasena) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [tipoId, nombre, apellido, correo, telefono, usuario, contrasena],
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
router.put('/empleados/:id', (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { id } = req.params;
    const { fk_tipo, nombre, apellido, correo, telefono, fecha_nacimiento, direccion, curp, rfc, salario } = req.body;

    if (!fk_tipo || !nombre || !apellido || !correo || !telefono || !fecha_nacimiento || !direccion || !curp || !rfc || !salario) {
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

        connection.query(
            'UPDATE usuarios SET fk_tipo = ?, nombre = ?, apellido = ?, correo = ?, telefono = ? WHERE pk_id_usuario = ?',
            [tipoId, nombre, apellido, correo, telefono, id],
            (error, results) => {
                if (error) {
                    return res.status(500).json({ error: error.message });
                }
                if (results.affectedRows === 0) {
                    return res.status(404).json({ error: 'Usuario no encontrado.' });
                }

                connection.query(
                    'UPDATE empleados SET fecha_nacimiento = ?, direccion = ?, curp = ?, rfc = ?, salario = ? WHERE fk_usuario = ?',
                    [fecha_nacimiento, direccion, curp, rfc, salario, id],
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

//Eliminar empleado
router.delete('/empleados/:id', (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { id } = req.params;

    connection.query(
        'UPDATE empleados SET estado = 0 WHERE fk_usuario = ?',
        [id],
        (error, results) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Empleado no encontrado.' });
            }

            connection.query(
                'UPDATE usuarios SET estado = 0 WHERE pk_id_usuario = ?',
                [id],
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
});

module.exports = router;