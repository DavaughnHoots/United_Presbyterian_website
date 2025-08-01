'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Migrate all prayers to content table
    await queryInterface.sequelize.query(`
      INSERT INTO content (
        id,
        type,
        title,
        content,
        theme,
        tags,
        "usageCount",
        "isActive",
        metadata,
        duration_minutes,
        "createdAt",
        "updatedAt"
      )
      SELECT 
        id,
        CASE 
          WHEN category IN ('guided_prayer') THEN 'guided_prayer'::enum_content_type
          ELSE 'prayer'::enum_content_type
        END,
        title,
        content,
        category::text as theme,
        tags,
        usage_count as "usageCount",
        is_active as "isActive",
        jsonb_build_object(
          'author', author,
          'category', category,
          'created_by', created_by,
          'migrated_from', 'prayers_table'
        ) as metadata,
        CASE 
          WHEN category = 'guided_prayer' THEN 10
          ELSE 3
        END as duration_minutes,
        "createdAt",
        "updatedAt"
      FROM prayers
      WHERE NOT EXISTS (
        SELECT 1 FROM content c WHERE c.id = prayers.id
      );
    `);

    // Add index on metadata for migrated prayers
    await queryInterface.addIndex('content', ['metadata'], {
      name: 'content_metadata_migrated_prayers_idx',
      where: {
        metadata: {
          migrated_from: 'prayers_table'
        }
      },
      using: 'GIN'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove migrated prayers from content table
    await queryInterface.sequelize.query(`
      DELETE FROM content 
      WHERE metadata->>'migrated_from' = 'prayers_table';
    `);

    // Remove the index
    await queryInterface.removeIndex('content', 'content_metadata_migrated_prayers_idx');
  }
};