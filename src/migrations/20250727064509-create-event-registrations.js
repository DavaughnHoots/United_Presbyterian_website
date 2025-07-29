'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('event_registrations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      eventId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      guestName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      guestEmail: {
        type: Sequelize.STRING,
        allowNull: true
      },
      numberOfAttendees: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('registered', 'waitlisted', 'cancelled'),
        defaultValue: 'registered'
      },
      registeredAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      cancelledAt: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Add unique constraints
    await queryInterface.addIndex('event_registrations', ['eventId', 'userId'], {
      unique: true,
      where: {
        userId: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    await queryInterface.addIndex('event_registrations', ['eventId', 'guestEmail'], {
      unique: true,
      where: {
        guestEmail: {
          [Sequelize.Op.ne]: null
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('event_registrations');
  }
};