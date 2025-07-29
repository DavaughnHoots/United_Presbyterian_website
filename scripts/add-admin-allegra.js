const { User } = require('../src/models');

async function addAdminUser() {
  try {
    // Check if user already exists
    let user = await User.findOne({ 
      where: { email: 'allegrahoots@upc.com' } 
    });
    
    if (!user) {
      // Create new admin user
      user = await User.create({
        email: 'allegrahoots@upc.com',
        firstName: 'Allegra',
        lastName: 'Hoots',
        isAdmin: true,
        isActive: true,
        currentStreak: 0,
        longestStreak: 0
      });
      console.log('✅ Admin user allegrahoots@upc.com created successfully');
    } else {
      // Update existing user to admin
      await user.update({ isAdmin: true });
      console.log('✅ User allegrahoots@upc.com elevated to admin');
    }
    
    console.log('Admin status:', user.isAdmin);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addAdminUser();