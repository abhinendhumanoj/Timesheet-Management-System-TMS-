const path = require('path');
const express = require('express');
const session = require('express-session');
const { initializeDatabase } = require('./db');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const timesheetRoutes = require('./routes/timesheetRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'simple-timesheet-secret',
    resave: false,
    saveUninitialized: false
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.error = req.session.error || null;
  res.locals.success = req.session.success || null;
  delete req.session.error;
  delete req.session.success;
  next();
});

app.use(authRoutes);
app.use(dashboardRoutes);
app.use('/admin', adminRoutes);
app.use('/timesheet', timesheetRoutes);
app.use('/', approvalRoutes);
app.use('/', reportRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { title: 'Error', message: 'Something went wrong.' });
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`TMS running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database', error);
    process.exit(1);
  });
