const axios = require('axios');

async function checkGitHub() {
  try {
    const res = await axios.get('https://api.github.com/repos/ralph7789/Aladin-AI/actions/runs?per_page=1');
    const run = res.data.workflow_runs[0];
    console.log(`Workflow: ${run.name}`);
    console.log(`Status: ${run.status}`);
    console.log(`Conclusion: ${run.conclusion}`);
    console.log(`Created At: ${run.created_at}`);
    console.log(`Updated At: ${run.updated_at}`);
  } catch (err) {
    console.error(err.message);
  }
}
checkGitHub();
