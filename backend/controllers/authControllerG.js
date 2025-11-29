// backend/controllers/authControllerG.js

const userModel = require('../models/userModelG');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { sendPasswordResetEmailG, sendWelcomeEmailG } = require('../utils/emailServiceG');
require('dotenv').config();

/**
 * Función auxiliar para crear usuario con username único
 */
const createUserWithUniqueUsername = async (username, email, password, nombre, res) => {
    try {
        const user = await userModel.createUser(username, email, password, nombre);
        
        // Verificar que el usuario se creó con el rol correcto
        console.log('Usuario creado con rol:', user.rol);

        // Enviar email de bienvenida
        try {
            await sendWelcomeEmailG(email, user.nombre || user.username);
        } catch (emailError) {
            console.error('Error enviando correo de bienvenida:', emailError);
            // No fallar el registro si el correo de bienvenida falla
        }

        // Generar token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                email: user.email,
                rol: user.rol || 'user'
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Excluir password de la respuesta
        const { password: _, ...userWithoutPass } = user;

        return res.status(201).json({
            success: true,
            message: 'Usuario creado correctamente',
            data: { 
                user: userWithoutPass,
                token: token
            }
        });

    } catch (error) {
        // Si hay error de username duplicado, intentar con otro
        if (error.code === '23505' && error.constraint === 'users_username_key') {
            const newUsername = `${username}${Math.floor(Math.random() * 10000)}`;
            return await createUserWithUniqueUsername(newUsername, email, password, nombre, res);
        }
        
        console.error('Error en createUserWithUniqueUsername:', error);
        throw error;
    }
};

/**
 * Registra un nuevo usuario en el sistema
 */
const register = async (req, res) => {
    // Aceptar datos del frontend
    const { username, email, password, nombre } = req.body;

    console.log('Datos recibidos en registro:', { username, email, password, nombre });

    // Validaciones básicas
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Faltan datos obligatorios: email y password'
        });
    }

    // Si no viene username, generarlo desde el email
    const finalUsername = username || email.split('@')[0];

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'El formato del email no es válido'
        });
    }

    // Validar longitud de password
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 6 caracteres'
        });
    }

    try {
        // Verificar si el email ya existe
        const existingEmail = await userModel.findUserByEmail(email);
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Este email ya está registrado'
            });
        }

        // Verificar si el username ya existe (si se proporciona o se genera)
        const existingUsername = await userModel.findUserByUsername(finalUsername);
        if (existingUsername) {
            // Si el username ya existe, agregar un número aleatorio
            const uniqueUsername = `${finalUsername}${Math.floor(Math.random() * 1000)}`;
            return await createUserWithUniqueUsername(uniqueUsername, email, password, nombre, res);
        }

        // Crear nuevo usuario con username único
        return await createUserWithUniqueUsername(finalUsername, email, password, nombre, res);

    } catch (error) {
        console.error('Error en register:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Autentica un usuario y genera token JWT
 */
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email y contraseña son obligatorios'
        });
    }

    try {
        // Buscar usuario por email
        const user = await userModel.findUserByEmail(email);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                email: user.email,
                rol: user.rol || 'user'
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Excluir password de la respuesta
        const { password: _, ...userSafe } = user;

        return res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                user: userSafe
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Inicia el proceso de recuperación de contraseña
 */
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    console.log('\n🔐 ===== SOLICITUD DE RECUPERACIÓN =====');
    console.log('📧 Email recibido:', email);

    if (!email) {
        console.log('❌ Error: Email requerido');
        return res.status(400).json({
            success: false,
            message: 'Email es requerido'
        });
    }

    try {
        const user = await userModel.findUserByEmail(email);

        // Por seguridad, siempre respondemos lo mismo
        if (!user) {
            console.log('❌ Email no encontrado en BD:', email);
            return res.json({
                success: true,
                message: 'Si el email existe, se ha enviado un enlace de recuperación'
            });
        }

        console.log('✅ Usuario encontrado:', user.email);

        // Generar token JWT para reset de password
        const resetToken = jwt.sign(
            { 
                id: user.id, 
                type: 'password_reset',
                email: user.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('🔐 Token generado exitosamente');

        // Enviar el correo de recuperación
        try {
            const emailResult = await sendPasswordResetEmailG(
                email, 
                user.nombre || user.username || 'Usuario', 
                resetToken
            );

            console.log('✅ Correo enviado exitosamente');
            console.log('📨 ID del mensaje:', emailResult.messageId);

            return res.json({
                success: true,
                message: 'Se ha enviado un enlace de recuperación a tu email'
            });

        } catch (emailError) {
            console.error('❌ Error enviando correo:', emailError);
            
            return res.status(500).json({
                success: false,
                message: 'Error al enviar el correo de recuperación. Por favor, intenta nuevamente.'
            });
        }

    } catch (error) {
        console.error('❌ Error en forgotPassword:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Restablece la contraseña usando el token
 */
const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    console.log('\n🔄 ===== RESTABLECIENDO CONTRASEÑA =====');

    if (!password || password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 6 caracteres'
        });
    }

    try {
        // Verificar token JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'password_reset') {
            console.log('❌ Token inválido - tipo incorrecto');
            return res.status(400).json({
                success: false,
                message: 'Token inválido'
            });
        }

        console.log('✅ Token verificado para usuario:', decoded.email);

        // Verificar que el usuario existe
        const user = await userModel.findUserById(decoded.id);
        if (!user) {
            console.log('❌ Usuario no encontrado:', decoded.id);
            return res.status(400).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Actualizar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            `UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2`,
            [hashedPassword, user.id]
        );

        console.log('✅ Contraseña actualizada para:', user.email);

        res.json({
            success: true,
            message: '¡Contraseña actualizada correctamente! Ya puedes iniciar sesión.'
        });

    } catch (error) {
        // Manejar diferentes tipos de errores
        if (error.name === 'TokenExpiredError') {
            console.log('❌ Token expirado');
            return res.status(400).json({
                success: false,
                message: 'El enlace ha expirado. Solicita uno nuevo.'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            console.log('❌ Token JWT inválido');
            return res.status(400).json({
                success: false,
                message: 'Token inválido'
            });
        }

        console.error('❌ Error en resetPassword:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor'
        });
    }
};

/**
 * Verifica si un token de reset es válido
 */
const verifyResetToken = async (req, res) => {
    const { token } = req.params;

    console.log('\n🔍 ===== VERIFICANDO TOKEN =====');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.type !== 'password_reset') {
            console.log('❌ Token inválido - tipo incorrecto');
            return res.json({
                success: true,
                valid: false,
                message: 'Token inválido'
            });
        }

        // Verificar que el usuario aún existe
        const user = await userModel.findUserById(decoded.id);
        if (!user) {
            console.log('❌ Usuario no encontrado');
            return res.json({
                success: true,
                valid: false,
                message: 'Usuario no encontrado'
            });
        }

        console.log('✅ Token válido para:', user.email);

        return res.json({
            success: true,
            valid: true,
            message: 'Token válido'
        });

    } catch (error) {
        console.log('❌ Token inválido o expirado:', error.message);
        return res.json({
            success: true,
            valid: false,
            message: 'Token inválido o expirado'
        });
    }
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    verifyResetToken
};