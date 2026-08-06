const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const supabase = createClient('https://lllftazvjbfrtakmauxe.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbGZ0YXp2amJmcnRha21hdXhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTYwMDY4NywiZXhwIjoyMTAxMTc2Njg3fQ.BNiq4mM1-lO2QtQEANq2HdzuzqPjXHgigAfBJiF1Xqo', {
  auth: { persistSession: false },
  realtime: { transport: WebSocket }
});

async function run() {
  const { data, error } = await supabase.from('admin_api_keys').select('*');
  if (error) console.error("Error:", error);
  else console.log("Keys:", JSON.stringify(data, null, 2));
}
run();
