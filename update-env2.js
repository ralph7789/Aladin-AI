const axios = require('axios');
const fs = require('fs');
const secrets = JSON.parse(fs.readFileSync('/root/.gemini/antigravity-cli/brain/db927f20-3725-4f36-bed8-0cbf3a59c4c9/scratch/secrets.json', 'utf8'));

async function run() {
  try {
    const res = await axios.get('https://api.render.com/v1/services/srv-d9mvcclaeets73assl7g/env-vars', {
      headers: { Authorization: `Bearer ${secrets.render.api_key}` }
    });
    
    let envs = res.data;
    
    envs.push({ envVar: { key: "DOMAIN_CLIENT", value: "https://client-chi-rouge-51.vercel.app" } });
    envs.push({ envVar: { key: "DOMAIN_SERVER", value: "https://aladin-api-xhoj.onrender.com" } });
    
    // According to Render API: an array of objects like { key: "foo", value: "bar" } or { envVar: { key: "foo", value: "bar" } }?
    // Let's look at the shape of PUT /env-vars. It expects an array of {key, value, generateValue}.
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
