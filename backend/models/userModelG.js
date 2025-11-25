const pool = require('../config/db');
const bcrypt = require('bcrypt');

const createUser = async (username, email, password, nombre = null) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
        INSERT INTO users (username, email, password, nombre)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, email, nombre, foto_perfil, created_at
    `;
    const values = [username, email, hashedPassword, nombre];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const findUserByEmail = async (email) => {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
};

const findUserByUsername = async (username) => {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return rows[0];
};

const findUserById = async (id) => {
    const { rows } = await pool.query(`
        SELECT id, username, email, nombre, foto_perfil, created_at 
        FROM users WHERE id = $1
    `, [id]);
    return rows[0];
};

// === ACTUALIZAR PERFIL (solo nombre y foto_perfil) ===
const updateUserProfile = async (id, { nombre, foto_perfil }) => {
    const query = `
        UPDATE users 
        SET nombre = COALESCE($1, nombre),
            foto_perfil = COALESCE($2, foto_perfil),
            updated_at = NOW()
        WHERE id = $3
        RETURNING id, username, email, nombre, foto_perfil, updated_at
    `;
    const values = [nombre, foto_perfil, id];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

// === BORRAR USUARIO (sin cambios) ===
const deleteUser = async (id) => {
    const query = `DELETE FROM users WHERE id = $1 RETURNING id, username`;
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