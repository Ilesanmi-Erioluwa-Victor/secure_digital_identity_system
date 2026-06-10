const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    institutionName: {
      type: String,
      default: 'Delta State Polytechnic Library',
    },
    institutionAddress: {
      type: String,
      default: 'Otefe-Oghara, Delta State, Nigeria',
    },
    institutionPhone: {
      type: String,
      default: '+234 800 000 0000',
    },
    defaultExpiryMonths: {
      type: Number,
      default: 12,
    },
    expiryWarningDays: {
      type: Number,
      default: 30,
    },
    finalWarningDays: {
      type: Number,
      default: 7,
    },
    requireMFAForAll: {
      type: Boolean,
      default: true,
    },
    allowTOTP: {
      type: Boolean,
      default: true,
    },
    loginRateLimitMax: {
      type: Number,
      default: 5,
    },
    accountLockoutMinutes: {
      type: Number,
      default: 30,
    },
    accessLevelDescriptions: [
      {
        level: {
          type: Number,
          enum: [1, 2, 3, 4],
        },
        description: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
