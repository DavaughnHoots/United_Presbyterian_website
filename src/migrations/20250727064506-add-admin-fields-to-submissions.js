'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Checking submissions table structure...');
    
    try {
      // Get current columns
      const tableInfo = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = 'submissions'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      const existingColumns = tableInfo.map(row => row.column_name);
      console.log('Existing columns:', existingColumns);
      
      // Define columns to add
      const columnsToAdd = [
        { name: 'approvedBy', definition: { type: Sequelize.UUID, allowNull: true } },
        { name: 'rejectedBy', definition: { type: Sequelize.UUID, allowNull: true } },
        { name: 'rejectionReason', definition: { type: Sequelize.TEXT, allowNull: true } },
        { name: 'ipHash', definition: { type: Sequelize.STRING, allowNull: true } }
      ];
      
      // Add missing columns
      for (const column of columnsToAdd) {
        if (!existingColumns.includes(column.name)) {
          console.log(`Adding column: ${column.name}`);
          await queryInterface.addColumn('submissions', column.name, column.definition);
        } else {
          console.log(`Column ${column.name} already exists, skipping...`);
        }
      }
      
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns if they exist
    const columnsToRemove = ['approvedBy', 'rejectedBy', 'rejectionReason', 'ipHash'];
    
    for (const columnName of columnsToRemove) {
      try {
        await queryInterface.removeColumn('submissions', columnName);
      } catch (error) {
        console.log(`Column ${columnName} might not exist, continuing...`);
      }
    }
  }
};