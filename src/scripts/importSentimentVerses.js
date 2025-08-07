const fs = require('fs');
const path = require('path');
const csv = require('csv-parse');
const { SentimentAnnotation } = require('../models');

async function importVerses() {
  const csvPath = '/mnt/c/Users/Owner/Documents/Research/KJVB_sentiment_analysis/data/annotations/verses_for_annotation.csv';
  
  console.log('Starting verse import from:', csvPath);
  
  try {
    // Read and parse CSV
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = await new Promise((resolve, reject) => {
      csv.parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      }, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });
    
    console.log(`Found ${records.length} verses to import`);
    
    // Import verses in batches
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, Math.min(i + batchSize, records.length));
      
      const verses = batch.map(record => ({
        sampleId: parseInt(record.sample_id),
        bookName: record.book_name,
        chapter: parseInt(record.chapter),
        verse: parseInt(record.verse),
        text: record.text,
        genreName: record.genre_name,
        sentiment: record.annotator_1 || null,
        annotatorId: null,
        annotatedAt: record.annotator_1 ? new Date() : null,
        notes: record.notes || null
      }));
      
      await SentimentAnnotation.bulkCreate(verses, {
        updateOnDuplicate: ['sentiment', 'annotatorId', 'annotatedAt', 'notes']
      });
      
      console.log(`Imported batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)}`);
    }
    
    console.log('Import complete!');
    const count = await SentimentAnnotation.count();
    console.log(`Total verses in database: ${count}`);
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  importVerses().then(() => {
    process.exit(0);
  });
}

module.exports = { importVerses };