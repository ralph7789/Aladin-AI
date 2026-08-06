const axios = require('axios');
const fs = require('fs');
const secrets = JSON.parse(fs.readFileSync('/root/.gemini/antigravity-cli/brain/db927f20-3725-4f36-bed8-0cbf3a59c4c9/scratch/secrets.json', 'utf8'));
async function checkDeploys() {
  try {
    const res = await axios.get('https://api.render.com/v1/services/srv-d9mvcclaeets73assl7g/deploys', {
      headers: { Authorization: `Bearer ${secrets.render.api_key}` }
    });
    console.log(JSON.stringify(res.data.slice(0, 2), null, 2));
  } catch (err) {
    console.error(err.message);
  }
}
checkDeploys();
