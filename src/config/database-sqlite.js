// Alternative database configuration for SQLite (testing only)
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    // SQLite doesn't support JSONB, so we'll use JSON
    hooks: {
      beforeCreate: (instance) => {
        // Convert JSONB fields to JSON strings
        if (instance.preferences) {
          instance.preferences = JSON.stringify(instance.preferences);
        }
        if (instance.metadata) {
          instance.metadata = JSON.stringify(instance.metadata);
        }
      },
      beforeUpdate: (instance) => {
        // Convert JSONB fields to JSON strings
        if (instance.preferences) {
          instance.preferences = JSON.stringify(instance.preferences);
        }
        if (instance.metadata) {
          instance.metadata = JSON.stringify(instance.metadata);
        }
      },
      afterFind: (instances) => {
        // Parse JSON strings back to objects
        if (!instances) return;
        
        const parseJsonFields = (instance) => {
          if (instance.preferences && typeof instance.preferences === 'string') {
            instance.preferences = JSON.parse(instance.preferences);
          }
          if (instance.metadata && typeof instance.metadata === 'string') {
            instance.metadata = JSON.parse(instance.metadata);
          }
        };
        
        if (Array.isArray(instances)) {
          instances.forEach(parseJsonFields);
        } else {
          parseJsonFields(instances);
        }
      }
    }
  }
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = { sequelize, testConnection };