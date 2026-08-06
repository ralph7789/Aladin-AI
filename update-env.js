const axios = require('axios');
const fs = require('fs');
const secrets = JSON.parse(fs.readFileSync('/root/.gemini/antigravity-cli/brain/db927f20-3725-4f36-bed8-0cbf3a59c4c9/scratch/secrets.json', 'utf8'));

async function updateEnv() {
  try {
    const res = await axios.put('https://api.render.com/v1/services/srv-d9mvcclaeets73assl7g/env-vars', 
      [
        { envVar: { key: "DOMAIN_CLIENT", value: "https://client-chi-rouge-51.vercel.app" } },
        { envVar: { key: "DOMAIN_SERVER", value: "https://aladin-api-xhoj.onrender.com" } }
      ], 
      {
        headers: { Authorization: `Bearer ${secrets.render.api_key}` }
      }
    );
    console.log("Updated Env Vars:", res.data.map(e => `${e.envVar.key}=${e.envVar.value}`));
  } catch(err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
updateEnv();
