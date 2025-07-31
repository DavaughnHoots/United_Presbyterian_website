require('dotenv').config();
const { Event, User } = require('../src/models');
const eventsData = require('../calendar_files/events.json');

// Map calendar categories to our system categories
const categoryMapping = {
  'Holiday': 'special',
  'Religious': 'worship',
  'Awareness': 'service',
  'Social Justice': 'service',
  'Commemoration': 'special',
  'Season': 'worship',
  'Fellowship': 'fellowship',
  'Youth': 'fellowship',
  'Education': 'bible-study',
  'Meeting': 'meeting',
  'Service': 'service',
  'Mission': 'service',
  'Campaign': 'service',
  'Charity': 'service',
  'Cultural': 'fellowship',
  'Civic': 'meeting',
  'Environmental': 'service',
  'Health': 'service',
  'Peace': 'service',
  'Community': 'fellowship',
  'Historical': 'special',
  'National': 'special',
  'International': 'special',
  'Military': 'special',
  'Stewardship': 'service',
  'Inclusion': 'fellowship',
  'Diversity': 'fellowship',
  'Media': 'special',
  'Development': 'meeting',
  'Gathering': 'fellowship',
  'Observance': 'special',
  'Ecumenical': 'worship',
  'Spiritual': 'worship',
  'Advocacy': 'service',
  'Philanthropy': 'service',
  'LGBTQ+': 'fellowship',
  'Human Rights': 'service',
  'Economic Justice': 'service',
  'Civil Rights': 'service',
  'Political': 'meeting',
  'Safety': 'service',
  'Social': 'fellowship',
  'Elder Care': 'service',
  'Social Services': 'service',
  'Celebration': 'special',
  'Heritage': 'special',
  'Civic Engagement': 'meeting'
};

// Category color mapping
const categoryColors = {
  'Holiday': '#1f78b4',
  'Religious': '#33a02c',
  'Awareness': '#e31a1c',
  'Season': '#ff7f00',
  'Social Justice': '#6a3d9a',
  'Commemoration': '#b15928',
  'Fellowship': '#fb9a99',
  'Youth': '#cab2d6',
  'Education': '#ffff99',
  'Service': '#b2df8a',
  'Mission': '#a6cee3',
  'Campaign': '#fdbf6f'
};

async function importEvents() {
  try {
    console.log('Starting calendar events import...');
    
    // Find a system user to assign as creator
    const systemUser = await User.findOne({
      where: { email: 'davaughnhoots@upc.com' }
    });
    
    if (!systemUser) {
      console.error('System user not found. Please ensure davaughnhoots@upc.com exists.');
      process.exit(1);
    }

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (const eventData of eventsData) {
      try {
        // Check if event already exists by importId
        const existingEvent = await Event.findOne({
          where: { importId: eventData.id }
        });

        if (existingEvent) {
          console.log(`Skipping existing event: ${eventData.name}`);
          skipped++;
          continue;
        }

        // Map category - use first category for primary, store all in categories field
        const primaryCategory = categoryMapping[eventData.categories[0]] || 'special';
        const eventColor = categoryColors[eventData.categories[0]] || '#87CEEB';

        // Create the event
        await Event.create({
          title: eventData.name,
          description: eventData.description,
          location: 'United Presbyterian Church', // Default location
          startDate: new Date(eventData.start + 'T00:00:00'),
          endDate: new Date(eventData.end + 'T23:59:59'),
          allDay: eventData.allDay,
          category: primaryCategory,
          categories: eventData.categories,
          color: eventColor,
          isPublished: true,
          isFeatured: false,
          slug: eventData.slug,
          externalUrl: eventData.url,
          source: 'calendar_import',
          importId: eventData.id,
          createdBy: systemUser.id
        });

        console.log(`Imported: ${eventData.name}`);
        imported++;

      } catch (error) {
        console.error(`Failed to import ${eventData.name}:`, error.message);
        failed++;
      }
    }

    console.log('\nImport Summary:');
    console.log(`Total events: ${eventsData.length}`);
    console.log(`Imported: ${imported}`);
    console.log(`Skipped (already exists): ${skipped}`);
    console.log(`Failed: ${failed}`);

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the import
importEvents();