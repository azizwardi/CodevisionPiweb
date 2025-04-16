// Script pour tester l'API utilisateur
import axios from 'axios';

async function testUserAPI() {
  console.log('Testing User API...');

  // Test port 5000
  try {
    console.log('Trying port 5000...');
    const response5000 = await axios.get('http://localhost:5000/api/user/showuser');
    console.log('Success on port 5000!');
    console.log('Number of users:', response5000.data.length);
    console.log('First user:', response5000.data[0]);
    return;
  } catch (err) {
    console.error('Error on port 5000:', err.message);
  }

  // Test port 8000
  try {
    console.log('Trying port 8000...');
    const response8000 = await axios.get('http://localhost:8000/api/user/showuser');
    console.log('Success on port 8000!');
    console.log('Number of users:', response8000.data.length);
    console.log('First user:', response8000.data[0]);
    return;
  } catch (err) {
    console.error('Error on port 8000:', err.message);
  }

  // Test port 3000
  try {
    console.log('Trying port 3000...');
    const response3000 = await axios.get('http://localhost:3000/api/user/showuser');
    console.log('Success on port 3000!');
    console.log('Number of users:', response3000.data.length);
    console.log('First user:', response3000.data[0]);
    return;
  } catch (err) {
    console.error('Error on port 3000:', err.message);
  }

  console.log('All attempts failed. Please check if the API server is running.');
}

testUserAPI();
