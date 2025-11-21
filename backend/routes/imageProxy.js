const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * Proxy inteligente para imágenes - Prueba HTTP y HTTPS automáticamente
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

        // Generar todas las posibles URLs (HTTP y HTTPS)
        const imageUrls = generateImageUrls(imageCode, size);
        console.log('🔍 URLs a probar:', imageUrls);

        let success = false;
        let lastError = null;
        let workingUrl = null;

        for (const imageUrl of imageUrls) {
            try {
                console.log('🔗 Probando URL:', imageUrl);
                
                const response = await axios({
                    method: 'GET',
                    url: imageUrl,
                    responseType: 'stream',
                    timeout: 8000, // Timeout más corto
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
                console.log(`❌ Falló URL ${imageUrl}: ${statusCode || error.code}`);
                
                // Si es error 404, continuar con la siguiente URL
                if (statusCode === 404) {
                    continue;
                }
                // Si es error de conexión (CORS, etc.), continuar
                if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
                    continue;
                }
            }
        }

        if (!success) {
            console.error('❌ Todas las URLs fallaron para:', imageCode);
            setupResponseHeaders(res);
            return res.status(404).json({
                success: false,
                error: 'Imagen no disponible en ningún servidor',
                imageCode: imageCode,
                testedUrls: imageUrls,
                lastError: lastError?.message
            });
        }

    } catch (error) {
        console.error('❌ Error general en proxy de imagen:', error.message);
        setupResponseHeaders(res);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor de imágenes',
            message: error.message
        });
    }
});

/**
 * Genera todas las posibles URLs para una imagen
 */
function generateImageUrls(imageCode, size) {
    const basePaths = [
        `${imageCode}/${imageCode}_${size}.jpg`,
        `${imageCode}/${imageCode}.jpg`,
        `${imageCode}.jpg`
    ];

    const urls = [];
    
    // Probar HTTP primero (más rápido para las que funcionan)
    basePaths.forEach(path => {
        urls.push(`http://static.ctonline.mx/imagenes/${path}`);
    });
    
    // Luego probar HTTPS
    basePaths.forEach(path => {
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

/**
 * Endpoint para probar una imagen específica
 */
router.get('/test/:imageCode', async (req, res) => {
    try {
        const { imageCode } = req.params;
        const { size = 'full' } = req.query;

        console.log('🧪 Testeando imagen:', imageCode);
        
        const imageUrls = generateImageUrls(imageCode, size);
        const results = [];

        for (const imageUrl of imageUrls) {
            try {
                console.log('🔍 Probando:', imageUrl);
                const startTime = Date.now();
                
                const response = await axios({
                    method: 'HEAD',
                    url: imageUrl,
                    timeout: 5000,
                    headers: getImageHeaders(imageUrl)
                });

                const responseTime = Date.now() - startTime;
                results.push({
                    url: imageUrl,
                    status: response.status,
                    statusText: response.statusText,
                    responseTime: `${responseTime}ms`,
                    contentLength: response.headers['content-length'],
                    contentType: response.headers['content-type'],
                    success: true
                });

                console.log(`✅ ${imageUrl} - ${response.status} (${responseTime}ms)`);

            } catch (error) {
                const responseTime = Date.now() - startTime;
                results.push({
                    url: imageUrl,
                    status: error.response?.status || 'ERROR',
                    statusText: error.code || error.message,
                    responseTime: `${responseTime}ms`,
                    success: false
                });

                console.log(`❌ ${imageUrl} - ${error.response?.status || error.code}`);
            }
        }

        // Encontrar la primera URL que funciona
        const workingUrl = results.find(r => r.success);
        
        setupResponseHeaders(res);
        res.json({
            success: true,
            imageCode,
            workingUrl: workingUrl ? workingUrl.url : null,
            results,
            summary: {
                totalTested: results.length,
                working: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                recommendedUrl: workingUrl ? workingUrl.url : 'No disponible'
            }
        });

    } catch (error) {
        console.error('❌ Error en test:', error);
        setupResponseHeaders(res);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Endpoint OPTIONS para CORS preflight
 */
router.options('/code/:imageCode', (req, res) => {
    setupResponseHeaders(res);
    res.status(200).end();
});

router.options('/test/:imageCode', (req, res) => {
    setupResponseHeaders(res);
    res.status(200).end();
});

/**
 * Health check mejorado
 */
router.get('/health', async (req, res) => {
    try {
        // Probar una imagen conocida que funciona con HTTP
        const testResponse = await axios.head('http://static.ctonline.mx/imagenes/ACPTPL290/ACPTPL290_full.jpg', {
            timeout: 5000,
            headers: getImageHeaders('http://static.ctonline.mx/imagenes/ACPTPL290/ACPTPL290_full.jpg')
        });

        setupResponseHeaders(res);
        res.json({
            success: true,
            status: 'healthy',
            staticServer: 'accessible via HTTP',
            testedImage: 'ACPTPL290_full.jpg',
            protocol: 'HTTP',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        setupResponseHeaders(res);
        res.json({
            success: false,
            status: 'unhealthy', 
            staticServer: 'HTTP failed, trying HTTPS...',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;