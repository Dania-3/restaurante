const express = require('express');
const router = express.Router();
const { connection } = require('../config/config.db');
const { verificarToken } = require('./login');

/**
 * @swagger
 * tags:
 *   name: Reservaciones
 *   description: Operaciones relacionadas con la gestión de las reservaciones
 */

/**
 * @swagger
 * /api/reservaciones:
 *   get:
 *     summary: Mostrar todas las reservaciones
 *     tags: [Reservaciones]
 *     responses:
 *       200:
 *         description: Lista de reservaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   pk_id_reservacion:
 *                     type: integer
 *                     description: ID de la reservación
 *                   cliente:
 *                     type: string
 *                     description: Nombre completo del cliente
 *                   correo:
 *                     type: string
 *                     description: Correo electrónico del cliente
 *                   telefono:
 *                     type: string
 *                     description: Teléfono del cliente
 *                   fecha:
 *                     type: string
 *                     format: date
 *                     description: Fecha de la reservación
 *                   hora:
 *                     type: string
 *                     description: Hora de la reservación
 *                   mesa:
 *                     type: string
 *                     description: Mesa asignada
 *                   comensales:
 *                     type: integer
 *                     description: Número de comensales
 *                   estatus:
 *                     type: string
 *                     description: Estado de la reservación (Activo, Cancelado)
 *       500:
 *         description: Error al obtener las reservaciones
 */
//Mostrar reservaciones
router.get('/reservaciones', (req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    connection.query('SELECT r.pk_id_reservacion, CONCAT(u.nombre, " ", u.apellido) AS cliente, u.correo, u.telefono, r.fecha, h.hora, CONCAT(m.seccion_mesa, " - ", m.numero_mesa) AS mesa, r.comensales, r.estatus FROM reservaciones AS r JOIN mesas AS m JOIN usuarios AS u JOIN horarios AS h WHERE r.fk_usuario = u.pk_id_usuario AND r.fk_mesa = m.pk_id_mesa AND r.fk_horario = h.pk_id_horario', 
        (error, results) => {
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        res.status(200).json(results);
    });
});

/**
 * @swagger
 * /api/reservaciones/{id}:
 *   get:
 *     summary: Obtener una reservación por ID
 *     tags: [Reservaciones]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la reservación
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Información de la reservación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pk_id_reservacion:
 *                   type: integer
 *                 cliente:
 *                   type: string
 *                 correo:
 *                   type: string
 *                 telefono:
 *                   type: string
 *                 fecha:
 *                   type: string
 *                   format: date
 *                 hora:
 *                   type: string
 *                 mesa:
 *                   type: string
 *                 comensales:
 *                   type: integer
 *                 estatus:
 *                   type: string
 *       404:
 *         description: Reservación no encontrada
 *       500:
 *         description: Error al obtener la reservación
 */
router.get('/reservaciones/:id', verificarToken, (req, res) => {
    const { id } = req.params;

    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }

    // Realizar consulta para obtener los datos del empleado por id
    connection.query(
        `SELECT r.pk_id_reservacion, u.nombre, u.apellido, u.correo, u.telefono, r.fecha, h.hora, 
        CONCAT(m.seccion_mesa, " - ", m.numero_mesa) AS mesa, r.comensales, r.estatus FROM reservaciones AS r 
        JOIN mesas AS m JOIN usuarios AS u JOIN horarios AS h WHERE r.fk_usuario = u.pk_id_usuario 
        AND r.fk_mesa = m.pk_id_mesa AND r.fk_horario = h.pk_id_horario AND r.pk_id_reservacion = ?`,
        [id],
        (err, results) => {
            if (err) {
                console.error('Error al ejecutar la consulta: ' + err.stack);
                return res.status(500).send('Error en la consulta');
            }

            if (results.length > 0) {
                res.json(results[0]);
            } else {
                res.status(404).send('Reservacion no encontrado');
            }
        }
    );
});

/**
 * @swagger
 * /api/reservaciones:
 *   post:
 *     summary: Crear una nueva reservación
 *     tags: [Reservaciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del cliente
 *               apellido:
 *                 type: string
 *                 description: Apellido del cliente
 *               telefono:
 *                 type: string
 *                 description: Teléfono del cliente
 *               correo:
 *                 type: string
 *                 description: Correo electrónico del cliente
 *               hora:
 *                 type: string
 *                 description: Hora de la reservación
 *               fecha:
 *                 type: string
 *                 format: date
 *                 description: Fecha de la reservación
 *               mesa:
 *                 type: string
 *                 description: Mesa asignada (sección - número)
 *               comensales:
 *                 type: integer
 *                 description: Número de comensales
 *               comentario:
 *                 type: string
 *                 description: Comentarios adicionales de la reservación
 *     responses:
 *       201:
 *         description: Reservación creada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de confirmación
 *                 reservacionId:
 *                   type: integer
 *                   description: ID de la reservación creada
 *       400:
 *         description: Faltan datos para crear la reservación
 *       500:
 *         description: Error al crear la reservación
 */
//Agregar reservacion
router.post('/reservaciones', (req, res) => {
    console.log("Datos recibidos:", req.body); 
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { nombre, apellido, telefono, correo, hora, fecha, mesa, comensales, comentario } = req.body;
    if (!nombre || !apellido || !telefono || !correo || !hora || !fecha || !mesa || !comensales) {
        return res.status(400).json({ error: 'Faltan datos para agregar la reservación.' });
    }
    const mesaP = mesa.split(' - ');
    const seccion = mesaP[1];
    const numero = mesaP[0];

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
                                console.log("Usuario ID: ", usuarioId);
                                console.log("Mesa ID: ", mesaId);
                                console.log("Horario ID: ", horarioId);
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

/**
 * @swagger
 * /api/reservaciones/{id}:
 *   put:
 *     summary: Actualizar una reservación existente
 *     tags: [Reservaciones]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la reservación a actualizar
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - telefono
 *               - hora
 *               - fecha
 *               - mesa
 *               - comensales
 *               - estatus
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del cliente
 *               telefono:
 *                 type: string
 *                 description: Teléfono del cliente
 *               hora:
 *                 type: string
 *                 description: Hora de la reservación
 *               fecha:
 *                 type: string
 *                 format: date
 *                 description: Fecha de la reservación
 *               mesa:
 *                 type: string
 *                 description: Identificador de mesa
 *                 example: "A - 5"
 *               comensales:
 *                 type: integer
 *                 description: Cantidad de comensales
 *               estatus:
 *                 type: string
 *                 description: Estado de la reservación
 *     responses:
 *       200:
 *         description: Reservación actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reservación actualizada correctamente.
 *                 reservacionId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Datos inválidos o entidad no encontrada
 *       404:
 *         description: Reservación no encontrada
 *       500:
 *         description: Error al actualizar la reservación
 */
//actualizar reservacion
router.put('/reservaciones/:id', verificarToken,(req, res) => {
    if (!connection) {
        return res.status(500).json({ error: 'No se pudo establecer conexión con la base de datos.' });
    }
    const { id } = req.params;
    const { nombre, telefono, hora, fecha, mesa, comensales, estatus } = req.body;

    const mesaP = mesa.split(' - ');
    const seccion = mesaP[0];
    const numero = mesaP[1];
    console.log("Datos recibidos en la solicitud PUT:", req.body);

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
                                'UPDATE reservaciones SET fk_usuario = ?, fk_mesa = ?, fk_horario = ?, fecha = ?, comensales = ?, estatus = ? WHERE pk_id_reservacion = ?',
                                [usuarioId, mesaId, horarioId, fecha, comensales, estatus, id],
                                (error, results) => {
                                    if (error) {
                                        return res.status(500).json({ error: error.message });
                                    }
                                    console.log("Resultados de la consulta UPDATE:", results);
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

/**
 * @swagger
 * /api/reservaciones/{id}:
 *   delete:
 *     summary: Eliminar una reservación
 *     tags: [Reservaciones]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la reservación a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reservación cancelada correctamente
 *       404:
 *         description: Reservación no encontrada
 *       500:
 *         description: Error al cancelar la reservación
 */

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