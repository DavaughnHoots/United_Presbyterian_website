'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update existing content types to new unified types
    await queryInterface.sequelize.query(`
      UPDATE content 
      SET type = CASE 
        WHEN type = 'reading' THEN 'scripture_reading'::enum_content_type
        WHEN type = 'music' THEN 'hymn'::enum_content_type
        WHEN type = 'question' THEN 'journaling_prompt'::enum_content_type
        ELSE type
      END
      WHERE type IN ('reading', 'music', 'question');
    `);
    
    // Add metadata to track original type for backward compatibility
    await queryInterface.sequelize.query(`
      UPDATE content 
      SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{original_type}',
        to_jsonb(type::text)
      )
      WHERE type IN ('reading', 'music', 'question')
      AND NOT (metadata ? 'original_type');
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert content types back to legacy types
    await queryInterface.sequelize.query(`
      UPDATE content 
      SET type = CASE 
        WHEN type = 'scripture_reading' AND metadata->>'original_type' = 'reading' THEN 'reading'::enum_content_type
        WHEN type = 'hymn' AND metadata->>'original_type' = 'music' THEN 'music'::enum_content_type
        WHEN type = 'journaling_prompt' AND metadata->>'original_type' = 'question' THEN 'question'::enum_content_type
        ELSE type
      END
      WHERE metadata ? 'original_type';
    `);
    
    // Remove original_type from metadata
    await queryInterface.sequelize.query(`
      UPDATE content 
      SET metadata = metadata - 'original_type'
      WHERE metadata ? 'original_type';
    `);
  }
};