const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('https://lllftazvjbfrtakmauxe.supabase.co/rest/v1/Admin_API_Keys?select=*', {
      headers: { 
        apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbGZ0YXp2amJmcnRha21hdXhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTYwMDY4NywiZXhwIjoyMTAxMTc2Njg3fQ.BNiq4mM1-lO2QtQEANq2HdzuzqPjXHgigAfBJiF1Xqo',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbGZ0YXp2amJmcnRha21hdXhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTYwMDY4NywiZXhwIjoyMTAxMTc2Njg3fQ.BNiq4mM1-lO2QtQEANq2HdzuzqPjXHgigAfBJiF1Xqo'
      }
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
run();
