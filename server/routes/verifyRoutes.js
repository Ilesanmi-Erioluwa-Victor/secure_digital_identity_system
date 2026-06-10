const express = require('express');
const router = express.Router();
const { verifyIdentity } = require('../controllers/verifyController');

router.get('/:token', verifyIdentity);

module.exports = router;
