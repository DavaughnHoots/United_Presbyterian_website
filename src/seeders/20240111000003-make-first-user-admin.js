'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Find the first user and make them admin
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users ORDER BY "createdAt" ASC LIMIT 1',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    if (users.length > 0) {
      await queryInterface.bulkUpdate('users', 
        { isAdmin: true },
        { id: users[0].id }
      );
      
      console.log(`User ${users[0].id} has been made an admin`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove admin status from all users
    await queryInterface.bulkUpdate('users', 
      { isAdmin: false },
      {}
    );
  }
};