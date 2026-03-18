const Timesheet = require('../models/timesheetModel');

async function showReports(req, res, next) {
  try {
    const report = await Timesheet.getHoursReport();
    res.render('reports', { title: 'Reports', report });
  } catch (error) {
    next(error);
  }
}

module.exports = { showReports };
