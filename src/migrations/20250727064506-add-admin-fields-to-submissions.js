'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Get current table structure
      const tableDescription = await queryInterface.describeTable('submissions');
      
      // Add approvedBy column if it doesn't exist
      if (!tableDescription.approvedBy) {
        await queryInterface.addColumn('submissions', 'approvedBy', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
        }, { transaction });
      }
      
      // Add rejectedBy column if it doesn't exist
      if (!tableDescription.rejectedBy) {
        await queryInterface.addColumn('submissions', 'rejectedBy', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
        }, { transaction });
      }
      
      // Add rejectionReason column if it doesn't exist
      if (!tableDescription.rejectionReason) {
        await queryInterface.addColumn('submissions', 'rejectionReason', {
          type: Sequelize.TEXT,
          allowNull: true
        }, { transaction });
      }
      
      // Add ipHash column if it doesn't exist
      if (!tableDescription.ipHash) {
        await queryInterface.addColumn('submissions', 'ipHash', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Hashed IP address for rate limiting'
        }, { transaction });
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.removeColumn('submissions', 'approvedBy', { transaction });
      await queryInterface.removeColumn('submissions', 'rejectedBy', { transaction });
      await queryInterface.removeColumn('submissions', 'rejectionReason', { transaction });
      await queryInterface.removeColumn('submissions', 'ipHash', { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};