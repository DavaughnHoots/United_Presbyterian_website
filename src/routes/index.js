const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// Home page
router.get('/', async (req, res) => {
  try {
    const { Setting } = require('../models');
    
    // Get church settings
    const settings = await Setting.getAll();
    
    // Debug logging
    console.log('Home page - Session user:', req.session.user);
    console.log('Home page - res.locals.user:', res.locals.user);
    
    res.render('pages/home', {
      title: settings.churchName || 'United Presbyterian Church',
      churchName: settings.churchName || 'United Presbyterian Church',
      welcomeMessage: res.locals.welcomeMessage
    });
  } catch (error) {
    console.error('Error rendering home page:', error);
    res.status(500).send('Internal server error');
  }
});

// Daily content page
router.get('/daily', async (req, res) => {
  try {
    const { DailyContent, UserProgress } = require('../models');
    const { Op } = require('sequelize');
    
    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Fetch today's content
    let todayContent = await DailyContent.findOne({
      where: {
        date: today
      }
    });
    
    // If no content for today, get the most recent content
    if (!todayContent) {
      todayContent = await DailyContent.findOne({
        order: [['date', 'DESC']]
      });
    }
    
    // Check user's progress for today if logged in
    let userProgress = null;
    if (req.session.user && todayContent) {
      userProgress = await UserProgress.findOne({
        where: {
          userId: req.session.user.id,
          contentId: todayContent.id
        }
      });
    }
    
    res.render('pages/daily-content', {
      title: 'Daily Spiritual Content',
      content: todayContent,
      userProgress: userProgress,
      today: today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    });
  } catch (error) {
    console.error('Error rendering daily content:', error);
    res.status(500).send('Internal server error');
  }
});

// Anonymous submissions page
router.get('/share', async (req, res) => {
  try {
    res.render('pages/submissions', {
      title: 'Share Your Heart'
    });
  } catch (error) {
    console.error('Error rendering submissions page:', error);
    res.status(500).send('Internal server error');
  }
});

// About page
router.get('/about', async (req, res) => {
  try {
    const { Setting } = require('../models');
    
    // Get church settings
    const settings = await Setting.getAll();
    
    res.render('pages/about', {
      title: 'About United Presbyterian Church',
      churchName: settings.churchName || 'United Presbyterian Church',
      churchAddress: settings.churchAddress || '',
      phoneNumber: settings.phoneNumber || '',
      contactEmail: settings.contactEmail || '',
      serviceTimes: settings.serviceTimes || '',
      welcomeMessage: settings.welcomeMessage || 'Welcome to our church family!'
    });
  } catch (error) {
    console.error('Error rendering about page:', error);
    res.status(500).send('Internal server error');
  }
});

// Live Service page
router.get('/live', async (req, res) => {
  try {
    const { Setting } = require('../models');
    
    // Get church settings
    const settings = await Setting.getAll();
    
    res.render('pages/live', {
      title: 'Live Service - ' + (settings.churchName || 'United Presbyterian Church'),
      churchName: settings.churchName || 'United Presbyterian Church',
      youtubeLiveLink: settings.youtubeLiveLink || '',
      serviceTimes: settings.serviceTimes || ''
    });
  } catch (error) {
    console.error('Error rendering live page:', error);
    res.status(500).send('Internal server error');
  }
});

// Profile page (requires authentication)
router.get('/profile', requireAuth, async (req, res) => {
  try {
    res.render('pages/profile', {
      title: 'My Profile'
    });
  } catch (error) {
    console.error('Error rendering profile page:', error);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;