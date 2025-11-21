const ftpService = require('../services/ftpService');
const logger = require('../utils/logger');

class CategoriasController {
    
    /**
     * Obtener todas las categorías (solo nombres)
     */
    async getCategorias(req, res) {
        try {
            logger.info('📋 Controlador: Solicitando categorías...');
            
            const productos = await this.obtenerProductosProcesados();
            
            if (!Array.isArray(productos)) {
                return res.status(500).json({
                    success: false,
                    error: 'No se pudieron obtener los productos procesados',
                    data: [],
                    timestamp: new Date().toISOString()
                });
            }

            // Extraer solo nombres de categorías únicas
            const categoriasUnicas = this.extraerCategoriasUnicas(productos);

            res.json({
                success: true,
                data: categoriasUnicas, // Solo array de strings
                total: categoriasUnicas.length,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('❌ Error en controlador de categorías:', error);
            
            res.status(500).json({
                success: false,
                error: error.message,
                data: [],
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Extraer categorías únicas de los productos
     */
    extraerCategoriasUnicas(productos) {
        const categoriasSet = new Set();

        productos.forEach(producto => {
            const categoria = producto.categoria || producto.subcategoria;
            if (categoria && typeof categoria === 'string' && categoria.trim() !== '') {
                categoriasSet.add(categoria.trim());
            }
        });

        // Convertir a array y ordenar alfabéticamente
        return Array.from(categoriasSet).sort();
    }

    /**
     * Obtener productos procesados del FTP service
     */
    async obtenerProductosProcesados() {
        try {
            const cacheData = ftpService.getCacheForController();
            const productos = cacheData.productos || [];
            return productos;
        } catch (error) {
            logger.error('❌ Error obteniendo productos procesados:', error);
            throw new Error('No se pudieron cargar los productos procesados: ' + error.message);
        }
    }
}

module.exports = new CategoriasController();