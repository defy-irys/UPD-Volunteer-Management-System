const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.auth_token;
  if (!token) return next(new AppError('Unauthorized.', 401));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return next(new AppError('Unauthorized.', 401));
  }
}

module.exports = { requireAuth };
