const { sequelize } = require('../src/config/database');

async function fixEventsTable() {
  try {
    console.log('Fixing events table...');
    
    // Add startTime column
    try {
      await sequelize.query(`ALTER TABLE events ADD COLUMN "startTime" TIME;`);
      console.log('✓ Added startTime column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('- startTime column already exists');
      } else {
        console.error('Error adding startTime:', error.message);
      }
    }
    
    // Add endTime column
    try {
      await sequelize.query(`ALTER TABLE events ADD COLUMN "endTime" TIME;`);
      console.log('✓ Added endTime column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('- endTime column already exists');
      } else {
        console.error('Error adding endTime:', error.message);
      }
    }
    
    // Add isRecurring column
    try {
      await sequelize.query(`ALTER TABLE events ADD COLUMN "isRecurring" BOOLEAN DEFAULT false;`);
      console.log('✓ Added isRecurring column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('- isRecurring column already exists');
      } else {
        console.error('Error adding isRecurring:', error.message);
      }
    }
    
    // Add requireRegistration column
    try {
      await sequelize.query(`ALTER TABLE events ADD COLUMN "requireRegistration" BOOLEAN DEFAULT false;`);
      console.log('✓ Added requireRegistration column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('- requireRegistration column already exists');
      } else {
        console.error('Error adding requireRegistration:', error.message);
      }
    }
    
    // Add recurrencePattern column
    try {
      await sequelize.query(`ALTER TABLE events ADD COLUMN "recurrencePattern" VARCHAR(255);`);
      console.log('✓ Added recurrencePattern column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('- recurrencePattern column already exists');
      } else {
        console.error('Error adding recurrencePattern:', error.message);
      }
    }
    
    // Add recurrenceEnd column
    try {
      await sequelize.query(`ALTER TABLE events ADD COLUMN "recurrenceEnd" TIMESTAMP WITH TIME ZONE;`);
      console.log('✓ Added recurrenceEnd column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('- recurrenceEnd column already exists');
      } else {
        console.error('Error adding recurrenceEnd:', error.message);
      }
    }
    
    // Add guestPhone to event_registrations
    try {
      await sequelize.query(`ALTER TABLE event_registrations ADD COLUMN "guestPhone" VARCHAR(255);`);
      console.log('✓ Added guestPhone column to event_registrations');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('- guestPhone column already exists');
      } else {
        console.error('Error adding guestPhone:', error.message);
      }
    }
    
    console.log('\nEvents table fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixEventsTable();