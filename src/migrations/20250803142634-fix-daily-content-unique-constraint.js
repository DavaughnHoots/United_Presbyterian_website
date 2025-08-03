'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // Drop the single-column unique constraint on date
    await queryInterface.removeConstraint('daily_content', 'daily_content_date_key');
    
    // The compound index on (date, contentType) should already exist from the model definition
    // But let's make sure it exists
    const indexes = await queryInterface.showIndex('daily_content');
    const hasCompoundIndex = indexes.some(index => 
      index.fields && 
      index.fields.length === 2 && 
      index.fields.some(f => f.attribute === 'date') &&
      index.fields.some(f => f.attribute === 'contentType') &&
      index.unique
    );
    
    if (!hasCompoundIndex) {
      await queryInterface.addIndex('daily_content', {
        fields: ['date', 'contentType'],
        unique: true,
        name: 'daily_content_date_contentType_unique'
      });
    }
  },

  async down (queryInterface, Sequelize) {
    // Re-add the single-column unique constraint
    await queryInterface.addConstraint('daily_content', {
      fields: ['date'],
      type: 'unique',
      name: 'daily_content_date_key'
    });
  }
};