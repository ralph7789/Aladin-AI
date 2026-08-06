require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket }
});

async function run() {
  const modelName = 'zai-glm-4.7'; // or 'gpt-3.5-turbo'
  console.log("Testing with contains models JSON.stringify([modelName])");
  const { data, error } = await supabase
          .from('admin_api_keys')
          .select('*')
          .eq('is_active', true)
          .contains('models', JSON.stringify([modelName]));
  console.log("JSON.stringify Result:", data, error);

  console.log("Testing with contains models [modelName]");
  const { data: d2, error: e2 } = await supabase
          .from('admin_api_keys')
          .select('*')
          .eq('is_active', true)
          .contains('models', [modelName]);
  console.log("Array Result:", d2, e2);
}
run();
