const axios = require('axios');
const fs = require('fs');

async function test() {
  try {
    const secrets = JSON.parse(fs.readFileSync('/root/.gemini/antigravity-cli/brain/db927f20-3725-4f36-bed8-0cbf3a59c4c9/scratch/secrets.json', 'utf8'));
    
    console.log('Registering/Logging in...');
    // Register first
    try {
      await axios.post('https://aladin-api-xhoj.onrender.com/api/auth/register', {
        name: 'Test Admin',
        username: 'testadmin1',
        email: 'testadmin1@aladin.ai',
        password: 'password123',
        confirm_password: 'password123'
      });
      console.log('Registered successfully.');
    } catch (e) {
      console.log('Registration failed (might already exist):', e.response?.data);
    }

    const loginRes = await axios.post('https://aladin-api-xhoj.onrender.com/api/auth/login', {
      email: 'testadmin1@aladin.ai',
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    console.log('Login success! Token:', token ? token.substring(0, 15) + '...' : 'NONE');
    
    const modelsRes = await axios.get('https://aladin-api-xhoj.onrender.com/api/admin/model-management/providers', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Models response:', modelsRes.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.status + ' ' + JSON.stringify(err.response.data) : err.message);
  }
}
test();
