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
        // Consulta corregida - separada en consultas individuales para evitar errores de columna
        const queries = [
            // Total de favoritos
            `SELECT COUNT(*) as total_favorites FROM user_favorites`,
            
            // Total de usuarios con favoritos
            `SELECT COUNT(DISTINCT user_id) as total_users_with_favorites FROM user_favorites`,
            
            // Productos únicos
            `SELECT COUNT(DISTINCT product_id) as unique_products FROM user_favorites`,
            
            // Promedio de favoritos por usuario
            `SELECT COALESCE(AVG(fav_count), 0) as avg_favorites_per_user 
             FROM (
                 SELECT user_id, COUNT(*) as fav_count 
                 FROM user_favorites 
                 GROUP BY user_id
             ) user_counts`
        ];
        
        try {
            console.log('📊 Obteniendo estadísticas de favoritos');
            
            // Ejecutar todas las consultas
            const results = await Promise.all([
                pool.query(queries[0]),
                pool.query(queries[1]),
                pool.query(queries[2]),
                pool.query(queries[3])
            ]);
            
            // Extraer los resultados
            const totalFavorites = parseInt(results[0].rows[0].total_favorites) || 0;
            const totalUsers = parseInt(results[1].rows[0].total_users_with_favorites) || 0;
            const uniqueProducts = parseInt(results[2].rows[0].unique_products) || 0;
            const avgPerUser = parseFloat(results[3].rows[0].avg_favorites_per_user) || 0;
            
            const stats = {
                total_favorites: totalFavorites,
                total_users_with_favorites: totalUsers,
                unique_products: uniqueProducts,
                avg_favorites_per_user: avgPerUser
            };
            
            console.log('✅ Estadísticas obtenidas:', stats);
            return stats;
            
        } catch (error) {
            console.error('❌ Error en getFavoritesStats:', error);
            
            // Retornar estadísticas por defecto en caso de error
            return {
                total_favorites: 0,
                total_users_with_favorites: 0,
                unique_products: 0,
                avg_favorites_per_user: 0
            };
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
                COALESCE(MAX(product_data->>'nombre'), 'Producto sin nombre') as product_name,
                COALESCE(MAX(product_data->>'marca'), 'Sin marca') as brand
            FROM user_favorites 
            GROUP BY product_id 
            ORDER BY favorite_count DESC 
            LIMIT $1
        `;
        
        try {
            console.log('🔥 Obteniendo productos más favoritos, límite:', limit);
            const { rows } = await pool.query(query, [limit]);
            console.log('✅ Productos más favoritos obtenidos:', rows.length);
            
            // Asegurar que los conteos sean números
            return rows.map(row => ({
                ...row,
                favorite_count: parseInt(row.favorite_count) || 0
            }));
        } catch (error) {
            console.error('❌ Error en getMostFavoritedProducts:', error);
            // Retornar array vacío en caso de error
            return [];
        }
    }

    /**
     * Verificar si hay datos en la tabla
     */
    async hasData() {
        const query = `SELECT EXISTS (SELECT 1 FROM user_favorites LIMIT 1) as has_data`;
        
        try {
            const { rows } = await pool.query(query);
            return rows[0].has_data;
        } catch (error) {
            console.error('❌ Error verificando datos:', error);
            return false;
        }
    }
}

module.exports = new FavoritesModel();