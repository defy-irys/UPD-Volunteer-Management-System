const { pool } = require('../db');

async function findByName(name) {
  const { rows } = await pool.query(
    'SELECT id, name, password_hash FROM admins WHERE lower(name) = lower($1) LIMIT 1',
    [name]
  );
  return rows[0] || null;
}

async function createAdmin(name, passwordHash) {
  const { rows } = await pool.query(
    'INSERT INTO admins (name, password_hash) VALUES ($1, $2) RETURNING id, name',
    [name, passwordHash]
  );
  return rows[0];
}

module.exports = { findByName, createAdmin };
