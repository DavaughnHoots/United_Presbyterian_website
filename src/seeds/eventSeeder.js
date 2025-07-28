const { Event, User } = require('../models');

const eventData = [
  {
    title: 'Sunday Worship Service',
    description: 'Join us for our weekly worship service as we gather to praise God, hear His Word, and fellowship together. All are welcome!',
    location: 'Main Sanctuary',
    category: 'worship',
    allDay: false,
    recurring: true,
    recurringPattern: 'weekly',
    color: '#1e40af',
    registrationRequired: false,
    isFeatured: true
  },
  {
    title: 'Wednesday Bible Study',
    description: 'Dive deeper into God\'s Word with our midweek Bible study. We\'re currently studying the book of Romans.',
    location: 'Fellowship Hall',
    category: 'bible-study',
    allDay: false,
    recurring: true,
    recurringPattern: 'weekly',
    color: '#92400e',
    registrationRequired: false
  },
  {
    title: 'Youth Group Meeting',
    description: 'A fun and engaging time for middle and high school students to grow in faith and friendship.',
    location: 'Youth Room',
    category: 'fellowship',
    allDay: false,
    recurring: true,
    recurringPattern: 'weekly',
    color: '#5b21b6',
    registrationRequired: false
  },
  {
    title: 'Community Food Drive',
    description: 'Help us serve our community by donating non-perishable food items for local families in need.',
    location: 'Church Parking Lot',
    category: 'service',
    allDay: false,
    color: '#065f46',
    registrationRequired: true,
    maxAttendees: 30,
    isFeatured: true
  },
  {
    title: 'Annual Church Picnic',
    description: 'Join us for food, games, and fellowship at our annual church picnic! Bring your family and friends.',
    location: 'Riverside Park',
    category: 'fellowship',
    allDay: true,
    color: '#5b21b6',
    registrationRequired: true,
    maxAttendees: 200,
    isFeatured: true
  },
  {
    title: 'Prayer Meeting',
    description: 'Come together to lift up our church, community, and world in prayer.',
    location: 'Prayer Room',
    category: 'worship',
    allDay: false,
    recurring: true,
    recurringPattern: 'weekly',
    color: '#1e40af',
    registrationRequired: false
  },
  {
    title: 'Church Council Meeting',
    description: 'Monthly meeting of the church council to discuss church business and ministry plans.',
    location: 'Conference Room',
    category: 'meeting',
    allDay: false,
    recurring: true,
    recurringPattern: 'monthly',
    color: '#9a3412',
    registrationRequired: false
  },
  {
    title: 'Easter Sunrise Service',
    description: 'Celebrate the resurrection of our Lord Jesus Christ with a special sunrise service.',
    location: 'Church Lawn',
    category: 'special',
    allDay: false,
    color: '#9f1239',
    registrationRequired: false,
    isFeatured: true
  }
];

async function seedEvents() {
  try {
    // Get an admin user to be the creator
    const adminUser = await User.findOne({ where: { isAdmin: true } });
    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      return;
    }

    const now = new Date();
    const events = [];

    eventData.forEach((event, index) => {
      const baseDate = new Date(now);
      
      // Set different start dates for events
      switch (event.title) {
        case 'Sunday Worship Service':
          // Next Sunday at 10:00 AM
          baseDate.setDate(baseDate.getDate() + (7 - baseDate.getDay()));
          baseDate.setHours(10, 0, 0, 0);
          break;
        case 'Wednesday Bible Study':
          // Next Wednesday at 7:00 PM
          baseDate.setDate(baseDate.getDate() + ((3 - baseDate.getDay() + 7) % 7));
          baseDate.setHours(19, 0, 0, 0);
          break;
        case 'Youth Group Meeting':
          // Next Friday at 7:00 PM
          baseDate.setDate(baseDate.getDate() + ((5 - baseDate.getDay() + 7) % 7));
          baseDate.setHours(19, 0, 0, 0);
          break;
        case 'Community Food Drive':
          // Next Saturday at 9:00 AM
          baseDate.setDate(baseDate.getDate() + ((6 - baseDate.getDay() + 7) % 7));
          baseDate.setHours(9, 0, 0, 0);
          break;
        case 'Annual Church Picnic':
          // In 3 weeks on Saturday
          baseDate.setDate(baseDate.getDate() + 21 + ((6 - baseDate.getDay() + 7) % 7));
          baseDate.setHours(11, 0, 0, 0);
          break;
        case 'Prayer Meeting':
          // Next Thursday at 6:00 AM
          baseDate.setDate(baseDate.getDate() + ((4 - baseDate.getDay() + 7) % 7));
          baseDate.setHours(6, 0, 0, 0);
          break;
        case 'Church Council Meeting':
          // First Tuesday of next month at 7:00 PM
          baseDate.setMonth(baseDate.getMonth() + 1);
          baseDate.setDate(1);
          while (baseDate.getDay() !== 2) {
            baseDate.setDate(baseDate.getDate() + 1);
          }
          baseDate.setHours(19, 0, 0, 0);
          break;
        case 'Easter Sunrise Service':
          // Easter Sunday (simplified - would need proper calculation)
          baseDate.setMonth(3); // April
          baseDate.setDate(20);
          baseDate.setHours(6, 30, 0, 0);
          break;
      }

      const startDate = new Date(baseDate);
      const endDate = new Date(baseDate);
      
      // Set end time based on event type
      if (!event.allDay) {
        switch (event.category) {
          case 'worship':
            endDate.setHours(endDate.getHours() + 1, 30); // 1.5 hours
            break;
          case 'bible-study':
          case 'fellowship':
            endDate.setHours(endDate.getHours() + 2); // 2 hours
            break;
          case 'service':
            endDate.setHours(endDate.getHours() + 4); // 4 hours
            break;
          case 'meeting':
            endDate.setHours(endDate.getHours() + 1); // 1 hour
            break;
          case 'special':
            endDate.setHours(endDate.getHours() + 2); // 2 hours
            break;
        }
      } else {
        endDate.setHours(17, 0, 0, 0); // All day events end at 5 PM
      }

      // Set recurring end date if recurring
      let recurringEndDate = null;
      if (event.recurring) {
        recurringEndDate = new Date(startDate);
        recurringEndDate.setFullYear(recurringEndDate.getFullYear() + 1); // Recur for 1 year
      }

      // Set registration deadline if required
      let registrationDeadline = null;
      if (event.registrationRequired) {
        registrationDeadline = new Date(startDate);
        registrationDeadline.setDate(registrationDeadline.getDate() - 2); // 2 days before event
      }

      events.push({
        ...event,
        startDate,
        endDate,
        recurringEndDate,
        registrationDeadline,
        createdBy: adminUser.id
      });
    });

    // Create events
    await Event.bulkCreate(events);
    console.log(`✅ Seeded ${events.length} events`);

  } catch (error) {
    console.error('Error seeding events:', error);
    throw error;
  }
}

module.exports = seedEvents;