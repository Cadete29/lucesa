const userModel = require('../models/userModelG');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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
        if (!user) {
            // Por seguridad, no revelamos si el email existe o no
            return res.json({
                success: true,
                message: 'Si el email existe, se ha enviado un enlace de recuperación'
            });
        }

        // Generar token de recuperación
        const resetToken = jwt.sign(
            { id: user.id, type: 'password_reset' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // En un entorno real, aquí enviarías el email con el enlace
        // await sendResetEmail(user.email, resetToken);

        console.log(`🔐 Reset token for ${email}: ${resetToken}`); // Solo para desarrollo

        return res.json({
            success: true,
            message: 'Si el email existe, se ha enviado un enlace de recuperación',
            // En desarrollo, devolvemos el token para testing
            ...(process.env.NODE_ENV === 'development' && { resetToken })
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
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Token y nueva contraseña son requeridos'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.type !== 'password_reset') {
            return res.status(400).json({
                success: false,
                message: 'Token inválido'
            });
        }

        // Actualizar contraseña del usuario
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Necesitarías implementar esta función en userModel
        // Por ahora, simulamos la actualización
        console.log(`🔄 Actualizando contraseña para usuario ID: ${decoded.id}`);
        
        // Aquí iría: await userModel.updateUserPassword(decoded.id, hashedPassword);

        return res.json({
            success: true,
            message: 'Contraseña restablecida correctamente'
        });

    } catch (error) {
        console.error('Error en resetPassword:', error);
        return res.status(400).json({
            success: false,
            message: 'Token inválido o expirado'
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