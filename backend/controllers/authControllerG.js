const userModel = require('../models/userModelG');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { sendPasswordResetEmailG } = require('../utils/emailServiceG');
require('dotenv').config();

const register = async (req, res) => {
    const { username, email, password, nombre } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Faltan datos obligatorios: username, email y password'
        });
    }

    try {
        const existingEmail = await userModel.findUserByEmail(email);
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Este email ya está registrado'
            });
        }

        const existingUsername = await userModel.findUserByUsername(username);
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: 'Este username ya está en uso'
            });
        }

        const user = await userModel.createUser(username, email, password, nombre);

        const { password: _, ...userWithoutPass } = user;

        return res.status(201).json({
            success: true,
            message: 'Usuario creado correctamente',
            data: { user: userWithoutPass }
        });

    } catch (error) {
        console.error('Error en register:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email y contraseña son obligatorios'
        });
    }

    try {
        const user = await userModel.findUserByEmail(email);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
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

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email es requerido'
        });
    }

    try {
        const user = await userModel.findUserByEmail(email);

        // Siempre respondemos lo mismo por seguridad
        if (!user) {
            return res.json({
                success: true,
                message: 'Si el email existe, se ha enviado un enlace de recuperación'
            });
        }

        // Generamos token JWT (más limpio que crypto + DB)
        const resetToken = jwt.sign(
            { id: user.id, type: 'password_reset' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // EN PRODUCCIÓN: enviamos el correo con la plantilla bonita
        if (process.env.NODE_ENV === 'production') {
            await sendPasswordResetEmailG(email, user.username || user.nombre || 'Usuario', resetToken);
        } 
        // EN DESARROLLO: solo lo mostramos en consola y respuesta
        else {
            console.log(`Reset token para ${email}: ${resetToken}`);
            console.log(`Enlace directo: ${process.env.FRONTEND_URL}/reset-password/${resetToken}`);
        }

        return res.json({
            success: true,
            message: 'Si el email existe, se ha enviado un enlace de recuperación',
            // Solo en desarrollo devolvemos el token para que lo pruebes fácil
            ...(process.env.NODE_ENV !== 'production' && { 
                resetToken,
                resetLink: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
            })
        });

    } catch (error) {
        console.error('Error en forgotPassword:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 6 caracteres'
        });
    }

    try {
        // Verificamos el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'password_reset') {
            return res.status(400).json({
                success: false,
                message: 'Token inválido'
            });
        }

        const user = await userModel.findUserById(decoded.id);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Actualizamos contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            `UPDATE users SET password = $1 WHERE id = $2`,
            [hashedPassword, user.id]
        );

        res.json({
            success: true,
            message: '¡Contraseña actualizada correctamente! Ya puedes iniciar sesión.'
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({
                success: false,
                message: 'El enlace ha expirado. Solicita uno nuevo.'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({
                success: false,
                message: 'Token inválido'
            });
        }

        console.error('Error en resetPassword:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor'
        });
    }
};

const verifyResetToken = async (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.type !== 'password_reset') {
            return res.json({
                success: true,
                valid: false
            });
        }

        return res.json({
            success: true,
            valid: true
        });

    } catch (error) {
        return res.json({
            success: true,
            valid: false
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