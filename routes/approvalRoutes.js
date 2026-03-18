const express = require('express');
const approvalController = require('../controllers/approvalController');
const { ensureAuthenticated, ensureRole } = require('../utils/auth');

const router = express.Router();

router.get('/approvals', ensureAuthenticated, ensureRole('admin', 'manager'), approvalController.listApprovals);
router.post('/approve', ensureAuthenticated, ensureRole('admin', 'manager'), approvalController.approveTimesheet);
router.post('/reject', ensureAuthenticated, ensureRole('admin', 'manager'), approvalController.rejectTimesheet);

module.exports = router;
