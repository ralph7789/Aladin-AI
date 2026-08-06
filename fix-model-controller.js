const fs = require('fs');
const file = 'api/server/controllers/ModelController.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/.from\('Admin_API_Keys'\)/g, ".from('admin_api_keys')");
fs.writeFileSync(file, content);
