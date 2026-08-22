const express = require('express');
const crypto = require('crypto');
const { CacheKeys } = require('aladin-data-provider');
const { getLogStores } = require('~/cache');
const { createSetBalanceConfig } = require('@aladin/api');
const {
  resetPasswordRequestController,
  resetPasswordController,
  registrationController,
  graphTokenController,
  refreshController,
} = require('~/server/controllers/AuthController');
const {
  regenerateBackupCodes,
  disable2FA,
  confirm2FA,
  enable2FA,
  verify2FA,
} = require('~/server/controllers/TwoFactorController');
const { verify2FAWithTempToken } = require('~/server/controllers/auth/TwoFactorAuthController');
const { logoutController } = require('~/server/controllers/auth/LogoutController');
const { loginController } = require('~/server/controllers/auth/LoginController');
const { getAppConfig } = require('~/server/services/Config');
const middleware = require('~/server/middleware');
const { Balance } = require('~/db/models');

const preventProgrammatic = (req, res, next) => {
  const isBrowser = req.headers['sec-fetch-mode'] || req.headers['sec-fetch-site'] || req.headers['origin'];
  if (!isBrowser) {
    return res.status(403).json({ message: 'Direct programmatic registration/login is disabled to prevent bot abuse.' });
  }
  next();
};

const setBalanceConfig = createSetBalanceConfig({
  getAppConfig,
  Balance,
});

const router = express.Router();

const ldapAuth = !!process.env.LDAP_URL && !!process.env.LDAP_USER_SEARCH_BASE;
//Local
router.post('/logout', middleware.requireJwtAuth, logoutController);
router.post(
  '/login',
  preventProgrammatic,
  middleware.logHeaders,
  middleware.loginLimiter,
  middleware.checkBan,
  ldapAuth ? middleware.requireLdapAuth : middleware.requireLocalAuth,
  setBalanceConfig,
  loginController,
);
router.post('/refresh', refreshController);
router.post(
  '/register',
  preventProgrammatic,
  middleware.registerLimiter,
  middleware.checkBan,
  middleware.checkInviteUser,
  middleware.validateRegistration,
  registrationController,
);
router.post(
  '/requestPasswordReset',
  middleware.resetPasswordLimiter,
  middleware.checkBan,
  middleware.validatePasswordReset,
  resetPasswordRequestController,
);
router.post(
  '/resetPassword',
  middleware.checkBan,
  middleware.validatePasswordReset,
  resetPasswordController,
);

router.get('/2fa/enable', middleware.requireJwtAuth, enable2FA);
router.post('/2fa/verify', middleware.requireJwtAuth, verify2FA);
router.post('/2fa/verify-temp', middleware.checkBan, verify2FAWithTempToken);
router.post('/2fa/confirm', middleware.requireJwtAuth, confirm2FA);
router.post('/2fa/disable', middleware.requireJwtAuth, disable2FA);
router.post('/2fa/backup/regenerate', middleware.requireJwtAuth, regenerateBackupCodes);

router.get('/graph-token', middleware.requireJwtAuth, graphTokenController);

const WINDOW_MS = 5 * 60 * 1000;
const getChallengeSecret = () => {
  const timeWindow = Math.floor(Date.now() / WINDOW_MS);
  const baseSecret = process.env.SENTINEL_GATEWAY_SECRET || 'default-secret';
  return `${baseSecret}-${timeWindow}`;
};

router.get('/register-challenge', (req, res) => {
  const session_id = crypto.randomBytes(32).toString('hex');
  const secret = getChallengeSecret();
  const challenge = crypto.createHmac('sha256', secret).update(session_id).digest('hex');
  
  const cache = getLogStores(CacheKeys.PENDING_REQ);
  cache.set(session_id, '1', WINDOW_MS); 
  
  res.json({ session_id, challenge });
});

module.exports = router;
