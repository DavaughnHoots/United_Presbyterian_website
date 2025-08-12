'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create user_badges table
    await queryInterface.createTable('user_badges', {
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
        onDelete: 'CASCADE'
      },
      badgeType: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Type of badge earned (streak_7, scripture_50, prayer_10, etc.)'
      },
      badgeName: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Display name of the badge'
      },
      badgeIcon: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '⭐',
        comment: 'Emoji or icon for the badge'
      },
      tier: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: 'Badge tier/level (1=bronze, 2=silver, 3=gold)'
      },
      earnedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
        comment: 'Additional data about how badge was earned'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    
    // Add indexes
    await queryInterface.addIndex('user_badges', ['userId'], {
      name: 'user_badges_userId_idx'
    });
    
    await queryInterface.addIndex('user_badges', ['badgeType'], {
      name: 'user_badges_badgeType_idx'
    });
    
    await queryInterface.addIndex('user_badges', ['earnedAt'], {
      name: 'user_badges_earnedAt_idx'
    });
    
    // Unique constraint to prevent duplicate badges
    await queryInterface.addIndex('user_badges', ['userId', 'badgeType', 'tier'], {
      name: 'user_badges_unique_idx',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_badges');
  }
};