const Project = require('../models/projectModel');
const Task = require('../models/taskModel');
const Timesheet = require('../models/timesheetModel');

async function listTimesheets(req, res, next) {
  try {
    const timesheets = await Timesheet.getByUser(req.session.user.id);
    res.render('timesheet/index', { title: 'Timesheets', timesheets });
  } catch (error) {
    next(error);
  }
}

async function newTimesheetForm(req, res, next) {
  try {
    const week = req.query.week || getWeekStart(new Date().toISOString().slice(0, 10));
    const [timesheet, projects, tasks] = await Promise.all([
      Timesheet.findByUserAndWeek(req.session.user.id, week),
      Project.getAll(),
      Task.getAll()
    ]);

    let currentTimesheet = timesheet;
    if (!currentTimesheet) {
      const created = await Timesheet.create(req.session.user.id, week);
      currentTimesheet = await Timesheet.getById(created.id);
    }

    const entries = await Timesheet.getEntries(currentTimesheet.id);
    res.render('timesheet/new', {
      title: 'Weekly Timesheet',
      timesheet: currentTimesheet,
      entries,
      projects,
      tasks,
      week
    });
  } catch (error) {
    next(error);
  }
}

async function editEntryForm(req, res, next) {
  try {
    const entry = await Timesheet.getEntryById(req.params.entryId);
    if (!entry) {
      req.session.error = 'Entry not found.';
      return res.redirect('/timesheet');
    }

    const timesheet = await Timesheet.getById(entry.timesheet_id);
    if (!timesheet || timesheet.user_id !== req.session.user.id || timesheet.status !== 'Draft') {
      req.session.error = 'Only draft entries can be edited.';
      return res.redirect('/timesheet');
    }

    const [projects, tasks] = await Promise.all([Project.getAll(), Task.getAll()]);
    return res.render('timesheet/edit', {
      title: 'Edit Entry',
      entry,
      timesheet,
      projects,
      tasks
    });
  } catch (error) {
    next(error);
  }
}

async function addEntry(req, res, next) {
  try {
    const { timesheet_id: timesheetId, date, project_id: projectId, task_id: taskId, hours, billable } = req.body;
    const parsedHours = Number(hours);

    if (!date || !projectId || !taskId || Number.isNaN(parsedHours) || parsedHours <= 0 || parsedHours > 24) {
      req.session.error = 'Please provide valid entry data. Hours must be greater than 0 and up to 24.';
      return res.redirect(`/timesheet/new?week=${req.body.week}`);
    }

    const timesheet = await Timesheet.getById(timesheetId);
    if (!timesheet || timesheet.user_id !== req.session.user.id || timesheet.status !== 'Draft') {
      req.session.error = 'Entries can only be added to your draft timesheet.';
      return res.redirect('/timesheet');
    }

    await Timesheet.addEntry({
      timesheetId,
      date,
      projectId,
      taskId,
      hours: parsedHours,
      billable: billable ? 1 : 0
    });

    req.session.success = 'Entry saved successfully.';
    return res.redirect(`/timesheet/new?week=${timesheet.week}`);
  } catch (error) {
    next(error);
  }
}

async function updateEntry(req, res, next) {
  try {
    const { entry_id: entryId, timesheet_id: timesheetId, date, project_id: projectId, task_id: taskId, hours, billable } = req.body;
    const parsedHours = Number(hours);
    const timesheet = await Timesheet.getById(timesheetId);

    if (!timesheet || timesheet.user_id !== req.session.user.id || timesheet.status !== 'Draft') {
      req.session.error = 'Only draft entries can be updated.';
      return res.redirect('/timesheet');
    }

    if (!date || !projectId || !taskId || Number.isNaN(parsedHours) || parsedHours <= 0 || parsedHours > 24) {
      req.session.error = 'Please provide valid entry data. Hours must be greater than 0 and up to 24.';
      return res.redirect(`/timesheet/edit/${entryId}`);
    }

    await Timesheet.updateEntry({
      entryId,
      timesheetId,
      date,
      projectId,
      taskId,
      hours: parsedHours,
      billable: billable ? 1 : 0
    });

    req.session.success = 'Entry updated successfully.';
    return res.redirect(`/timesheet/new?week=${timesheet.week}`);
  } catch (error) {
    next(error);
  }
}

async function deleteEntry(req, res, next) {
  try {
    const { entry_id: entryId, timesheet_id: timesheetId } = req.body;
    const timesheet = await Timesheet.getById(timesheetId);
    if (!timesheet || timesheet.user_id !== req.session.user.id || timesheet.status !== 'Draft') {
      req.session.error = 'Only draft entries can be deleted.';
      return res.redirect('/timesheet');
    }

    await Timesheet.deleteEntry(entryId, timesheetId);
    req.session.success = 'Entry deleted successfully.';
    return res.redirect(`/timesheet/new?week=${timesheet.week}`);
  } catch (error) {
    next(error);
  }
}

async function submitTimesheet(req, res, next) {
  try {
    const { timesheet_id: timesheetId } = req.body;
    const timesheet = await Timesheet.getById(timesheetId);
    const entryCount = await Timesheet.countEntries(timesheetId);

    if (!timesheet || timesheet.user_id !== req.session.user.id || timesheet.status !== 'Draft') {
      req.session.error = 'Only draft timesheets can be submitted.';
      return res.redirect('/timesheet');
    }

    if (!entryCount) {
      req.session.error = 'Add at least one entry before submitting.';
      return res.redirect(`/timesheet/new?week=${timesheet.week}`);
    }

    await Timesheet.updateStatus(timesheetId, 'Submitted');
    req.session.success = 'Timesheet submitted successfully.';
    return res.redirect('/timesheet');
  } catch (error) {
    next(error);
  }
}

function getWeekStart(dateString) {
  const date = new Date(dateString);
  const day = date.getUTCDay();
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setUTCDate(diff);
  return monday.toISOString().slice(0, 10);
}

module.exports = {
  listTimesheets,
  newTimesheetForm,
  editEntryForm,
  addEntry,
  updateEntry,
  deleteEntry,
  submitTimesheet
};
