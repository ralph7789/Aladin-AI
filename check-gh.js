const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('https://api.github.com/repos/ralph7789/Aladin-AI/actions/runs?branch=prod&per_page=3');
    for (const run of res.data.workflow_runs) {
      console.log(`Run ${run.id}: Status: ${run.status}, Conclusion: ${run.conclusion}`);
    }
  } catch(e) {
    console.log(e.message);
  }
}
run();
