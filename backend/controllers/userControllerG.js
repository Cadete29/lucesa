// backend/controllers/userControllerG.js

const userModel = require('../models/userModelG');
const fs = require('fs');
const path = require('path');

/**
 * Obtiene el perfil del usuario autenticado
 */
const getMyProfile = async (req, res) => {
    try {
        const user = await userModel.findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }
        
        res.json({
            success: true,
            message: 'Perfil obtenido correctamente',
            data: { user }
        });
    } catch (error) {
        console.error('Error en getMyProfile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error del servidor' 
        });
    }
};

/**
 * Actualiza el perfil del usuario (nombre y images_profile)
 */
const updateMyProfile = async (req, res) => {
    const { nombre, images_profile } = req.body;

    console.log('📝 Datos recibidos para actualizar perfil:', { nombre, images_profile });

    // Validar que al menos un campo sea proporcionado
    if (nombre === undefined && images_profile === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Se requiere al menos un campo para actualizar (nombre o images_profile)'
        });
    }

    try {
        const updatedUser = await userModel.updateUserProfile(req.user.id, {
            nombre,
            images_profile
        });

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Perfil actualizado correctamente',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('Error en updateMyProfile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al actualizar perfil: ' + error.message 
        });
    }
};

/**
 * Elimina la cuenta del usuario autenticado
 */
const deleteMyAccount = async (req, res) => {
    try {
        const deletedUser = await userModel.deleteUser(req.user.id);
        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Cuenta eliminada permanentemente'
        });
    } catch (error) {
        console.error('Error en deleteMyAccount:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al eliminar cuenta' 
        });
    }
};

/**
 * Sube y actualiza la imagen de perfil del usuario
 */
const uploadProfileImage = async (req, res) => {
    try {
        console.log('📸 Iniciando subida de imagen de perfil...');
        console.log('👤 Usuario:', req.user.id);
        console.log('📁 Archivo recibido:', req.file);

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se ha proporcionado ninguna imagen'
            });
        }

        const userId = req.user.id;
        
        // Obtener información del usuario actual para eliminar la imagen anterior
        const currentUser = await userModel.findUserById(userId);
        console.log('👤 Usuario actual:', currentUser);
        
        // Eliminar imagen anterior si existe
        if (currentUser.images_profile && currentUser.images_profile.startsWith('/uploads/photoperfil/')) {
            const oldImagePath = path.join(__dirname, '..', currentUser.images_profile);
            console.log('🗑️ Intentando eliminar imagen anterior:', oldImagePath);
            
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
                console.log('✅ Imagen anterior eliminada');
            } else {
                console.log('ℹ️ Imagen anterior no encontrada en el sistema de archivos');
            }
        }

        // Crear la ruta de la nueva imagen
        const imagePath = `/uploads/photoperfil/${req.file.filename}`;
        console.log('🖼️ Nueva ruta de imagen:', imagePath);
        
        // Actualizar el perfil del usuario con la nueva imagen
        console.log('💾 Actualizando base de datos...');
        const updatedUser = await userModel.updateUserProfile(userId, {
            images_profile: imagePath
        });

        if (!updatedUser) {
            // Si falla la actualización, eliminar la imagen subida
            console.log('❌ Falló la actualización en BD, eliminando archivo subido...');
            fs.unlinkSync(req.file.path);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar el perfil en la base de datos'
            });
        }

        console.log('✅ Imagen subida y perfil actualizado correctamente');
        console.log('👤 Usuario actualizado:', updatedUser);

        const imageUrl = `${process.env.BASE_URL || 'http://localhost:4004'}${imagePath}`;
        
        res.json({
            success: true,
            message: 'Imagen de perfil actualizada correctamente',
            data: { 
                user: updatedUser,
                imageUrl: imageUrl
            }
        });

    } catch (error) {
        console.error('❌ Error en uploadProfileImage:', error);
        
        // Eliminar archivo subido en caso de error
        if (req.file && fs.existsSync(req.file.path)) {
            console.log('🗑️ Eliminando archivo subido debido al error...');
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error al subir la imagen: ' + error.message
        });
    }
};

/**
 * Elimina la imagen de perfil del usuario
 */
const removeProfileImage = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('🗑️ Eliminando imagen de perfil para usuario:', userId);
        
        // Obtener información del usuario actual
        const currentUser = await userModel.findUserById(userId);
        console.log('👤 Usuario actual:', currentUser);
        
        // Eliminar imagen del sistema de archivos si existe
        if (currentUser.images_profile && currentUser.images_profile.startsWith('/uploads/photoperfil/')) {
            const imagePath = path.join(__dirname, '..', currentUser.images_profile);
            console.log('📁 Ruta de imagen a eliminar:', imagePath);
            
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log('✅ Imagen eliminada del sistema de archivos');
            } else {
                console.log('ℹ️ Imagen no encontrada en el sistema de archivos');
            }
        } else {
            console.log('ℹ️ No hay imagen de perfil para eliminar');
        }

        // Actualizar el perfil del usuario eliminando la imagen
        console.log('💾 Actualizando base de datos...');
        const updatedUser = await userModel.updateUserProfile(userId, {
            images_profile: null
        });

        if (!updatedUser) {
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar el perfil en la base de datos'
            });
        }

        console.log('✅ Imagen eliminada correctamente');
        console.log('👤 Usuario actualizado:', updatedUser);

        res.json({
            success: true,
            message: 'Imagen de perfil eliminada correctamente',
            data: { user: updatedUser }
        });

    } catch (error) {
        console.error('❌ Error en removeProfileImage:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la imagen: ' + error.message
        });
    }
};

module.exports = {
    getMyProfile,
    updateMyProfile,
    deleteMyAccount,
    uploadProfileImage,
    removeProfileImage
};