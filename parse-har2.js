const fs = require('fs');
const transcriptPath = '/root/.gemini/antigravity-cli/brain/4fcec72f-4049-4606-9543-47cc4b0107b0/.system_generated/logs/transcript_full.jsonl';
const data = fs.readFileSync(transcriptPath, 'utf8');

const lines = data.split('\n').filter(Boolean);
for (const line of lines) {
  const json = JSON.parse(line);
  if (json.type === 'USER_INPUT' && json.content.includes('HAR')) {
    const urls = [];
    const urlRegex = /"url":\s*"([^"]+\/api\/[^"]+)"/g;
    let match;
    while ((match = urlRegex.exec(json.content)) !== null) {
      urls.push(match[1]);
    }
    console.log("Found URLs in user HAR:", [...new Set(urls)]);
  }
}
