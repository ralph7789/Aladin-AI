const { getLLMConfig } = require('@aladin/api');
const { EModelEndpoint } = require('aladin-data-provider');
const { getUserKey, checkUserKeyExpiry } = require('~/server/services/UserService');
const AnthropicClient = require('~/app/clients/AnthropicClient');

const initializeClient = async ({ req, res, endpointOption, overrideModel, optionsOnly }) => {
  const appConfig = req.config;
  const { ANTHROPIC_API_KEY, ANTHROPIC_REVERSE_PROXY, PROXY } = process.env;
  const expiresAt = req.body.key;
  const isUserProvided = ANTHROPIC_API_KEY === 'user_provided';

  let anthropicApiKey = isUserProvided
    ? await getUserKey({ userId: req.user.id, name: EModelEndpoint.anthropic })
    : ANTHROPIC_API_KEY;

  // --- Admin Fallback Logic (Supabase Postgres) ---
  const modelName = overrideModel ?? endpointOption?.model_parameters?.model ?? req.body.model;
  if (modelName) {
    try {
      const { decrypt } = require('@aladin/api');
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
          .eq('is_active', true)
          .eq('provider', 'Anthropic')
          .contains('models', JSON.stringify([modelName]));
          
        if (keys && keys.length > 0) {
          const adminKey = keys[0];
          if (adminKey.key) anthropicApiKey = await decrypt(adminKey.key);
          console.log(`[AnthropicEndpoint] Using Supabase Fallback Key for ${modelName}`);
        }
      }
    } catch (err) {
      console.error('[AnthropicEndpoint] Error fetching admin key from Supabase:', err);
    }
  }
  // ----------------------------


  if (!anthropicApiKey) {
    throw new Error('Anthropic API key not provided. Please provide it again.');
  }

  if (expiresAt && isUserProvided) {
    checkUserKeyExpiry(expiresAt, EModelEndpoint.anthropic);
  }

  let clientOptions = {};

  /** @type {undefined | TBaseEndpoint} */
  const anthropicConfig = appConfig.endpoints?.[EModelEndpoint.anthropic];

  if (anthropicConfig) {
    clientOptions._lc_stream_delay = anthropicConfig.streamRate;
    clientOptions.titleModel = anthropicConfig.titleModel;
  }

  const allConfig = appConfig.endpoints?.all;
  if (allConfig) {
    clientOptions._lc_stream_delay = allConfig.streamRate;
  }

  if (optionsOnly) {
    clientOptions = Object.assign(
      {
        proxy: PROXY ?? null,
        reverseProxyUrl: ANTHROPIC_REVERSE_PROXY ?? null,
        modelOptions: endpointOption?.model_parameters ?? {},
      },
      clientOptions,
    );
    if (overrideModel) {
      clientOptions.modelOptions.model = overrideModel;
    }
    clientOptions.modelOptions.user = req.user.id;
    return getLLMConfig(anthropicApiKey, clientOptions);
  }

  const client = new AnthropicClient(anthropicApiKey, {
    req,
    res,
    reverseProxyUrl: ANTHROPIC_REVERSE_PROXY ?? null,
    proxy: PROXY ?? null,
    ...clientOptions,
    ...endpointOption,
  });

  return {
    client,
    anthropicApiKey,
  };
};

module.exports = initializeClient;
