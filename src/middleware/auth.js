const AuthService = require('../services/authService');

/**
 * Middleware to require authentication
 */
const requireAuth = (req, res, next) => {
  if (!AuthService.isAuthenticated(req)) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/auth/login');
  }
  next();
};

/**
 * Middleware to require admin privileges
 */
const requireAdmin = (req, res, next) => {
  if (!AuthService.isAdmin(req)) {
    return res.status(403).render('pages/403', {
      title: '403 - Forbidden',
      user: req.session.user,
      message: 'You do not have permission to access this page.'
    });
  }
  next();
};

/**
 * Middleware to add user data to all views
 */
const addUserToLocals = (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.welcomeMessage = req.session.welcomeMessage || null;
  
  // Clear welcome message after displaying
  if (req.session.welcomeMessage) {
    delete req.session.welcomeMessage;
  }
  
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  addUserToLocals
};