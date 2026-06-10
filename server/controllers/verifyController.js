const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Identity = require('../models/Identity');
const AccessLog = require('../models/AccessLog');
const hashToken = require('../utils/hashToken');

const verifyIdentity = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  if (!token || !token.includes('.')) {
    res.status(400);
    return res.json({
      valid: false,
      status: 'INVALID',
      message: 'Invalid token format',
    });
  }

  const [rawToken, hmacSignature] = token.split('.');

  if (!rawToken || !hmacSignature) {
    res.status(400);
    return res.json({
      valid: false,
      status: 'INVALID',
      message: 'Invalid token format',
    });
  }

  // We need identityId to verify HMAC, but we don't have it from the token alone.
  // Instead, we find all identities and check each... Too expensive.
  // Better approach: store the hmac token directly and compare via hash.
  // The stored verifyToken is hash(rawToken + hmacSignature).
  const storedTokenHash = hashToken(rawToken + hmacSignature);

  const identity = await Identity.findOne({ verifyToken: storedTokenHash }).populate(
    'user',
    'fullName email role matricNumber staffID department'
  );

  if (!identity) {
    await AccessLog.create({
      action: 'QR_SCAN_INVALID',
      outcome: 'Failed',
      ipAddress,
      userAgent,
      details: 'Invalid QR token - no matching identity',
    });

    return res.json({
      valid: false,
      status: 'INVALID',
      message: 'Invalid or expired QR code',
    });
  }

  const expectedHmac = crypto
    .createHmac('sha256', process.env.IDENTITY_VERIFY_SECRET)
    .update(rawToken + new crypto.createHash('md5').update(identity.digitalIDNumber).digest('hex'))
    .digest('hex');

  if (
    !crypto.timingSafeEqual
      ? hmacSignature !== expectedHmac
      : !crypto.timingSafeEqual(Buffer.from(hmacSignature), Buffer.from(expectedHmac))
  ) {
    await AccessLog.create({
      identity: identity._id,
      user: identity.user?._id,
      action: 'QR_SCAN_INVALID',
      outcome: 'Suspicious',
      ipAddress,
      userAgent,
      details: 'HMAC mismatch - tampered token',
    });

    return res.json({
      valid: false,
      status: 'INVALID',
      message: 'Invalid QR code signature',
    });
  }

  const now = new Date();

  if (identity.status === 'Suspended') {
    await AccessLog.create({
      identity: identity._id,
      user: identity.user?._id,
      action: 'QR_SCAN_SUSPENDED',
      outcome: 'Failed',
      ipAddress,
      userAgent,
      details: `Suspended identity scan - reason: ${identity.suspensionReason}`,
    });

    return res.json({
      valid: false,
      status: 'SUSPENDED',
      message: `This identity card has been suspended. Reason: ${identity.suspensionReason}`,
      identity: {
        fullName: identity.fullName,
        digitalIDNumber: identity.digitalIDNumber,
        status: identity.status,
        photo: identity.photo,
        role: identity.role,
        department: identity.department,
      },
    });
  }

  if (identity.status === 'Revoked') {
    await AccessLog.create({
      identity: identity._id,
      user: identity.user?._id,
      action: 'QR_SCAN_INVALID',
      outcome: 'Failed',
      ipAddress,
      userAgent,
      details: 'Revoked identity scan',
    });

    return res.json({
      valid: false,
      status: 'REVOKED',
      message: 'This identity card has been permanently revoked',
      identity: {
        fullName: identity.fullName,
        digitalIDNumber: identity.digitalIDNumber,
        status: identity.status,
      },
    });
  }

  if (identity.status === 'Expired') {
    await AccessLog.create({
      identity: identity._id,
      user: identity.user?._id,
      action: 'QR_SCAN_EXPIRED',
      outcome: 'Failed',
      ipAddress,
      userAgent,
      details: 'Expired identity scan',
    });

    return res.json({
      valid: false,
      status: 'EXPIRED',
      message: 'This identity card has expired',
      identity: {
        fullName: identity.fullName,
        digitalIDNumber: identity.digitalIDNumber,
        status: identity.status,
        expiryDate: identity.expiryDate,
      },
    });
  }

  if (identity.expiryDate < now) {
    identity.status = 'Expired';
    await identity.save();

    await AccessLog.create({
      identity: identity._id,
      user: identity.user?._id,
      action: 'QR_SCAN_EXPIRED',
      outcome: 'Failed',
      ipAddress,
      userAgent,
      details: 'Expired identity scan (auto-detected)',
    });

    return res.json({
      valid: false,
      status: 'EXPIRED',
      message: 'This identity card has expired',
      identity: {
        fullName: identity.fullName,
        digitalIDNumber: identity.digitalIDNumber,
        status: identity.status,
        expiryDate: identity.expiryDate,
      },
    });
  }

  await AccessLog.create({
    identity: identity._id,
    user: identity.user?._id,
    action: 'QR_SCAN_VALID',
    outcome: 'Success',
    ipAddress,
    userAgent,
    details: 'Valid identity verification scan',
  });

  res.json({
    valid: true,
    status: 'VALID',
    message: 'Identity verified successfully',
    identity: {
      fullName: identity.fullName,
      digitalIDNumber: identity.digitalIDNumber,
      status: identity.status,
      photo: identity.photo,
      role: identity.role,
      accessLevel: identity.accessLevel,
      department: identity.department,
      matricNumber: identity.matricNumber,
      staffID: identity.staffID,
      issueDate: identity.issueDate,
      expiryDate: identity.expiryDate,
    },
  });
});

module.exports = { verifyIdentity };
