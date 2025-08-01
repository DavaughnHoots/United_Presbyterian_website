'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, we need to drop the existing constraint on the content_type column
    await queryInterface.sequelize.query(`
      ALTER TABLE journey_content 
      DROP CONSTRAINT IF EXISTS journey_content_content_type_check;
    `);
    
    // Add the new ENUM type with all content types
    await queryInterface.sequelize.query(`
      CREATE TYPE journey_content_type_new AS ENUM (
        'bible_verse',
        'prayer', 
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
    
    // Change the column to use the new type
    await queryInterface.sequelize.query(`
      ALTER TABLE journey_content 
      ALTER COLUMN content_type TYPE journey_content_type_new 
      USING content_type::text::journey_content_type_new;
    `);
    
    // Drop the old type if it exists
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_journey_content_content_type;
    `);
    
    // Rename the new type to the standard name
    await queryInterface.sequelize.query(`
      ALTER TYPE journey_content_type_new RENAME TO enum_journey_content_content_type;
    `);
    
    // Add duration_minutes column if it doesn't exist
    const tableInfo = await queryInterface.describeTable('journey_content');
    if (!tableInfo.duration_minutes) {
      await queryInterface.addColumn('journey_content', 'duration_minutes', {
        type: Sequelize.INTEGER,
        defaultValue: 5,
        allowNull: false
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Revert to original content types
    await queryInterface.sequelize.query(`
      CREATE TYPE journey_content_type_old AS ENUM (
        'bible_verse',
        'prayer', 
        'hymn',
        'creed',
        'reflection'
      );
    `);
    
    // Update any new types to 'reflection' before reverting
    await queryInterface.sequelize.query(`
      UPDATE journey_content 
      SET content_type = 'reflection' 
      WHERE content_type IN ('scripture_reading', 'artwork', 'video', 'journaling_prompt', 'guided_prayer', 'breathing_exercise');
    `);
    
    // Change back to old type
    await queryInterface.sequelize.query(`
      ALTER TABLE journey_content 
      ALTER COLUMN content_type TYPE journey_content_type_old 
      USING content_type::text::journey_content_type_old;
    `);
    
    // Drop the current type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_journey_content_content_type;
    `);
    
    // Rename old type back
    await queryInterface.sequelize.query(`
      ALTER TYPE journey_content_type_old RENAME TO enum_journey_content_content_type;
    `);
  }
};