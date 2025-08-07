#!/usr/bin/env node

// Script to import Bible verses on Heroku
// Run with: heroku run node src/scripts/importBibleVersesHeroku.js

const { sequelize } = require('../config/database');
const { SentimentAnnotation } = require('../models');
const fs = require('fs');
const path = require('path');

async function importVerses() {
  try {
    console.log('Starting Bible verse import on Heroku...');
    
    // Try to load the JSON file if it exists
    let sampleVerses;
    const jsonPath = path.join(__dirname, 'bibleSampleData.json');
    
    if (fs.existsSync(jsonPath)) {
      console.log('Loading verses from bibleSampleData.json...');
      sampleVerses = require('./bibleSampleData.json');
    } else {
      console.log('bibleSampleData.json not found, using minimal sample data...');
      // Fallback to minimal data if JSON file doesn't exist
      sampleVerses = [
        { sample_id: 1, book_name: "Genesis", chapter: 1, verse: 1, text: "In the beginning God created the heaven and the earth.", genre_name: "Law", sentiment: null, annotator_id: null, annotated_at: null, notes: null },
        { sample_id: 2, book_name: "Psalms", chapter: 23, verse: 1, text: "The LORD is my shepherd; I shall not want.", genre_name: "Wisdom", sentiment: null, annotator_id: null, annotated_at: null, notes: null },
        { sample_id: 3, book_name: "John", chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.", genre_name: "Gospels", sentiment: null, annotator_id: null, annotated_at: null, notes: null }
      ];
    }
    
    // Clear existing data
    console.log('Clearing existing sentiment annotations...');
    await SentimentAnnotation.destroy({ where: {} });
    
    // Bulk insert
    console.log(`Inserting ${sampleVerses.length} verses into database...`);
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