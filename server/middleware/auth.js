const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  // check auth header first
  const authHeader = req.headers.authorization;
  let token = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.auth_token) {
    // Fallback to cookie
    token = req.cookies.auth_token;
  }
  
  if (!token) {
    return next(new AppError('Unauthorized - No token provided', 401));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return next(new AppError('Unauthorized - Invalid token', 401));
  }
}

module.exports = { requireAuth };