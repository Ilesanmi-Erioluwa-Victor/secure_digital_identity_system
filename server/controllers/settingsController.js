const asyncHandler = require('express-async-handler');
const Settings = require('../models/Settings');

const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  const doc = settings.toObject();
  if (Array.isArray(doc.accessLevelDescriptions)) {
    doc.accessLevelDescriptions = doc.accessLevelDescriptions.reduce((acc, { level, description }) => {
      if (level) acc[String(level)] = description || '';
      return acc;
    }, {});
  }
  res.json({ settings: doc });
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
      if (field === 'accessLevelDescriptions') {
        const obj = req.body[field];
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
          settings[field] = Object.entries(obj).map(([level, description]) => ({
            level: Number(level),
            description: String(description),
          }));
          return;
        }
      }
      settings[field] = req.body[field];
    }
  });

  await settings.save();
  res.json({ settings, message: 'Settings updated successfully' });
});

module.exports = { getSettings, updateSettings };
