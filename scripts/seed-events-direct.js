// Direct database seeding script for events
const { Client } = require('pg');

async function seedEvents() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // First, check if we have an admin user
    const adminResult = await client.query(`
      SELECT id FROM users WHERE "isAdmin" = true LIMIT 1
    `);

    if (adminResult.rows.length === 0) {
      console.log('No admin user found. Creating one...');
      const createAdminResult = await client.query(`
        INSERT INTO users (id, "firstName", "lastName", email, "personalEmail", "isAdmin", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'Admin', 'User', 'adminuser@upc.com', 'admin@example.com', true, NOW(), NOW())
        RETURNING id
      `);
      adminResult.rows[0] = createAdminResult.rows[0];
    }

    const adminId = adminResult.rows[0].id;
    console.log('Using admin ID:', adminId);

    // Check if events table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'events'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('Events table does not exist. Run migrations first.');
      return;
    }

    // Check if events already exist
    const eventCount = await client.query('SELECT COUNT(*) FROM events');
    if (parseInt(eventCount.rows[0].count) > 0) {
      console.log('Events already exist. Skipping seed.');
      return;
    }

    // Insert sample events
    const events = [
      {
        title: 'Sunday Worship Service',
        description: 'Join us for our weekly worship service',
        location: 'Main Sanctuary',
        category: 'worship',
        startDate: getNextSunday(),
        endDate: addHours(getNextSunday(), 1.5),
        allDay: false,
        recurring: true,
        recurringPattern: 'weekly',
        color: '#1e40af',
        isFeatured: true
      },
      {
        title: 'Wednesday Bible Study',
        description: 'Weekly Bible study and discussion',
        location: 'Fellowship Hall',
        category: 'bible-study',
        startDate: getNextWednesday(),
        endDate: addHours(getNextWednesday(), 2),
        allDay: false,
        recurring: true,
        recurringPattern: 'weekly',
        color: '#92400e'
      },
      {
        title: 'Community Food Drive',
        description: 'Help serve our community',
        location: 'Church Parking Lot',
        category: 'service',
        startDate: getNextSaturday(),
        endDate: addHours(getNextSaturday(), 4),
        allDay: false,
        color: '#065f46',
        isFeatured: true
      }
    ];

    for (const event of events) {
      await client.query(`
        INSERT INTO events (
          id, title, description, location, "startDate", "endDate", 
          "allDay", recurring, "recurringPattern", category, color, 
          "isPublished", "isFeatured", "registrationRequired", "createdBy", 
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
          true, $11, false, $12, NOW(), NOW()
        )
      `, [
        event.title, event.description, event.location, 
        event.startDate, event.endDate, event.allDay,
        event.recurring, event.recurringPattern, event.category,
        event.color, event.isFeatured || false, adminId
      ]);
      console.log(`Created event: ${event.title}`);
    }

    console.log('✅ Events seeded successfully!');
  } catch (error) {
    console.error('Error seeding events:', error);
  } finally {
    await client.end();
  }
}

// Helper functions
function getNextSunday() {
  const date = new Date();
  const day = date.getDay();
  const diff = day === 0 ? 7 : 7 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(10, 0, 0, 0);
  return date;
}

function getNextWednesday() {
  const date = new Date();
  const day = date.getDay();
  const diff = day <= 3 ? 3 - day : 10 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(19, 0, 0, 0);
  return date;
}

function getNextSaturday() {
  const date = new Date();
  const day = date.getDay();
  const diff = day <= 6 ? 6 - day : 13 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(9, 0, 0, 0);
  return date;
}

function addHours(date, hours) {
  const newDate = new Date(date);
  newDate.setTime(newDate.getTime() + (hours * 60 * 60 * 1000));
  return newDate;
}

// Run if called directly
if (require.main === module) {
  seedEvents();
}

module.exports = seedEvents;