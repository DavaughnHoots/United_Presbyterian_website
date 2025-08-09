'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('events', 'show_in_happening_now', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('events', 'show_in_happening_now');
  }
};