const axios = require('axios');
const fs = require('fs');
const secrets = JSON.parse(fs.readFileSync('/root/.gemini/antigravity-cli/brain/db927f20-3725-4f36-bed8-0cbf3a59c4c9/scratch/secrets.json', 'utf8'));

async function checkRender() {
  try {
    const res = await axios.get('https://api.render.com/v1/services', {
      headers: { Authorization: `Bearer ${secrets.render.api_key}` }
    });
    const services = res.data.map(s => {
       const info = s.service;
       return {
         id: info.id,
         name: info.name,
         branch: info.repoInfo ? info.repoInfo.branch : (info.imagePath ? info.imagePath : null),
         status: info.suspended
       };
    });
    console.log(JSON.stringify(services, null, 2));
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
checkRender();
