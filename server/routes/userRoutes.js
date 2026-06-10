const express = require('express');
const router = express.Router();
const {
  createUser,
  registerAdmin,
  getAllUsers,
  getUser,
  updateUser,
  unlockUser,
  deactivateUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(protect, roleMiddleware('admin'));

router.post('/', createUser);
router.post('/register-admin', registerAdmin);
router.get('/', getAllUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.put('/:id/unlock', unlockUser);
router.put('/:id/deactivate', deactivateUser);

module.exports = router;
