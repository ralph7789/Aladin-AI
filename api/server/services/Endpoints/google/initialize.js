const path = require('path');
const { EModelEndpoint, AuthKeys } = require('aladin-data-provider');
const { getGoogleConfig, isEnabled, loadServiceKey } = require('@aladin/api');
const { getUserKey, checkUserKeyExpiry } = require('~/server/services/UserService');
const { GoogleClient } = require('~/app');

const initializeClient = async ({ req, res, endpointOption, overrideModel, optionsOnly }) => {
  const { GOOGLE_KEY, GOOGLE_REVERSE_PROXY, GOOGLE_AUTH_HEADER, PROXY } = process.env;
  const isUserProvided = GOOGLE_KEY === 'user_provided';
  const { key: expiresAt } = req.body;

  let userKey = null;
  if (expiresAt && isUserProvided) {
    checkUserKeyExpiry(expiresAt, EModelEndpoint.google);
    userKey = await getUserKey({ userId: req.user.id, name: EModelEndpoint.google });
  }

  let serviceKey = {};

  /** Check if GOOGLE_KEY is provided at all (including 'user_provided') */
  const isGoogleKeyProvided =
    (GOOGLE_KEY && GOOGLE_KEY.trim() !== '') || (isUserProvided && userKey != null);

  if (!isGoogleKeyProvided) {
    /** Only attempt to load service key if GOOGLE_KEY is not provided */
    try {
      const serviceKeyPath =
        process.env.GOOGLE_SERVICE_KEY_FILE ||
        path.join(__dirname, '../../../..', 'data', 'auth.json');
      serviceKey = await loadServiceKey(serviceKeyPath);
      if (!serviceKey) {
        serviceKey = {};
      }
    } catch (_e) {
      // Service key loading failed, but that's okay if not required
      serviceKey = {};
    }
  }

  let credentials = isUserProvided
    ? userKey
    : {
        [AuthKeys.GOOGLE_SERVICE_KEY]: serviceKey,
        [AuthKeys.GOOGLE_API_KEY]: GOOGLE_KEY,
      };

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
          .eq('provider', 'Google')
          .contains('models', JSON.stringify([modelName]));
          
        if (keys && keys.length > 0) {
          const adminKey = keys[0];
          if (adminKey.key) {
            credentials = {
              [AuthKeys.GOOGLE_SERVICE_KEY]: serviceKey,
              [AuthKeys.GOOGLE_API_KEY]: await decrypt(adminKey.key),
            };
          }
          console.log(`[GoogleEndpoint] Using Supabase Fallback Key for ${modelName}`);
        }
      }
    } catch (err) {
      console.error('[GoogleEndpoint] Error fetching admin key from Supabase:', err);
    }
  }
  // ----------------------------


  let clientOptions = {};

  const appConfig = req.config;
  /** @type {undefined | TBaseEndpoint} */
  const allConfig = appConfig.endpoints?.all;
  /** @type {undefined | TBaseEndpoint} */
  const googleConfig = appConfig.endpoints?.[EModelEndpoint.google];

  if (googleConfig) {
    clientOptions.streamRate = googleConfig.streamRate;
    clientOptions.titleModel = googleConfig.titleModel;
  }

  if (allConfig) {
    clientOptions.streamRate = allConfig.streamRate;
  }

  clientOptions = {
    req,
    res,
    reverseProxyUrl: GOOGLE_REVERSE_PROXY ?? null,
    authHeader: isEnabled(GOOGLE_AUTH_HEADER) ?? null,
    proxy: PROXY ?? null,
    ...clientOptions,
    ...endpointOption,
  };

  if (optionsOnly) {
    clientOptions = Object.assign(
      {
        modelOptions: endpointOption?.model_parameters ?? {},
      },
      clientOptions,
    );
    if (overrideModel) {
      clientOptions.modelOptions.model = overrideModel;
    }
    return getGoogleConfig(credentials, clientOptions);
  }

  const client = new GoogleClient(credentials, clientOptions);

  return {
    client,
    credentials,
  };
};

module.exports = initializeClient;
