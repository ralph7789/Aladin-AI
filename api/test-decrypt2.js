require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const { decrypt, decryptV2, decryptV3 } = require('../packages/api/dist/crypto/encryption.js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket }
});

async function run() {
  const modelName = 'zai-glm-4.7';
  const { data: keys, error } = await supabase
          .from('admin_api_keys')
          .select('*')
          .eq('is_active', true)
          .contains('models', JSON.stringify([modelName]));
  
  if (keys && keys.length > 0) {
    const adminKey = keys[0];
    try {
      const dec = await decrypt(adminKey.key);
      console.log("Decrypted with decrypt():", dec);
    } catch(e) { console.error("decrypt() failed:", e.message); }
    try {
      const dec = await decryptV2(adminKey.key);
      console.log("Decrypted with decryptV2():", dec);
    } catch(e) { console.error("decryptV2() failed:", e.message); }
    try {
      const dec = decryptV3(adminKey.key);
      console.log("Decrypted with decryptV3():", dec);
    } catch(e) { console.error("decryptV3() failed:", e.message); }
  } else {
    console.log("No keys found.");
  }
}
run();
