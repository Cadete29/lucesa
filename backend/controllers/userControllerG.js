// backend/controllers/userController.js


const userModel = require('../models/userModelG');

const getMyProfile = async (req, res) => {
    try {
        const user = await userModel.findUserById(req.user.id);
        res.json({
            success: true,
            message: 'Perfil obtenido correctamente',
            data: { user }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

const updateMyProfile = async (req, res) => {
    const { nombre, foto_perfil } = req.body;   // ← solo estos dos

    try {
        const updatedUser = await userModel.updateUserProfile(req.user.id, {
            nombre,
            foto_perfil
        });

        res.json({
            success: true,
            message: 'Perfil actualizado correctamente',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al actualizar perfil' });
    }
};

const deleteMyAccount = async (req, res) => {
    try {
        await userModel.deleteUser(req.user.id);
        res.json({
            success: true,
            message: 'Cuenta eliminada permanentemente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al eliminar cuenta' });
    }
};


module.exports = {
    getMyProfile,
    updateMyProfile,
    deleteMyAccount
};