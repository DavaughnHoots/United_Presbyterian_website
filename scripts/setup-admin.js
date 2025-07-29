const { User } = require('../src/models');

async function setupAdmin() {
  try {
    // Find davaughnhoots@upc.com
    const user = await User.findOne({
      where: { email: 'davaughnhoots@upc.com' }
    });

    if (!user) {
      console.log('User davaughnhoots@upc.com not found');
      return;
    }

    console.log('User found:', {
      email: user.email,
      isAdmin: user.isAdmin,
      hasPassword: !!user.password
    });

    // Make sure user is admin
    if (!user.isAdmin) {
      user.isAdmin = true;
      await user.save();
      console.log('User has been made an admin');
    } else {
      console.log('User is already an admin');
    }

    // Check password status
    if (!user.password) {
      console.log('Admin does not have a password set - they will need to set one on next login');
    } else {
      console.log('Admin already has a password set');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close database connection
    const { sequelize } = require('../src/models');
    await sequelize.close();
  }
}

setupAdmin();