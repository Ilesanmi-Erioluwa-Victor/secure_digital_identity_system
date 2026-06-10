const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const createUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, role, matricNumber, staffID, phone, department } = req.body;

  if (!fullName || !email || !password || !role) {
    res.status(400);
    throw new Error('fullName, email, password, and role are required');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  const user = await User.create({
    fullName,
    email,
    password,
    role,
    matricNumber,
    staffID,
    phone,
    department,
    createdBy: req.user.id,
  });

  res.status(201).json({
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      matricNumber: user.matricNumber,
      staffID: user.staffID,
      phone: user.phone,
      department: user.department,
      isActive: user.isActive,
      isMFAEnabled: user.isMFAEnabled,
      isEmailVerified: user.isEmailVerified,
    },
  });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.search) {
    filter.$or = [
      { fullName: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { matricNumber: { $regex: req.query.search, $options: 'i' } },
      { staffID: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ user });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const allowedFields = ['fullName', 'email', 'role', 'matricNumber', 'staffID', 'phone', 'department', 'isMFAEnabled'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  if (req.body.password) {
    user.password = req.body.password;
  }

  await user.save();

  res.json({
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      matricNumber: user.matricNumber,
      staffID: user.staffID,
      phone: user.phone,
      department: user.department,
      isActive: user.isActive,
      isMFAEnabled: user.isMFAEnabled,
      isEmailVerified: user.isEmailVerified,
    },
    message: 'User updated successfully',
  });
});

const unlockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  res.json({ message: 'User account unlocked successfully' });
});

const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'admin' && user._id.toString() !== req.user.id) {
    const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
    if (adminCount <= 1) {
      res.status(400);
      throw new Error('Cannot deactivate the last active admin account');
    }
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    isActive: user.isActive,
  });
});

const registerAdmin = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, department } = req.body;

  if (!fullName || !email || !password) {
    res.status(400);
    throw new Error('fullName, email, and password are required');
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error('A user with this email already exists');
  }

  const admin = await User.create({
    fullName,
    email: email.toLowerCase(),
    password,
    role: 'admin',
    phone,
    department,
    isMFAEnabled: true,
    createdBy: req.user.id,
  });

  res.status(201).json({
    message: 'Admin account created successfully',
    user: {
      id: admin._id,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
    },
  });
});

module.exports = {
  createUser,
  registerAdmin,
  getAllUsers,
  getUser,
  updateUser,
  unlockUser,
  deactivateUser,
};
