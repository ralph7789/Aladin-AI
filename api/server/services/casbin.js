const { newEnforcer } = require('casbin');
const MongooseAdapter = require('casbin-mongoose-adapter').default;
const path = require('path');

let enforcer;

async function getEnforcer() {
  if (enforcer) return enforcer;

  const modelPath = path.resolve(__dirname, '../../config/casbin/rbac_model.conf');
  let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Aladin';
  let options = { useNewUrlParser: true, useUnifiedTopology: true };

  // Workaround for Mongoose 5 (used by adapter) URI parsing issue with special chars in password
  if (mongoUri.includes('mongodb+srv://')) {
    try {
      // Format: mongodb+srv://user:pass@host/db?query
      // We split by @, the last one is the host part, the part before is credentials
      // But credentials can contain @ if encoded.
      // The regex needs to be careful.
      // Generally mongodb+srv://USER:PASS@HOST...
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
          console.log('Casbin Adapter: Separated credentials from URI to avoid parsing errors.');
        }
      }
    } catch (e) {
      console.error('Casbin Adapter: Failed to parse URI for workaround', e);
    }
  }

  // Using the default adapter which creates a 'casbin_rule' collection
  const adapter = await MongooseAdapter.newAdapter(mongoUri, options);
  enforcer = await newEnforcer(modelPath, adapter);

  await enforcer.loadPolicy();
  return enforcer;
}

async function reloadPolicy() {
  if (enforcer) {
    await enforcer.loadPolicy();
  }
}

module.exports = { getEnforcer, reloadPolicy };
