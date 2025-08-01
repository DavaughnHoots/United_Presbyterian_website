'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, we need to drop the old enum type and create a new one with all values
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_content_type RENAME TO enum_content_type_old;
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE enum_content_type AS ENUM (
        'reading',
        'prayer', 
        'music',
        'question',
        'hymn',
        'creed',
        'reflection',
        'scripture_reading',
        'artwork',
        'video',
        'journaling_prompt',
        'guided_prayer',
        'breathing_exercise'
      );
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE content 
      ALTER COLUMN type TYPE enum_content_type 
      USING type::text::enum_content_type;
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE enum_content_type_old;
    `);

    // Add new columns needed for journey content
    await queryInterface.addColumn('content', 'duration_minutes', {
      type: Sequelize.INTEGER,
      defaultValue: 5,
      allowNull: false
    });

    await queryInterface.addColumn('content', 'artist', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('content', 'image_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('content', 'video_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('content', 'instructions', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('content', 'prompts', {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      defaultValue: [],
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove new columns
    await queryInterface.removeColumn('content', 'duration_minutes');
    await queryInterface.removeColumn('content', 'artist');
    await queryInterface.removeColumn('content', 'image_url');
    await queryInterface.removeColumn('content', 'video_url');
    await queryInterface.removeColumn('content', 'instructions');
    await queryInterface.removeColumn('content', 'prompts');

    // Revert enum type
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_content_type RENAME TO enum_content_type_new;
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE enum_content_type AS ENUM ('reading', 'prayer', 'music', 'question');
    `);

    // Delete any content with new types before converting
    await queryInterface.sequelize.query(`
      DELETE FROM content 
      WHERE type NOT IN ('reading', 'prayer', 'music', 'question');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE content 
      ALTER COLUMN type TYPE enum_content_type 
      USING type::text::enum_content_type;
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE enum_content_type_new;
    `);
  }
};