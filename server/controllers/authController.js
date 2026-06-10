const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const AccessLog = require('../models/AccessLog');
const generateTokens = require('../utils/generateTokens');
const generateOTP = require('../utils/generateOTP');
const hashToken = require('../utils/hashToken');
const { sendEmail } = require('../config/email');

const logAccess = async ({ user, action, outcome, ipAddress, userAgent, details, performedBy }) => {
  try {
    await AccessLog.create({
      user,
      action,
      outcome,
      ipAddress,
      userAgent,
      details,
      performedBy: performedBy || user,
    });
  } catch (err) {
    console.error('Failed to log access:', err.message);
  }
};

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    await logAccess({
      action: 'LOGIN_FAILED',
      outcome: 'Failed',
      ipAddress,
      userAgent,
      details: 'Invalid email',
    });
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    await logAccess({
      user: user._id,
      action: 'LOGIN_FAILED',
      outcome: 'Failed',
      ipAddress,
      userAgent,
      details: 'Account deactivated',
      performedBy: user._id,
    });
    res.status(401);
    throw new Error('Account has been deactivated. Contact administrator.');
  }

  if (user.isLocked()) {
    const minutesLeft = Math.ceil((user.lockUntil - new Date()) / 60000);
    res.status(401);
    throw new Error(`Account is locked. Try again in ${minutesLeft} minutes`);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    user.loginAttempts += 1;

    if (user.loginAttempts >= parseInt(process.env.ACCOUNT_LOCKOUT_ATTEMPTS, 10) || 5) {
      const lockDuration = parseInt(process.env.ACCOUNT_LOCKOUT_DURATION_MIN, 10) || 30;
      user.lockUntil = new Date(Date.now() + lockDuration * 60 * 1000);
      await user.save();
      await logAccess({
        user: user._id,
        action: 'ACCOUNT_LOCKED',
        outcome: 'Failed',
        ipAddress,
        userAgent,
        details: `Account locked after ${user.loginAttempts} failed attempts`,
        performedBy: user._id,
      });
      res.status(401);
      throw new Error(`Account locked due to too many failed attempts. Try again in ${lockDuration} minutes`);
    }

    await user.save();
    await logAccess({
      user: user._id,
      action: 'LOGIN_FAILED',
      outcome: 'Failed',
      ipAddress,
      userAgent,
      details: `Failed attempt ${user.loginAttempts}`,
      performedBy: user._id,
    });
    res.status(401);
    throw new Error('Invalid email or password');
  }

  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  if (user.isTOTPEnabled) {
    res.json({
      mfaRequired: true,
      method: 'totp',
      email: user.email,
    });
    return;
  }

  if (user.isMFAEnabled) {
    const otp = generateOTP();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    await User.updateOne(
      { _id: user._id },
      { $set: { otpCode: hashedOtp, otpExpiry: new Date(Date.now() + 5 * 60 * 1000) } }
    );
    user.otpCode = hashedOtp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    try {
      await sendEmail({
        to: user.email,
        subject: 'Your OTP Code',
        html: `<h2>Your One-Time Password</h2><p>Your OTP code is: <strong>${otp}</strong></p><p>This code expires in 5 minutes.</p><p>If you did not request this, please ignore.</p>`,
      });
    } catch (emailErr) {
      console.error('OTP email failed:', emailErr.message);
    }
    console.log(`\n========== OTP for ${user.email} ==========`);
    console.log(`  OTP: ${otp}`);
    console.log(`  Expires in 5 minutes`);
    console.log(`===========================================\n`);

    await logAccess({
      user: user._id,
      action: 'OTP_SENT',
      outcome: 'Success',
      ipAddress,
      userAgent,
      details: 'OTP sent to email',
      performedBy: user._id,
    });

    res.json({
      mfaRequired: true,
      method: 'email',
      email: user.email,
    });
    return;
  }

  const tokens = generateTokens(user._id, user.role);
  const hashedRefresh = hashToken(tokens.refreshToken);
  await RefreshToken.create({
    token: hashedRefresh,
    user: user._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  await logAccess({
    user: user._id,
    action: 'LOGIN_SUCCESS',
    outcome: 'Success',
    ipAddress,
    userAgent,
    details: 'Login successful (no MFA)',
    performedBy: user._id,
  });

  res.json({
    accessToken: tokens.accessToken,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      matricNumber: user.matricNumber,
      staffID: user.staffID,
      department: user.department,
      profileImage: user.profileImage,
      isMFAEnabled: user.isMFAEnabled,
      isTOTPEnabled: user.isTOTPEnabled,
    },
  });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and OTP are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +otpCode +otpExpiry').lean();
  if (!user) {
    res.status(401);
    throw new Error('User not found');
  }

  if (!user.otpCode || !user.otpExpiry) {
    res.status(400);
    throw new Error('No OTP requested. Please login again.');
  }

  if (new Date() > user.otpExpiry) {
    await User.updateOne(
      { _id: user._id },
      { $unset: { otpCode: '', otpExpiry: '' } }
    );
    res.status(401);
    throw new Error('OTP has expired. Please login again.');
  }

  const hashedInput = crypto.createHash('sha256').update(otp).digest('hex');
  if (hashedInput !== user.otpCode) {
    await logAccess({
      user: user._id,
      action: 'OTP_FAILED',
      outcome: 'Failed',
      ipAddress,
      userAgent,
      details: 'Invalid OTP',
      performedBy: user._id,
    });
    res.status(401);
    throw new Error('Invalid OTP code');
  }

  await User.updateOne(
    { _id: user._id },
    { $unset: { otpCode: '', otpExpiry: '' } }
  );

  const tokens = generateTokens(user._id, user.role);
  const hashedRefresh = hashToken(tokens.refreshToken);
  await RefreshToken.create({
    token: hashedRefresh,
    user: user._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  await logAccess({
    user: user._id,
    action: 'OTP_VERIFIED',
    outcome: 'Success',
    ipAddress,
    userAgent,
    details: 'OTP verified successfully',
    performedBy: user._id,
  });

  await logAccess({
    user: user._id,
    action: 'LOGIN_SUCCESS',
    outcome: 'Success',
    ipAddress,
    userAgent,
    details: 'Login successful (OTP MFA)',
    performedBy: user._id,
  });

  res.json({
    accessToken: tokens.accessToken,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      matricNumber: user.matricNumber,
      staffID: user.staffID,
      department: user.department,
      profileImage: user.profileImage,
      isMFAEnabled: user.isMFAEnabled,
      isTOTPEnabled: user.isTOTPEnabled,
    },
  });
});

const verifyTotp = asyncHandler(async (req, res) => {
  const { email, token: bodyToken, totp } = req.body;
  const token = bodyToken || totp;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  if (!email || !token) {
    res.status(400);
    throw new Error('Email and TOTP token are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    res.status(401);
    throw new Error('User not found');
  }

  if (!user.totpSecret || !user.isTOTPEnabled) {
    res.status(400);
    throw new Error('TOTP is not configured');
  }

  const verified = speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!verified) {
    await logAccess({
      user: user._id,
      action: 'OTP_FAILED',
      outcome: 'Failed',
      ipAddress,
      userAgent,
      details: 'Invalid TOTP token',
      performedBy: user._id,
    });
    res.status(401);
    throw new Error('Invalid TOTP token');
  }

  const tokens = generateTokens(user._id, user.role);
  const hashedRefresh = hashToken(tokens.refreshToken);
  await RefreshToken.create({
    token: hashedRefresh,
    user: user._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  await logAccess({
    user: user._id,
    action: 'OTP_VERIFIED',
    outcome: 'Success',
    ipAddress,
    userAgent,
    details: 'TOTP verified successfully',
    performedBy: user._id,
  });

  await logAccess({
    user: user._id,
    action: 'LOGIN_SUCCESS',
    outcome: 'Success',
    ipAddress,
    userAgent,
    details: 'Login successful (TOTP MFA)',
    performedBy: user._id,
  });

  res.json({
    accessToken: tokens.accessToken,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      matricNumber: user.matricNumber,
      staffID: user.staffID,
      department: user.department,
      profileImage: user.profileImage,
      isMFAEnabled: user.isMFAEnabled,
      isTOTPEnabled: user.isTOTPEnabled,
    },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken: tokenFromCookie } = req.cookies;
  if (!tokenFromCookie) {
    res.status(401);
    throw new Error('No refresh token');
  }

  const hashed = hashToken(tokenFromCookie);
  const storedToken = await RefreshToken.findOne({ token: hashed, isRevoked: false });

  if (!storedToken) {
    res.status(401);
    throw new Error('Invalid refresh token');
  }

  if (new Date() > storedToken.expiresAt) {
    storedToken.isRevoked = true;
    await storedToken.save();
    res.status(401);
    throw new Error('Refresh token expired');
  }

  const jwtPayload = require('jsonwebtoken').verify(
    tokenFromCookie,
    process.env.JWT_REFRESH_SECRET
  );

  const user = await User.findById(jwtPayload.id);
  if (!user || !user.isActive) {
    storedToken.isRevoked = true;
    await storedToken.save();
    res.status(401);
    throw new Error('User not found or inactive');
  }

  storedToken.isRevoked = true;
  await storedToken.save();

  const tokens = generateTokens(user._id, user.role);
  const hashedNew = hashToken(tokens.refreshToken);
  await RefreshToken.create({
    token: hashedNew,
    user: user._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken: tokens.accessToken });
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken: tokenFromCookie } = req.cookies;
  if (tokenFromCookie) {
    const hashed = hashToken(tokenFromCookie);
    await RefreshToken.findOneAndUpdate({ token: hashed }, { isRevoked: true });
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.json({ message: 'Logged out successfully' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(404);
    throw new Error('No account found with this email');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `<h2>Password Reset</h2><p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, please ignore this email.</p>`,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();
    res.status(500);
    throw new Error('Failed to send reset email. Please try again.');
  }

  res.json({ message: 'Password reset link sent to email' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || !password) {
    res.status(400);
    throw new Error('Token and new password are required');
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: new Date() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  await logAccess({
    user: user._id,
    action: 'PASSWORD_RESET',
    outcome: 'Success',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || '',
    details: 'Password reset completed',
    performedBy: user._id,
  });

  res.json({ message: 'Password has been reset successfully' });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ user });
});

const getTOTPSetup = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const secret = speakeasy.generateSecret({ length: 20, name: `DSPoly:${user.email}` });
  const qrCode = require('qrcode');
  const qrDataUrl = await qrCode.toDataURL(secret.otpauth_url);

  res.json({
    secret: secret.base32,
    otpauth_url: secret.otpauth_url,
    qrCode: qrDataUrl,
  });
});

const enableTOTP = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { token, secret } = req.body;
  if (!token) {
    res.status(400);
    throw new Error('Verification token is required');
  }

  const verified = speakeasy.totp.verify({
    secret: secret || user.totpSecret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!verified) {
    res.status(400);
    throw new Error('Invalid TOTP token. Please try again.');
  }

  if (secret) {
    user.totpSecret = secret;
  }
  user.isTOTPEnabled = true;
  await user.save();

  await logAccess({
    user: user._id,
    action: '2FA_ENABLED',
    outcome: 'Success',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || '',
    details: 'TOTP enabled',
    performedBy: user._id,
  });

  res.json({ message: 'TOTP enabled successfully' });
});

const disableTOTP = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.totpSecret = undefined;
  user.isTOTPEnabled = false;
  await user.save();

  await logAccess({
    user: user._id,
    action: '2FA_DISABLED',
    outcome: 'Success',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || '',
    details: 'TOTP disabled',
    performedBy: user._id,
  });

  res.json({ message: 'TOTP disabled successfully' });
});

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role, department, phone, matricNumber, staffID } = req.body;

  if (!fullName || !email || !password) {
    res.status(400);
    throw new Error('Full name, email, and password are required');
  }

  if (!['student', 'staff'].includes(role)) {
    res.status(400);
    throw new Error('Role must be student or staff');
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    password,
    role,
    department,
    phone,
    matricNumber: role === 'student' ? matricNumber : undefined,
    staffID: role === 'staff' ? staffID : undefined,
    isMFAEnabled: true,
    isEmailVerified: false,
  });

  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  await logAccess({
    user: user._id,
    action: 'IDENTITY_ISSUED',
    outcome: 'Success',
    ipAddress,
    userAgent,
    details: 'User self-registered',
    performedBy: user._id,
  });

  res.status(201).json({
    message: 'Account created successfully. An administrator will issue your digital identity.',
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  });
});

module.exports = {
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
};
