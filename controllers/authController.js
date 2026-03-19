const bcrypt = require('bcrypt');
const User = require('../models/userModel');

function showLogin(req, res) {
  if (req.session.user) {
    return res.redirect('/');
  }
  return res.render('login', { title: 'Login' });
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);

    if (!user) {
      req.session.error = 'Invalid email or password.';
      return res.redirect('/login');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      req.session.error = 'Invalid email or password.';
      return res.redirect('/login');
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    return res.redirect('/');
  } catch (error) {
    return next(error);
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/login');
  });
}

module.exports = {
  showLogin,
  login,
  logout
};
