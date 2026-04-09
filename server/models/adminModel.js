const db = require('../db');

// GET volunteers
async function getVolunteers() {
  const { rows } = await db.query('SELECT * FROM volunteers');
  return rows;
}

// ADD volunteer
async function addVolunteer(data) {
  const { rows } = await db.query(
    'INSERT INTO volunteers(name, email) VALUES($1, $2) RETURNING *',
    [data.name, data.email]
  );
  return rows[0];
}

// FIND admin by name
async function findByName(name) {
  const { rows } = await db.query(
    'SELECT id, name, password_hash FROM admins WHERE lower(name) = lower($1) LIMIT 1',
    [name]
  );
  return rows[0] || null;
}

// CREATE admin
async function createAdmin(name, passwordHash) {
  const { rows } = await db.query(
    'INSERT INTO admins (name, password_hash) VALUES ($1, $2) RETURNING id, name',
    [name, passwordHash]
  );
  return rows[0];
}

module.exports = { findByName, createAdmin, getVolunteers, addVolunteer };