const express = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

const loginSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  password: z.string().min(6, 'Password is required.'),
  rememberMe: z.boolean().optional().default(false)
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  setupCode: z.string().min(4, 'Setup code is required.')
});

router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/register', validate(registerSchema), authController.register);
router.get('/me', requireAuth, authController.me);

router.get('/init-db', async (req, res) => {
  try {
    const db = require('../db');
    const bcrypt = require('bcryptjs');
    
    // Create admins table
    await db.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Check if admin exists
    const adminCheck = await db.query('SELECT * FROM admins WHERE name = $1', ['Admin User']);
    
    if (adminCheck.rows.length === 0) {
      const hash = await bcrypt.hash('InitPwd', 10);
      await db.query(
        'INSERT INTO admins (name, password_hash) VALUES ($1, $2)',
        ['Admin User', hash]
      );
    }
    
    // Create volunteers table
    await db.query(`
      CREATE TABLE IF NOT EXISTS volunteers (
        id SERIAL PRIMARY KEY,
        uid VARCHAR(50) UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        mobile VARCHAR(50),
        program VARCHAR(255),
        year_joined VARCHAR(10),
        occupation VARCHAR(100),
        alumnus_up VARCHAR(10),
        connected_pgh VARCHAR(10),
        prc_license VARCHAR(100),
        department_office VARCHAR(255),
        college VARCHAR(255),
        course VARCHAR(255),
        year_level VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    res.json({ success: true, message: "Database initialized!" });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
