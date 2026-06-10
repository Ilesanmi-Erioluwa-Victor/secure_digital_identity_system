const asyncHandler = require('express-async-handler');
const Settings = require('../models/Settings');

const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  res.json({ settings });
});

const updateSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings();
  }

  const allowedFields = [
    'institutionName',
    'institutionAddress',
    'institutionPhone',
    'defaultExpiryMonths',
    'expiryWarningDays',
    'finalWarningDays',
    'requireMFAForAll',
    'allowTOTP',
    'loginRateLimitMax',
    'accountLockoutMinutes',
    'accessLevelDescriptions',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      settings[field] = req.body[field];
    }
  });

  await settings.save();
  res.json({ settings, message: 'Settings updated successfully' });
});

module.exports = { getSettings, updateSettings };
