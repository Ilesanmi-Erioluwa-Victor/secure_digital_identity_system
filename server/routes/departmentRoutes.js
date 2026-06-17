const express = require('express');
const router = express.Router();
const {
  getAllDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/', getAllDepartments);
router.get('/:id', getDepartment);
router.post('/', protect, roleMiddleware('admin'), createDepartment);
router.put('/:id', protect, roleMiddleware('admin'), updateDepartment);
router.delete('/:id', protect, roleMiddleware('admin'), deleteDepartment);

module.exports = router;
