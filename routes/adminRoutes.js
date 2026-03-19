const express = require('express');
const adminController = require('../controllers/adminController');
const { ensureAuthenticated, ensureRole } = require('../utils/auth');

const router = express.Router();

router.use(ensureAuthenticated, ensureRole('admin'));

router.get('/clients', adminController.listClients);
router.post('/clients', adminController.createClient);
router.get('/projects', adminController.listProjects);
router.post('/projects', adminController.createProject);
router.get('/tasks', adminController.listTasks);
router.post('/tasks', adminController.createTask);
router.get('/users', adminController.listUsers);
router.post('/users', adminController.createUser);

module.exports = router;
