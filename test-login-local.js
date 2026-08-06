const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('https://aladin-api-xhoj.onrender.com/api/auth/login', {
      email: "jeko@aladin.ai",
      password: "password123"
    });
    console.log(res.data);
  } catch(err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
