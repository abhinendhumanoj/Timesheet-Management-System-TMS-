const express = require('express');
const reportController = require('../controllers/reportController');
const { ensureAuthenticated, ensureRole } = require('../utils/auth');

const router = express.Router();

router.get('/reports', ensureAuthenticated, ensureRole('admin', 'manager'), reportController.showReports);

module.exports = router;
