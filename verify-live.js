const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('https://aladin-api-xhoj.onrender.com/api/auth/login', {
      email: "jeko@aladin.ai",
      password: "password123"
    });
    const token = res.data.token;
    
    // Now try to fetch admin keys (this was migrated to Supabase in the new deploy)
    // Or just fetch models
    const modelsRes = await axios.get('https://aladin-api-xhoj.onrender.com/api/models', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Models status:", modelsRes.status);
    console.log("Models length:", modelsRes.data.length);
  } catch(err) {
    console.error("Error:", err.response ? err.response.status + " " + err.response.data : err.message);
  }
}
test();
