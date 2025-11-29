// backend/middlewares/authenticateTokenG.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware para autenticar tokens JWT
 * Verifica que el token sea válido y añade la información del usuario al request
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Token de autenticación requerido' 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false,
                message: 'Token inválido o expirado' 
            });
        }
        
        // Añadir información del usuario al request
        req.user = user; // { id, username, email, rol }
        next();
    });
};

module.exports = authenticateToken;