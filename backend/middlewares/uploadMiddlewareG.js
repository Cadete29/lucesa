// backend/middlewares/uploadMiddlewareG.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio si no existe
const uploadsDir = path.join(__dirname, '../uploads/photoperfil');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Directorio de uploads creado:', uploadsDir);
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generar nombre único para el archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const fileName = `profile-${req.user.id}-${uniqueSuffix}${fileExtension}`;
        cb(null, fileName);
    }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
    // Verificar que sea una imagen
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen'), false);
    }
};

// Configuración de multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // Límite de 5MB
    }
});

// Middleware para subir una sola imagen
const uploadProfileImage = upload.single('profileImage');

module.exports = {
    uploadProfileImage
};