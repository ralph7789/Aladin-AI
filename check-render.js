const axios = require('axios');
const fs = require('fs');
const secrets = JSON.parse(fs.readFileSync('/root/.gemini/antigravity-cli/brain/db927f20-3725-4f36-bed8-0cbf3a59c4c9/scratch/secrets.json', 'utf8'));
async function checkDeploy() {
  try {
    const res = await axios.get('https://api.render.com/v1/services/srv-d9mvcclaeets73assl7g/deploys/dep-d9ps7mrm8hqs73f62920', {
      headers: { Authorization: `Bearer ${secrets.render.api_key}` }
    });
    console.log("Render Deploy Status:", res.data.status);
  } catch (err) {
    console.error(err.message);
  }
}
checkDeploy();
