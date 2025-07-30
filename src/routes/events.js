const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Event, EventRegistration, User } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { generateRecurringOccurrences, getNextOccurrence } = require('../utils/recurringEvents');

// Events calendar page
router.get('/', async (req, res) => {
  try {
    const { view = 'month', date = new Date().toISOString() } = req.query;
    
    // Get featured events (including recurring events)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const featuredEventsQuery = await Event.findAll({
      where: {
        isPublished: true,
        isFeatured: true,
        [Op.or]: [
          // Future non-recurring events
          {
            isRecurring: false,
            startDate: {
              [Op.gte]: today
            }
          },
          // Active recurring events
          {
            isRecurring: true,
            [Op.or]: [
              { recurrenceEnd: null },
              { recurrenceEnd: { [Op.gte]: today } }
            ]
          }
        ]
      },
      order: [['startDate', 'ASC']]
    });
    
    // Process featured events to get next occurrences
    const featuredEvents = [];
    
    for (const event of featuredEventsQuery) {
      const eventData = event.toJSON();
      
      if (event.isRecurring) {
        const nextOccurrence = getNextOccurrence(eventData);
        if (nextOccurrence) {
          featuredEvents.push({
            ...eventData,
            startDate: nextOccurrence.startDate,
            endDate: nextOccurrence.endDate,
            isRecurringInstance: true
          });
        }
      } else if (event.startDate >= today) {
        featuredEvents.push(eventData);
      }
    }
    
    // Sort by next occurrence date and take top 3
    featuredEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    const topFeaturedEvents = featuredEvents.slice(0, 3);
    
    res.render('pages/events', {
      title: 'Events Calendar - United Presbyterian Church',
      user: req.session.user,
      featuredEvents: topFeaturedEvents,
      currentView: view,
      currentDate: date
    });
  } catch (error) {
    console.error('Error loading events page:', error);
    res.status(500).send('Internal server error');
  }
});

// Get events for calendar (AJAX endpoint)
router.get('/api/calendar', async (req, res) => {
  try {
    const { start, end, category } = req.query;
    const rangeStart = new Date(start);
    const rangeEnd = new Date(end);
    
    // First, get all events that might be relevant (including recurring events)
    const where = {
      isPublished: true,
      [Op.or]: [
        // Regular events in range
        {
          startDate: {
            [Op.between]: [rangeStart, rangeEnd]
          }
        },
        {
          endDate: {
            [Op.between]: [rangeStart, rangeEnd]
          }
        },
        // Recurring events that started before the range but might have occurrences
        {
          isRecurring: true,
          startDate: {
            [Op.lte]: rangeEnd
          },
          [Op.or]: [
            { recurrenceEnd: null },
            { recurrenceEnd: { [Op.gte]: rangeStart } }
          ]
        }
      ]
    };
    
    if (category) {
      where.category = category;
    }
    
    const events = await Event.findAll({
      where,
      attributes: ['id', 'title', 'startDate', 'endDate', 'allDay', 'category', 'color', 'location', 'link', 'isRecurring', 'recurrencePattern', 'recurrenceEnd', 'startTime', 'endTime'],
      order: [['startDate', 'ASC']]
    });
    
    // Process events and generate recurring occurrences
    const allEvents = [];
    
    events.forEach(event => {
      const eventData = event.toJSON();
      
      if (event.isRecurring) {
        // Generate occurrences for recurring events
        const occurrences = generateRecurringOccurrences(eventData, rangeStart, rangeEnd);
        occurrences.forEach(occurrence => {
          allEvents.push({
            id: `${occurrence.id}_${occurrence.startDate.getTime()}`, // Unique ID for each occurrence
            originalId: occurrence.id,
            title: occurrence.title,
            start: occurrence.startDate,
            end: occurrence.endDate,
            allDay: occurrence.allDay,
            color: occurrence.color,
            category: occurrence.category,
            location: occurrence.location,
            link: occurrence.link,
            isRecurring: true,
            isRecurringInstance: true
          });
        });
      } else {
        // Regular non-recurring event
        if ((event.startDate >= rangeStart && event.startDate <= rangeEnd) ||
            (event.endDate >= rangeStart && event.endDate <= rangeEnd) ||
            (event.startDate <= rangeStart && event.endDate >= rangeEnd)) {
          allEvents.push({
            id: event.id,
            title: event.title,
            start: event.startDate,
            end: event.endDate,
            allDay: event.allDay,
            color: event.color,
            category: event.category,
            location: event.location,
            link: event.link,
            isRecurring: false
          });
        }
      }
    });
    
    // Sort all events by start date
    allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
    
    res.json(allEvents);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Event detail page
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findOne({
      where: {
        id: req.params.id,
        isPublished: true
      },
      include: [{
        model: User,
        attributes: ['firstName', 'lastName']
      }]
    });
    
    if (!event) {
      return res.status(404).render('pages/404', {
        title: 'Event Not Found',
        user: req.session.user
      });
    }
    
    // Get registration count
    const registrationCount = await EventRegistration.count({
      where: {
        eventId: event.id,
        status: 'registered'
      }
    });
    
    // Check if user is registered
    let userRegistration = null;
    if (req.session.user) {
      userRegistration = await EventRegistration.findOne({
        where: {
          eventId: event.id,
          userId: req.session.user.id
        }
      });
    }
    
    // Calculate available spots
    const availableSpots = event.maxAttendees ? event.maxAttendees - registrationCount : null;
    const isRegistrationOpen = event.registrationRequired && 
      (!event.registrationDeadline || new Date(event.registrationDeadline) > new Date()) &&
      (!availableSpots || availableSpots > 0);
    
    res.render('pages/event-detail', {
      title: event.title,
      user: req.session.user,
      event,
      registrationCount,
      userRegistration,
      availableSpots,
      isRegistrationOpen
    });
  } catch (error) {
    console.error('Error loading event detail:', error);
    res.status(500).send('Internal server error');
  }
});

// Register for event
router.post('/:id/register', async (req, res) => {
  try {
    const eventId = req.params.id;
    const { numberOfAttendees = 1, notes, guestName, guestEmail } = req.body;
    
    // Verify event exists and registration is open
    const event = await Event.findOne({
      where: {
        id: eventId,
        isPublished: true,
        registrationRequired: true
      }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found or registration not required' });
    }
    
    // Check registration deadline
    if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
      return res.status(400).json({ error: 'Registration deadline has passed' });
    }
    
    // Check available spots
    if (event.maxAttendees) {
      const currentCount = await EventRegistration.sum('numberOfAttendees', {
        where: {
          eventId,
          status: 'registered'
        }
      });
      
      if (currentCount + parseInt(numberOfAttendees) > event.maxAttendees) {
        return res.status(400).json({ error: 'Not enough spots available' });
      }
    }
    
    // Create registration
    const registrationData = {
      eventId,
      numberOfAttendees: parseInt(numberOfAttendees),
      notes
    };
    
    if (req.session.user) {
      registrationData.userId = req.session.user.id;
    } else {
      if (!guestName || !guestEmail) {
        return res.status(400).json({ error: 'Guest name and email are required' });
      }
      registrationData.guestName = guestName;
      registrationData.guestEmail = guestEmail;
    }
    
    const registration = await EventRegistration.create(registrationData);
    
    res.json({
      success: true,
      message: 'Successfully registered for event',
      registrationId: registration.id
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'You are already registered for this event' });
    }
    
    res.status(500).json({ error: 'Failed to register for event' });
  }
});

// Cancel registration
router.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const registration = await EventRegistration.findOne({
      where: {
        eventId: req.params.id,
        userId: req.session.user.id,
        status: 'registered'
      }
    });
    
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    registration.status = 'cancelled';
    registration.cancelledAt = new Date();
    await registration.save();
    
    res.json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    res.status(500).json({ error: 'Failed to cancel registration' });
  }
});

module.exports = router;