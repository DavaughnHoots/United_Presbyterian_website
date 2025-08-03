'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // First, let's check what state we're in
      const tableInfo = await queryInterface.describeTable('daily_content');
      console.log('Current table structure:', Object.keys(tableInfo));
      
      // Check if contentType column exists
      if (!tableInfo.contentType) {
        console.log('contentType column does not exist');
        
        // Drop the existing ENUM type if it exists
        await queryInterface.sequelize.query(`
          DROP TYPE IF EXISTS "enum_daily_content_contentType" CASCADE;
        `).catch(err => console.log('No existing enum to drop'));
        
        // Create the ENUM with all values
        await queryInterface.sequelize.query(`
          CREATE TYPE "enum_daily_content_contentType" AS ENUM (
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
        
        // Add the column
        await queryInterface.addColumn('daily_content', 'contentType', {
          type: 'enum_daily_content_contentType',
          allowNull: false,
          defaultValue: 'prayer'
        });
      } else {
        console.log('contentType column already exists - migration already complete');
      }
      
      // Ensure the unique index exists
      const indexes = await queryInterface.showIndex('daily_content');
      const hasIndex = indexes.some(idx => 
        idx.fields.includes('date') && idx.fields.includes('contentType')
      );
      
      if (!hasIndex) {
        // Remove any existing index on date alone
        await queryInterface.removeIndex('daily_content', ['date']).catch(() => {});
        
        // Add composite unique index
        await queryInterface.addIndex('daily_content', {
          fields: ['date', 'contentType'],
          unique: true,
          name: 'daily_content_date_contentType_idx'
        });
      }
      
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the column
    await queryInterface.removeColumn('daily_content', 'contentType');
    
    // Drop the enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_daily_content_contentType";
    `);
  }
};