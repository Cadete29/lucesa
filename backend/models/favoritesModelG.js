// backend/models/favoritesModelG.js
const pool = require('../config/db');

class FavoritesModel {
    
    /**
     * Obtener todos los favoritos de un usuario
     */
    async getUserFavorites(userId) {
        const query = `
            SELECT id, user_id, product_id, product_data, created_at, updated_at
            FROM user_favorites 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `;
        
        try {
            console.log('🔍 Ejecutando query getUserFavorites para usuario:', userId);
            const { rows } = await pool.query(query, [userId]);
            console.log('✅ Favoritos encontrados:', rows.length);
            return rows;
        } catch (error) {
            console.error('❌ Error en getUserFavorites:', error);
            throw error;
        }
    }

    /**
     * Agregar producto a favoritos
     */
    async addToFavorites(userId, productId, productData) {
        const query = `
            INSERT INTO user_favorites (user_id, product_id, product_data)
            VALUES ($1, $2, $3)
            RETURNING id, user_id, product_id, product_data, created_at
        `;
        
        try {
            console.log('💾 Guardando favorito en BD:', { userId, productId });
            const { rows } = await pool.query(query, [
                userId, 
                productId, 
                JSON.stringify(productData)
            ]);
            console.log('✅ Favorito guardado con ID:', rows[0].id);
            return rows[0];
        } catch (error) {
            console.error('❌ Error en addToFavorites:', error);
            throw error;
        }
    }

    /**
     * Eliminar producto de favoritos
     */
    async removeFromFavorites(userId, productId) {
        const query = `
            DELETE FROM user_favorites 
            WHERE user_id = $1 AND product_id = $2
            RETURNING id
        `;
        
        try {
            console.log('🗑️ Eliminando favorito de BD:', { userId, productId });
            const { rows } = await pool.query(query, [userId, productId]);
            console.log('✅ Favorito eliminado:', rows[0] ? 'Sí' : 'No');
            return rows[0];
        } catch (error) {
            console.error('❌ Error en removeFromFavorites:', error);
            throw error;
        }
    }

    /**
     * Verificar si un producto está en favoritos
     */
    async isFavorite(userId, productId) {
        const query = `
            SELECT id FROM user_favorites 
            WHERE user_id = $1 AND product_id = $2
        `;
        
        try {
            console.log('🔍 Verificando si es favorito:', { userId, productId });
            const { rows } = await pool.query(query, [userId, productId]);
            const result = rows.length > 0;
            console.log('✅ Es favorito?:', result);
            return result;
        } catch (error) {
            console.error('❌ Error en isFavorite:', error);
            throw error;
        }
    }

    /**
     * Eliminar todos los favoritos de un usuario
     */
    async clearAllFavorites(userId) {
        const query = `
            DELETE FROM user_favorites 
            WHERE user_id = $1 
            RETURNING COUNT(*) as deleted_count
        `;
        
        try {
            console.log('🧹 Eliminando todos los favoritos para usuario:', userId);
            const { rows } = await pool.query(query, [userId]);
            const count = parseInt(rows[0].deleted_count);
            console.log('✅ Favoritos eliminados:', count);
            return count;
        } catch (error) {
            console.error('❌ Error en clearAllFavorites:', error);
            throw error;
        }
    }

    /**
     * Contar favoritos de un usuario
     */
    async getFavoritesCount(userId) {
        const query = `
            SELECT COUNT(*) as count 
            FROM user_favorites 
            WHERE user_id = $1
        `;
        
        try {
            console.log('🔢 Contando favoritos para usuario:', userId);
            const { rows } = await pool.query(query, [userId]);
            const count = parseInt(rows[0].count);
            console.log('✅ Total de favoritos:', count);
            return count;
        } catch (error) {
            console.error('❌ Error en getFavoritesCount:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de favoritos (para admin)
     */
    async getFavoritesStats() {
        const query = `
            SELECT 
                COUNT(*) as total_favorites,
                COUNT(DISTINCT user_id) as total_users_with_favorites,
                COUNT(DISTINCT product_id) as unique_products,
                AVG(fav_count) as avg_favorites_per_user
            FROM (
                SELECT 
                    user_id,
                    COUNT(*) as fav_count
                FROM user_favorites 
                GROUP BY user_id
            ) user_counts
        `;
        
        try {
            console.log('📊 Obteniendo estadísticas de favoritos');
            const { rows } = await pool.query(query);
            console.log('✅ Estadísticas obtenidas');
            return rows[0];
        } catch (error) {
            console.error('❌ Error en getFavoritesStats:', error);
            throw error;
        }
    }

    /**
     * Obtener productos más favoritos (para admin)
     */
    async getMostFavoritedProducts(limit = 10) {
        const query = `
            SELECT 
                product_id,
                COUNT(*) as favorite_count,
                MAX(product_data->>'nombre') as product_name,
                MAX(product_data->>'marca') as brand
            FROM user_favorites 
            GROUP BY product_id 
            ORDER BY favorite_count DESC 
            LIMIT $1
        `;
        
        try {
            console.log('🔥 Obteniendo productos más favoritos, límite:', limit);
            const { rows } = await pool.query(query, [limit]);
            console.log('✅ Productos más favoritos obtenidos:', rows.length);
            return rows;
        } catch (error) {
            console.error('❌ Error en getMostFavoritedProducts:', error);
            throw error;
        }
    }
}

module.exports = new FavoritesModel();