require('dotenv').config({ path: '/home/jeko/Aladin-AI-prod/api/.env' });
const { createClient } = require('@supabase/supabase-js');
const { decrypt } = require('@aladin/api');

async function test() {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: keys, error } = await supabase.from('admin_api_keys').select('*').eq('is_active', true);
  console.log("Keys:", keys);
  
  if (keys && keys.length > 0) {
    for (const adminKey of keys) {
      try {
        console.log(`Decrypting key ${adminKey.id}...`);
        const decrypted = await decrypt(adminKey.key);
        console.log("Decrypted successfully:", decrypted.substring(0, 5) + "...");
      } catch (err) {
        console.error("Decrypt failed:", err.message);
      }
    }
  }
}
test();
