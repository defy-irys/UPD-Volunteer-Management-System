const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorHandler');
const { sendResponse } = require('../utils/response');
const { findByName, createAdmin } = require('../models/adminModel');

function signToken(payload, remember) {
  const expiresIn = remember ? '7d' : '1d';
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

function cookieOptions(remember) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : undefined
  };
}

async function login(req, res, next) {
  try {
    console.log("=== LOGIN START ===");
    console.log("Request body:", req.body);
    console.log("Name:", req.body.name);
    console.log("Password provided:", req.body.password ? "Yes (length: " + req.body.password.length + ")" : "No");
    
    const { name, password, rememberMe } = req.body;
    
    if (!name || !password) {
      console.log("Missing name or password");
      return next(new AppError('Name and password required.', 400));
    }
    
    console.log("Calling findByName for:", name);
    const admin = await findByName(name);
    console.log("findByName result:", admin ? "Admin found" : "Admin not found");
    
    if (!admin) {
      console.log("No admin found with name:", name);
      return next(new AppError('Invalid credentials.', 401));
    }
    
    console.log("Admin found, comparing password...");
    const ok = await bcrypt.compare(password, admin.password_hash);
    console.log("Password match:", ok);
    
    if (!ok) {
      console.log("Password mismatch for:", name);
      return next(new AppError('Invalid credentials.', 401));
    }

    console.log("Login successful for:", name);
    const token = signToken({ id: admin.id, name: admin.name }, rememberMe);
    res.cookie('auth_token', token, cookieOptions(rememberMe));
    return sendResponse(res, { success: true, data: { name: admin.name }, message: 'Login successful.' });
  } catch (err) {
    console.error("=== LOGIN ERROR ===");
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.error("Full error:", err);
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    res.clearCookie('auth_token', { httpOnly: true, sameSite: 'lax' });
    return sendResponse(res, { success: true, data: null, message: 'Logged out.' });
  } catch (err) {
    return next(err);
  }
}

async function register(req, res, next) {
  try {
    const { name, password, setupCode } = req.body;
    if (setupCode !== process.env.ADMIN_SETUP_CODE) {
      return next(new AppError('Invalid setup code.', 403));
    }

    const existing = await findByName(name);
    if (existing) return next(new AppError('Account already exists.', 409));

    const hash = await bcrypt.hash(password, 10);
    const admin = await createAdmin(name, hash);
    return sendResponse(res, { success: true, data: { name: admin.name }, message: 'Account created.' }, 201);
  } catch (err) {
    return next(err);
  }
}

function me(req, res, next) {
  try {
    return sendResponse(res, { success: true, data: { name: req.user.name }, message: 'Session active.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { login, logout, register, me };
