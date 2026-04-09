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

const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://upd-volunteer-form-5v7mnfatw-defy-irys-projects.vercel.app',
  /\.vercel\.app$/,
  /\.vercel\.app/
];

if (process.env.CORS_ORIGIN) {
  const envOrigins = process.env.CORS_ORIGIN.split(',').map(o => o.trim());
  allowedOrigins.push(...envOrigins);
}

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      return callback(null, true);
    }
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log(`✅ CORS allowed: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked: ${origin}`);
      console.log(`Allowed origins:`, allowedOrigins);
      callback(new Error('CORS not allowed from this origin'));
    }
  },
  credentials: true, // Important for cookies/sessions
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));


app.options('*', cors());

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