const { License } = require('~/models');
const { getEnforcer } = require('~/server/services/casbin');

const createLicense = async (req, res) => {
  try {
    const { name, models, features, maxChats } = req.body;
    
    const existing = await License.findOne({ name });
    if (existing) {
      return res.status(400).json({ error: 'License already exists' });
    }

    const license = await License.create({ name, models, features, maxChats });

    const enforcer = await getEnforcer();
    // Add policy: p, licenseName, modelName, access
    if (models && Array.isArray(models)) {
      for (const model of models) {
        await enforcer.addPolicy(name, model, 'access');
      }
    }
    if (features && Array.isArray(features)) {
      for (const feature of features) {
        await enforcer.addPolicy(name, feature, 'use');
      }
    }

    res.status(201).json(license);
  } catch (error) {
    console.error('Error creating license:', error);
    res.status(500).json({ error: error.message });
  }
};

const getLicenses = async (req, res) => {
  try {
    const licenses = await License.find({});
    res.status(200).json(licenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateLicense = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const license = await License.findByIdAndUpdate(id, updates, { new: true });
    
    if (!license) return res.status(404).json({ error: 'License not found' });

    // Update Casbin policies
    const enforcer = await getEnforcer();
    // Remove old policies for this license name? 
    // Casbin doesn't support easy update of multiple rules by subject unless we delete all and re-add.
    // deletePermissionsForUser(license.name) removes all policies where sub = license.name
    await enforcer.deletePermissionsForUser(license.name);
    
    if (license.models && Array.isArray(license.models)) {
      for (const model of license.models) {
        await enforcer.addPolicy(license.name, model, 'access');
      }
    }
    if (license.features && Array.isArray(license.features)) {
      for (const feature of license.features) {
        await enforcer.addPolicy(license.name, feature, 'use');
      }
    }

    res.status(200).json(license);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createLicense, getLicenses, updateLicense };
