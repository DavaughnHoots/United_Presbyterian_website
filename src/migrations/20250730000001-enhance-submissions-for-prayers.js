'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns to submissions table
    await queryInterface.addColumn('submissions', 'userId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('submissions', 'isAnonymous', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });

    await queryInterface.addColumn('submissions', 'isUrgent', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('submissions', 'subcategory', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('submissions', 'isAnswered', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('submissions', 'answeredAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('submissions', 'prayerCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    // Create prayer_supports table
    await queryInterface.createTable('prayer_supports', {
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      submissionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'submissions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add unique constraint to prevent duplicate prayers
    await queryInterface.addIndex('prayer_supports', ['userId', 'submissionId'], {
      unique: true,
      name: 'prayer_supports_user_submission_unique'
    });

    // Create submission_updates table
    await queryInterface.createTable('submission_updates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      submissionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'submissions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      updateType: {
        type: Sequelize.ENUM('update', 'answered', 'need_continued_prayer'),
        defaultValue: 'update',
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('submissions', ['userId']);
    await queryInterface.addIndex('submissions', ['isAnswered']);
    await queryInterface.addIndex('submissions', ['isUrgent']);
    await queryInterface.addIndex('submissions', ['subcategory']);
    await queryInterface.addIndex('prayer_supports', ['submissionId']);
    await queryInterface.addIndex('submission_updates', ['submissionId']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables
    await queryInterface.dropTable('submission_updates');
    await queryInterface.dropTable('prayer_supports');

    // Remove columns from submissions table
    await queryInterface.removeColumn('submissions', 'prayerCount');
    await queryInterface.removeColumn('submissions', 'answeredAt');
    await queryInterface.removeColumn('submissions', 'isAnswered');
    await queryInterface.removeColumn('submissions', 'subcategory');
    await queryInterface.removeColumn('submissions', 'isUrgent');
    await queryInterface.removeColumn('submissions', 'isAnonymous');
    await queryInterface.removeColumn('submissions', 'userId');
  }
};