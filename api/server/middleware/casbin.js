const { getEnforcer } = require('~/server/services/casbin');
const { License } = require('~/models');

const checkModelAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Identify model from request body or params
    const model = req.body.model || req.params.model;
    if (!model) {
      return next();
    }

    const enforcer = await getEnforcer();
    let licenseName = 'Free'; // Default fallback

    if (req.user.license) {
      // If license is already populated, use it
      if (req.user.license.name) {
        licenseName = req.user.license.name;
      } else {
        // Fetch it
        const license = await License.findById(req.user.license);
        if (license) {
          licenseName = license.name;
        }
      }
    }

    // Check permissions
    // Sub: licenseName, Obj: model, Act: 'access'
    if (model === 'HuggingFaceTB/SmolLM3-3B') {
      return next();
    }
    const allowed = await enforcer.enforce(licenseName, model, 'access');

    if (allowed) {
      return next();
    }
    
    // Log denial for debugging
    console.warn(`Access denied for User ${req.user.id} (License: ${licenseName}) to Model ${model}`);
    
    return res.status(403).json({ error: `Access denied for model: ${model} with license ${licenseName}` });

  } catch (err) {
    console.error('Casbin Middleware Error:', err);
    return res.status(500).json({ error: 'Internal Server Error during permission check' });
  }
};

module.exports = { checkModelAccess };
