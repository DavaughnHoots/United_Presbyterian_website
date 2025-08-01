const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { sequelize } = require('../src/config/database');

// Bible data directory
const BIBLE_DATA_DIR = path.join(__dirname, '../bible_dataset');

// Import Bible books
async function importBibleBooks() {
  console.log('Importing Bible books...');
  
  const books = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(BIBLE_DATA_DIR, 'key_english.csv'))
      .pipe(parse({ columns: true }))
      .on('data', (row) => {
        books.push({
          id: parseInt(row.b),
          name: row.n,
          testament: row.t,
          genre: parseInt(row.g) || null
        });
      })
      .on('end', async () => {
        try {
          // Insert books
          for (const book of books) {
            await sequelize.query(
              `INSERT INTO bible_books (id, name, testament, genre, "createdAt", "updatedAt") 
               VALUES (:id, :name, :testament, :genre, NOW(), NOW())
               ON CONFLICT (id) DO NOTHING`,
              {
                replacements: book,
                type: sequelize.QueryTypes.INSERT
              }
            );
          }
          console.log(`Imported ${books.length} Bible books`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

// Import Bible verses for a specific translation
async function importBibleVerses(translation = 'kjv') {
  console.log(`Importing Bible verses (${translation.toUpperCase()})...`);
  
  const filename = `t_${translation}.csv`;
  const filepath = path.join(BIBLE_DATA_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    throw new Error(`Bible translation file not found: ${filename}`);
  }
  
  let count = 0;
  const batchSize = 1000;
  let batch = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filepath)
      .pipe(parse({ columns: true }))
      .on('data', async (row) => {
        batch.push({
          id: parseInt(row.id),
          book_id: parseInt(row.b),
          chapter: parseInt(row.c),
          verse: parseInt(row.v),
          text: row.t,
          translation: translation.toUpperCase()
        });
        
        // Process in batches
        if (batch.length >= batchSize) {
          const currentBatch = [...batch];
          batch = [];
          
          try {
            await insertVerseBatch(currentBatch);
            count += currentBatch.length;
            if (count % 10000 === 0) {
              console.log(`  Processed ${count} verses...`);
            }
          } catch (error) {
            console.error('Error inserting batch:', error);
          }
        }
      })
      .on('end', async () => {
        // Process remaining verses
        if (batch.length > 0) {
          try {
            await insertVerseBatch(batch);
            count += batch.length;
          } catch (error) {
            console.error('Error inserting final batch:', error);
          }
        }
        console.log(`Imported ${count} Bible verses`);
        resolve();
      })
      .on('error', reject);
  });
}

// Insert a batch of verses
async function insertVerseBatch(verses) {
  const values = verses.map(v => 
    `(${v.id}, ${v.book_id}, ${v.chapter}, ${v.verse}, '${v.text.replace(/'/g, "''")}', '${v.translation}', NOW(), NOW())`
  ).join(',');
  
  await sequelize.query(
    `INSERT INTO bible_verses (id, book_id, chapter, verse, text, translation, "createdAt", "updatedAt") 
     VALUES ${values}
     ON CONFLICT (id) DO NOTHING`,
    { type: sequelize.QueryTypes.INSERT }
  );
}

// Main import function
async function importBibleData() {
  try {
    console.log('Starting Bible data import...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Import books first
    await importBibleBooks();
    
    // Import verses (KJV by default)
    await importBibleVerses('kjv');
    
    console.log('Bible data import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error importing Bible data:', error);
    process.exit(1);
  }
}

// Check if csv-parser is installed
try {
  require.resolve('csv-parser');
} catch (e) {
  console.error('csv-parser package not found. Installing...');
  const { execSync } = require('child_process');
  execSync('npm install csv-parser', { stdio: 'inherit' });
}

// Run the import
importBibleData();