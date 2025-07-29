'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Adding missing date fields to submissions...');
    
    try {
      // Only add approvedAt and rejectedAt which seem to be missing
      const columnsToAdd = [
        { name: 'approvedAt', definition: { type: Sequelize.DATE, allowNull: true } },
        { name: 'rejectedAt', definition: { type: Sequelize.DATE, allowNull: true } }
      ];
      
      for (const column of columnsToAdd) {
        try {
          console.log(`Adding column: ${column.name}`);
          await queryInterface.addColumn('submissions', column.name, column.definition);
          console.log(`Successfully added column: ${column.name}`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`Column ${column.name} already exists, skipping...`);
          } else {
            throw error;
          }
        }
      }
      
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const columnsToRemove = ['approvedAt', 'rejectedAt'];
    
    for (const columnName of columnsToRemove) {
      try {
        await queryInterface.removeColumn('submissions', columnName);
      } catch (error) {
        console.log(`Column ${columnName} might not exist, continuing...`);
      }
    }
  }
};