const fs = require('fs');

const transcriptPath = '/root/.gemini/antigravity-cli/brain/4fcec72f-4049-4606-9543-47cc4b0107b0/.system_generated/logs/transcript_full.jsonl';
const data = fs.readFileSync(transcriptPath, 'utf8');

const lines = data.split('\n').filter(Boolean);
for (const line of lines) {
  const json = JSON.parse(line);
  if (json.type === 'USER_INPUT' && json.content.includes('HAR')) {
    // extract HAR JSON
    const match = json.content.match(/HAR\s*({[\s\S]+})/);
    if (match) {
      try {
        const har = JSON.parse(match[1]);
        if (har.log && har.log.entries) {
          const urls = har.log.entries
            .filter(e => e.request.url.includes('/api/'))
            .map(e => `${e.request.method} ${e.request.url} - Status: ${e.response?.status}`);
          console.log("Found HAR with API requests:", [...new Set(urls)]);
        }
      } catch (e) {
        console.error("Failed to parse HAR JSON in a user message");
      }
    }
  }
}
