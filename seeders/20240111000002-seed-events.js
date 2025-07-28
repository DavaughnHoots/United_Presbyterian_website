'use strict';

const seedEvents = require('../src/seeds/eventSeeder');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if events already exist
    const existingEvents = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM events',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (existingEvents[0].count > 0) {
      console.log('Events already seeded, skipping...');
      return;
    }

    // Run the event seeder
    await seedEvents();
  },

  down: async (queryInterface, Sequelize) => {
    // Delete all events
    await queryInterface.bulkDelete('events', null, {});
  }
};