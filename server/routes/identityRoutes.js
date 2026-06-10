const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/identityController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post(
  '/',
  protect,
  roleMiddleware('admin'),
  upload.single('photo'),
  issueIdentity
);

router.get('/', protect, getAllIdentities);

router.get('/my', protect, getMyIdentity);

router.get('/:id', protect, getIdentity);

router.put(
  '/:id',
  protect,
  roleMiddleware('admin'),
  updateIdentity
);

router.post(
  '/:id/suspend',
  protect,
  roleMiddleware('admin'),
  suspendIdentity
);

router.post(
  '/:id/activate',
  protect,
  roleMiddleware('admin'),
  activateIdentity
);

router.post(
  '/:id/revoke',
  protect,
  roleMiddleware('admin'),
  revokeIdentity
);

router.post(
  '/:id/renew',
  protect,
  roleMiddleware('admin'),
  renewIdentity
);

router.get('/:id/download', protect, downloadIDCard);

router.post(
  '/:id/photo',
  protect,
  upload.single('photo'),
  updatePhoto
);

module.exports = router;
