const loadCustomConfig = require('./api/server/services/Config/loadCustomConfig.js');
async function test() {
  console.log('Loading config...');
  const config = await loadCustomConfig(true);
  console.log('Result:', config ? 'Success' : 'Failed (null)');
}
test();
