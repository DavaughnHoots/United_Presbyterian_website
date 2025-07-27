const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('pages/login', {
    title: 'Login',
    user: null,
    error: req.query.error
  });
});

// Registration page
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('pages/register', {
    title: 'Register',
    user: null,
    error: req.query.error
  });
});

// Welcome page after registration
router.get('/welcome', (req, res) => {
  // Check if coming from registration
  if (!req.session.registrationComplete) {
    return res.redirect('/');
  }
  
  const regInfo = req.session.registrationComplete;
  // Clear registration info after displaying
  delete req.session.registrationComplete;
  
  res.render('pages/welcome', {
    title: 'Welcome to UPC!',
    user: req.session.user,
    registrationInfo: regInfo
  });
});

// Handle registration
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, personalEmail } = req.body;
    
    if (!firstName || !lastName) {
      return res.redirect('/auth/register?error=missing_fields');
    }

    // Register user with AuthService
    const result = await AuthService.register(firstName, lastName, personalEmail);
    
    if (result.success) {
      // Create session for new user (auto-login)
      AuthService.createSession(req, result.user);
      
      // Store registration info for confirmation page
      req.session.registrationComplete = {
        email: result.user.email,
        personalEmail: result.user.personalEmail,
        firstName: result.user.firstName
      };
      
      // Save session before redirect
      req.session.save((err) => {
        if (err) {
          console.error('Session save error after registration:', err);
        }
        // Redirect to confirmation page
        res.redirect('/auth/welcome');
      });
    } else {
      res.redirect('/auth/register?error=' + encodeURIComponent(result.error));
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.redirect('/auth/register?error=registration_failed');
  }
});

// Handle login
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.redirect('/auth/login?error=missing_email');
    }

    // Login user with AuthService
    const result = await AuthService.login(email);
    
    if (result.success) {
      // Create session
      AuthService.createSession(req, result.user);
      
      // Debug logging
      console.log('Login successful for:', email);
      console.log('Session after login:', req.session);
      
      // Save session before redirect
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
        }
        
        // Redirect to home page or intended destination
        const redirectTo = req.session.returnTo || '/';
        delete req.session.returnTo;
        res.redirect(redirectTo);
      });
    } else {
      res.redirect('/auth/login?error=' + encodeURIComponent(result.error));
    }
  } catch (error) {
    console.error('Login error:', error);
    res.redirect('/auth/login?error=login_failed');
  }
});

// Logout
router.get('/logout', async (req, res) => {
  try {
    await AuthService.destroySession(req);
    res.redirect('/');
  } catch (error) {
    console.error('Logout error:', error);
    res.redirect('/');
  }
});

module.exports = router;