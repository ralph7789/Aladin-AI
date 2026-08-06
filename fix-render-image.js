const axios = require('axios');
const fs = require('fs');
const secrets = JSON.parse(fs.readFileSync('/root/.gemini/antigravity-cli/brain/db927f20-3725-4f36-bed8-0cbf3a59c4c9/scratch/secrets.json', 'utf8'));

async function run() {
  try {
    const res = await axios.post('https://api.render.com/v1/services/srv-d9mvcclaeets73assl7g/deploys', {
      imageUrl: "ghcr.io/ralph7789/aladin-api:latest"
    }, {
      headers: { Authorization: `Bearer ${secrets.render.api_key}` }
    });
    console.log("Deploy triggered with imageUrl:", res.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
run();
