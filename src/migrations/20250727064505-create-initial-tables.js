'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      isAdmin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      currentStreak: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      longestStreak: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lastActiveDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      preferences: {
        type: Sequelize.JSONB,
        defaultValue: {
          emailNotifications: true,
          dailyReminder: true,
          reminderTime: '08:00'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create content table
    await queryInterface.createTable('content', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      type: {
        type: Sequelize.ENUM('reading', 'prayer', 'music', 'question'),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      biblePassage: {
        type: Sequelize.STRING,
        allowNull: true
      },
      youtubeId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      theme: {
        type: Sequelize.STRING,
        allowNull: true
      },
      season: {
        type: Sequelize.STRING,
        allowNull: true
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      usageCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lastUsedDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create submissions table
    await queryInterface.createTable('submissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      type: {
        type: Sequelize.ENUM('joy', 'concern', 'testimony'),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      contentHash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      moderatorNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      moderatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      moderatedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      flags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create progress table
    await queryInterface.createTable('progress', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      contentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'content',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('not_started', 'in_progress', 'completed'),
        defaultValue: 'not_started'
      },
      progressPercentage: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      timeSpent: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      reflection: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      date: {
        type: Sequelize.DATEONLY,
        defaultValue: Sequelize.NOW
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create daily_content table
    await queryInterface.createTable('daily_content', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        unique: true
      },
      contentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'content',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      contentType: {
        type: Sequelize.ENUM('reading', 'prayer', 'music', 'question'),
        allowNull: false
      },
      theme: {
        type: Sequelize.STRING,
        allowNull: true
      },
      season: {
        type: Sequelize.STRING,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create session table for express-session
    await queryInterface.createTable('user_sessions', {
      sid: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      sess: {
        type: Sequelize.JSON,
        allowNull: false
      },
      expire: {
        type: Sequelize.DATE(6),
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('content', ['type']);
    await queryInterface.addIndex('content', ['theme']);
    await queryInterface.addIndex('content', ['season']);
    await queryInterface.addIndex('content', ['isActive']);
    await queryInterface.addIndex('submissions', ['type']);
    await queryInterface.addIndex('submissions', ['status']);
    await queryInterface.addIndex('submissions', ['createdAt']);
    await queryInterface.addIndex('submissions', ['contentHash']);
    await queryInterface.addIndex('progress', ['userId', 'contentId'], { unique: true });
    await queryInterface.addIndex('progress', ['userId']);
    await queryInterface.addIndex('progress', ['status']);
    await queryInterface.addIndex('progress', ['date']);
    await queryInterface.addIndex('daily_content', ['date', 'contentType'], { unique: true });
    await queryInterface.addIndex('daily_content', ['date']);
    await queryInterface.addIndex('daily_content', ['contentType']);
    await queryInterface.addIndex('user_sessions', ['expire']);
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order due to foreign key constraints
    await queryInterface.dropTable('user_sessions');
    await queryInterface.dropTable('daily_content');
    await queryInterface.dropTable('progress');
    await queryInterface.dropTable('submissions');
    await queryInterface.dropTable('content');
    await queryInterface.dropTable('users');
  }
};