'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create user_progress table
    await queryInterface.createTable('user_progress', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'userId'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      contentCompleted: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false,
        field: 'contentCompleted',
        comment: 'Tracks which content items were completed'
      },
      timeSpent: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        field: 'timeSpent',
        comment: 'Time spent in minutes'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'createdAt'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'updatedAt'
      }
    });

    // Add unique constraint for user and date
    await queryInterface.addIndex('user_progress', ['userId', 'date'], {
      unique: true,
      name: 'user_progress_userId_date_unique'
    });

    // Add index for date queries
    await queryInterface.addIndex('user_progress', ['date'], {
      name: 'user_progress_date_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_progress');
  }
};