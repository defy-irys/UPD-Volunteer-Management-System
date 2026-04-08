const { AppError } = require('./errorHandler');

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors.map(e => e.message).join(' ');
      return next(new AppError(message || 'Validation failed.', 400));
    }
    req.body = result.data;
    return next();
  };
}

module.exports = { validate };
