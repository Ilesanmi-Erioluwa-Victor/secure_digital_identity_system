const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const path = require('path');
const Identity = require('../models/Identity');
const User = require('../models/User');
const Settings = require('../models/Settings');
const AccessLog = require('../models/AccessLog');
const generateDID = require('../utils/generateDID');
const generateVerifyToken = require('../utils/generateVerifyToken');
const hashToken = require('../utils/hashToken');
const generateIDCardPDF = require('../utils/pdfGenerator');
const { sendEmail } = require('../config/email');

const logAccess = async (data) => {
  try {
    await AccessLog.create(data);
  } catch (err) {
    console.error('Failed to log access:', err.message);
  }
};

const issueIdentity = asyncHandler(async (req, res) => {
  const { userId, accessLevel, department, expiryDate } = req.body;

  if (!userId || !accessLevel) {
    res.status(400);
    throw new Error('userId and accessLevel are required');
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const existingIdentity = await Identity.findOne({ user: userId });
  if (existingIdentity) {
    res.status(400);
    throw new Error('User already has an identity card');
  }

  let photoPath = '';
  if (req.file) {
    photoPath = `/uploads/${req.file.filename}`;
  } else {
    res.status(400);
    throw new Error('Photo is required');
  }

  const settings = await Settings.findOne();
  const defaultExpiry = settings?.defaultExpiryMonths || 12;

  let finalExpiryDate;
  if (expiryDate) {
    finalExpiryDate = new Date(expiryDate);
  } else {
    finalExpiryDate = new Date();
    finalExpiryDate.setMonth(finalExpiryDate.getMonth() + defaultExpiry);
  }

  const digitalIDNumber = await generateDID();
  const identityId = new crypto.createHash('md5').update(digitalIDNumber).digest('hex');

  const { rawToken, hmacSignature, verifyUrl } = generateVerifyToken(identityId);
  const storedToken = hashToken(rawToken + hmacSignature);

  const qrCode = require('qrcode');
  const qrDataUrl = await qrCode.toDataURL(verifyUrl);

  const identity = await Identity.create({
    digitalIDNumber,
    user: user._id,
    fullName: user.fullName,
    photo: photoPath,
    role: user.role,
    accessLevel: parseInt(accessLevel, 10),
    department: department || user.department,
    matricNumber: user.matricNumber,
    staffID: user.staffID,
    expiryDate: finalExpiryDate,
    verifyToken: storedToken,
    qrCodeImage: qrDataUrl,
    issuedBy: req.user.id,
    lifecycleHistory: [
      {
        action: 'Issued',
        performedBy: req.user.id,
        reason: 'Initial identity card issuance',
        timestamp: new Date(),
      },
    ],
  });

  await logAccess({
    identity: identity._id,
    user: user._id,
    action: 'IDENTITY_ISSUED',
    outcome: 'Success',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || '',
    details: `Identity ${digitalIDNumber} issued`,
    performedBy: req.user.id,
  });

  try {
    await sendEmail({
      to: user.email,
      subject: 'Digital Identity Card Issued',
      html: `<h2>Identity Card Issued</h2>
        <p>Dear ${user.fullName}, your digital identity card has been issued.</p>
        <p><strong>Digital ID:</strong> ${digitalIDNumber}</p>
        <p><strong>Expiry Date:</strong> ${finalExpiryDate.toLocaleDateString()}</p>
        <p>You can view your identity card by logging into the system.</p>`,
    });
  } catch (err) {
    console.error('Issue notification email failed:', err.message);
  }

  res.status(201).json({ identity, verifyUrl });
});

const getAllIdentities = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.role) filter.role = req.query.role;
  if (req.query.accessLevel) filter.accessLevel = parseInt(req.query.accessLevel, 10);
  if (req.query.department) filter.department = { $regex: req.query.department, $options: 'i' };
  if (req.query.search) {
    filter.$or = [
      { fullName: { $regex: req.query.search, $options: 'i' } },
      { digitalIDNumber: { $regex: req.query.search, $options: 'i' } },
      { matricNumber: { $regex: req.query.search, $options: 'i' } },
      { staffID: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [identities, total] = await Promise.all([
    Identity.find(filter)
      .populate('user', 'fullName email role matricNumber staffID department profileImage')
      .populate('issuedBy', 'fullName email')
      .populate('renewedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Identity.countDocuments(filter),
  ]);

  res.json({
    identities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

const getMyIdentity = asyncHandler(async (req, res) => {
  const identity = await Identity.findOne({ user: req.user.id })
    .populate('user', 'fullName email role matricNumber staffID department profileImage')
    .populate('issuedBy', 'fullName email')
    .populate('renewedBy', 'fullName email');

  if (!identity) {
    res.status(404);
    throw new Error('No identity card found for your account');
  }

  res.json({ identity });
});

const getIdentity = asyncHandler(async (req, res) => {
  const identity = await Identity.findById(req.params.id)
    .populate('user', 'fullName email role matricNumber staffID department profileImage')
    .populate('issuedBy', 'fullName email')
    .populate('renewedBy', 'fullName email')
    .populate('lifecycleHistory.performedBy', 'fullName');

  if (!identity) {
    res.status(404);
    throw new Error('Identity not found');
  }

  res.json({ identity });
});

const updateIdentity = asyncHandler(async (req, res) => {
  const identity = await Identity.findById(req.params.id);
  if (!identity) {
    res.status(404);
    throw new Error('Identity not found');
  }

  const allowedFields = ['accessLevel', 'department', 'fullName'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      identity[field] = req.body[field];
    }
  });

  identity.lifecycleHistory.push({
    action: 'Updated',
    performedBy: req.user.id,
    reason: req.body.reason || 'Identity details updated',
    timestamp: new Date(),
  });

  await identity.save();

  res.json({ identity, message: 'Identity updated successfully' });
});

const suspendIdentity = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason) {
    res.status(400);
    throw new Error('Suspension reason is required');
  }

  const identity = await Identity.findById(req.params.id).populate('user', 'email fullName');
  if (!identity) {
    res.status(404);
    throw new Error('Identity not found');
  }

  if (identity.status === 'Suspended') {
    res.status(400);
    throw new Error('Identity is already suspended');
  }

  identity.status = 'Suspended';
  identity.suspendedAt = new Date();
  identity.suspensionReason = reason;
  identity.lifecycleHistory.push({
    action: 'Suspended',
    performedBy: req.user.id,
    reason,
    timestamp: new Date(),
  });

  await identity.save();

  await logAccess({
    identity: identity._id,
    user: identity.user?._id,
    action: 'IDENTITY_SUSPENDED',
    outcome: 'Success',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || '',
    details: `Suspended: ${reason}`,
    performedBy: req.user.id,
  });

  if (identity.user && identity.user.email) {
    try {
      await sendEmail({
        to: identity.user.email,
        subject: 'Identity Card Suspended',
        html: `<h2>Identity Suspended</h2>
          <p>Dear ${identity.fullName}, your digital identity card has been suspended.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p>Please contact the library administration for more information.</p>`,
      });
    } catch (err) {
      console.error('Suspension email failed:', err.message);
    }
  }

  res.json({ identity, message: 'Identity suspended successfully' });
});

const activateIdentity = asyncHandler(async (req, res) => {
  const identity = await Identity.findById(req.params.id).populate('user', 'email fullName');
  if (!identity) {
    res.status(404);
    throw new Error('Identity not found');
  }

  if (identity.status !== 'Suspended') {
    res.status(400);
    throw new Error('Only suspended identities can be activated');
  }

  identity.status = 'Active';
  identity.suspendedAt = undefined;
  identity.suspensionReason = undefined;
  identity.lifecycleHistory.push({
    action: 'Activated',
    performedBy: req.user.id,
    reason: req.body.reason || 'Identity reactivated',
    timestamp: new Date(),
  });

  await identity.save();

  await logAccess({
    identity: identity._id,
    user: identity.user?._id,
    action: 'IDENTITY_ACTIVATED',
    outcome: 'Success',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || '',
    details: 'Identity reactivated',
    performedBy: req.user.id,
  });

  if (identity.user && identity.user.email) {
    try {
      await sendEmail({
        to: identity.user.email,
        subject: 'Identity Card Activated',
        html: `<h2>Identity Activated</h2>
          <p>Dear ${identity.fullName}, your digital identity card has been reactivated.</p>
          <p>You can now use your identity card normally.</p>`,
      });
    } catch (err) {
      console.error('Activation email failed:', err.message);
    }
  }

  res.json({ identity, message: 'Identity activated successfully' });
});

const revokeIdentity = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason) {
    res.status(400);
    throw new Error('Revocation reason is required');
  }

  const identity = await Identity.findById(req.params.id).populate('user', 'email fullName');
  if (!identity) {
    res.status(404);
    throw new Error('Identity not found');
  }

  identity.status = 'Revoked';
  identity.revokedAt = new Date();
  identity.revocationReason = reason;
  identity.lifecycleHistory.push({
    action: 'Revoked',
    performedBy: req.user.id,
    reason,
    timestamp: new Date(),
  });

  await identity.save();

  await logAccess({
    identity: identity._id,
    user: identity.user?._id,
    action: 'IDENTITY_REVOKED',
    outcome: 'Success',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || '',
    details: `Revoked: ${reason}`,
    performedBy: req.user.id,
  });

  if (identity.user && identity.user.email) {
    try {
      await sendEmail({
        to: identity.user.email,
        subject: 'Identity Card Revoked',
        html: `<h2>Identity Revoked</h2>
          <p>Dear ${identity.fullName}, your digital identity card has been permanently revoked.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Please contact the library administration for more information.</p>`,
      });
    } catch (err) {
      console.error('Revocation email failed:', err.message);
    }
  }

  res.json({ identity, message: 'Identity revoked successfully' });
});

const renewIdentity = asyncHandler(async (req, res) => {
  const { expiryDate } = req.body;

  const identity = await Identity.findById(req.params.id).populate('user', 'email fullName');
  if (!identity) {
    res.status(404);
    throw new Error('Identity not found');
  }

  if (identity.status === 'Revoked') {
    res.status(400);
    throw new Error('Cannot renew a revoked identity');
  }

  const settings = await Settings.findOne();
  const defaultExpiry = settings?.defaultExpiryMonths || 12;

  let finalExpiryDate;
  if (expiryDate) {
    finalExpiryDate = new Date(expiryDate);
  } else {
    finalExpiryDate = new Date();
    finalExpiryDate.setMonth(finalExpiryDate.getMonth() + defaultExpiry);
  }

  identity.expiryDate = finalExpiryDate;
  identity.status = 'Active';
  identity.renewedAt = new Date();
  identity.renewedBy = req.user.id;
  identity.expiryWarningSent = false;
  identity.finalWarningSent = false;
  identity.suspendedAt = undefined;
  identity.suspensionReason = undefined;

  const identityId = new crypto.createHash('md5').update(identity.digitalIDNumber).digest('hex');
  const { rawToken, hmacSignature, verifyUrl } = generateVerifyToken(identityId);
  const storedToken = hashToken(rawToken + hmacSignature);
  identity.verifyToken = storedToken;

  const qrCode = require('qrcode');
  const qrDataUrl = await qrCode.toDataURL(verifyUrl);
  identity.qrCodeImage = qrDataUrl;

  identity.lifecycleHistory.push({
    action: 'Renewed',
    performedBy: req.user.id,
    reason: req.body.reason || 'Identity card renewed',
    timestamp: new Date(),
  });

  await identity.save();

  await logAccess({
    identity: identity._id,
    user: identity.user?._id,
    action: 'IDENTITY_RENEWED',
    outcome: 'Success',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || '',
    details: `Renewed, new expiry: ${finalExpiryDate.toLocaleDateString()}`,
    performedBy: req.user.id,
  });

  if (identity.user && identity.user.email) {
    try {
      await sendEmail({
        to: identity.user.email,
        subject: 'Identity Card Renewed',
        html: `<h2>Identity Renewed</h2>
          <p>Dear ${identity.fullName}, your digital identity card has been renewed.</p>
          <p><strong>New Expiry Date:</strong> ${finalExpiryDate.toLocaleDateString()}</p>
          <p>Please log in to view your updated identity card.</p>`,
      });
    } catch (err) {
      console.error('Renewal email failed:', err.message);
    }
  }

  res.json({ identity, verifyUrl, message: 'Identity renewed successfully' });
});

const downloadIDCard = asyncHandler(async (req, res) => {
  const identity = await Identity.findById(req.params.id).populate('user');
  if (!identity) {
    res.status(404);
    throw new Error('Identity not found');
  }

  const settings = await Settings.findOne();
  const pdfBuffer = await generateIDCardPDF(identity, identity.user, settings);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ID_CARD_${identity.digitalIDNumber}.pdf"`);
  res.send(pdfBuffer);
});

const updatePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Photo file is required');
  }

  const identity = await Identity.findById(req.params.id);
  if (!identity) {
    res.status(404);
    throw new Error('Identity not found');
  }

  identity.photo = `/uploads/${req.file.filename}`;
  identity.lifecycleHistory.push({
    action: 'Photo Updated',
    performedBy: req.user.id,
    reason: 'Photo changed',
    timestamp: new Date(),
  });

  await identity.save();

  res.json({ identity, message: 'Photo updated successfully' });
});

module.exports = {
  issueIdentity,
  getAllIdentities,
  getMyIdentity,
  getIdentity,
  updateIdentity,
  suspendIdentity,
  activateIdentity,
  revokeIdentity,
  renewIdentity,
  downloadIDCard,
  updatePhoto,
};
