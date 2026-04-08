const db = require('../db');

// Using the pool directly
async function getVolunteers() {
  const { rows } = await db.pool.query('SELECT * FROM volunteers');
  return rows;
}

async function addVolunteer(data) {
  const result = await db.query(
    'INSERT INTO volunteers(name, email) VALUES($1, $2) RETURNING *',
    [data.name, data.email]
  );
  return result.rows[0];
}

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

module.exports = { findByName, createAdmin, getVolunteers, addVolunteer };
