'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_activities', {
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
      action: {
        type: Sequelize.STRING,
        allowNull: false
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'ipAddress'
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'userAgent'
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false
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

    // Add indexes for better query performance
    await queryInterface.addIndex('user_activities', ['userId', 'createdAt'], {
      name: 'user_activities_userId_createdAt_idx'
    });

    await queryInterface.addIndex('user_activities', ['action'], {
      name: 'user_activities_action_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_activities');
  }
};