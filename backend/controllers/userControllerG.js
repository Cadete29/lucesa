// backend/controllers/userControllerG.js

const userModel = require('../models/userModelG');
const fs = require('fs');
const path = require('path');

/**
 * Obtener perfil del usuario autenticado
 */
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('🔍 Obteniendo perfil para usuario ID:', userId);
        
        const user = await userModel.findUserById(userId);
        
        if (!user) {
            console.log('❌ Usuario no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        console.log('✅ Perfil obtenido exitosamente:', {
            id: user.id,
            email: user.email,
            hasImage: !!user.images_profile
        });
        
        return res.status(200).json({
            success: true,
            data: { user }
        });
    } catch (error) {
        console.error('❌ Error en getMyProfile:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el perfil'
        });
    }
};

/**
 * Actualizar perfil del usuario (nombre, etc.)
 */
const updateMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nombre, username } = req.body;
        
        console.log('📝 Actualizando perfil para usuario ID:', userId, { nombre, username });
        
        // Validar que al menos un campo sea proporcionado
        if (!nombre && !username) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un campo para actualizar'
            });
        }
        
        // Verificar si el username ya existe (si se está actualizando)
        if (username) {
            const existingUser = await userModel.findUserByUsername(username);
            if (existingUser && existingUser.id !== userId) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de usuario ya está en uso'
                });
            }
        }
        
        const updateData = {};
        if (nombre !== undefined) updateData.nombre = nombre;
        if (username !== undefined) updateData.username = username;
        
        const updatedUser = await userModel.updateUserProfile(userId, updateData);
        
        console.log('✅ Perfil actualizado exitosamente:', {
            id: updatedUser.id,
            nombre: updatedUser.nombre,
            username: updatedUser.username
        });
        
        return res.status(200).json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('❌ Error en updateMyProfile:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar el perfil'
        });
    }
};

/**
 * Subir imagen de perfil
 */
const uploadProfileImage = async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log('📤 Subiendo imagen de perfil para usuario ID:', userId);
        
        if (!req.file) {
            console.log('❌ No se recibió ningún archivo');
            return res.status(400).json({
                success: false,
                message: 'No se recibió ninguna imagen'
            });
        }
        
        console.log('📄 Archivo recibido:', {
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
        
        // Construir la ruta relativa para la base de datos
        const relativePath = `/uploads/photoperfil/${req.file.filename}`;
        
        console.log('🖼️ Ruta para BD:', relativePath);
        
        // Actualizar el perfil del usuario con la nueva imagen
        const updateData = {
            images_profile: relativePath
        };
        
        const updatedUser = await userModel.updateUserProfile(userId, updateData);
        
        console.log('✅ Imagen subida exitosamente:', {
            userId: updatedUser.id,
            imagePath: updatedUser.images_profile,
            updatedAt: updatedUser.updated_at
        });
        
        return res.status(200).json({
            success: true,
            message: 'Foto de perfil actualizada exitosamente',
            data: {
                user: updatedUser,
                fileInfo: {
                    filename: req.file.filename,
                    path: relativePath,
                    size: req.file.size,
                    mimetype: req.file.mimetype
                }
            }
        });
    } catch (error) {
        console.error('❌ Error en uploadProfileImage:', error);
        
        // Si hay un error, eliminar el archivo subido
        if (req.file) {
            const filePath = path.join(__dirname, '../uploads/photoperfil', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('🗑️ Archivo eliminado por error:', filePath);
            }
        }
        
        return res.status(500).json({
            success: false,
            message: 'Error al subir la imagen de perfil'
        });
    }
};

/**
 * Eliminar imagen de perfil
 */
const removeProfileImage = async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log('🗑️ Eliminando imagen de perfil para usuario ID:', userId);
        
        // Obtener el usuario actual para ver si tiene imagen
        const currentUser = await userModel.findUserById(userId);
        
        if (!currentUser.images_profile) {
            console.log('ℹ️ El usuario no tiene imagen de perfil');
            return res.status(400).json({
                success: false,
                message: 'No tienes una imagen de perfil para eliminar'
            });
        }
        
        // Eliminar el archivo físico si existe
        const imagePath = path.join(__dirname, '..', currentUser.images_profile);
        console.log('🔍 Buscando archivo en:', imagePath);
        
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log('✅ Archivo físico eliminado:', imagePath);
        } else {
            console.log('⚠️ Archivo no encontrado en el sistema de archivos:', imagePath);
        }
        
        // Actualizar el perfil del usuario para eliminar la referencia a la imagen
        const updateData = {
            images_profile: null
        };
        
        const updatedUser = await userModel.updateUserProfile(userId, updateData);
        
        console.log('✅ Imagen eliminada exitosamente de la BD:', {
            userId: updatedUser.id,
            hasImage: !!updatedUser.images_profile
        });
        
        return res.status(200).json({
            success: true,
            message: 'Foto de perfil eliminada exitosamente',
            data: {
                user: updatedUser
            }
        });
    } catch (error) {
        console.error('❌ Error en removeProfileImage:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar la imagen de perfil'
        });
    }
};

/**
 * Eliminar cuenta de usuario
 */
const deleteMyAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log('🗑️ Eliminando cuenta para usuario ID:', userId);
        
        // Obtener usuario para ver si tiene imagen que eliminar
        const user = await userModel.findUserById(userId);
        
        // Eliminar imagen de perfil si existe
        if (user.images_profile) {
            const imagePath = path.join(__dirname, '..', user.images_profile);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log('🗑️ Imagen de perfil eliminada:', imagePath);
            }
        }
        
        // Eliminar usuario de la base de datos
        const deletedUser = await userModel.deleteUser(userId);
        
        console.log('✅ Cuenta eliminada exitosamente:', {
            id: deletedUser.id,
            email: deletedUser.email
        });
        
        return res.status(200).json({
            success: true,
            message: 'Cuenta eliminada exitosamente',
            data: { user: deletedUser }
        });
    } catch (error) {
        console.error('❌ Error en deleteMyAccount:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar la cuenta'
        });
    }
};

module.exports = {
    getMyProfile,
    updateMyProfile,
    uploadProfileImage,
    removeProfileImage,
    deleteMyAccount
};