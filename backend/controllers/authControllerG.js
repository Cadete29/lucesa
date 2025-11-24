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
        //?  para no devolver la contrasena 
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

module.exports = {
    register,
    login
};