#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { sequelize } = require('../config/database');
const { SentimentAnnotation } = require('../models');

async function loadCSV(filePath) {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function importVerses() {
  try {
    console.log('Starting Bible verse import...');
    
    // Load reference data
    const booksData = await loadCSV(path.join(__dirname, '../../bible_dataset/key_english.csv'));
    const genresData = await loadCSV(path.join(__dirname, '../../bible_dataset/key_genre_english.csv'));
    const versesData = await loadCSV(path.join(__dirname, '../../bible_dataset/t_kjv.csv'));
    
    // Create lookup maps
    const booksMap = {};
    booksData.forEach(book => {
      booksMap[book.b] = {
        name: book.n,
        genreId: book.g
      };
    });
    
    const genresMap = {};
    genresData.forEach(genre => {
      genresMap[genre.g] = genre.n;
    });
    
    console.log(`Loaded ${versesData.length} total verses`);
    console.log(`Loaded ${Object.keys(booksMap).length} books`);
    console.log(`Loaded ${Object.keys(genresMap).length} genres`);
    
    // Filter verses to get a diverse sample
    // Get verses from different books and genres
    const sampleSize = 1000;
    const selectedVerses = [];
    const versesPerBook = Math.ceil(sampleSize / Object.keys(booksMap).length);
    
    // Group verses by book
    const versesByBook = {};
    versesData.forEach(verse => {
      if (!versesByBook[verse.b]) {
        versesByBook[verse.b] = [];
      }
      versesByBook[verse.b].push(verse);
    });
    
    // Select verses from each book
    Object.keys(versesByBook).forEach(bookId => {
      const bookVerses = versesByBook[bookId];
      const numToSelect = Math.min(versesPerBook, bookVerses.length);
      
      // Random selection from each book
      const shuffled = bookVerses.sort(() => 0.5 - Math.random());
      selectedVerses.push(...shuffled.slice(0, numToSelect));
      
      if (selectedVerses.length >= sampleSize) {
        return;
      }
    });
    
    // Trim to exact sample size
    const finalSample = selectedVerses.slice(0, sampleSize);
    console.log(`Selected ${finalSample.length} verses for annotation`);
    
    // Clear existing data
    console.log('Clearing existing sentiment annotations...');
    await SentimentAnnotation.destroy({ where: {} });
    
    // Prepare data for bulk insert
    const annotationsData = finalSample.map((verse, index) => {
      const book = booksMap[verse.b];
      const genreName = genresMap[book.genreId];
      
      return {
        sampleId: index + 1,
        bookName: book.name,
        chapter: parseInt(verse.c),
        verse: parseInt(verse.v),
        text: verse.t,
        genreName: genreName,
        sentiment: null,
        annotatorId: null,
        annotatedAt: null,
        notes: null
      };
    });
    
    // Bulk insert
    console.log('Inserting verses into database...');
    await SentimentAnnotation.bulkCreate(annotationsData, {
      logging: false // Reduce console spam
    });
    
    console.log(`Successfully imported ${annotationsData.length} verses!`);
    
    // Show sample statistics
    const genreCount = {};
    annotationsData.forEach(verse => {
      genreCount[verse.genreName] = (genreCount[verse.genreName] || 0) + 1;
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