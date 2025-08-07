'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sentiment_annotations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      sample_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true
      },
      book_name: {
        type: Sequelize.STRING,
        allowNull: false
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
      genre_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sentiment: {
        type: Sequelize.ENUM('positive', 'negative', 'neutral', 'skip'),
        allowNull: true
      },
      annotator_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      annotated_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for faster queries
    await queryInterface.addIndex('sentiment_annotations', ['sample_id']);
    await queryInterface.addIndex('sentiment_annotations', ['annotator_id']);
    await queryInterface.addIndex('sentiment_annotations', ['sentiment']);
    await queryInterface.addIndex('sentiment_annotations', ['book_name', 'chapter', 'verse']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sentiment_annotations');
  }
};