'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'password', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Only required for admin users'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'password');
  }
};