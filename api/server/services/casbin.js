const { newEnforcer } = require('casbin');
const MongooseAdapter = require('casbin-mongoose-adapter').default;
const path = require('path');

let enforcer;

async function getEnforcer() {
  if (enforcer) return enforcer;

  const modelPath = path.resolve(__dirname, '../../config/casbin/rbac_model.conf');
  let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Aladin';
  let options = { useNewUrlParser: true, useUnifiedTopology: true };

    // Workaround for Mongoose 5 removed since we now use Mongoose 8 via overrides

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
