const { isEnabled } = require('@aladin/api');
const { getAppConfig } = require('~/server/services/Config');
const crypto = require('crypto');
const { CacheKeys } = require('aladin-data-provider');
const { getLogStores } = require('~/cache');

const WINDOW_MS = 5 * 60 * 1000;

async function validateRegistration(req, res, next) {
  if (req.invite) {
    return next();
  }

  // 1. Instantly ALLOW if Sentinel injected authorized roles (bypass captcha & handshake)
  const sentinelRolesHeader = req.headers['x-sentinel-roles'];
  if (sentinelRolesHeader) {
    const roles = sentinelRolesHeader.split(',').map(r => r.trim());
    if (roles.includes('admin') || roles.includes('api_tester')) {
      return next();
    }
  }

  // 2. Token Handshake Verification (Replay Attack Prevention)
  const { session_id, challenge } = req.body;
  if (!session_id || !challenge) {
    return res.status(403).json({ message: 'Missing session_id or challenge.' });
  }

  const cache = getLogStores(CacheKeys.PENDING_REQ);
  const deleted = await cache.delete(session_id); // Atomic delete via deletion failure pattern
  if (!deleted) {
    return res.status(403).json({ message: 'Replay attack detected or session expired.' });
  }

  // 3. Challenge Validation with Time Window Fallback
  const timeWindow = Math.floor(Date.now() / WINDOW_MS);
  const baseSecret = process.env.SENTINEL_GATEWAY_SECRET || 'default-secret';
  
  const expectedChallengeCurrent = crypto.createHmac('sha256', `${baseSecret}-${timeWindow}`).update(session_id).digest('hex');
  const expectedChallengePrevious = crypto.createHmac('sha256', `${baseSecret}-${timeWindow - 1}`).update(session_id).digest('hex');

  if (challenge !== expectedChallengeCurrent && challenge !== expectedChallengePrevious) {
    return res.status(403).json({ message: 'Invalid challenge.' });
  }

  // 4. Normal Turnstile Execution (if Handshake succeeded but user is not Admin/API Tester)
  if (process.env.ALLOW_REGISTRATION === undefined || isEnabled(process.env.ALLOW_REGISTRATION)) {
    const appConfig = await getAppConfig();
    const turnstileEnabled = Boolean(appConfig?.turnstileConfig?.siteKey);
    
    if (turnstileEnabled) {
      const secret = process.env.CF_TURNSTILE_SECRET_KEY;
      const token = req.body.turnstileToken;
      
      if (!token) {
        return res.status(403).json({ message: 'Turnstile CAPTCHA token missing. Registration denied.' });
      }
      
      try {
        const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret, response: token })
        });
        const data = await resp.json();
        if (!data.success) {
          return res.status(403).json({ message: 'Invalid CAPTCHA.' });
        }
      } catch (e) {
        return res.status(500).json({ message: 'Error verifying CAPTCHA.' });
      }
    }
    
    next();
  } else {
    return res.status(403).json({
      message: 'Registration is not allowed.',
    });
  }
}

module.exports = validateRegistration;
