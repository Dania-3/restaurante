const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { connection } = require('../config/config.db');

const SECRET_KEY = 'contraseña_secreta';

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Endpoints relacionados con la autenticación de usuarios
 */

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Iniciar sesión y obtener un token JWT
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usuario
 *               - contraseña
 *             properties:
 *               usuario:
 *                 type: string
 *                 example: "admin"
 *               contraseña:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso, devuelve un token JWT.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsIn..."
 *       401:
 *         description: Usuario no encontrado o contraseña incorrecta.
 *       500:
 *         description: Error interno del servidor.
 */


// Ruta para iniciar sesión y generar un token
router.post('/login', (req, res) => {
    const { usuario, contraseña } = req.body;

    connection.query('SELECT pk_id_usuario, usuario, contrasena FROM usuarios, tipo_usuario  WHERE usuario = "admin" and contrasena = "123456" and pk_id_tipo = 1', [usuario, contraseña], (error, results) => {
        if (error) return res.status(500).json({ error: error.message });

        if (results.length === 0) return res.status(401).json({ mensaje: "Usuario no encontrado" });

        const usuarioDB = results[0];

        //if (contraseña !== usuarioDB.contraseña) return res.status(401).json({ mensaje: "Contraseña incorrecta" });

        // Crear token
        const token = jwt.sign(
            { id: usuarioDB.id_usuario, usuario: usuarioDB.usuario },
            SECRET_KEY,
            { expiresIn: "1h" }
        );

        console.log("Token generado", token);

        res.json({ token });
    });
});


// Middleware para verificar el token (NO ES UN ENDPOINT, NO SE DOCUMENTA EN SWAGGER)
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