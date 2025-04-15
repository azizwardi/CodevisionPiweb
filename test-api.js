// Script pour tester l'API utilisateur avec fetch (natif à Node.js récent)

async function testUserAPI() {
  console.log('Testing User API...');
  
  // Test port 5000
  try {
    console.log('Trying port 5000...');
    const response = await fetch('http://localhost:5000/api/user/showuser');
    if (response.ok) {
      const data = await response.json();
      console.log('Success on port 5000!');
      console.log('Number of users:', data.length);
      console.log('First user:', data[0]);
      return;
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (err) {
    console.error('Error on port 5000:', err.message);
  }
  
  // Test port 8000
  try {
    console.log('Trying port 8000...');
    const response = await fetch('http://localhost:8000/api/user/showuser');
    if (response.ok) {
      const data = await response.json();
      console.log('Success on port 8000!');
      console.log('Number of users:', data.length);
      console.log('First user:', data[0]);
      return;
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (err) {
    console.error('Error on port 8000:', err.message);
  }
  
  // Test port 3000
  try {
    console.log('Trying port 3000...');
    const response = await fetch('http://localhost:3000/api/user/showuser');
    if (response.ok) {
      const data = await response.json();
      console.log('Success on port 3000!');
      console.log('Number of users:', data.length);
      console.log('First user:', data[0]);
      return;
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (err) {
    console.error('Error on port 3000:', err.message);
  }
  
  console.log('All attempts failed. Please check if the API server is running.');
}

testUserAPI();
