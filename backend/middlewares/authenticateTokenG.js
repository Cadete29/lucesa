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

    console.log('🔐 Middleware authenticateToken - Verificando token...');
    console.log('📨 Header Authorization recibido:', req.headers['authorization']);
    console.log('🔑 Token extraído:', token ? `${token.substring(0, 20)}...` : 'NO HAY TOKEN');
    console.log('🌐 Ruta solicitada:', req.originalUrl);
    console.log('📋 Método:', req.method);

    if (!token) {
        console.log('❌ No se proporcionó token de autenticación');
        return res.status(401).json({ 
            success: false,
            message: 'Token de autenticación requerido' 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('❌ Error verificando token:', err.name);
            console.log('❌ Mensaje de error:', err.message);
            
            if (err.name === 'TokenExpiredError') {
                console.log('⏰ Token expirado en:', err.expiredAt);
                return res.status(403).json({ 
                    success: false,
                    message: 'Token expirado' 
                });
            }
            
            if (err.name === 'JsonWebTokenError') {
                console.log('🆘 Error JWT:', err.message);
                return res.status(403).json({ 
                    success: false,
                    message: 'Token inválido' 
                });
            }
            
            return res.status(403).json({ 
                success: false,
                message: 'Token inválido o expirado' 
            });
        }
        
        console.log('✅ Token válido para usuario:');
        console.log('   👤 ID:', user.id);
        console.log('   📧 Email:', user.email);
        console.log('   🎯 Rol:', user.rol);
        console.log('   🏷️ Username:', user.username);
        
        // Añadir información del usuario al request
        req.user = user;
        next();
    });
};

module.exports = authenticateToken;