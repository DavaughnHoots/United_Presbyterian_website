'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add startTime column
    const startTimeExists = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'startTime'`
    );
    
    if (startTimeExists[0].length === 0) {
      await queryInterface.addColumn('events', 'startTime', {
        type: Sequelize.TIME,
        allowNull: true
      });
    }
    
    // Add endTime column
    const endTimeExists = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'endTime'`
    );
    
    if (endTimeExists[0].length === 0) {
      await queryInterface.addColumn('events', 'endTime', {
        type: Sequelize.TIME,
        allowNull: true
      });
    }
    
    // Add isRecurring column
    const isRecurringExists = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'isRecurring'`
    );
    
    if (isRecurringExists[0].length === 0) {
      await queryInterface.addColumn('events', 'isRecurring', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
    }
    
    // Add requireRegistration column
    const requireRegistrationExists = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'requireRegistration'`
    );
    
    if (requireRegistrationExists[0].length === 0) {
      await queryInterface.addColumn('events', 'requireRegistration', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
    }
    
    // Add recurrencePattern column
    const recurrencePatternExists = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'recurrencePattern'`
    );
    
    if (recurrencePatternExists[0].length === 0) {
      await queryInterface.addColumn('events', 'recurrencePattern', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    
    // Add recurrenceEnd column
    const recurrenceEndExists = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'recurrenceEnd'`
    );
    
    if (recurrenceEndExists[0].length === 0) {
      await queryInterface.addColumn('events', 'recurrenceEnd', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('events', 'startTime');
    await queryInterface.removeColumn('events', 'endTime');
    await queryInterface.removeColumn('events', 'isRecurring');
    await queryInterface.removeColumn('events', 'requireRegistration');
    await queryInterface.removeColumn('events', 'recurrencePattern');
    await queryInterface.removeColumn('events', 'recurrenceEnd');
  }
};