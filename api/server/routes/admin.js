const express = require('express');
const router = express.Router();
const requireJwtAuth = require('../middleware/requireJwtAuth');
const checkAdmin = require('../middleware/roles/admin');
const mongoose = require('mongoose');

// Use JWT Auth for all routes in this router
router.use(requireJwtAuth);

// Get models safely from Mongoose registry
const User = mongoose.models.User;
const License = mongoose.models.License;

// --- USER MANAGEMENT ---

// Get all users
router.get('/users', checkAdmin, async (req, res) => {
  try {
    const User = mongoose.models.User;
    console.log('[AdminAPI] Fetching users...');
    if (!User) {
      throw new Error('User model is undefined');
    }
    const users = await User.find({}, '-password').lean();
    console.log(`[AdminAPI] Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('[AdminAPI] Error fetching users:', error);
    res
      .status(500)
      .json({ message: 'Error fetching users', error: error.message, stack: error.stack });
  }
});

// Create user
router.post('/users', checkAdmin, async (req, res) => {
  try {
    const User = mongoose.models.User;
    const { username, email, password, role, license } = req.body;
    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check existing
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'USER',
      license,
      emailVerified: true,
    });

    // Casbin policy update would happen here (omitted for brevity, handled by hooks usually or service)

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Update user
router.put('/users/:id', checkAdmin, async (req, res) => {
  try {
    const User = mongoose.models.User;
    const { id } = req.params;
    const updates = req.body;
    delete updates.password; // Handle password change separately or securely

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Delete user
router.delete('/users/:id', checkAdmin, async (req, res) => {
  try {
    const User = mongoose.models.User;
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// --- LICENSE MANAGEMENT ---

// Get all licenses
router.get('/licenses', checkAdmin, async (req, res) => {
  try {
    const License = mongoose.models.License;
    console.log('[AdminAPI] Fetching licenses...');
    if (!License) {
      throw new Error('License model is undefined');
    }
    const licenses = await License.find({});
    console.log(`[AdminAPI] Found ${licenses.length} licenses`);
    res.json(licenses);
  } catch (error) {
    console.error('[AdminAPI] Error fetching licenses:', error);
    res
      .status(500)
      .json({ message: 'Error fetching licenses', error: error.message, stack: error.stack });
  }
});

// Create license
router.post('/licenses', checkAdmin, async (req, res) => {
  try {
    const License = mongoose.models.License;
    const licenseData = req.body;
    const newLicense = await License.create(licenseData);
    res.status(201).json(newLicense);
  } catch (error) {
    res.status(500).json({ message: 'Error creating license', error: error.message });
  }
});

// Update license
router.put('/licenses/:id', checkAdmin, async (req, res) => {
  try {
    const License = mongoose.models.License;
    const { id } = req.params;
    const updated = await License.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating license', error: error.message });
  }
});

// Delete license
router.delete('/licenses/:id', checkAdmin, async (req, res) => {
  try {
    const License = mongoose.models.License;
    await License.findByIdAndDelete(req.params.id);
    res.json({ message: 'License deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting license', error: error.message });
  }
});

// --- ROLE MANAGEMENT ---

// Get all roles
router.get('/roles', checkAdmin, async (req, res) => {
  try {
    const Role = mongoose.models.Role;
    console.log('[AdminAPI] Fetching roles...');
    if (!Role) {
      throw new Error('Role model is undefined');
    }
    const roles = await Role.find({});
    console.log(`[AdminAPI] Found ${roles.length} roles`);
    res.json(roles);
  } catch (error) {
    console.error('[AdminAPI] Error fetching roles:', error);
    res.status(500).json({ message: 'Error fetching roles', error: error.message });
  }
});

// Create role
router.post('/roles', checkAdmin, async (req, res) => {
  try {
    const Role = mongoose.models.Role;
    const { name, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const existing = await Role.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: 'Role already exists' });
    }

    const newRole = await Role.create({
      name,
      permissions: permissions || {},
    });
    res.status(201).json(newRole);
  } catch (error) {
    res.status(500).json({ message: 'Error creating role', error: error.message });
  }
});

// Update role permissions
router.put('/roles/:id', checkAdmin, async (req, res) => {
  try {
    const Role = mongoose.models.Role;
    const { id } = req.params;

    const role = await Role.findByIdAndUpdate(id, req.body, { new: true });
    res.json(role);
  } catch (error) {
    res.status(500).json({ message: 'Error updating role', error: error.message });
  }
});

// Delete role
router.delete('/roles/:id', checkAdmin, async (req, res) => {
  try {
    const Role = mongoose.models.Role;
    await Role.findByIdAndDelete(req.params.id);
    res.json({ message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting role', error: error.message });
  }
});
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { CacheKeys } = require('aladin-data-provider');
const { getLogStores } = require('../../cache');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
// Initialize Supabase only if URL and key are provided
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Helper to get LiteLLM host and key
const getLiteLLMConfig = () => {
  const host = process.env.LITELLM_HOST || 'http://localhost:4000';
  const key = process.env.LITELLM_MASTER_KEY;
  return { host, key };
};

// Validate an API Key and fetch available models
router.post('/model-management/validate', checkAdmin, async (req, res) => {
  try {
    const { key, baseURL } = req.body;
    if (!key || !baseURL) {
      return res.status(400).json({ message: 'Key and baseURL are required' });
    }
    
    // Call the provider's /models endpoint to validate and fetch available models
    const axios = require('axios');
    const response = await axios.get(`${baseURL.replace(/\/$/, '')}/models`, {
      headers: { Authorization: `Bearer ${key}` }
    });
    
    const models = response.data.data.map(m => m.id);
    res.json({ message: 'Valid API Key', models });
  } catch (error) {
    console.error('[AdminAPI] Validation Error:', error.response?.data || error.message);
    res.status(400).json({ message: 'Failed to validate API Key or fetch models', error: error.message });
  }
});

// Get all providers and keys from LiteLLM
router.get('/model-management/providers', checkAdmin, async (req, res) => {
  try {
    const { host, key } = getLiteLLMConfig();
    let keys = [];
    if (key) {
      const response = await axios.get(`${host}/key/info`, { 
        headers: { 'Authorization': `Bearer ${key}` } 
      });
      keys = response.data?.keys || [];
    }
    
    // Group keys by team_id (which we use as provider name)
    const providersMap = {};
    
    for (const k of keys) {
      const providerName = k.team_id || 'Default Provider';
      if (!providersMap[providerName]) {
        providersMap[providerName] = {
          name: providerName,
          isActive: true,
          aggregateTokensLimit: 0,
          aggregateTokensUsed: 0,
          keys: []
        };
      }
      
      const tokensUsed = Number(k.spend) || 0;
      const tokenLimit = Number(k.max_budget) || 1000000;
      
      providersMap[providerName].aggregateTokensLimit += tokenLimit;
      providersMap[providerName].aggregateTokensUsed += tokensUsed;
      
      providersMap[providerName].keys.push({
        _id: k.token,
        key_name: k.key_alias || `${providerName}-Key`,
        key: k.token,
        status: tokensUsed >= tokenLimit ? 'exhausted' : 'active',
        supportedModels: k.models || ['all'],
        tokenLimit: tokenLimit,
        tokensUsed: tokensUsed
      });
    }
    
    res.json(Object.values(providersMap));
  } catch (error) {
    console.error('[AdminAPI] LiteLLM Error:', error.response?.data || error.message);
    
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      // Fetch from Supabase as fallback
      const { data: fallbackKeys, error: dbError } = await supabase
        .from('Admin_API_Keys')
        .select('*');
        
      if (dbError) throw dbError;
      
      const providersMap = {};
      for (const k of (fallbackKeys || [])) {
        const providerName = k.provider || 'Fallback Provider';
        if (!providersMap[providerName]) {
          providersMap[providerName] = {
            name: providerName,
            isActive: k.is_active !== false,
            aggregateTokensLimit: 0,
            aggregateTokensUsed: 0,
            keys: []
          };
        }
        
        const limitBudget = k.limit_budget || 1000000;
        providersMap[providerName].aggregateTokensLimit += limitBudget;
        providersMap[providerName].keys.push({
          _id: k.id,
          key_name: k.key_alias || `${providerName}-Fallback-Key`,
          key: k.key,
          status: k.is_active ? 'active' : 'exhausted',
          supportedModels: k.models || ['all'],
          tokenLimit: limitBudget,
          tokensUsed: 0
        });
      }
      return res.json(Object.values(providersMap));
    } catch (fallbackError) {
      return res.status(503).json({ message: 'LiteLLM not connected and DB fallback failed', error: fallbackError.message });
    }
  }
});

// Add a new API Key to LiteLLM and Supabase
router.post('/model-management/keys', checkAdmin, async (req, res) => {
  try {
    const { provider, key, limit, baseURL = '' } = req.body;
    const { encrypt } = require('@aladin/api');
    
    // 1. Auto-fetch models from provider
    let fetchedModels = [];
    try {
      const modelsResponse = await axios.get(`${baseURL.replace(/\/$/, '')}/v1/models`, {
        headers: { Authorization: `Bearer ${key}` }
      });
      fetchedModels = modelsResponse.data?.data?.map(m => m.id) || [];
    } catch (fetchError) {
      console.warn('[AdminAPI] Could not auto-fetch models with /v1/models. Attempting /models fallback...');
      try {
        const fallbackResponse = await axios.get(`${baseURL.replace(/\/$/, '')}/models`, {
          headers: { Authorization: `Bearer ${key}` }
        });
        fetchedModels = fallbackResponse.data?.data?.map(m => m.id) || [];
      } catch (fallbackErr) {
        console.error('[AdminAPI] Auto-fetch models failed:', fallbackErr.message);
      }
    }
    
    // If we have models, use them, otherwise use body.models or empty
    const finalModels = fetchedModels.length > 0 ? fetchedModels : (req.body.models || []);

    const encryptedKey = await encrypt(key);
    
    // 2. Save to Supabase Admin_API_Keys
    if (supabase) {
      const { error: insertError } = await supabase
        .from('Admin_API_Keys')
        .upsert({ 
          provider, 
          key_alias: `${provider}-Key`,
          key: encryptedKey, 
          models: finalModels, 
          limit_budget: limit, 
          base_url: baseURL 
        }, { onConflict: 'provider,key' });
        
      if (insertError) {
        console.error('[AdminAPI] Supabase Insert Error:', insertError);
      }
    }

    // 3. Cache Invalidation
    try {
      const cache = getLogStores(CacheKeys.CONFIG_STORE);
      await cache.delete(CacheKeys.MODELS_CONFIG);
    } catch (cacheError) {
      console.error('[AdminAPI] Error invalidating MODELS_CONFIG cache:', cacheError);
    }
    
    // 4. Try LiteLLM
    let liteLLMData = null;
    try {
      const { host, key: masterKey } = getLiteLLMConfig();
      if (masterKey) {
        const response = await axios.post(`${host}/key/generate`, { 
          models: finalModels, 
          max_budget: limit, 
          team_id: provider,
          aliases: { "key_value": key }
        }, { 
          headers: { 'Authorization': `Bearer ${masterKey}` } 
        });
        liteLLMData = response.data;
      }
    } catch (liteError) {
      console.warn('[AdminAPI] LiteLLM Error adding key:', liteError.message);
    }

    res.status(201).json({ 
      message: 'Key added successfully and models auto-fetched', 
      models: finalModels,
      data: liteLLMData 
    });
  } catch (error) {
    console.error('[AdminAPI] Error adding admin key:', error);
    res.status(500).json({ message: 'Error adding key', error: error.message });
  }
});

// Toggle fallback status for an Admin Key
router.post('/model-management/keys/fallback', checkAdmin, async (req, res) => {
  try {
    const { provider, isFallback } = req.body;
    const AdminKey = mongoose.models.AdminKey || require('../../models/AdminKey').AdminKey;
    
    const key = await AdminKey.findOneAndUpdate(
      { provider },
      { isFallback },
      { new: true }
    );
    
    if (!key) {
      return res.status(404).json({ message: 'Key not found in MongoDB' });
    }
    
    res.status(200).json({ message: 'Fallback status updated', data: key });
  } catch (error) {
    console.error('[AdminAPI] Error toggling fallback:', error);
    res.status(500).json({ message: 'Error updating fallback status', error: error.message });
  }
});

module.exports = router;
