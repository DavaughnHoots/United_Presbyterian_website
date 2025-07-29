const { sequelize } = require('../src/models');

async function checkSubmissionsTable() {
  try {
    // Get all columns in submissions table
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'submissions'
      ORDER BY ordinal_position
    `);
    
    console.log('Submissions table columns:');
    console.log('========================');
    columns.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check which expected columns are missing
    const expectedColumns = [
      'id', 'type', 'content', 'status', 'contentHash', 
      'moderatorNotes', 'moderatedBy', 'moderatedAt',
      'approvedAt', 'approvedBy', 'rejectedAt', 'rejectedBy',
      'rejectionReason', 'ipHash', 'flags', 'metadata',
      'createdAt', 'updatedAt'
    ];
    
    const existingColumns = columns.map(c => c.column_name);
    const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('\nMissing columns:');
      console.log('================');
      missingColumns.forEach(col => console.log(`- ${col}`));
    } else {
      console.log('\nAll expected columns exist!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkSubmissionsTable();