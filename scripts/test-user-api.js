const axios = require('axios');

async function testUserAPI() {
  const baseURL = 'https://upcp-ad5530d1035c.herokuapp.com';
  
  console.log('Testing User Management API Endpoints...\n');
  
  // Test toggle admin endpoint
  try {
    console.log('1. Testing toggle-admin endpoint:');
    const response = await axios.put(`${baseURL}/admin/api/users/test-id/toggle-admin`, {}, {
      headers: {
        'Cookie': 'connect.sid=YOUR_SESSION_ID_HERE'
      }
    });
    console.log('✓ Toggle admin endpoint exists');
  } catch (error) {
    if (error.response) {
      console.log(`✗ Toggle admin endpoint returned: ${error.response.status} - ${error.response.statusText}`);
      if (error.response.status === 401) {
        console.log('  (This is expected - requires admin authentication)');
      }
    } else {
      console.log('✗ Toggle admin endpoint error:', error.message);
    }
  }
  
  // Test toggle status endpoint
  try {
    console.log('\n2. Testing toggle-status endpoint:');
    const response = await axios.put(`${baseURL}/admin/api/users/test-id/toggle-status`, {}, {
      headers: {
        'Cookie': 'connect.sid=YOUR_SESSION_ID_HERE'
      }
    });
    console.log('✓ Toggle status endpoint exists');
  } catch (error) {
    if (error.response) {
      console.log(`✗ Toggle status endpoint returned: ${error.response.status} - ${error.response.statusText}`);
      if (error.response.status === 401) {
        console.log('  (This is expected - requires admin authentication)');
      }
    } else {
      console.log('✗ Toggle status endpoint error:', error.message);
    }
  }
  
  console.log('\nNote: 401 errors are expected since we\'re not providing valid admin session cookies.');
  console.log('The important thing is that the endpoints exist and are responding.\n');
}

testUserAPI();