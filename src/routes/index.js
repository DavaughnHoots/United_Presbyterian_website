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
    
    // Get Eastern Time offset (EST = -5, EDT = -4)
    const easternOffset = new Date().toLocaleString("en-US", {timeZone: "America/New_York", timeZoneName: "short"}).includes("EDT") ? -4 : -5;
    const utcOffset = now.getTimezoneOffset() / 60; // in hours
    const hoursDiff = utcOffset + easternOffset; // difference between server time and Eastern
    
    // Get today's date range in server timezone
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
          
          // If event has specific times, adjust for Eastern Time
          if (event.startTime) {
            const [hours, minutes] = event.startTime.split(':');
            eventStart.setHours(parseInt(hours) - hoursDiff, parseInt(minutes), 0, 0);
          }
          if (event.endTime) {
            const [hours, minutes] = event.endTime.split(':');
            eventEnd.setHours(parseInt(hours) - hoursDiff, parseInt(minutes), 0, 0);
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
        
        // If event has specific times, adjust for Eastern Time
        if (event.startTime) {
          const [hours, minutes] = event.startTime.split(':');
          eventStart.setHours(parseInt(hours) - hoursDiff, parseInt(minutes), 0, 0);
        }
        if (event.endTime) {
          const [hours, minutes] = event.endTime.split(':');
          eventEnd.setHours(parseInt(hours) - hoursDiff, parseInt(minutes), 0, 0);
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
    const { DailyContent, UserProgress, UserJourney, JourneyDay, JourneyContent, UserJourneyProgress } = require('../models');
    const { Op } = require('sequelize');
    
    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let userJourney = null;
    let journeyDay = null;
    let journeyContent = [];
    let allContentCompleted = false;
    
    // Check if user has an active journey
    if (req.session.user) {
      userJourney = await UserJourney.findOne({
        where: {
          user_id: req.session.user.id,
          is_active: true
        },
        include: [{
          model: require('../models').Journey,
          as: 'journey'
        }]
      });
      
      if (userJourney) {
        // Calculate current day based on start date
        const startDate = new Date(userJourney.start_date);
        startDate.setHours(0, 0, 0, 0);
        const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        const currentDay = Math.max(1, Math.min(daysSinceStart + 1, userJourney.journey.duration_days));
        
        // Allow viewing specific day if requested
        const requestedDay = req.query.day ? parseInt(req.query.day) : currentDay;
        const dayToShow = Math.max(1, Math.min(requestedDay, currentDay));
        
        // Get the journey day content
        journeyDay = await JourneyDay.findOne({
          where: {
            journey_id: userJourney.journey_id,
            day_number: dayToShow
          }
        });
        
        if (journeyDay) {
          // Get all content for this day
          const dayContent = await JourneyContent.findAll({
            where: {
              journey_day_id: journeyDay.id
            },
            order: [['order_index', 'ASC']]
          });
          
          // Get user's progress for each content
          const userProgressMap = {};
          if (dayContent.length > 0) {
            const progress = await UserJourneyProgress.findAll({
              where: {
                user_journey_id: userJourney.id,
                journey_content_id: {
                  [Op.in]: dayContent.map(c => c.id)
                }
              }
            });
            progress.forEach(p => {
              userProgressMap[p.journey_content_id] = p;
            });
          }
          
          // Load actual content for each item
          for (const content of dayContent) {
            const contentWithData = content.toJSON();
            contentWithData.actualContent = await content.getContent();
            contentWithData.isCompleted = !!userProgressMap[content.id];
            journeyContent.push(contentWithData);
          }
          
          // Check if all content is completed
          allContentCompleted = journeyContent.length > 0 && journeyContent.every(c => c.isCompleted);
        }
        
        // Update current day in user journey
        userJourney.current_day = currentDay;
        await userJourney.save();
      }
    }
    
    // Fallback to legacy daily content if no journey
    let todayContent = null;
    let userProgress = null;
    
    if (!userJourney) {
      // Fetch today's content
      todayContent = await DailyContent.findOne({
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
      if (req.session.user && todayContent) {
        userProgress = await UserProgress.findOne({
          where: {
            userId: req.session.user.id,
            contentId: todayContent.id
          }
        });
      }
    }
    
    res.render('pages/daily-content', {
      title: 'Daily Spiritual Journey',
      content: todayContent,
      userProgress: userProgress,
      userJourney: userJourney,
      journeyDay: journeyDay,
      journeyContent: journeyContent,
      allContentCompleted: allContentCompleted,
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

// Journeys page
router.get('/journeys', async (req, res) => {
  try {
    const { Journey, UserJourney } = require('../models');
    
    // Get all active journeys
    const journeys = await Journey.findAll({
      where: { is_published: true },
      order: [['createdAt', 'DESC']]
    });
    
    // Get user's active journey if logged in
    let activeJourney = null;
    if (req.session.user) {
      activeJourney = await UserJourney.findOne({
        where: {
          user_id: req.session.user.id,
          is_active: true
        },
        include: [{
          model: Journey,
          as: 'journey'
        }]
      });
    }
    
    res.render('pages/journeys', {
      title: 'Spiritual Journeys',
      journeys,
      activeJourney
    });
  } catch (error) {
    console.error('Error rendering journeys page:', error);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;