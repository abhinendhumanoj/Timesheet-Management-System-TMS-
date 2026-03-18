const User = require('../models/userModel');
const Project = require('../models/projectModel');
const Timesheet = require('../models/timesheetModel');

async function showDashboard(req, res, next) {
  try {
    const { role, id } = req.session.user;
    const dashboardData = {};

    if (role === 'admin') {
      dashboardData.totalUsers = await User.countAll();
      dashboardData.totalProjects = await Project.countAll();
    }

    if (role === 'manager') {
      dashboardData.pendingApprovals = await Timesheet.countPendingApprovalsForManager(id);
    }

    if (role === 'resource') {
      dashboardData.latestTimesheet = await Timesheet.getLatestByUser(id);
    }

    res.render('dashboard', { title: 'Dashboard', dashboardData });
  } catch (error) {
    next(error);
  }
}

module.exports = { showDashboard };
