'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, we need to drop the existing constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE daily_content 
      DROP CONSTRAINT IF EXISTS daily_content_contentType_check;
    `);
    
    // Then update the ENUM type
    await queryInterface.sequelize.query(`
      ALTER TABLE daily_content 
      DROP COLUMN IF EXISTS "contentType";
    `);
    
    // Create new ENUM type with all content types
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_daily_content_contentType_new" AS ENUM (
        'scripture_reading',
        'hymn',
        'prayer',
        'guided_prayer',
        'journaling_prompt',
        'reflection',
        'artwork',
        'video',
        'creed',
        'reading',
        'music',
        'question'
      );
    `);
    
    // Add the column back with new ENUM
    await queryInterface.addColumn('daily_content', 'contentType', {
      type: Sequelize.ENUM(
        'scripture_reading',
        'hymn',
        'prayer',
        'guided_prayer',
        'journaling_prompt',
        'reflection',
        'artwork',
        'video',
        'creed',
        'reading',
        'music',
        'question'
      ),
      allowNull: false,
      defaultValue: 'scripture_reading'
    });
    
    // Re-create the unique index
    await queryInterface.addIndex('daily_content', {
      fields: ['date', 'contentType'],
      unique: true,
      name: 'daily_content_date_contentType_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the index
    await queryInterface.removeIndex('daily_content', 'daily_content_date_contentType_unique');
    
    // Drop the column
    await queryInterface.removeColumn('daily_content', 'contentType');
    
    // Drop the new ENUM type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_daily_content_contentType_new";
    `);
    
    // Add back the old column with old ENUM
    await queryInterface.addColumn('daily_content', 'contentType', {
      type: Sequelize.ENUM('reading', 'prayer', 'music', 'question'),
      allowNull: false,
      defaultValue: 'reading'
    });
    
    // Re-create the unique index
    await queryInterface.addIndex('daily_content', {
      fields: ['date', 'contentType'],
      unique: true
    });
  }
};