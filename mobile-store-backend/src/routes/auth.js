const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate'); // Import validate middleware
const authValidator = require('../validators/auth.validator'); // Import auth validator
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for auth routes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/signup',
  authLimiter,
  validate(authValidator.userSignup),
  controller.signup
);
router.post(
  '/login',
  authLimiter,
  validate(authValidator.userLogin),
  controller.login
);
router.post('/logout', controller.logout);
router.get('/me', requireAuth, controller.me);

module.exports = router;
