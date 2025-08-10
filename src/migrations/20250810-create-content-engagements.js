'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create content_engagements table for Amen tracking
    await queryInterface.createTable('content_engagements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      contentType: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'contentType',
        comment: 'Type of content: scripture, prayer, hymn, etc.'
      },
      contentId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'contentId',
        comment: 'Reference to specific content item'
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
      engagementType: {
        type: Sequelize.ENUM('amen', 'share', 'save', 'like'),
        allowNull: false,
        defaultValue: 'amen',
        field: 'engagementType'
      },
      ipHash: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'ipHash',
        comment: 'Hashed IP for anonymous deduplication'
      },
      sessionId: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'sessionId'
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
        field: 'metadata'
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

    // Add indexes for performance
    await queryInterface.addIndex('content_engagements', ['contentType', 'contentId'], {
      name: 'content_engagements_content_idx'
    });

    await queryInterface.addIndex('content_engagements', ['userId'], {
      name: 'content_engagements_userId_idx'
    });

    await queryInterface.addIndex('content_engagements', ['engagementType'], {
      name: 'content_engagements_type_idx'
    });

    await queryInterface.addIndex('content_engagements', ['createdAt'], {
      name: 'content_engagements_createdAt_idx'
    });

    // Unique constraint to prevent duplicate Amens
    await queryInterface.addIndex('content_engagements', 
      ['contentType', 'contentId', 'userId', 'engagementType'], 
      {
        unique: true,
        where: {
          userId: {
            [Sequelize.Op.ne]: null
          }
        },
        name: 'content_engagements_user_unique'
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('content_engagements');
  }
};