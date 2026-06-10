const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
  identity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Identity',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    enum: [
      'LOGIN_SUCCESS',
      'LOGIN_FAILED',
      'OTP_SENT',
      'OTP_VERIFIED',
      'OTP_FAILED',
      'QR_SCAN_VALID',
      'QR_SCAN_INVALID',
      'QR_SCAN_SUSPENDED',
      'QR_SCAN_EXPIRED',
      'IDENTITY_ISSUED',
      'IDENTITY_RENEWED',
      'IDENTITY_SUSPENDED',
      'IDENTITY_REVOKED',
      'IDENTITY_ACTIVATED',
      'PASSWORD_RESET',
      'ACCOUNT_LOCKED',
      '2FA_ENABLED',
      '2FA_DISABLED',
      'IDENTITY_EXPIRED',
    ],
    required: [true, 'Action is required'],
  },
  outcome: {
    type: String,
    enum: ['Success', 'Failed', 'Suspicious'],
    required: [true, 'Outcome is required'],
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  details: {
    type: String,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AccessLog', accessLogSchema);
