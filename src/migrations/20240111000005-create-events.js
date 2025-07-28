'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('events', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      allDay: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      recurring: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      recurringPattern: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly'),
        allowNull: true
      },
      recurringEndDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      category: {
        type: Sequelize.ENUM('worship', 'bible-study', 'fellowship', 'service', 'meeting', 'special'),
        defaultValue: 'worship'
      },
      color: {
        type: Sequelize.STRING,
        defaultValue: '#87CEEB'
      },
      isPublished: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isFeatured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      maxAttendees: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      registrationRequired: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      registrationDeadline: {
        type: Sequelize.DATE,
        allowNull: true
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('events', ['startDate']);
    await queryInterface.addIndex('events', ['category']);
    await queryInterface.addIndex('events', ['isPublished', 'startDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('events');
  }
};