const { readState, insert, updateWhere, deleteWhere } = require('../db');

function create(userId, week) {
  return insert('timesheets', { user_id: Number(userId), week, status: 'Draft', rejection_reason: null });
}

function findByUserAndWeek(userId, week) {
  const state = readState();
  return state.timesheets.find((timesheet) => timesheet.user_id === Number(userId) && timesheet.week === week) || null;
}

function getById(id) {
  const state = readState();
  return state.timesheets.find((timesheet) => timesheet.id === Number(id)) || null;
}

function getByUser(userId) {
  const state = readState();
  return state.timesheets
    .filter((timesheet) => timesheet.user_id === Number(userId))
    .sort((a, b) => b.week.localeCompare(a.week));
}

function getLatestByUser(userId) {
  return getByUser(userId)[0] || null;
}

function addEntry({ timesheetId, date, projectId, taskId, hours, billable }) {
  return insert('entries', {
    timesheet_id: Number(timesheetId),
    date,
    project_id: Number(projectId),
    task_id: Number(taskId),
    hours: Number(hours),
    billable: Number(billable)
  });
}

function getEntryById(entryId) {
  const state = readState();
  return state.entries.find((entry) => entry.id === Number(entryId)) || null;
}

function updateEntry({ entryId, timesheetId, date, projectId, taskId, hours, billable }) {
  return updateWhere(
    'entries',
    (entry) => entry.id === Number(entryId) && entry.timesheet_id === Number(timesheetId),
    () => ({
      date,
      project_id: Number(projectId),
      task_id: Number(taskId),
      hours: Number(hours),
      billable: Number(billable)
    })
  );
}

function deleteEntry(entryId, timesheetId) {
  return deleteWhere('entries', (entry) => entry.id === Number(entryId) && entry.timesheet_id === Number(timesheetId));
}

function getEntries(timesheetId) {
  const state = readState();
  return state.entries
    .filter((entry) => entry.timesheet_id === Number(timesheetId))
    .map((entry) => ({
      ...entry,
      project_name: state.projects.find((project) => project.id === entry.project_id)?.name || 'Unknown',
      task_name: state.tasks.find((task) => task.id === entry.task_id)?.name || 'Unknown'
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function countEntries(timesheetId) {
  return readState().entries.filter((entry) => entry.timesheet_id === Number(timesheetId)).length;
}

function updateStatus(timesheetId, status, rejectionReason = null) {
  return updateWhere(
    'timesheets',
    (timesheet) => timesheet.id === Number(timesheetId),
    () => ({ status, rejection_reason: rejectionReason })
  );
}

function decorateSubmitted(timesheets) {
  const state = readState();
  return timesheets.map((timesheet) => {
    const user = state.users.find((item) => item.id === timesheet.user_id);
    return {
      ...timesheet,
      user_name: user?.name || 'Unknown',
      user_email: user?.email || 'Unknown'
    };
  }).sort((a, b) => b.week.localeCompare(a.week));
}

function getSubmittedForAdmin() {
  const state = readState();
  return decorateSubmitted(state.timesheets.filter((timesheet) => timesheet.status === 'Submitted'));
}

function getSubmittedForManager(managerId) {
  const state = readState();
  const allowedIds = new Set(
    state.entries
      .filter((entry) => state.projects.find((project) => project.id === entry.project_id && project.manager_id === Number(managerId)))
      .map((entry) => entry.timesheet_id)
  );
  return decorateSubmitted(
    state.timesheets.filter((timesheet) => timesheet.status === 'Submitted' && allowedIds.has(timesheet.id))
  );
}

function canManagerReview(timesheetId, managerId) {
  const state = readState();
  return state.entries.some((entry) =>
    entry.timesheet_id === Number(timesheetId) &&
    state.projects.some((project) => project.id === entry.project_id && project.manager_id === Number(managerId))
  );
}

function countPendingApprovalsForManager(managerId) {
  return getSubmittedForManager(managerId).length;
}

function getHoursReport() {
  const state = readState();
  return state.users
    .map((user) => {
      const timesheetIds = state.timesheets.filter((timesheet) => timesheet.user_id === user.id).map((timesheet) => timesheet.id);
      const totalHours = state.entries
        .filter((entry) => timesheetIds.includes(entry.timesheet_id))
        .reduce((sum, entry) => sum + Number(entry.hours), 0);
      return {
        user_name: user.name,
        email: user.email,
        total_hours: totalHours
      };
    })
    .sort((a, b) => a.user_name.localeCompare(b.user_name));
}

module.exports = {
  create,
  findByUserAndWeek,
  getById,
  getByUser,
  getLatestByUser,
  addEntry,
  getEntryById,
  updateEntry,
  deleteEntry,
  getEntries,
  countEntries,
  updateStatus,
  getSubmittedForAdmin,
  getSubmittedForManager,
  canManagerReview,
  countPendingApprovalsForManager,
  getHoursReport
};
