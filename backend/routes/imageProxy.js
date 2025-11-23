const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * Proxy inteligente para imágenes - Maneja todas las variaciones de nombres
 */
router.get('/code/:imageCode', async (req, res) => {
    try {
        const { imageCode } = req.params;
        const { size = 'full' } = req.query;

        console.log('🖼️ Solicitando imagen por código:', imageCode);
        
        if (!imageCode) {
            return res.status(400).json({
                success: false,
                error: 'Código de imagen requerido'
            });
        }

        // Generar TODAS las posibles URLs (HTTP y HTTPS)
        const imageUrls = generateImageUrls(imageCode, size);
        console.log(`🔍 ${imageCode}: Probando ${imageUrls.length} variaciones`);

        let success = false;
        let lastError = null;
        let workingUrl = null;
        let testedUrls = [];

        for (const imageUrl of imageUrls) {
            try {
                console.log('🔗 Probando URL:', imageUrl);
                testedUrls.push(imageUrl);
                
                const response = await axios({
                    method: 'GET',
                    url: imageUrl,
                    responseType: 'stream',
                    timeout: 5000, // Timeout más corto
                    headers: getImageHeaders(imageUrl),
                    validateStatus: function (status) {
                        return status >= 200 && status < 400;
                    }
                });

                console.log('✅ Imagen encontrada en:', imageUrl);
                workingUrl = imageUrl;
                
                // Configurar headers de respuesta
                setupResponseHeaders(res, response.headers);
                
                success = true;
                response.data.pipe(res);
                break;

            } catch (error) {
                lastError = error;
                const statusCode = error.response?.status;
                
                if (statusCode === 404) {
                    console.log(`❌ 404 - No existe: ${imageUrl}`);
                } else if (error.code === 'ECONNABORTED') {
                    console.log(`⏰ Timeout: ${imageUrl}`);
                } else if (error.code === 'ENOTFOUND') {
                    console.log(`🌐 DNS Error: ${imageUrl}`);
                } else {
                    console.log(`❌ Error ${statusCode || error.code}: ${imageUrl}`);
                }
                
                // Continuar con la siguiente URL en todos los casos
                continue;
            }
        }

        if (!success) {
            console.error('❌ Todas las URLs fallaron para:', imageCode);
            console.log('📋 URLs probadas:', testedUrls);
            
            setupResponseHeaders(res);
            return res.status(404).json({
                success: false,
                error: 'Imagen no disponible en ningún servidor',
                imageCode: imageCode,
                testedUrls: testedUrls,
                lastError: lastError?.message,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('❌ Error general en proxy de imagen:', error.message);
        setupResponseHeaders(res);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor de imágenes',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Genera TODAS las posibles URLs para una imagen con todas las variaciones
 */
function generateImageUrls(imageCode, size) {
    // TODAS las posibles variaciones de nombres de archivo
    const basePaths = [
        // Formato estándar: CODIGO/CODIGO_full.jpg
        `${imageCode}/${imageCode}_${size}.jpg`,
        `${imageCode}/${imageCode}.jpg`,
        
        // Formato con _0, _1, _2, etc.: CODIGO/CODIGO_0_full.jpg
        `${imageCode}/${imageCode}_0_${size}.jpg`,
        `${imageCode}/${imageCode}_1_${size}.jpg`,
        `${imageCode}/${imageCode}_2_${size}.jpg`,
        `${imageCode}/${imageCode}_3_${size}.jpg`,
        `${imageCode}/${imageCode}_0.jpg`,
        `${imageCode}/${imageCode}_1.jpg`,
        `${imageCode}/${imageCode}_2.jpg`,
        `${imageCode}/${imageCode}_3.jpg`,
        
        // Formato directo sin subcarpeta
        `${imageCode}.jpg`,
        `${imageCode}_${size}.jpg`,
        `${imageCode}_0_${size}.jpg`,
        `${imageCode}_1_${size}.jpg`,
        `${imageCode}_2_${size}.jpg`,
        
        // Formato alternativo para casos especiales
        `${imageCode}/${imageCode}_large.jpg`,
        `${imageCode}/${imageCode}_medium.jpg`,
        `${imageCode}/${imageCode}_small.jpg`,
        `${imageCode}_large.jpg`,
        `${imageCode}_medium.jpg`,
        `${imageCode}_small.jpg`
    ];

    const urls = [];
    
    // Eliminar duplicados
    const uniquePaths = [...new Set(basePaths)];
    
    // Probar HTTP primero (más rápido para las que funcionan)
    uniquePaths.forEach(path => {
        urls.push(`http://static.ctonline.mx/imagenes/${path}`);
    });
    
    // Luego probar HTTPS
    uniquePaths.forEach(path => {
        urls.push(`https://static.ctonline.mx/imagenes/${path}`);
    });

    return urls;
}

/**
 * Headers inteligentes según el protocolo
 */
function getImageHeaders(imageUrl) {
    const isHttps = imageUrl.startsWith('https://');
    const baseHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
    };

    if (isHttps) {
        return {
            ...baseHeaders,
            'Referer': 'https://static.ctonline.mx/',
            'Origin': 'https://static.ctonline.mx',
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'same-origin'
        };
    } else {
        return {
            ...baseHeaders,
            'Referer': 'http://static.ctonline.mx/',
            'Origin': 'http://static.ctonline.mx'
        };
    }
}

/**
 * Configura headers de respuesta CORS
 */
function setupResponseHeaders(res, originalHeaders = {}) {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Headers de cache
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 horas
    res.setHeader('Vary', 'Origin, Accept-Encoding');
    
    // Headers del contenido original
    if (originalHeaders['content-type']) {
        res.setHeader('Content-Type', originalHeaders['content-type']);
    } else {
        res.setHeader('Content-Type', 'image/jpeg');
    }
    
    if (originalHeaders['content-length']) {
        res.setHeader('Content-Length', originalHeaders['content-length']);
    }
    
    if (originalHeaders['last-modified']) {
        res.setHeader('Last-Modified', originalHeaders['last-modified']);
    }
    
    if (originalHeaders['etag']) {
        res.setHeader('ETag', originalHeaders['etag']);
    }
}

module.exports = router;