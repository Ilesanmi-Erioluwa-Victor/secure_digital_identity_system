const asyncHandler = require('express-async-handler');
const Department = require('../models/Department');

const getAllDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({ isActive: true }).sort({ name: 1 });
  res.json({ departments });
});

const getDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }
  res.json({ department });
});

const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Department name is required');
  }
  const exists = await Department.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  if (exists) {
    res.status(400);
    throw new Error('Department already exists');
  }
  const department = await Department.create({
    name,
    code,
    description,
    createdBy: req.user.id,
  });
  res.status(201).json({ department });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }
  const { name, code, description, isActive } = req.body;
  if (name) department.name = name;
  if (code !== undefined) department.code = code;
  if (description !== undefined) department.description = description;
  if (isActive !== undefined) department.isActive = isActive;
  await department.save();
  res.json({ department });
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }
  department.isActive = false;
  await department.save();
  res.json({ message: 'Department deactivated' });
});

module.exports = {
  getAllDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
