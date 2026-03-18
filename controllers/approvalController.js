const Timesheet = require('../models/timesheetModel');

async function listApprovals(req, res, next) {
  try {
    const user = req.session.user;
    const timesheets = user.role === 'admin'
      ? await Timesheet.getSubmittedForAdmin()
      : await Timesheet.getSubmittedForManager(user.id);

    res.render('approvals', { title: 'Approvals', timesheets });
  } catch (error) {
    next(error);
  }
}

async function approveTimesheet(req, res, next) {
  try {
    const timesheetId = req.body.timesheet_id;
    const timesheet = await Timesheet.getById(timesheetId);
    if (!timesheet || timesheet.status !== 'Submitted') {
      req.session.error = 'Only submitted timesheets can be approved.';
      return res.redirect('/approvals');
    }

    if (req.session.user.role === 'manager') {
      const allowed = await Timesheet.canManagerReview(timesheetId, req.session.user.id);
      if (!allowed) {
        req.session.error = 'You can only approve timesheets for your assigned projects.';
        return res.redirect('/approvals');
      }
    }

    await Timesheet.updateStatus(timesheetId, 'Approved', null);
    req.session.success = 'Timesheet approved successfully.';
    res.redirect('/approvals');
  } catch (error) {
    next(error);
  }
}

async function rejectTimesheet(req, res, next) {
  try {
    const timesheetId = req.body.timesheet_id;
    const reason = req.body.reason ? req.body.reason.trim() : '';
    const timesheet = await Timesheet.getById(timesheetId);

    if (!timesheet || timesheet.status !== 'Submitted') {
      req.session.error = 'Only submitted timesheets can be rejected.';
      return res.redirect('/approvals');
    }

    if (!reason) {
      req.session.error = 'Rejection reason is required.';
      return res.redirect('/approvals');
    }

    if (req.session.user.role === 'manager') {
      const allowed = await Timesheet.canManagerReview(timesheetId, req.session.user.id);
      if (!allowed) {
        req.session.error = 'You can only reject timesheets for your assigned projects.';
        return res.redirect('/approvals');
      }
    }

    await Timesheet.updateStatus(timesheetId, 'Rejected', reason);
    req.session.success = 'Timesheet rejected successfully.';
    return res.redirect('/approvals');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listApprovals,
  approveTimesheet,
  rejectTimesheet
};
