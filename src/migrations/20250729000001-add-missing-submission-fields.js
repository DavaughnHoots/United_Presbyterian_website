'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Adding missing submission fields...');
    
    try {
      // Get current columns
      const tableInfo = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = 'submissions'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      const existingColumns = tableInfo.map(row => row.column_name);
      console.log('Existing columns:', existingColumns);
      
      // Define all columns that should exist
      const columnsToAdd = [
        { name: 'contentHash', definition: { type: Sequelize.STRING, allowNull: false, defaultValue: '' } },
        { name: 'moderatorNotes', definition: { type: Sequelize.TEXT, allowNull: true } },
        { name: 'moderatedBy', definition: { type: Sequelize.UUID, allowNull: true } },
        { name: 'moderatedAt', definition: { type: Sequelize.DATE, allowNull: true } },
        { name: 'approvedAt', definition: { type: Sequelize.DATE, allowNull: true } },
        { name: 'approvedBy', definition: { type: Sequelize.UUID, allowNull: true } },
        { name: 'rejectedAt', definition: { type: Sequelize.DATE, allowNull: true } },
        { name: 'rejectedBy', definition: { type: Sequelize.UUID, allowNull: true } },
        { name: 'rejectionReason', definition: { type: Sequelize.TEXT, allowNull: true } },
        { name: 'ipHash', definition: { type: Sequelize.STRING, allowNull: true } },
        { name: 'flags', definition: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] } },
        { name: 'metadata', definition: { type: Sequelize.JSONB, defaultValue: {} } }
      ];
      
      // Add missing columns
      for (const column of columnsToAdd) {
        if (!existingColumns.includes(column.name.toLowerCase())) {
          console.log(`Adding column: ${column.name}`);
          await queryInterface.addColumn('submissions', column.name, column.definition);
        } else {
          console.log(`Column ${column.name} already exists, skipping...`);
        }
      }
      
      // Add indexes if they don't exist
      const indexes = ['type', 'status', 'contentHash'];
      for (const field of indexes) {
        try {
          await queryInterface.addIndex('submissions', [field]);
        } catch (error) {
          console.log(`Index on ${field} might already exist, continuing...`);
        }
      }
      
      // Update existing records to have contentHash if missing
      await queryInterface.sequelize.query(`
        UPDATE submissions 
        SET "contentHash" = encode(digest(LOWER(TRIM(content)), 'sha256'), 'hex')
        WHERE "contentHash" = '' OR "contentHash" IS NULL
      `);
      
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns if they exist
    const columnsToRemove = [
      'contentHash', 'moderatorNotes', 'moderatedBy', 'moderatedAt',
      'approvedAt', 'approvedBy', 'rejectedAt', 'rejectedBy',
      'rejectionReason', 'ipHash', 'flags', 'metadata'
    ];
    
    for (const columnName of columnsToRemove) {
      try {
        await queryInterface.removeColumn('submissions', columnName);
      } catch (error) {
        console.log(`Column ${columnName} might not exist, continuing...`);
      }
    }
  }
};