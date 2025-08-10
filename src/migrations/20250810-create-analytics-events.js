'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create analytics_events table for general analytics
    await queryInterface.createTable('analytics_events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      eventType: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'eventType',
        comment: 'Type of event: page_view, content_complete, greeting_click, etc.'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        field: 'userId'
      },
      sessionId: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'sessionId'
      },
      page: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Page URL or route'
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
        field: 'metadata',
        comment: 'Additional event data'
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'userAgent'
      },
      ipHash: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'ipHash'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'createdAt'
      }
    });

    // Add indexes for analytics queries
    await queryInterface.addIndex('analytics_events', ['eventType'], {
      name: 'analytics_events_type_idx'
    });

    await queryInterface.addIndex('analytics_events', ['userId'], {
      name: 'analytics_events_userId_idx'
    });

    await queryInterface.addIndex('analytics_events', ['sessionId'], {
      name: 'analytics_events_sessionId_idx'
    });

    await queryInterface.addIndex('analytics_events', ['createdAt'], {
      name: 'analytics_events_createdAt_idx'
    });

    await queryInterface.addIndex('analytics_events', ['page'], {
      name: 'analytics_events_page_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('analytics_events');
  }
};