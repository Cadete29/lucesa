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

module.exports = {
    createUser,
    findUserByEmail,
    findUserByUsername,
    findUserById
};