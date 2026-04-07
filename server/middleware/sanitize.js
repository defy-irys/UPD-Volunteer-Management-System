const xss = require('xss');

function sanitizeValue(value) {
  if (typeof value === 'string') {
    return xss(value.trim());
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const out = {};
    Object.keys(value).forEach(key => {
      out[key] = sanitizeValue(value[key]);
    });
    return out;
  }
  return value;
}

function sanitize(req, res, next) {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
}

module.exports = { sanitize };
