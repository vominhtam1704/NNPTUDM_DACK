const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

router.get(
  '/overview',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  analyticsController.getAnalyticsOverview
);

module.exports = router;
