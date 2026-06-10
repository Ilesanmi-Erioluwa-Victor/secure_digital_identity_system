const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 5,
  message: {
    message: `Too many attempts. Try again in ${Math.ceil(
      (parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000) / 60000
    )} minutes`,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter };
