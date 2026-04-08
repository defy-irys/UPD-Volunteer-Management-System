const { sendResponse } = require('../utils/response');

class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

function notFound(req, res, next) {
  next(new AppError('Route not found.', 404));
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Server error.';
  return sendResponse(res, { success: false, data: null, message }, status);
}

module.exports = { AppError, notFound, errorHandler };
