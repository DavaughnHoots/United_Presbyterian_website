const express = require('express');
const router = express.Router();
const { User, DailyContent, Submission } = require('../models');

// Debug route to check database and session
router.get('/status', async (req, res) => {
  try {
    // Check session
    const sessionInfo = {
      sessionID: req.sessionID,
      session: req.session,
      user: req.session.user || null,
      cookie: req.session.cookie
    };
    
    // Check database connection
    let dbStatus = 'Not connected';
    let userCount = 0;
    let users = [];
    
    try {
      userCount = await User.count();
      users = await User.findAll({
        attributes: ['id', 'firstName', 'lastName', 'email', 'personalEmail', 'createdAt'],
        limit: 10,
        order: [['createdAt', 'DESC']]
      });
      dbStatus = 'Connected';
    } catch (dbError) {
      dbStatus = `Error: ${dbError.message}`;
    }
    
    // Send debug info
    res.json({
      status: 'Debug Information',
      session: sessionInfo,
      database: {
        status: dbStatus,
        userCount,
        recentUsers: users
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
        SESSION_SECRET: process.env.SESSION_SECRET ? 'Set' : 'Not set'
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Debug error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Test login route
router.get('/test-login/:email', async (req, res) => {
  try {
    const user = await User.findOne({
      where: { email: req.params.email }
    });
    
    if (user) {
      req.session.user = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isAdmin: user.isAdmin || false
      };
      
      req.session.save((err) => {
        if (err) {
          return res.json({ error: 'Session save failed', details: err });
        }
        res.json({
          message: 'Test login successful',
          user: req.session.user,
          sessionID: req.sessionID
        });
      });
    } else {
      res.json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all sessions for testing
router.get('/clear-sessions', async (req, res) => {
  try {
    // Clear current user session
    if (req.session) {
      req.session.destroy();
    }
    
    res.json({ 
      message: 'Session cleared. You can now test login again.',
      tip: 'Visit /auth/login to sign in'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check current cookies
router.get('/cookies', (req, res) => {
  res.json({
    cookies: req.cookies || {},
    signedCookies: req.signedCookies || {},
    headers: {
      cookie: req.headers.cookie,
      'user-agent': req.headers['user-agent']
    }
  });
});

module.exports = router;