const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// Home page
router.get('/', async (req, res) => {
  try {
    const { Setting, Event } = require('../models');
    const { Op } = require('sequelize');
    const { generateRecurringOccurrences } = require('../utils/recurringEvents');
    
    // Get church settings
    const settings = await Setting.getAll();
    
    // Get current time
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Find currently active events
    const events = await Event.findAll({
      where: {
        isPublished: true,
        [Op.or]: [
          // Non-recurring events happening today
          {
            isRecurring: false,
            startDate: {
              [Op.between]: [today, endOfDay]
            }
          },
          // Recurring events that might have an occurrence today
          {
            isRecurring: true,
            startDate: {
              [Op.lte]: endOfDay
            },
            [Op.or]: [
              { recurrenceEnd: null },
              { recurrenceEnd: { [Op.gte]: today } }
            ]
          }
        ]
      }
    });
    
    // Process events to find current/upcoming ones
    let currentEvent = null;
    let upcomingEvents = [];
    
    events.forEach(event => {
      const eventData = event.toJSON();
      
      if (event.isRecurring) {
        // Generate today's occurrences for recurring events
        const occurrences = generateRecurringOccurrences(eventData, today, endOfDay);
        occurrences.forEach(occurrence => {
          const eventStart = new Date(occurrence.startDate);
          const eventEnd = new Date(occurrence.endDate);
          
          // If event has specific times, use them
          if (event.startTime) {
            const [hours, minutes] = event.startTime.split(':');
            eventStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          }
          if (event.endTime) {
            const [hours, minutes] = event.endTime.split(':');
            eventEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          }
          
          // Check if event is currently active
          if (now >= eventStart && now <= eventEnd) {
            currentEvent = {
              ...occurrence,
              startDateTime: eventStart,
              endDateTime: eventEnd,
              timeRemaining: Math.floor((eventEnd - now) / 1000 / 60) // minutes remaining
            };
          } else if (eventStart > now && eventStart <= endOfDay) {
            upcomingEvents.push({
              ...occurrence,
              startDateTime: eventStart,
              endDateTime: eventEnd,
              timeUntil: Math.floor((eventStart - now) / 1000 / 60) // minutes until start
            });
          }
        });
      } else {
        // Handle non-recurring events
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        
        if (event.startTime) {
          const [hours, minutes] = event.startTime.split(':');
          eventStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }
        if (event.endTime) {
          const [hours, minutes] = event.endTime.split(':');
          eventEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }
        
        if (now >= eventStart && now <= eventEnd) {
          currentEvent = {
            ...eventData,
            startDateTime: eventStart,
            endDateTime: eventEnd,
            timeRemaining: Math.floor((eventEnd - now) / 1000 / 60)
          };
        } else if (eventStart > now && eventStart <= endOfDay) {
          upcomingEvents.push({
            ...eventData,
            startDateTime: eventStart,
            endDateTime: eventEnd,
            timeUntil: Math.floor((eventStart - now) / 1000 / 60)
          });
        }
      }
    });
    
    // Sort upcoming events by start time
    upcomingEvents.sort((a, b) => a.startDateTime - b.startDateTime);
    
    // Debug logging
    console.log('Home page - Session user:', req.session.user);
    console.log('Home page - res.locals.user:', res.locals.user);
    
    res.render('pages/home', {
      title: settings.churchName || 'United Presbyterian Church',
      churchName: settings.churchName || 'United Presbyterian Church',
      welcomeMessage: res.locals.welcomeMessage,
      user: res.locals.user,
      currentEvent,
      upcomingEvents: upcomingEvents.slice(0, 3) // Show next 3 upcoming events today
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