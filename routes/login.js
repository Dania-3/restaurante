const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { connection } = require('../config/config.db');

const SECRET_KEY = 'contraseña_secreta';

/**
 * @swagger
 * tags:
 *   - name: Login
 *     description: Ruta para el inicio de sesión y autenticación del usuario
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Inicia sesión y genera un token de autenticación
 *     description: Permite a un usuario iniciar sesión proporcionando su nombre de usuario y contraseña. Si las credenciales son correctas, se genera un token JWT.
 *     tags:
 *       - Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuario:
 *                 type: string
 *                 description: El nombre de usuario del usuario que intenta iniciar sesión
 *               contrasena:
 *                 type: string
 *                 description: La contraseña del usuario
 *             required:
 *               - usuario
 *               - contrasena
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso, token generado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT generado para la sesión del usuario.
 *                 nombre:
 *                   type: string
 *                   description: Nombre completo del usuario.
 *                 puesto:
 *                   type: string
 *                   description: El puesto del usuario.
 *       401:
 *         description: Usuario no encontrado o credenciales incorrectas.
 *       500:
 *         description: Error interno del servidor.
 *       403:
 *         description: El token es necesario para acceder a otras rutas protegidas.
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * security:
 *   - bearerAuth: []
 */


// Ruta para iniciar sesión y generar un token
router.post('/login', (req, res) => {
    const { usuario, contrasena } = req.body;

    connection.query(
    `SELECT t.nombre, u.usuario, u.contrasena, CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo
        FROM usuarios u , tipo_usuario t 
        WHERE u.usuario = ? AND u.contrasena = ? AND t.pk_id_tipo = 1`, 
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