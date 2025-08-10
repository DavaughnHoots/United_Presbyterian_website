'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add totalDaysActive field to users table
    await queryInterface.addColumn('users', 'totalDaysActive', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'totalDaysActive'
    });

    // The following fields already exist in the User model but let's ensure they have defaults
    // currentStreak - already exists
    // longestStreak - already exists 
    // lastActiveDate - already exists
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'totalDaysActive');
  }
};