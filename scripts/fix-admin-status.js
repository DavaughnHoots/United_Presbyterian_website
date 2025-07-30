require('dotenv').config();
const { User } = require('../src/models');

async function fixAdminStatus() {
  try {
    console.log('Checking admin status for davaughnhoots@upc.com...');
    
    const user = await User.findOne({
      where: { email: 'davaughnhoots@upc.com' }
    });
    
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    console.log('Current admin status:', user.isAdmin);
    console.log('User ID:', user.id);
    
    if (!user.isAdmin) {
      console.log('Setting admin status to true...');
      await user.update({ isAdmin: true });
      console.log('Admin status updated successfully!');
    } else {
      console.log('User is already an admin');
    }
    
    // Verify the update
    const updatedUser = await User.findByPk(user.id);
    console.log('Verified admin status:', updatedUser.isAdmin);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

fixAdminStatus();