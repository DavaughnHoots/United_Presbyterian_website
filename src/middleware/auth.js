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
const requireAdmin = async (req, res, next) => {
  // First check if user is authenticated
  if (!AuthService.isAuthenticated(req)) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/auth/login');
  }
  
  // Then check if user is admin
  if (!AuthService.isAdmin(req)) {
    return res.status(403).render('pages/403', {
      title: '403 - Forbidden',
      user: req.session.user,
      message: 'You do not have permission to access this page.'
    });
  }
  
  // Check if admin has password set
  const { User } = require('../models');
  const admin = await User.findByPk(req.session.user.id);
  
  if (!admin.password) {
    // Admin needs to set password first
    req.session.pendingPasswordSetup = {
      userId: admin.id,
      email: admin.email
    };
    return res.redirect('/auth/setup-password');
  }
  
  next();
};

/**
 * Middleware to add user data to all views
 */
const addUserToLocals = (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.welcomeMessage = req.session.welcomeMessage || null;
  
  // Note: We don't delete welcomeMessage here to avoid session corruption
  // The message will only display once per request since it's in res.locals
  
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  addUserToLocals
};