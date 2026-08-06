const fs = require('fs');
const transcriptPath = '/root/.gemini/antigravity-cli/brain/4fcec72f-4049-4606-9543-47cc4b0107b0/.system_generated/logs/transcript_full.jsonl';
const data = fs.readFileSync(transcriptPath, 'utf8');

const lines = data.split('\n').filter(Boolean);
for (const line of lines) {
  const json = JSON.parse(line);
  if (json.type === 'USER_INPUT' && json.content.includes('HAR')) {
    const urls = [];
    const entryRegex = /"request":\s*\{[^}]*"url":\s*"([^"]+\/api\/[^"]+)"[^}]*\}[^}]*"response":\s*\{\s*"status":\s*(\d+)/g;
    let match;
    while ((match = entryRegex.exec(json.content)) !== null) {
      urls.push(`${match[2]} ${match[1]}`);
    }
    console.log("Found API requests in user HAR:", urls);
  }
}
