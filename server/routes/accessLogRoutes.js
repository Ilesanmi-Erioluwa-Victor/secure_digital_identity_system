const express = require('express');
const router = express.Router();
const {
  getAllLogs,
  getMyLogs,
  exportLogs,
} = require('../controllers/accessLogController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/', protect, roleMiddleware('admin', 'librarian'), getAllLogs);
router.get('/my', protect, getMyLogs);
router.get('/export', protect, roleMiddleware('admin'), exportLogs);

module.exports = router;
