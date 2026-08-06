const fs = require('fs');
const transcriptPath = '/root/.gemini/antigravity-cli/brain/4fcec72f-4049-4606-9543-47cc4b0107b0/.system_generated/logs/transcript_full.jsonl';
const data = fs.readFileSync(transcriptPath, 'utf8');

const lines = data.split('\n').filter(Boolean);
for (const line of lines) {
  const json = JSON.parse(line);
  if (json.type === 'USER_INPUT' && json.content.includes('HAR')) {
    const harStart = json.content.indexOf('{');
    const harText = json.content.substring(harStart);
    try {
      const har = JSON.parse(harText);
      const entries = har.log.entries.filter(e => e.request.url.includes('/api/'));
      for (const e of entries) {
        let errorText = '';
        if (e.response.status >= 400 && e.response.content && e.response.content.text) {
          errorText = ' => ' + e.response.content.text;
        }
        console.log(`${e.request.method} ${e.request.url} - Status: ${e.response.status}${errorText}`);
      }
    } catch (e) {
      console.log("Failed to parse HAR:", e.message);
    }
    console.log("---");
  }
}
