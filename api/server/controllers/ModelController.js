const { logger } = require('@aladin/data-schemas');
const { CacheKeys } = require('aladin-data-provider');
const { loadDefaultModels, loadConfigModels } = require('~/server/services/Config');
const { getLogStores } = require('~/cache');

/**
 * @param {ServerRequest} req
 * @returns {Promise<TModelsConfig>} The models config.
 */
const getModelsConfig = async (req) => {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  let modelsConfig = await cache.get(CacheKeys.MODELS_CONFIG);
  if (!modelsConfig) {
    modelsConfig = await loadModels(req);
  }

  return modelsConfig;
};

/**
 * Loads the models from the config.
 * @param {ServerRequest} req - The Express request object.
 * @returns {Promise<TModelsConfig>} The models config.
 */
async function loadModels(req) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cachedModelsConfig = await cache.get(CacheKeys.MODELS_CONFIG);
  if (cachedModelsConfig) {
    return cachedModelsConfig;
  }
  const defaultModelsConfig = await loadDefaultModels(req);
  const customModelsConfig = await loadConfigModels(req);

  const modelConfig = { ...defaultModelsConfig, ...customModelsConfig };

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
    
    if (supabaseUrl && supabaseKey) {
      const WebSocket = require('ws');
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
        realtime: { transport: WebSocket }
      });
      const { data: keys, error } = await supabase
        .from('admin_api_keys')
        .select('*')
        .eq('is_active', true);
        
      if (error) {
        logger.error('Supabase query error:', error);
      } else if (keys && keys.length > 0) {
        for (const k of keys) {
          if (k.models && Array.isArray(k.models)) {
            // Inject models into specific endpoint based on provider rather than generic 'custom'
            const endpoint = (k.provider || 'custom').toLowerCase().replace(/\s+/g, '-');
            if (!modelConfig[endpoint]) {
              modelConfig[endpoint] = [];
            }
            for (const m of k.models) {
              if (!modelConfig[endpoint].includes(m)) {
                modelConfig[endpoint].push(m);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    logger.error('Error injecting Supabase Admin_API_Keys models:', err);
  }

  await cache.set(CacheKeys.MODELS_CONFIG, modelConfig);
  return modelConfig;
}

async function modelController(req, res) {
  try {
    const modelConfig = await loadModels(req);
    res.send(modelConfig);
  } catch (error) {
    logger.error('Error fetching models:', error);
    res.status(500).send({ error: error.message });
  }
}

module.exports = { modelController, loadModels, getModelsConfig };
