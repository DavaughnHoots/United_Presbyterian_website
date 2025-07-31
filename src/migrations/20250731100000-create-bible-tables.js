'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create bible_books table
    await queryInterface.createTable('bible_books', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      testament: {
        type: Sequelize.STRING(2),
        allowNull: false // OT or NT
      },
      genre: {
        type: Sequelize.INTEGER,
        allowNull: true
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

    // Create bible_verses table
    await queryInterface.createTable('bible_verses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false
      },
      book_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'bible_books',
          key: 'id'
        }
      },
      chapter: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      verse: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      translation: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'KJV'
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

    // Create indexes for better performance
    await queryInterface.addIndex('bible_verses', ['book_id', 'chapter', 'verse']);
    await queryInterface.addIndex('bible_verses', ['translation']);
    
    // Create Journey tables
    await queryInterface.createTable('journeys', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      duration_days: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_published: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
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

    // Create journey_days table
    await queryInterface.createTable('journey_days', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      journey_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'journeys',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      day_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true
      },
      theme: {
        type: Sequelize.STRING,
        allowNull: true
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

    // Create journey_content table
    await queryInterface.createTable('journey_content', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      journey_day_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'journey_days',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      content_type: {
        type: Sequelize.ENUM('bible_verse', 'prayer', 'hymn', 'creed', 'reflection'),
        allowNull: false
      },
      content_id: {
        type: Sequelize.STRING, // Can be bible verse ID or content table ID
        allowNull: false
      },
      order_index: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
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

    // Create user_journeys table to track user progress
    await queryInterface.createTable('user_journeys', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      journey_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'journeys',
          key: 'id'
        }
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      current_day: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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

    // Create user_journey_progress table
    await queryInterface.createTable('user_journey_progress', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_journey_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'user_journeys',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      journey_content_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'journey_content',
          key: 'id'
        }
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: false
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

    // Add indexes for journey tables
    await queryInterface.addIndex('journey_days', ['journey_id', 'day_number']);
    await queryInterface.addIndex('journey_content', ['journey_day_id', 'order_index']);
    await queryInterface.addIndex('user_journeys', ['user_id', 'is_active']);
    await queryInterface.addIndex('user_journey_progress', ['user_journey_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order due to foreign key constraints
    await queryInterface.dropTable('user_journey_progress');
    await queryInterface.dropTable('user_journeys');
    await queryInterface.dropTable('journey_content');
    await queryInterface.dropTable('journey_days');
    await queryInterface.dropTable('journeys');
    await queryInterface.dropTable('bible_verses');
    await queryInterface.dropTable('bible_books');
  }
};