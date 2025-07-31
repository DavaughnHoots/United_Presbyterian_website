'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add slug field for URL-friendly identifiers
    await queryInterface.addColumn('events', 'slug', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });

    // Add external URL field for reference links
    await queryInterface.addColumn('events', 'externalUrl', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add categories field (JSON array) for multiple categories
    await queryInterface.addColumn('events', 'categories', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });

    // Add source field to track where event came from
    await queryInterface.addColumn('events', 'source', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'user'
    });

    // Add importId field for tracking imported events
    await queryInterface.addColumn('events', 'importId', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });

    // Update existing category column to allow more values
    await queryInterface.changeColumn('events', 'category', {
      type: Sequelize.STRING,
      defaultValue: 'worship'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('events', 'slug');
    await queryInterface.removeColumn('events', 'externalUrl');
    await queryInterface.removeColumn('events', 'categories');
    await queryInterface.removeColumn('events', 'source');
    await queryInterface.removeColumn('events', 'importId');
    
    // Revert category column to ENUM
    await queryInterface.changeColumn('events', 'category', {
      type: Sequelize.ENUM('worship', 'bible-study', 'fellowship', 'service', 'meeting', 'special'),
      defaultValue: 'worship'
    });
  }
};