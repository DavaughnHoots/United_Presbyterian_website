'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add fields for consistency checking and re-rating
    await queryInterface.addColumn('sentiment_annotations', 'is_consistency_check', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('sentiment_annotations', 'original_sentiment', {
      type: Sequelize.ENUM('positive', 'negative', 'neutral', 'skip'),
      allowNull: true
    });

    await queryInterface.addColumn('sentiment_annotations', 'consistency_check_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add index for faster queries on annotator_id
    await queryInterface.addIndex('sentiment_annotations', ['annotator_id'], {
      name: 'sentiment_annotations_annotator_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('sentiment_annotations', 'is_consistency_check');
    await queryInterface.removeColumn('sentiment_annotations', 'original_sentiment');
    await queryInterface.removeColumn('sentiment_annotations', 'consistency_check_at');
    await queryInterface.removeIndex('sentiment_annotations', 'sentiment_annotations_annotator_idx');
  }
};