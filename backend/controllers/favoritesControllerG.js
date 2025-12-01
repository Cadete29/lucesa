// backend/controllers/favoritesControllerG.js
const favoritesModel = require('../models/favoritesModelG');

class FavoritesController {
    
    /**
     * Obtener favoritos del usuario
     */
    async getUserFavorites(req, res) {
        try {
            const userId = req.user.id;
            
            console.log('📥 Obteniendo favoritos para usuario:', userId);
            
            const favorites = await favoritesModel.getUserFavorites(userId);
            
            // Transformar los datos para el frontend
            const formattedFavorites = favorites.map(fav => ({
                id: fav.product_id,
                ...fav.product_data,
                favorited_at: fav.created_at,
                favorite_id: fav.id
            }));

            console.log('✅ Favoritos obtenidos:', formattedFavorites.length);

            res.json({
                success: true,
                data: {
                    favorites: formattedFavorites,
                    count: formattedFavorites.length
                }
            });

        } catch (error) {
            console.error('❌ Error en getUserFavorites:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener favoritos'
            });
        }
    }

    /**
     * Agregar a favoritos
     */
    async addToFavorites(req, res) {
        try {
            const userId = req.user.id;
            const { productId } = req.params;
            const productData = req.body;

            console.log('❤️ Agregando a favoritos:', { userId, productId });

            if (!productId || !productData) {
                return res.status(400).json({
                    success: false,
                    message: 'Product ID y datos del producto son requeridos'
                });
            }

            // Verificar si ya está en favoritos
            const alreadyFavorite = await favoritesModel.isFavorite(userId, productId);
            if (alreadyFavorite) {
                return res.status(400).json({
                    success: false,
                    message: 'El producto ya está en favoritos'
                });
            }

            const favorite = await favoritesModel.addToFavorites(userId, productId, productData);

            console.log('✅ Producto agregado a favoritos:', favorite.id);

            res.status(201).json({
                success: true,
                message: 'Producto agregado a favoritos',
                data: {
                    favorite_id: favorite.id,
                    product_id: productId,
                    added_at: favorite.created_at
                }
            });

        } catch (error) {
            console.error('❌ Error en addToFavorites:', error);
            
            if (error.code === '23505') { // Violación de unique constraint
                return res.status(400).json({
                    success: false,
                    message: 'El producto ya está en favoritos'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al agregar a favoritos'
            });
        }
    }

    /**
     * Eliminar de favoritos
     */
    async removeFromFavorites(req, res) {
        try {
            const userId = req.user.id;
            const { productId } = req.params;

            console.log('🗑️ Eliminando de favoritos:', { userId, productId });

            const result = await favoritesModel.removeFromFavorites(userId, productId);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado en favoritos'
                });
            }

            console.log('✅ Producto eliminado de favoritos');

            res.json({
                success: true,
                message: 'Producto eliminado de favoritos'
            });

        } catch (error) {
            console.error('❌ Error en removeFromFavorites:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar de favoritos'
            });
        }
    }

    /**
     * Verificar si un producto está en favoritos
     */
    async checkIsFavorite(req, res) {
        try {
            const userId = req.user.id;
            const { productId } = req.params;

            console.log('🔍 Verificando favorito:', { userId, productId });

            const isFavorite = await favoritesModel.isFavorite(userId, productId);

            res.json({
                success: true,
                data: {
                    is_favorite: isFavorite,
                    product_id: productId
                }
            });

        } catch (error) {
            console.error('❌ Error en checkIsFavorite:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar favorito'
            });
        }
    }

    /**
     * Eliminar todos los favoritos
     */
    async clearAllFavorites(req, res) {
        try {
            const userId = req.user.id;

            console.log('🧹 Limpiando todos los favoritos para usuario:', userId);

            const deletedCount = await favoritesModel.clearAllFavorites(userId);

            console.log('✅ Favoritos eliminados:', deletedCount);

            res.json({
                success: true,
                message: `Se eliminaron ${deletedCount} productos de favoritos`,
                data: {
                    deleted_count: deletedCount
                }
            });

        } catch (error) {
            console.error('❌ Error en clearAllFavorites:', error);
            res.status(500).json({
                success: false,
                message: 'Error al limpiar favoritos'
            });
        }
    }

    /**
     * Obtener estadísticas de favoritos (Admin only)
     */
    async getFavoritesStats(req, res) {
        try {
            // Verificar que el usuario es admin
            if (req.user.rol !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para acceder a estas estadísticas'
                });
            }

            console.log('📊 Obteniendo estadísticas de favoritos (Admin)');

            const stats = await favoritesModel.getFavoritesStats();
            const topProducts = await favoritesModel.getMostFavoritedProducts(10);

            console.log('📈 Estadísticas calculadas:', stats);
            console.log('🔥 Top productos:', topProducts.length);

            res.json({
                success: true,
                data: {
                    stats,
                    top_products: topProducts
                }
            });

        } catch (error) {
            console.error('❌ Error en getFavoritesStats:', error);
            
            // Enviar estadísticas por defecto en caso de error
            res.json({
                success: true,
                data: {
                    stats: {
                        total_favorites: 0,
                        total_users_with_favorites: 0,
                        unique_products: 0,
                        avg_favorites_per_user: 0
                    },
                    top_products: []
                }
            });
        }
    }

    /**
     * Obtener favoritos por usuario (Admin only)
     */
    async getUserFavoritesAdmin(req, res) {
        try {
            if (req.user.rol !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para acceder a esta información'
                });
            }

            const { userId } = req.params;

            console.log('👤 Obteniendo favoritos del usuario (Admin):', userId);

            const favorites = await favoritesModel.getUserFavorites(userId);
            const count = await favoritesModel.getFavoritesCount(userId);

            res.json({
                success: true,
                data: {
                    user_id: parseInt(userId),
                    favorites: favorites.map(fav => ({
                        id: fav.product_id,
                        ...fav.product_data,
                        favorited_at: fav.created_at
                    })),
                    total_count: count
                }
            });

        } catch (error) {
            console.error('❌ Error en getUserFavoritesAdmin:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener favoritos del usuario'
            });
        }
    }
}

module.exports = new FavoritesController();