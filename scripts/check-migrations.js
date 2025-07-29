const { sequelize } = require('../src/config/database');

async function checkMigrations() {
  try {
    // Check if SequelizeMeta table exists and what migrations are recorded
    const [results] = await sequelize.query(`
      SELECT * FROM "SequelizeMeta" ORDER BY name;
    `);
    
    console.log('Executed migrations:');
    results.forEach(row => {
      console.log(`- ${row.name}`);
    });
    
    // Check if the events table has the required columns
    const [eventColumns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'events' 
      ORDER BY column_name;
    `);
    
    console.log('\nEvent table columns:');
    eventColumns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
    // Check for startTime column specifically
    const hasStartTime = eventColumns.some(col => col.column_name === 'startTime');
    console.log(`\nHas startTime column: ${hasStartTime}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMigrations();