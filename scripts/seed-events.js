#!/usr/bin/env node

require('dotenv').config();
const sequelize = require('../src/config/database');

async function runSeeder() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Run the event seeder
    const seedEvents = require('../src/seeds/eventSeeder');
    await seedEvents();
    
    console.log('✅ Event seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding events:', error);
    process.exit(1);
  }
}

runSeeder();