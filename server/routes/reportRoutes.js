const express = require('express');
const router = express.Router();
const {
  getSummary,
  getMonthlyIssuance,
  getAccessSummary,
  getRoleBreakdown,
  exportIdentities,
  exportAccessLogs,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(protect, roleMiddleware('admin'));

router.get('/summary', getSummary);
router.get('/monthly-issuance', getMonthlyIssuance);
router.get('/access-summary', getAccessSummary);
router.get('/role-breakdown', getRoleBreakdown);
router.get('/export/identities', exportIdentities);
router.get('/export/access-logs', exportAccessLogs);

module.exports = router;
