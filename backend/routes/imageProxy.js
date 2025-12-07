const express = require('express');
const router = express.Router();
const axios = require('axios');
const https = require('https');

// ✅ Crear agente HTTPS para ignorar errores SSL
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true
});

/**
 * Proxy principal para imágenes por código
 */
router.get('/code/:imageCode', async (req, res) => {
    try {
        const { imageCode } = req.params;
        const { size = 'full', index = '0' } = req.query;

        console.log('🖼️ Solicitando imagen:', { imageCode, size, index });
        
        if (!imageCode || imageCode === 'N/A') {
            return sendFallbackImage(res, imageCode, 'Imagen no disponible');
        }

        // Intentar obtener la imagen con el índice especificado
        const imageFound = await tryGetImage(imageCode, size, index, res);
        
        if (!imageFound) {
            console.log('❌ Imagen no encontrada, enviando fallback');
            sendFallbackImage(res, imageCode, `Imagen ${index} no disponible`);
        }

    } catch (error) {
        console.error('❌ Error general en proxy de imagen:', error.message);
        sendFallbackImage(res, req.params.imageCode, 'Error en servidor');
    }
});

/**
 * ✅ NUEVO: Endpoint para obtener TODAS las imágenes disponibles de un producto
 */
router.get('/code/:imageCode/all', async (req, res) => {
    try {
        const { imageCode } = req.params;
        
        console.log('🖼️ Buscando todas las imágenes para:', imageCode);
        
        if (!imageCode || imageCode === 'N/A') {
            return res.json({
                success: false,
                error: 'Código inválido',
                availableImages: []
            });
        }

        // Probar diferentes índices hasta encontrar todas las imágenes disponibles
        const availableImages = [];
        const maxImagesToCheck = 10; // Máximo de imágenes por producto
        
        for (let i = 0; i < maxImagesToCheck; i++) {
            try {
                const testUrl = `https://static.ctonline.mx/imagenes/${imageCode}/${imageCode}_${i}_full.jpg`;
                console.log(`🔍 Probando imagen ${i}:`, testUrl);
                
                const response = await axios.head(testUrl, {
                    timeout: 2000,
                    httpsAgent: httpsAgent,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (response.status === 200) {
                    availableImages.push({
                        index: i,
                        url: `http://localhost:4004/api/images/code/${imageCode}?index=${i}`,
                        thumbnailUrl: `http://localhost:4004/api/images/code/${imageCode}?size=medium&index=${i}`,
                        directUrl: testUrl,
                        size: 'full'
                    });
                    console.log(`✅ Imagen ${i} encontrada`);
                }
            } catch (error) {
                // Si es 404, continuar; si es otro error, podríamos detener
                if (error.response?.status !== 404 && i === 0) {
                    // Para la imagen principal (index 0), también probar sin índice
                    try {
                        const mainUrl = `https://static.ctonline.mx/imagenes/${imageCode}/${imageCode}_full.jpg`;
                        const mainResponse = await axios.head(mainUrl, {
                            timeout: 2000,
                            httpsAgent: httpsAgent
                        });
                        
                        if (mainResponse.status === 200) {
                            availableImages.push({
                                index: 0,
                                url: `http://localhost:4004/api/images/code/${imageCode}`,
                                thumbnailUrl: `http://localhost:4004/api/images/code/${imageCode}?size=medium`,
                                directUrl: mainUrl,
                                size: 'full'
                            });
                            console.log('✅ Imagen principal encontrada (sin índice)');
                        }
                    } catch (mainError) {
                        console.log(`❌ Imagen ${i} no encontrada (${mainError.response?.status || mainError.code})`);
                    }
                } else {
                    console.log(`❌ Imagen ${i} no encontrada (${error.response?.status || error.code})`);
                }
                
                // Si hemos probado 3 veces y no encontramos nada, probablemente no hay más imágenes
                if (i >= 2 && availableImages.length === 0) {
                    break;
                }
            }
        }

        console.log(`📊 Encontradas ${availableImages.length} imágenes para ${imageCode}`);
        
        res.json({
            success: true,
            imageCode,
            availableImages,
            count: availableImages.length,
            thumbnailUrl: availableImages.length > 0 ? 
                `http://localhost:4004/api/images/code/${imageCode}?size=medium` : 
                null
        });

    } catch (error) {
        console.error('❌ Error buscando todas las imágenes:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error buscando imágenes',
            availableImages: []
        });
    }
});

/**
 * ✅ NUEVO: Endpoint para verificar existencia de imágenes
 */
router.get('/code/:imageCode/check', async (req, res) => {
    try {
        const { imageCode } = req.params;
        
        if (!imageCode || imageCode === 'N/A') {
            return res.json({
                exists: false,
                hasMultiple: false,
                count: 0
            });
        }

        // Verificar imagen principal
        let hasMainImage = false;
        let imageCount = 0;
        
        try {
            const mainUrl = `https://static.ctonline.mx/imagenes/${imageCode}/${imageCode}_full.jpg`;
            await axios.head(mainUrl, {
                timeout: 2000,
                httpsAgent: httpsAgent
            });
            hasMainImage = true;
            imageCount = 1;
        } catch (error) {
            console.log('❌ Imagen principal no encontrada');
        }

        // Verificar si hay múltiples imágenes
        let hasMultipleImages = false;
        if (hasMainImage) {
            try {
                // Verificar segunda imagen
                const secondUrl = `https://static.ctonline.mx/imagenes/${imageCode}/${imageCode}_1_full.jpg`;
                await axios.head(secondUrl, {
                    timeout: 2000,
                    httpsAgent: httpsAgent
                });
                hasMultipleImages = true;
                imageCount = 2;
                
                // Verificar tercera imagen
                try {
                    const thirdUrl = `https://static.ctonline.mx/imagenes/${imageCode}/${imageCode}_2_full.jpg`;
                    await axios.head(thirdUrl, {
                        timeout: 1500,
                        httpsAgent: httpsAgent
                    });
                    imageCount = 3;
                } catch (thirdError) {
                    // Solo 2 imágenes
                }
            } catch (secondError) {
                // Solo 1 imagen
            }
        }

        res.json({
            exists: hasMainImage,
            hasMultiple: hasMultipleImages,
            count: imageCount,
            mainImageUrl: hasMainImage ? 
                `http://localhost:4004/api/images/code/${imageCode}` : null,
            checkTimestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error verificando imágenes:', error.message);
        res.json({
            exists: false,
            hasMultiple: false,
            count: 0,
            error: error.message
        });
    }
});

/**
 * Función para intentar obtener una imagen específica
 */
async function tryGetImage(imageCode, size, index, res) {
    const imageUrls = generateImageUrls(imageCode, size, index);
    
    for (const imageUrl of imageUrls) {
        try {
            console.log('🔗 Probando URL:', imageUrl);
            
            const response = await axios({
                method: 'GET',
                url: imageUrl,
                responseType: 'stream',
                timeout: 3000,
                httpsAgent: httpsAgent,
                headers: getImageHeaders(imageUrl)
            });

            if (response.status === 200) {
                console.log('✅ Imagen encontrada en:', imageUrl);
                setupResponseHeaders(res, response.headers);
                response.data.pipe(res);
                return true;
            }
        } catch (error) {
            console.log(`❌ Error ${error.response?.status || error.code}: ${imageUrl}`);
            continue;
        }
    }
    
    return false;
}

/**
 * Generar URLs para una imagen específica
 */
function generateImageUrls(imageCode, size, index) {
    const urls = [];
    
    // Si index es "0" o undefined, probar también sin índice
    if (index === '0' || !index) {
        urls.push(
            `https://static.ctonline.mx/imagenes/${imageCode}/${imageCode}_${size}.jpg`,
            `http://static.ctonline.mx/imagenes/${imageCode}/${imageCode}_${size}.jpg`,
            `https://static.ctonline.mx/imagenes/${imageCode}/${imageCode}.jpg`,
            `http://static.ctonline.mx/imagenes/${imageCode}/${imageCode}.jpg`
        );
    }
    
    // Siempre probar con índice
    urls.push(
        `https://static.ctonline.mx/imagenes/${imageCode}/${imageCode}_${index}_${size}.jpg`,
        `http://static.ctonline.mx/imagenes/${imageCode}/${imageCode}_${index}_${size}.jpg`,
        `https://static.ctonline.mx/imagenes/${imageCode}/${imageCode}_${index}.jpg`,
        `http://static.ctonline.mx/imagenes/${imageCode}/${imageCode}_${index}.jpg`
    );
    
    return [...new Set(urls)]; // Eliminar duplicados
}

/**
 * Headers para las solicitudes
 */
function getImageHeaders(imageUrl) {
    const isHttps = imageUrl.startsWith('https://');
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': isHttps ? 'https://static.ctonline.mx/' : 'http://static.ctonline.mx/',
        'Origin': isHttps ? 'https://static.ctonline.mx' : 'http://static.ctonline.mx'
    };
}

/**
 * Enviar imagen de fallback
 */
function sendFallbackImage(res, imageCode, message = 'Imagen no disponible') {
    const svgPlaceholder = generateFallbackSVG(imageCode, message);
    
    setupResponseHeaders(res);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svgPlaceholder);
}

/**
 * Generar SVG de fallback
 */
function generateFallbackSVG(imageCode, message) {
    const code = imageCode || 'N/A';
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    <style>
        .bg { fill: #f8f9fa; }
        .card { fill: #e9ecef; rx: 8; }
        .icon { fill: #adb5bd; }
        .text { fill: #6c757d; font-family: Arial, sans-serif; font-size: 14px; text-anchor: middle; }
        .message { fill: #495057; font-family: Arial, sans-serif; font-size: 12px; text-anchor: middle; }
    </style>
    <rect class="bg" width="400" height="300"/>
    <rect class="card" x="80" y="80" width="240" height="140"/>
    <circle class="icon" cx="200" cy="150" r="30"/>
    <text class="text" x="200" y="220">${code}</text>
    <text class="message" x="200" y="245">${message}</text>
</svg>`;
}

/**
 * Configurar headers de respuesta
 */
function setupResponseHeaders(res, originalHeaders = {}) {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Headers de cache
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Vary', 'Origin');
    
    // Headers del contenido
    if (originalHeaders['content-type']) {
        res.setHeader('Content-Type', originalHeaders['content-type']);
    }
}

module.exports = router;