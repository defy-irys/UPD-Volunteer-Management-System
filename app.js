const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { sanitize } = require('./middleware/sanitize');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { sendResponse } = require('./utils/response');
const authRoutes = require('./routes/authRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(sanitize);

const allowedOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : true;

app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(morgan('tiny'));

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    sendResponse(res, { success: false, data: null, message: 'Too many requests. Please try again later.' }, 429)
}));

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' }, message: 'OK' });
});

app.use('/api/auth', authRoutes);
app.use('/api/volunteers', volunteerRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
