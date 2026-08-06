const axios = require('axios');
const fs = require('fs');
const secrets = JSON.parse(fs.readFileSync('/root/.gemini/antigravity-cli/brain/db927f20-3725-4f36-bed8-0cbf3a59c4c9/scratch/secrets.json', 'utf8'));

async function run() {
  try {
    const res = await axios.get('https://api.render.com/v1/services/srv-d9mvcclaeets73assl7g/env-vars', {
      headers: { Authorization: `Bearer ${secrets.render.api_key}` }
    });
    
    let envs = res.data;
    
    envs.push({ envVar: { key: "SUPABASE_URL", value: "https://lllftazvjbfrtakmauxe.supabase.co" } });
    envs.push({ envVar: { key: "SUPABASE_SERVICE_ROLE_KEY", value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbGZ0YXp2amJmcnRha21hdXhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTYwMDY4NywiZXhwIjoyMTAxMTc2Njg3fQ.BNiq4mM1-lO2QtQEANq2HdzuzqPjXHgigAfBJiF1Xqo" } });
    
    const payload = envs.map(e => ({ key: e.envVar.key, value: e.envVar.value }));
    
    const putRes = await axios.put('https://api.render.com/v1/services/srv-d9mvcclaeets73assl7g/env-vars', payload, {
      headers: { Authorization: `Bearer ${secrets.render.api_key}` }
    });
    console.log("Updated Env Vars successfully");
  } catch(err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
run();
