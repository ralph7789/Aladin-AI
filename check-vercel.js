const axios = require('axios');
const fs = require('fs');
const secrets = JSON.parse(fs.readFileSync('/root/.gemini/antigravity-cli/brain/db927f20-3725-4f36-bed8-0cbf3a59c4c9/scratch/secrets.json', 'utf8'));

async function run() {
  try {
    const res = await axios.get(`https://api.vercel.com/v6/deployments?projectId=prj_n2XG9t8B3A8B1mYwU4E7F5X6Pq8Z`, {
      headers: { Authorization: `Bearer ${secrets.vercel.token}` }
    });
    console.log(res.data.deployments.map(d => ({ state: d.state, url: d.url, created: new Date(d.created).toISOString() })).slice(0, 3));
  } catch(err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
run();
