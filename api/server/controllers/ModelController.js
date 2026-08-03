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
    const mongoose = require('mongoose');
    const AdminKey = mongoose.models.AdminKey || require('~/models/AdminKey').AdminKey;
    if (AdminKey) {
      const fallbackKeys = await AdminKey.find({ isActive: true }).lean();
      
      if (fallbackKeys.length > 0) {
        if (!modelConfig.custom) {
          modelConfig.custom = [];
        }
        for (const k of fallbackKeys) {
          if (k.models && Array.isArray(k.models)) {
            // Push models that aren't already in the list
            for (const m of k.models) {
              if (!modelConfig.custom.includes(m)) {
                modelConfig.custom.push(m);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    logger.error('Error injecting AdminKey fallback models:', err);
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
