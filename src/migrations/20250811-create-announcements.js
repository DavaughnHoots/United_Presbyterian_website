'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create announcements table
    await queryInterface.createTable('announcements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Announcement title'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Announcement content/message'
      },
      priority: {
        type: Sequelize.ENUM('info', 'important', 'urgent'),
        defaultValue: 'info',
        allowNull: false,
        comment: 'Priority level of the announcement'
      },
      targetAudience: {
        type: Sequelize.ENUM('all', 'members', 'admins'),
        defaultValue: 'all',
        allowNull: false,
        comment: 'Who should see this announcement'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      publishAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When to start showing the announcement'
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When to stop showing the announcement'
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    
    // Create user_announcements junction table
    await queryInterface.createTable('user_announcements', {
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
      announcementId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'announcements',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When user read the announcement'
      },
      dismissedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When user dismissed the announcement'
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
    
    // Add indexes for announcements
    await queryInterface.addIndex('announcements', ['isActive'], {
      name: 'announcements_isActive_idx'
    });
    
    await queryInterface.addIndex('announcements', ['publishAt', 'expiresAt'], {
      name: 'announcements_dates_idx'
    });
    
    await queryInterface.addIndex('announcements', ['priority'], {
      name: 'announcements_priority_idx'
    });
    
    // Add indexes for user_announcements
    await queryInterface.addIndex('user_announcements', ['userId'], {
      name: 'user_announcements_userId_idx'
    });
    
    await queryInterface.addIndex('user_announcements', ['announcementId'], {
      name: 'user_announcements_announcementId_idx'
    });
    
    await queryInterface.addIndex('user_announcements', ['userId', 'announcementId'], {
      name: 'user_announcements_unique_idx',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_announcements');
    await queryInterface.dropTable('announcements');
  }
};