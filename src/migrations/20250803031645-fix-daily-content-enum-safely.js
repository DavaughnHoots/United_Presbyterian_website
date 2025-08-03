'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First check if the contentType column exists and what type it has
    const tableInfo = await queryInterface.describeTable('daily_content');
    
    if (!tableInfo.contentType) {
      console.log('contentType column does not exist, creating it...');
      
      // Create new ENUM type if it doesn't exist
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
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
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      
      // Add the column
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
    } else {
      console.log('contentType column exists, checking if update needed...');
      
      // Check current enum values
      const result = await queryInterface.sequelize.query(`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid FROM pg_type WHERE typname = 'enum_daily_content_contentType'
        )
      `);
      
      const currentValues = result[0].map(row => row.enumlabel);
      const requiredValues = [
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
      ];
      
      const missingValues = requiredValues.filter(val => !currentValues.includes(val));
      
      if (missingValues.length > 0) {
        console.log('Adding missing enum values:', missingValues);
        
        // Temporarily remove the constraint
        await queryInterface.sequelize.query(`
          ALTER TABLE daily_content 
          ALTER COLUMN "contentType" DROP DEFAULT;
        `);
        
        // Save existing data
        const existingData = await queryInterface.sequelize.query(
          'SELECT * FROM daily_content',
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        
        // Drop the column
        await queryInterface.removeColumn('daily_content', 'contentType');
        
        // Drop the old enum type
        await queryInterface.sequelize.query(`
          DROP TYPE IF EXISTS "enum_daily_content_contentType";
        `);
        
        // Create new enum type
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
        
        // Add the column back
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
        
        // Restore data with type mapping
        for (const row of existingData) {
          let contentType = row.contentType;
          
          // Map old types to new types
          if (contentType === 'reading') {
            contentType = 'scripture_reading';
          } else if (contentType === 'music') {
            contentType = 'hymn';
          } else if (contentType === 'question') {
            contentType = 'journaling_prompt';
          }
          
          await queryInterface.sequelize.query(
            `UPDATE daily_content 
             SET "contentType" = :contentType 
             WHERE id = :id`,
            {
              replacements: {
                contentType,
                id: row.id
              }
            }
          );
        }
      } else {
        console.log('All required enum values already exist');
      }
    }
    
    // Ensure the unique index exists
    const indexes = await queryInterface.showIndex('daily_content');
    const hasUniqueIndex = indexes.some(idx => 
      idx.name === 'daily_content_date_contentType_unique' || 
      (idx.unique && idx.fields.includes('date') && idx.fields.includes('contentType'))
    );
    
    if (!hasUniqueIndex) {
      await queryInterface.addIndex('daily_content', {
        fields: ['date', 'contentType'],
        unique: true,
        name: 'daily_content_date_contentType_unique'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This is a fix migration, so we don't need to implement down
    console.log('This is a fix migration - down migration not implemented');
  }
};