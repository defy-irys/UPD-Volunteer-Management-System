require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

async function seed() {
  const name = process.env.ADMIN_SEED_NAME;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!name || !password) {
    console.log('ADMIN_SEED_NAME and ADMIN_SEED_PASSWORD are required.');
    process.exit(1);
  }

  const existing = await pool.query('SELECT id FROM admins WHERE lower(name) = lower($1) LIMIT 1', [name]);
  if (existing.rows.length) {
    console.log('Admin already exists.');
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO admins (name, password_hash) VALUES ($1, $2)', [name, hash]);
  console.log('Admin created.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
