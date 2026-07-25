const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const phoneRoutes = require('./routes/phones');
const upcomingPhoneRoutes = require('./routes/upcomingPhones');
const newsRoutes = require('./routes/news');
const brandRoutes = require('./routes/brands');
const adminRoutes = require('./routes/admin');

const app = express();

// Security headers

app.use(helmet());

// parse cookies (needed for cookie-based auth)
app.use(cookieParser());

// CORS: allow explicitly configured origins or default local dev origin
const rawOrigins = process.env.CLIENT_ORIGINS || 'http://localhost:5173';
const allowedOrigins = rawOrigins
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (e.g., server-to-server, tools)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error('CORS not allowed for origin ' + origin));
    },
    // allow cookies to be sent to the API
    credentials: true,
  }),
);

// Logging + JSON
app.use(morgan('dev'));

app.use(express.json());

// Global rate limiter for API endpoints (configurable)
const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/phones', phoneRoutes);
app.use('/api/upcoming', upcomingPhoneRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || 'Server error' });
});

module.exports = app;
