const { newEnforcer } = require('casbin');
const MongooseAdapter = require('casbin-mongoose-adapter').default;
const path = require('path');
require('dotenv').config();

async function testCasbin() {
  console.log('Testing Casbin Connection...');
  
  const modelPath = path.resolve(__dirname, 'config/casbin/rbac_model.conf');
  let mongoUri = process.env.MONGO_URI;
  let options = { useNewUrlParser: true, useUnifiedTopology: true };

  if (mongoUri.includes('mongodb+srv://')) {
     try {
       const protocol = 'mongodb+srv://';
       const withoutProtocol = mongoUri.substring(protocol.length);
       const atIndex = withoutProtocol.lastIndexOf('@');
       
       if (atIndex !== -1) {
         const creds = withoutProtocol.substring(0, atIndex);
         const rest = withoutProtocol.substring(atIndex + 1);
         const colonIndex = creds.indexOf(':');
         
         if (colonIndex !== -1) {
             const user = decodeURIComponent(creds.substring(0, colonIndex));
             const pass = decodeURIComponent(creds.substring(colonIndex + 1));
             
             mongoUri = protocol + rest;
             options.user = user;
             options.pass = pass;
             console.log('Separated credentials.');
         }
       }
     } catch (e) {
       console.error('Parsing error', e);
     }
  }
  
  try {
      const adapter = await MongooseAdapter.newAdapter(mongoUri, options);
      console.log('Adapter created.');
      const enforcer = await newEnforcer(modelPath, adapter);
      console.log('Enforcer created.');
      await enforcer.loadPolicy();
      console.log('Policy loaded.');
      process.exit(0);
  } catch (err) {
      console.error('Casbin Error:', err);
      process.exit(1);
  }
}

testCasbin();
