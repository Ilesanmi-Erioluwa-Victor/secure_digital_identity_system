const express = require('express');
const router = express.Router();
const {
  login,
  register,
  verifyOtp,
  verifyTotp,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  getTOTPSetup,
  enableTOTP,
  disableTOTP,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

router.post('/register', register);
router.post('/login', authLimiter, login);
router.post('/verify-otp', verifyOtp);
router.post('/verify-totp', verifyTotp);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.get('/totp/setup', protect, getTOTPSetup);
router.post('/totp/enable', protect, enableTOTP);
router.post('/totp/disable', protect, disableTOTP);

module.exports = router;
