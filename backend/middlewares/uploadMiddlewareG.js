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

// Función para corregir permisos del archivo
const fixFilePermissions = (filePath) => {
    try {
        // Cambiar propietario a www-data (UID 33, GID 33)
        fs.chownSync(filePath, 33, 33);
        
        // Cambiar permisos a 664 (rw-rw-r--)
        fs.chmodSync(filePath, 0o664);
        
        console.log('✅ Permisos corregidos para archivo:', filePath);
        console.log('   Propietario: www-data:www-data, Permisos: 664');
        return true;
    } catch (error) {
        console.error('❌ Error corrigiendo permisos:', error.message);
        return false;
    }
};

// Middleware wrapper que corrige permisos después del upload
const uploadProfileImageWithPermissions = (req, res, next) => {
    uploadProfileImage(req, res, (err) => {
        if (err) {
            return next(err);
        }
        
        // Si se subió un archivo exitosamente, corregir permisos
        if (req.file) {
            const filePath = path.join(uploadsDir, req.file.filename);
            fixFilePermissions(filePath);
        }
        
        next();
    });
};

module.exports = {
    uploadProfileImage: uploadProfileImageWithPermissions
};