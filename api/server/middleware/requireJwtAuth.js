const cookies = require('cookie');
const passport = require('passport');
const { isEnabled } = require('@aladin/api');

/**
 * Custom Middleware to handle JWT authentication, with support for OpenID token reuse
 * Switches between JWT and OpenID authentication based on cookies and environment settings
 */
const requireJwtAuth = (req, res, next) => {
  // Check if token provider is specified in cookies
  const cookieHeader = req.headers.cookie;
  const tokenProvider = cookieHeader ? cookies.parse(cookieHeader).token_provider : null;

  // Use OpenID authentication if token provider is OpenID and OPENID_REUSE_TOKENS is enabled
  if (tokenProvider === 'openid' && isEnabled(process.env.OPENID_REUSE_TOKENS)) {
    return passport.authenticate('openidJwt', { session: false })(req, res, next);
  }

  // Default to standard JWT authentication
  return passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) { return next(err); }
    if (!user) { return res.status(401).send('Unauthorized'); }
    
    const isBrowser = req.headers['sec-fetch-mode'] || req.headers['sec-fetch-site'] || req.headers['origin'];
    if (!isBrowser && !user.api_tester) {
        return res.status(403).json({ message: 'Programmatic API access requires the Dev API Tester role.' });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

module.exports = requireJwtAuth;
