const express = require('express');
const timesheetController = require('../controllers/timesheetController');
const { ensureAuthenticated, ensureRole } = require('../utils/auth');

const router = express.Router();

router.use(ensureAuthenticated, ensureRole('resource', 'admin', 'manager'));
router.get('/', timesheetController.listTimesheets);
router.get('/new', timesheetController.newTimesheetForm);
router.get('/edit/:entryId', timesheetController.editEntryForm);
router.post('/add', timesheetController.addEntry);
router.post('/update-entry', timesheetController.updateEntry);
router.post('/delete-entry', timesheetController.deleteEntry);
router.post('/submit', timesheetController.submitTimesheet);

module.exports = router;
