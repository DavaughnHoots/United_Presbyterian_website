'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new fields to users table
    await queryInterface.addColumn('users', 'requirePassword', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether user must enter password to login'
    });
    
    await queryInterface.addColumn('users', 'deletionRequestedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when user requested account deletion'
    });
    
    await queryInterface.addColumn('users', 'deletionReason', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Optional reason provided for account deletion'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'requirePassword');
    await queryInterface.removeColumn('users', 'deletionRequestedAt');
    await queryInterface.removeColumn('users', 'deletionReason');
  }
};