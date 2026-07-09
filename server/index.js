require('dotenv').config({ path: '../.env' });
const express   = require('express');
const path      = require('path');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan    = require('morgan');
const connectDB = require('./config/db');

const app = express();

// ── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));

// ── Body parsing MUST come before all routes ─────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);

// ── Rate limiting ────────────────────────────────────────────────────────────
// Global rate limit — disabled in development, active in production
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production'
    ? parseInt(process.env.RATE_LIMIT_GLOBAL) || 500
    : 0,  // 0 = disabled
  skip: () => process.env.NODE_ENV !== 'production',
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

// Auth rate limit — stricter, active in both environments
// but more generous in development
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production'
    ? parseInt(process.env.RATE_LIMIT_AUTH) || 20
    : 100,  // generous in dev so testing doesn't get blocked
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' }
});

app.use(globalLimiter);
// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',            authLimiter, require('./routes/auth'));
app.use('/api/users',           require('./routes/users'));
app.use('/api/courses',         require('./routes/courses'));
app.use('/api/contact',         require('./routes/contact'));
app.use('/api/join',            require('./routes/join'));
app.use('/api/orders',          require('./routes/orders'));
app.use('/api/admin',           require('./routes/admin'));
app.use('/api/admin-requests',  require('./routes/adminRequests'));
app.use('/api/courses/:courseId/modules', require('./routes/modules'));
app.use('/api/modules',         require('./routes/modules').standalone);
app.use('/api/lessons',         require('./routes/lessons'));

// ── Serve Frontend ───────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'client')));

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ── Start server only after DB connects ──────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  // Ensure owner always has admin role on every startup
  try {
    const User = require('./models/User');
    const ownerEmail = process.env.OWNER_EMAIL;
    if (ownerEmail) {
      await User.updateOne(
        { email: ownerEmail.toLowerCase().trim() },
        { $set: { role: 'admin' } }
      );
      console.log(`✅ Owner admin status verified: ${ownerEmail}`);
    }
  } catch (err) {
    console.error('Owner check failed:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`✅ Unibotics server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err.message);
  process.exit(1);
});