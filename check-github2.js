const axios = require('axios');
async function checkGitHub() {
  try {
    const res = await axios.get('https://api.github.com/repos/ralph7789/Aladin-AI/actions/runs?per_page=5');
    res.data.workflow_runs.forEach(run => {
      console.log(`Workflow: ${run.name}, Status: ${run.status}, Conclusion: ${run.conclusion}, Created: ${run.created_at}, Updated: ${run.updated_at}`);
    });
  } catch (err) {
    console.error(err.message);
  }
}
checkGitHub();
