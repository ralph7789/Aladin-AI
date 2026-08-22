const { isEnabled } = require('@aladin/api');
const { getAppConfig } = require('~/server/services/Config');

async function validateRegistration(req, res, next) {
  if (req.invite) {
    return next();
  }

  if (process.env.ALLOW_REGISTRATION === undefined || isEnabled(process.env.ALLOW_REGISTRATION)) {
    // Check Turnstile if enabled
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
