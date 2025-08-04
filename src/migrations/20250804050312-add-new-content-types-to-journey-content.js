'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check what enum types exist for journey_content
    const enumTypes = await queryInterface.sequelize.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typcategory = 'E' AND typname LIKE '%journey_content%'
    `, { type: queryInterface.sequelize.QueryTypes.SELECT });
    
    console.log('Found journey_content enum types:', enumTypes.map(t => t.typname));
    
    // Try different possible enum names
    const possibleEnumNames = [
      'enum_journey_content_content_type',
      'enum_journey_content_contentType',
      'enum_journey_content_contenttype'
    ];
    
    for (const enumName of possibleEnumNames) {
      try {
        // Check if this enum exists and what values it has
        const result = await queryInterface.sequelize.query(`
          SELECT unnest(enum_range(NULL::${enumName})) AS existing_value
        `, { type: queryInterface.sequelize.QueryTypes.SELECT });
        
        const existingValues = result.map(r => r.existing_value);
        console.log(`Found values in ${enumName}:`, existingValues);
        
        const hasHistoricalContext = existingValues.includes('historical_context');
        const hasInteractiveMap = existingValues.includes('interactive_map');
        
        if (!hasHistoricalContext || !hasInteractiveMap) {
          // Add new values to journey_content content_type enum
          if (!hasHistoricalContext) {
            await queryInterface.sequelize.query(`
              ALTER TYPE ${enumName} ADD VALUE IF NOT EXISTS 'historical_context';
            `);
          }
          if (!hasInteractiveMap) {
            await queryInterface.sequelize.query(`
              ALTER TYPE ${enumName} ADD VALUE IF NOT EXISTS 'interactive_map';
            `);
          }
          console.log(`Successfully updated ${enumName}`);
        } else {
          console.log(`${enumName} already has the new values`);
        }
        break; // If successful, don't try other names
      } catch (error) {
        console.log(`Could not update ${enumName}:`, error.message);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This would require recreating the enum types
    console.log('Removing enum values requires recreating the types - skipping for safety');
  }
};
