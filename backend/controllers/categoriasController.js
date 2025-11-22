const ftpService = require('../services/ftpService');
const logger = require('../utils/logger');

class CategoriasController {
    
    /**
     * Obtener TODAS las categorías reales desde los productos
     */
    async getCategoriasReales(req, res) {
        try {
            logger.info('📋 Controlador: Solicitando TODAS las categorías reales...');
            
            const cacheData = ftpService.getCacheForController();
            const productos = cacheData.productos || [];
            
            if (!Array.isArray(productos)) {
                return res.status(500).json({
                    success: false,
                    error: 'No se pudieron obtener los productos procesados',
                    data: [],
                    timestamp: new Date().toISOString()
                });
            }

            logger.info(`🔍 Analizando ${productos.length} productos para categorías reales...`);

            // Extraer TODAS las categorías reales
            const todasLasCategorias = this.extraerTodasLasCategoriasReales(productos);

            // Contar productos por categoría
            const conteoPorCategoria = this.contarProductosPorCategoria(productos);

            res.json({
                success: true,
                data: todasLasCategorias,
                metadata: {
                    total: todasLasCategorias.length,
                    totalProductos: productos.length,
                    categoriasConProductos: Object.keys(conteoPorCategoria).length,
                    conteoPorCategoria: conteoPorCategoria,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('❌ Error en controlador de categorías reales:', error);
            
            res.status(500).json({
                success: false,
                error: error.message,
                data: [],
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Extraer TODAS las categorías reales de los productos
     */
    extraerTodasLasCategoriasReales(productos) {
        const categoriasSet = new Set();
        const subcategoriasSet = new Set();

        productos.forEach((producto, index) => {
            // Categoría principal
            if (producto.categoria && 
                typeof producto.categoria === 'string' && 
                producto.categoria.trim() !== '' &&
                producto.categoria.trim() !== 'N/A' &&
                producto.categoria.trim() !== 'Sin categoría' &&
                producto.categoria.trim() !== 'null' &&
                producto.categoria.trim().length > 1) {
                
                categoriasSet.add(producto.categoria.trim());
            }

            // Subcategoría
            if (producto.subcategoria && 
                typeof producto.subcategoria === 'string' && 
                producto.subcategoria.trim() !== '' &&
                producto.subcategoria.trim() !== 'N/A' &&
                producto.subcategoria.trim() !== 'Sin subcategoría' &&
                producto.subcategoria.trim() !== 'null' &&
                producto.subcategoria.trim().length > 1 &&
                producto.subcategoria !== producto.categoria) {
                
                subcategoriasSet.add(producto.subcategoria.trim());
            }

            // Log cada 1000 productos
            if ((index + 1) % 1000 === 0) {
                logger.info(`   📊 Procesados ${index + 1} productos...`);
            }
        });

        // Combinar y ordenar
        const todasLasCategorias = [...categoriasSet, ...subcategoriasSet].sort();
        
        logger.info(`📊 Categorías reales encontradas: ${todasLasCategorias.length}`);
        logger.info(`   📁 Categorías principales: ${categoriasSet.size}`);
        logger.info(`   📂 Subcategorías: ${subcategoriasSet.size}`);

        // Mostrar ejemplos
        if (todasLasCategorias.length > 0) {
            logger.info('🏷️ Ejemplos de categorías encontradas:');
            todasLasCategorias.slice(0, 10).forEach((cat, i) => {
                logger.info(`   ${i + 1}. ${cat}`);
            });
        }

        return todasLasCategorias;
    }

    /**
     * Contar productos por categoría real
     */
    contarProductosPorCategoria(productos) {
        const conteo = {};
        let totalProductosConCategoria = 0;

        productos.forEach(producto => {
            // Contar por categoría principal
            if (producto.categoria && 
                typeof producto.categoria === 'string' && 
                producto.categoria.trim() !== '' &&
                producto.categoria.trim() !== 'N/A' &&
                producto.categoria.trim() !== 'null' &&
                producto.categoria.trim().length > 1) {
                
                const categoria = producto.categoria.trim();
                conteo[categoria] = (conteo[categoria] || 0) + 1;
                totalProductosConCategoria++;
            }

            // Contar por subcategoría
            if (producto.subcategoria && 
                typeof producto.subcategoria === 'string' && 
                producto.subcategoria.trim() !== '' &&
                producto.subcategoria.trim() !== 'N/A' &&
                producto.subcategoria.trim() !== 'null' &&
                producto.subcategoria.trim().length > 1 &&
                producto.subcategoria !== producto.categoria) {
                
                const subcategoria = producto.subcategoria.trim();
                conteo[subcategoria] = (conteo[subcategoria] || 0) + 1;
                totalProductosConCategoria++;
            }
        });

        logger.info(`📈 Productos con categoría: ${totalProductosConCategoria}`);
        logger.info(`🏷️ Categorías únicas con productos: ${Object.keys(conteo).length}`);

        return conteo;
    }

    /**
     * Obtener categorías con estadísticas detalladas
     */
    async getCategoriasConEstadisticas(req, res) {
        try {
            const cacheData = ftpService.getCacheForController();
            const productos = cacheData.productos || [];

            const categoriasReales = this.extraerTodasLasCategoriasReales(productos);
            const conteoPorCategoria = this.contarProductosPorCategoria(productos);

            // Crear array de categorías con estadísticas
            const categoriasConStats = categoriasReales.map(categoriaNombre => {
                const count = conteoPorCategoria[categoriaNombre] || 0;
                
                return {
                    nombre: categoriaNombre,
                    count: count,
                    tieneProductos: count > 0,
                    porcentajeDelTotal: productos.length > 0 ? 
                        ((count / productos.length) * 100).toFixed(2) + '%' : '0%'
                };
            }).filter(cat => cat.nombre && cat.nombre.trim() !== '')
              .sort((a, b) => b.count - a.count);

            res.json({
                success: true,
                data: categoriasConStats,
                metadata: {
                    totalCategorias: categoriasConStats.length,
                    categoriasConProductos: categoriasConStats.filter(cat => cat.count > 0).length,
                    categoriasSinProductos: categoriasConStats.filter(cat => cat.count === 0).length,
                    totalProductos: productos.length,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('❌ Error en getCategoriasConEstadisticas:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                data: [],
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Endpoint original para compatibilidad
     */
    async getCategorias(req, res) {
        try {
            logger.info('📋 Controlador: Solicitando categorías...');
            
            const cacheData = ftpService.getCacheForController();
            const productos = cacheData.productos || [];
            
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
                data: categoriasUnicas,
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
     * Extraer categorías únicas (método original para compatibilidad)
     */
    extraerCategoriasUnicas(productos) {
        const categoriasSet = new Set();

        productos.forEach(producto => {
            const categoria = producto.categoria || producto.subcategoria;
            if (categoria && typeof categoria === 'string' && categoria.trim() !== '') {
                categoriasSet.add(categoria.trim());
            }
        });

        return Array.from(categoriasSet).sort();
    }
}

module.exports = new CategoriasController();