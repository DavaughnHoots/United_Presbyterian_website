#!/usr/bin/env node

// Script to import Bible verses on Heroku
// Run with: heroku run node src/scripts/importBibleVersesHeroku.js

const { sequelize } = require('../config/database');
const { SentimentAnnotation } = require('../models');

// Inline data - sampling verses from different books and genres
// This is a curated selection of 1000 verses from the KJV Bible
async function importVerses() {
  try {
    console.log('Starting Bible verse import on Heroku...');
    
    // Sample verses data (we'll generate this from the CSV files)
    const sampleVerses = require('./bibleSampleData.json');
    
    // Clear existing data
    console.log('Clearing existing sentiment annotations...');
    await SentimentAnnotation.destroy({ where: {} });
    
    // Bulk insert
    console.log('Inserting verses into database...');
    await SentimentAnnotation.bulkCreate(sampleVerses, {
      logging: false // Reduce console spam
    });
    
    console.log(`Successfully imported ${sampleVerses.length} verses!`);
    
    // Show sample statistics
    const genreCount = {};
    sampleVerses.forEach(verse => {
      genreCount[verse.genre_name] = (genreCount[verse.genre_name] || 0) + 1;
    });
    
    console.log('\nDistribution by genre:');
    Object.entries(genreCount).forEach(([genre, count]) => {
      console.log(`  ${genre}: ${count} verses`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error importing verses:', error);
    process.exit(1);
  }
}

// Run import
importVerses();