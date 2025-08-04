'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, let's check what enum types exist
    const enumTypes = await queryInterface.sequelize.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typcategory = 'E'
    `, { type: queryInterface.sequelize.QueryTypes.SELECT });
    
    console.log('Found enum types:', enumTypes.map(t => t.typname));
    
    // Handle content table enum
    try {
      const result = await queryInterface.sequelize.query(`
        SELECT unnest(enum_range(NULL::enum_content_type)) AS existing_value
      `, { type: queryInterface.sequelize.QueryTypes.SELECT });
      
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
    } catch (error) {
      console.log('Could not update enum_content_type:', error.message);
    }
    
    // Check for daily_content enum - try different possible names
    const possibleEnumNames = [
      'enum_daily_content_contenttype',
      'enum_daily_content_contentType',
      'enum_daily_content_content_type'
    ];
    
    for (const enumName of possibleEnumNames) {
      try {
        const dailyResult = await queryInterface.sequelize.query(`
          SELECT unnest(enum_range(NULL::${enumName})) AS existing_value
        `, { type: queryInterface.sequelize.QueryTypes.SELECT });
        
        const dailyExistingValues = dailyResult.map(r => r.existing_value);
        const dailyHasHistoricalContext = dailyExistingValues.includes('historical_context');
        const dailyHasInteractiveMap = dailyExistingValues.includes('interactive_map');
        
        if (!dailyHasHistoricalContext || !dailyHasInteractiveMap) {
          // Add new values to daily_content contentType enum
          await queryInterface.sequelize.query(`
            ALTER TYPE ${enumName} ADD VALUE IF NOT EXISTS 'historical_context';
            ALTER TYPE ${enumName} ADD VALUE IF NOT EXISTS 'interactive_map';
          `);
        }
        console.log(`Successfully updated ${enumName}`);
        break; // If successful, don't try other names
      } catch (error) {
        console.log(`Could not update ${enumName}:`, error.message);
      }
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