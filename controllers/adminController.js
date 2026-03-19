const Client = require('../models/clientModel');
const Project = require('../models/projectModel');
const Task = require('../models/taskModel');
const User = require('../models/userModel');

async function listClients(req, res, next) {
  try {
    const clients = await Client.getAll();
    res.render('admin/clients', { title: 'Clients', clients });
  } catch (error) {
    next(error);
  }
}

async function createClient(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      req.session.error = 'Client name is required.';
      return res.redirect('/admin/clients');
    }

    await Client.create(name.trim());
    req.session.success = 'Client created successfully.';
    return res.redirect('/admin/clients');
  } catch (error) {
    req.session.error = 'Unable to create client. Name may already exist.';
    return res.redirect('/admin/clients');
  }
}

async function listProjects(req, res, next) {
  try {
    const [projects, clients, managers] = await Promise.all([
      Project.getAll(),
      Client.getAll(),
      User.getByRole('manager')
    ]);
    res.render('admin/projects', { title: 'Projects', projects, clients, managers });
  } catch (error) {
    next(error);
  }
}

async function createProject(req, res, next) {
  try {
    const { name, client_id: clientId, manager_id: managerId } = req.body;
    if (!name || !clientId) {
      req.session.error = 'Project name and client are required.';
      return res.redirect('/admin/projects');
    }

    await Project.create(name.trim(), clientId, managerId || null);
    req.session.success = 'Project created successfully.';
    return res.redirect('/admin/projects');
  } catch (error) {
    return next(error);
  }
}

async function listTasks(req, res, next) {
  try {
    const [tasks, projects] = await Promise.all([Task.getAll(), Project.getAll()]);
    res.render('admin/tasks', { title: 'Tasks', tasks, projects });
  } catch (error) {
    next(error);
  }
}

async function createTask(req, res, next) {
  try {
    const { name, project_id: projectId } = req.body;
    if (!name || !projectId) {
      req.session.error = 'Task name and project are required.';
      return res.redirect('/admin/tasks');
    }

    await Task.create(name.trim(), projectId);
    req.session.success = 'Task created successfully.';
    return res.redirect('/admin/tasks');
  } catch (error) {
    next(error);
  }
}

async function listUsers(req, res, next) {
  try {
    const users = await User.getAll();
    res.render('admin/users', { title: 'Users', users });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      req.session.error = 'All user fields are required.';
      return res.redirect('/admin/users');
    }

    await User.create({ name: name.trim(), email: email.trim(), password, role });
    req.session.success = 'User created successfully.';
    return res.redirect('/admin/users');
  } catch (error) {
    req.session.error = 'Unable to create user. Email may already exist.';
    return res.redirect('/admin/users');
  }
}

module.exports = {
  listClients,
  createClient,
  listProjects,
  createProject,
  listTasks,
  createTask,
  listUsers,
  createUser
};
