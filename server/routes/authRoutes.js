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

module.exports = router;
