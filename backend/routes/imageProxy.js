// imagenProxy.js
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
 * Proxy principal para imágenes por código - VERSIÓN SIMPLIFICADA
 */
router.get('/code/:imageCode', async (req, res) => {
    try {
        const { imageCode } = req.params;
        const { size = 'full', index = '0' } = req.query;

        console.log('🖼️ ===== INICIANDO PROXY DE IMAGEN =====');
        console.log('📌 Parámetros recibidos:', { 
            imageCode, 
            size, 
            index,
            urlOriginal: `http://static.ctonline.mx/imagenes/${imageCode}/${imageCode}_${index}_${size}.jpg`
        });
        
        if (!imageCode || imageCode === 'N/A') {
            console.log('❌ Código inválido');
            return sendFallbackImage(res, imageCode, 'Código inválido');
        }

        // ✅ GENERAR TODAS LAS POSIBLES URLS QUE PODRÍAN FUNCIONAR
        const allPossibleUrls = generateAllPossibleUrls(imageCode, size, index);
        console.log(`🔍 Generadas ${allPossibleUrls.length} URLs posibles para probar`);
        
        // Mostrar las primeras 5 URLs para debug
        allPossibleUrls.slice(0, 5).forEach((url, i) => {
            console.log(`   ${i+1}. ${url}`);
        });

        // ✅ INTENTAR CADA URL HASTA ENCONTRAR UNA QUE FUNCIONE
        let imageFound = false;
        
        for (const imageUrl of allPossibleUrls) {
            try {
                console.log(`🔄 Probando URL: ${imageUrl}`);
                
                // Hacer HEAD request primero para verificar
                const headResponse = await axios.head(imageUrl, {
                    timeout: 3000,
                    httpsAgent: httpsAgent,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'image/*',
                        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
                    }
                });
                
                console.log(`✅ HEAD exitoso (${headResponse.status}): ${imageUrl}`);
                
                // Si HEAD funciona, obtener la imagen completa
                const response = await axios({
                    method: 'GET',
                    url: imageUrl,
                    responseType: 'stream',
                    timeout: 5000,
                    httpsAgent: httpsAgent,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'image/*',
                        'Referer': imageUrl.startsWith('https') ? 'https://static.ctonline.mx/' : 'http://static.ctonline.mx/',
                        'Origin': imageUrl.startsWith('https') ? 'https://static.ctonline.mx' : 'http://static.ctonline.mx'
                    }
                });

                if (response.status === 200) {
                    console.log(`🎉 IMAGEN ENCONTRADA Y DESCARGADA: ${imageUrl}`);
                    console.log(`📊 Headers recibidos:`, {
                        'content-type': response.headers['content-type'],
                        'content-length': response.headers['content-length'],
                        'status': response.status
                    });
                    
                    // Configurar headers de respuesta
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
                    res.setHeader('Cache-Control', 'public, max-age=86400');
                    
                    if (response.headers['content-type']) {
                        res.setHeader('Content-Type', response.headers['content-type']);
                    }
                    
                    // Pipe de la imagen al response
                    response.data.pipe(res);
                    imageFound = true;
                    break;
                }
            } catch (error) {
                console.log(`❌ Error probando ${imageUrl}:`, {
                    status: error.response?.status,
                    code: error.code,
                    message: error.message
                });
                continue; // Intentar siguiente URL
            }
        }
        
        if (!imageFound) {
            console.log('💥 Todas las URLs fallaron, enviando imagen de fallback');
            sendFallbackImage(res, imageCode, 'Imagen no disponible en ningún servidor');
        }

    } catch (error) {
        console.error('💥 ERROR CRÍTICO en proxy:', error.message);
        console.error('Stack:', error.stack);
        sendFallbackImage(res, req.params.imageCode, 'Error interno del servidor');
    }
});

/**
 * ✅ GENERAR TODAS LAS POSIBLES COMBINACIONES DE URL
 * Para código CONGDM110, tamaño full, índice 0:
 * 1. http://static.ctonline.mx/imagenes/CONGDM110/CONGDM110_0_full.jpg
 * 2. https://static.ctonline.mx/imagenes/CONGDM110/CONGDM110_0_full.jpg
 * 3. http://static.ctonline.mx/imagenes/CONGDM110/CONGDM110_full.jpg (sin índice)
 * etc.
 */
function generateAllPossibleUrls(imageCode, size, index) {
    const urls = [];
    const basePaths = [
        // Formato más común: CÓDIGO_ÍNDICE_TAMAÑO.jpg
        `${imageCode}_${index}_${size}.jpg`,
        // Sin tamaño: CÓDIGO_ÍNDICE.jpg
        `${imageCode}_${index}.jpg`,
        // Sin índice: CÓDIGO_TAMAÑO.jpg
        `${imageCode}_${size}.jpg`,
        // Solo código: CÓDIGO.jpg
        `${imageCode}.jpg`,
        // Con guión bajo extra (algunas imágenes usan formato diferente)
        `${imageCode}_${index}_${size}_1.jpg`,
        // Para índice 0, también probar sin índice
        index === '0' ? `${imageCode}_${size}.jpg` : null,
        index === '0' ? `${imageCode}.jpg` : null
    ].filter(Boolean); // Eliminar nulls

    // Probar con HTTP y HTTPS
    basePaths.forEach(path => {
        urls.push(`http://static.ctonline.mx/imagenes/${imageCode}/${path}`);
        urls.push(`https://static.ctonline.mx/imagenes/${imageCode}/${path}`);
    });

    // URLs adicionales basadas en ejemplos que funcionan
    // Ejemplo: http://static.ctonline.mx/imagenes/CONGDM110/CONGDM110_4_full.jpg
    if (index !== '0') {
        // Si el índice no es 0, probar también ese índice específico
        urls.push(`http://static.ctonline.mx/imagenes/${imageCode}/${imageCode}_${index}_full.jpg`);
        urls.push(`https://static.ctonline.mx/imagenes/${imageCode}/${imageCode}_${index}_full.jpg`);
    }

    // Eliminar duplicados
    return [...new Set(urls)];
}

/**
 * ✅ Endpoint para verificar TODAS las URLs posibles
 */
router.get('/code/:imageCode/debug', async (req, res) => {
    try {
        const { imageCode } = req.params;
        const { size = 'full', index = '0' } = req.query;
        
        console.log('🔍 === DEBUG ENDPOINT ===');
        console.log('Código:', imageCode);
        
        const allUrls = generateAllPossibleUrls(imageCode, size, index);
        const results = [];
        
        // Probar cada URL concurrentemente
        const testPromises = allUrls.map(async (url) => {
            try {
                const startTime = Date.now();
                const response = await axios.head(url, {
                    timeout: 2000,
                    httpsAgent: httpsAgent,
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    }
                });
                const endTime = Date.now();
                
                return {
                    url,
                    status: response.status,
                    success: true,
                    timeMs: endTime - startTime,
                    contentType: response.headers['content-type'],
                    contentLength: response.headers['content-length']
                };
            } catch (error) {
                return {
                    url,
                    status: error.response?.status || 'ERROR',
                    success: false,
                    errorCode: error.code,
                    errorMessage: error.message,
                    timeMs: null
                };
            }
        });
        
        const testResults = await Promise.all(testPromises);
        
        // Ordenar: exitosas primero
        testResults.sort((a, b) => {
            if (a.success && !b.success) return -1;
            if (!a.success && b.success) return 1;
            return 0;
        });
        
        // Contar resultados
        const successful = testResults.filter(r => r.success).length;
        
        res.json({
            imageCode,
            size,
            index,
            totalUrlsTested: allUrls.length,
            successfulUrls: successful,
            failedUrls: allUrls.length - successful,
            results: testResults,
            recommendedUrl: testResults.find(r => r.success)?.url || null,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error en debug endpoint:', error);
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

/**
 * ✅ Endpoint simplificado para obtener todas las imágenes
 */
router.get('/code/:imageCode/all', async (req, res) => {
    try {
        const { imageCode } = req.params;
        
        console.log('🔍 Buscando múltiples imágenes para:', imageCode);
        
        const availableImages = [];
        const maxIndex = 10;
        
        // Buscar imágenes desde índice 0 hasta maxIndex
        for (let i = 0; i <= maxIndex; i++) {
            try {
                const testUrl = `http://static.ctonline.mx/imagenes/${imageCode}/${imageCode}_${i}_full.jpg`;
                console.log(`   Probando índice ${i}: ${testUrl}`);
                
                const response = await axios.head(testUrl, {
                    timeout: 1500,
                    httpsAgent: httpsAgent
                });
                
                if (response.status === 200) {
                    availableImages.push({
                        index: i,
                        url: `http://localhost:4004/api/images/code/${imageCode}?index=${i}`,
                        directUrl: testUrl,
                        protocol: 'http'
                    });
                    console.log(`   ✅ Imagen ${i} encontrada`);
                }
            } catch (error) {
                // Silenciar error, continuar con siguiente índice
                continue;
            }
        }
        
        // Si no encontramos ninguna con índice, probar sin índice
        if (availableImages.length === 0) {
            try {
                const mainUrl = `http://static.ctonline.mx/imagenes/${imageCode}/${imageCode}_full.jpg`;
                const response = await axios.head(mainUrl, {
                    timeout: 1500,
                    httpsAgent: httpsAgent
                });
                
                if (response.status === 200) {
                    availableImages.push({
                        index: 0,
                        url: `http://localhost:4004/api/images/code/${imageCode}`,
                        directUrl: mainUrl,
                        protocol: 'http'
                    });
                    console.log('✅ Imagen principal encontrada (sin índice)');
                }
            } catch (error) {
                // No hacer nada
            }
        }
        
        console.log(`📊 Total encontradas: ${availableImages.length}`);
        
        res.json({
            success: true,
            imageCode,
            availableImages,
            count: availableImages.length
        });
        
    } catch (error) {
        console.error('Error en /all:', error);
        res.json({
            success: false,
            error: error.message,
            availableImages: []
        });
    }
});

/**
 * Enviar imagen de fallback SVG
 */
function sendFallbackImage(res, imageCode, message = 'Imagen no disponible') {
    const code = imageCode || 'N/A';
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="300" fill="#f8f9fa"/>
    <rect x="80" y="80" width="240" height="140" fill="#e9ecef" rx="8"/>
    <circle cx="200" cy="150" r="30" fill="#adb5bd"/>
    <text x="200" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6c757d">
        ${code}
    </text>
    <text x="200" y="245" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#495057">
        ${message}
    </text>
</svg>`;
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(svg);
}

module.exports = router;