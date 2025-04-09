const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { connection } = require('../config/config.db');

const SECRET_KEY = 'contraseña_secreta';

// Ruta para iniciar sesión y generar un token
router.post('/login', (req, res) => {
    const { usuario, contrasena } = req.body;

    connection.query(
    `SELECT t.nombre, u.usuario, u.contrasena, CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo
        FROM usuarios u , tipo_usuario t 
        WHERE u.usuario = ? AND u.contrasena = ? AND t.pk_id_tipo = 1;`, 
        [usuario, contrasena], (error, results) => {
        if (error) return res.status(500).json({ error: error.message });

        if (results.length === 0) return res.status(401).json({ mensaje: "Usuario no encontrado" });

        const usuarioDB = results[0];

        // Crear token
        const token = jwt.sign(
            { id: usuarioDB.pk_id_usuario, usuario: usuarioDB.usuario },
            SECRET_KEY,
            { expiresIn: "8h" }
        );

        console.log("Token generado", token);

        res.json({ token,
            nombre: usuarioDB.nombre_completo,
            puesto: usuarioDB.nombre
         });
    });
});

function verificarToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ mensaje: "Token requerido" });
    }

    jwt.verify(token.split(" ")[1], SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ mensaje: "Token inválido" });
        }
        req.usuario = decoded; // Guardar datos del usuario en la request
        next();
    });
}

module.exports = { router, verificarToken };