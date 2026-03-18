function ensureAuthenticated(req, res, next) {
  if (!req.session.user) {
    req.session.error = 'Please log in first.';
    return res.redirect('/login');
  }
  return next();
}

function ensureRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user || !roles.includes(req.session.user.role)) {
      req.session.error = 'You do not have access to that page.';
      return res.redirect('/');
    }
    return next();
  };
}

module.exports = {
  ensureAuthenticated,
  ensureRole
};
