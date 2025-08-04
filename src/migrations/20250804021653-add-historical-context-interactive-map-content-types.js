'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, let's check if the types already exist to avoid errors
    const result = await queryInterface.sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_content_type)) AS existing_value
    `, { type: queryInterface.sequelize.QueryTypes.SELECT })
    .catch(() => []);
    
    const existingValues = result.map(r => r.existing_value);
    const hasHistoricalContext = existingValues.includes('historical_context');
    const hasInteractiveMap = existingValues.includes('interactive_map');
    
    if (!hasHistoricalContext || !hasInteractiveMap) {
      // Add new values to content type enum
      await queryInterface.sequelize.query(`
        ALTER TYPE enum_content_type ADD VALUE IF NOT EXISTS 'historical_context';
        ALTER TYPE enum_content_type ADD VALUE IF NOT EXISTS 'interactive_map';
      `);
    }
    
    // Check daily_content enum
    const dailyResult = await queryInterface.sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_daily_content_contenttype)) AS existing_value
    `, { type: queryInterface.sequelize.QueryTypes.SELECT })
    .catch(() => []);
    
    const dailyExistingValues = dailyResult.map(r => r.existing_value);
    const dailyHasHistoricalContext = dailyExistingValues.includes('historical_context');
    const dailyHasInteractiveMap = dailyExistingValues.includes('interactive_map');
    
    if (!dailyHasHistoricalContext || !dailyHasInteractiveMap) {
      // Add new values to daily_content contentType enum
      await queryInterface.sequelize.query(`
        ALTER TYPE enum_daily_content_contenttype ADD VALUE IF NOT EXISTS 'historical_context';
        ALTER TYPE enum_daily_content_contenttype ADD VALUE IF NOT EXISTS 'interactive_map';
      `);
    }
    
    // Add map_url column to content table if it doesn't exist
    const tableDescription = await queryInterface.describeTable('content');
    if (!tableDescription.map_url) {
      await queryInterface.addColumn('content', 'map_url', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This would require recreating the enum types
    console.log('Removing enum values requires recreating the types - skipping for safety');
    
    // Remove map_url column
    const tableDescription = await queryInterface.describeTable('content');
    if (tableDescription.map_url) {
      await queryInterface.removeColumn('content', 'map_url');
    }
  }
};