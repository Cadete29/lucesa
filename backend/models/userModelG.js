// backend/models/userModelG.js

const pool = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * Crea un nuevo usuario en la base de datos
 */
const createUser = async (username, email, password, nombre = null) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
        INSERT INTO users (username, email, password, nombre, rol, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'user', NOW(), NOW())
        RETURNING id, username, email, nombre, images_profile, rol, created_at, updated_at
    `;
    
    const values = [username, email, hashedPassword, nombre];
    
    try {
        const { rows } = await pool.query(query, values);
        console.log('Usuario creado en BD:', rows[0]);
        return rows[0];
    } catch (error) {
        console.error('Error en createUser:', error);
        throw error;
    }
};

/**
 * Busca un usuario por email
 */
const findUserByEmail = async (email) => {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
};

/**
 * Busca un usuario por username
 */
const findUserByUsername = async (username) => {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return rows[0];
};

/**
 * Busca un usuario por ID (excluye password)
 */
const findUserById = async (id) => {
    const { rows } = await pool.query(`
        SELECT id, username, email, nombre, images_profile, rol, created_at, updated_at 
        FROM users WHERE id = $1
    `, [id]);
    return rows[0];
};

/**
 * Actualiza el perfil del usuario (nombre y images_profile)
 */
const updateUserProfile = async (id, { nombre, images_profile }) => {
    console.log('📝 Actualizando perfil del usuario:', { id, nombre, images_profile });
    
    // Construir la consulta dinámicamente basada en los campos proporcionados
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (nombre !== undefined) {
        updates.push(`nombre = $${paramCount}`);
        values.push(nombre);
        paramCount++;
    }

    if (images_profile !== undefined) {
        updates.push(`images_profile = $${paramCount}`);
        values.push(images_profile);
        paramCount++;
    }

    // Siempre actualizar updated_at
    updates.push(`updated_at = NOW()`);

    if (updates.length === 0) {
        throw new Error('No hay campos para actualizar');
    }

    values.push(id);

    const query = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, username, email, nombre, images_profile, rol, updated_at
    `;

    console.log('🔍 Query ejecutada:', query);
    console.log('📊 Valores:', values);

    try {
        const { rows } = await pool.query(query, values);
        console.log('✅ Usuario actualizado:', rows[0]);
        return rows[0];
    } catch (error) {
        console.error('❌ Error en updateUserProfile:', error);
        throw error;
    }
};

/**
 * Elimina un usuario por ID
 */
const deleteUser = async (id) => {
    const query = `DELETE FROM users WHERE id = $1 RETURNING id, username, email`;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserByUsername,
    findUserById,
    updateUserProfile,
    deleteUser
};