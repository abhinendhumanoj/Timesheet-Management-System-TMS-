const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { ensureAuthenticated } = require('../utils/auth');

const router = express.Router();

router.get('/', ensureAuthenticated, dashboardController.showDashboard);

module.exports = router;
