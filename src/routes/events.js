const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Event, EventRegistration, User } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { generateRecurringOccurrences, getNextOccurrence } = require('../utils/recurringEvents');

// Helper function to format date for frontend without timezone issues
function formatDateForFrontend(date, startTime = null) {
  if (!date) return null;
  
  // Parse the date
  let d;
  if (typeof date === 'string') {
    // If it looks like a date without time, add noon to avoid timezone issues
    if (date.length === 10) { // YYYY-MM-DD format
      d = new Date(date + 'T12:00:00');
    } else {
      d = new Date(date);
    }
  } else {
    d = new Date(date);
  }
  
  // If we have a specific time, use it
  if (startTime) {
    const [hours, minutes] = startTime.split(':');
    d.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  
  // Return ISO string without timezone
  return d.toISOString().slice(0, 19);
}

// Calendar view page with FullCalendar
router.get('/calendar', async (req, res) => {
  try {
    res.render('pages/events-calendar', {
      title: 'Full Calendar View - United Presbyterian Church',
      user: req.session.user
    });
  } catch (error) {
    console.error('Error loading calendar view:', error);
    res.status(500).send('Internal server error');
  }
});

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
            startDate: formatDateForFrontend(nextOccurrence.startDate, eventData.startTime),
            endDate: formatDateForFrontend(nextOccurrence.endDate, eventData.endTime),
            isRecurringInstance: true
          });
        }
      } else if (event.startDate >= today) {
        featuredEvents.push({
          ...eventData,
          startDate: formatDateForFrontend(eventData.startDate, eventData.startTime),
          endDate: formatDateForFrontend(eventData.endDate, eventData.endTime)
        });
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

// Get all events for FullCalendar view
router.get('/api/calendar-all', async (req, res) => {
  try {
    const events = await Event.findAll({
      where: { isPublished: true },
      order: [['startDate', 'ASC']]
    });

    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      allDay: event.allDay,
      category: event.category,
      categories: event.categories || [], // Will be undefined until migration runs
      color: event.color,
      link: event.link,
      externalUrl: event.externalUrl || null, // Will be undefined until migration runs
      isRecurring: event.isRecurring,
      recurringPattern: event.recurringPattern
    }));

    res.json({ success: true, events: formattedEvents });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
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
            start: formatDateForFrontend(occurrence.startDate),
            end: formatDateForFrontend(occurrence.endDate),
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
            start: formatDateForFrontend(event.startDate, event.startTime),
            end: formatDateForFrontend(event.endDate, event.endTime),
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

// Event detail page
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).render('pages/404', {
        title: 'Event Not Found',
        user: req.session.user
      });
    }

    // Generate JSON-LD for SEO
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": event.title,
      "description": event.description || '',
      "startDate": event.startDate.toISOString(),
      "endDate": event.endDate.toISOString(),
      "eventAttendanceMode": "https://schema.org/OfflineEvent",
      "eventStatus": "https://schema.org/EventScheduled",
      "location": {
        "@type": "Place",
        "name": event.location || "United Presbyterian Church",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Church Address",
          "addressLocality": "City",
          "addressRegion": "State",
          "postalCode": "ZIP"
        }
      },
      "organizer": {
        "@type": "Organization",
        "name": "United Presbyterian Church",
        "url": "https://unitedpresbyterian.org"
      }
    };

    if (event.link || event.externalUrl) {
      jsonLd.url = event.link || event.externalUrl;
    }

    res.render('pages/event-detail', {
      title: `${event.title} - United Presbyterian Church`,
      user: req.session.user,
      event: event,
      jsonLd: JSON.stringify(jsonLd)
    });

  } catch (error) {
    console.error('Error loading event detail:', error);
    res.status(500).render('pages/500', {
      title: 'Server Error',
      user: req.session.user
    });
  }
});

// Generate ICS file for individual event
router.get('/:id/ics', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).send('Event not found');
    }

    // Helper function to escape ICS text
    function escapeICS(str = '') {
      return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;');
    }

    // Generate ICS content
    const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `${event.id}@unitedpresbyterian.org`;
    
    // Format dates for ICS
    let dtstart, dtend;
    if (event.allDay) {
      // For all-day events, use DATE format
      dtstart = new Date(event.startDate).toISOString().slice(0, 10).replace(/-/g, '');
      const endDate = new Date(event.endDate);
      endDate.setDate(endDate.getDate() + 1); // ICS all-day events end date is exclusive
      dtend = endDate.toISOString().slice(0, 10).replace(/-/g, '');
    } else {
      // For timed events, use DATE-TIME format
      dtstart = new Date(event.startDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      dtend = new Date(event.endDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    const categories = event.categories && event.categories.length > 0 
      ? event.categories.join(',') 
      : event.category;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//United Presbyterian Church//Events//EN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      event.allDay ? `DTSTART;VALUE=DATE:${dtstart}` : `DTSTART:${dtstart}`,
      event.allDay ? `DTEND;VALUE=DATE:${dtend}` : `DTEND:${dtend}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `DESCRIPTION:${escapeICS(event.description || '')}`,
      event.location ? `LOCATION:${escapeICS(event.location)}` : '',
      categories ? `CATEGORIES:${escapeICS(categories)}` : '',
      event.link || event.externalUrl ? `URL:${event.link || event.externalUrl}` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line).join('\r\n') + '\r\n';

    // Set headers for ICS file download
    const filename = event.slug || event.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.ics"`);
    res.send(icsContent);

  } catch (error) {
    console.error('Error generating ICS file:', error);
    res.status(500).send('Error generating calendar file');
  }
});

module.exports = router;