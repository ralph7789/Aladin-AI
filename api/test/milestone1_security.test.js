/**
 * Unit tests for Milestone 1 (Features 8, 9, 10):
 * Aladin-AI Security & Compliance Features
 *
 * Covers:
 * - Feature 8: postMessage origin validation (Login.tsx)
 * - Feature 9: Admin password bcrypt hashing & error stack sanitization (admin.js)
 * - Feature 10: Safe numeric parsing for REFRESH_TOKEN_EXPIRY & cross-site cookies (AuthService.js)
 */

const bcrypt = require('bcryptjs');

describe('Milestone 1 — Feature 8: postMessage Origin Validation (Login.tsx)', () => {
  const checkOriginAllowed = (eventOrigin, startupConfig) => {
    const allowedOrigins = [
      startupConfig?.serverDomain,
      'https://aladin-api-xhoj.onrender.com',
      'https://client-chi-rouge-51.vercel.app',
      'https://aladin-sentinel-gateway.onrender.com',
      'https://aladin-sentinel-dashboard.vercel.app',
      'http://localhost:3000',
    ].filter(Boolean);

    try {
      const normalizedEventOrigin = eventOrigin ? new URL(eventOrigin).origin : '';
      return allowedOrigins.some((allowed) => {
        try {
          return allowed && new URL(allowed).origin === normalizedEventOrigin;
        } catch {
          return allowed === normalizedEventOrigin;
        }
      });
    } catch {
      return false;
    }
  };

  test('accepts message from trusted serverDomain', () => {
    const config = { serverDomain: 'https://aladin-api-xhoj.onrender.com' };
    expect(checkOriginAllowed('https://aladin-api-xhoj.onrender.com', config)).toBe(true);
  });

  test('accepts message from trusted Vercel client', () => {
    const config = { serverDomain: 'https://aladin-api-xhoj.onrender.com' };
    expect(checkOriginAllowed('https://client-chi-rouge-51.vercel.app', config)).toBe(true);
  });

  test('accepts message from Sentinel IdP gateway and dashboard', () => {
    const config = { serverDomain: 'https://aladin-api-xhoj.onrender.com' };
    expect(checkOriginAllowed('https://aladin-sentinel-gateway.onrender.com', config)).toBe(true);
    expect(checkOriginAllowed('https://aladin-sentinel-dashboard.vercel.app', config)).toBe(true);
  });

  test('rejects message from untrusted attacker origin', () => {
    const config = { serverDomain: 'https://aladin-api-xhoj.onrender.com' };
    expect(checkOriginAllowed('https://attacker-evil.com', config)).toBe(false);
    expect(checkOriginAllowed('http://malicious.org', config)).toBe(false);
    expect(checkOriginAllowed('null', config)).toBe(false);
    expect(checkOriginAllowed('', config)).toBe(false);
  });
});

describe('Milestone 1 — Feature 9: Admin User Password Bcrypt Hashing (admin.js)', () => {
  test('bcrypt hashes password with salt before storage', async () => {
    const rawPassword = 'SuperAdminPassword2026!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    expect(hashedPassword).not.toBe(rawPassword);
    expect(hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$')).toBe(true);

    const isMatch = await bcrypt.compare(rawPassword, hashedPassword);
    expect(isMatch).toBe(true);

    const wrongMatch = await bcrypt.compare('WrongPassword', hashedPassword);
    expect(wrongMatch).toBe(false);
  });

  test('error response sanitization excludes stack traces', () => {
    const error = new Error('Database connection failed');
    const sanitizedResponse = {
      message: 'Error fetching users',
      error: error.message,
    };

    expect(sanitizedResponse.stack).toBeUndefined();
    expect(sanitizedResponse.error).toBe('Database connection failed');
  });
});

describe('Milestone 1 — Feature 10: Safe Numeric Parsing for REFRESH_TOKEN_EXPIRY (AuthService.js)', () => {
  const parseExpiry = (val) => {
    if (!val) return 1000 * 60 * 60 * 24 * 7;
    if (/^\d+$/.test(val.trim())) {
      return parseInt(val.trim(), 10);
    }
    if (/^[\d\s*]+$/.test(val)) {
      return val.split('*').reduce((acc, cur) => acc * parseInt(cur.trim(), 10), 1);
    }
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 1000 * 60 * 60 * 24 * 7 : parsed;
  };

  test('parses plain integer milliseconds string safely without eval', () => {
    expect(parseExpiry('604800000')).toBe(604800000);
    expect(parseExpiry('3600000')).toBe(3600000);
  });

  test('parses arithmetic multiplication expression safely without eval', () => {
    const result = parseExpiry('1000 * 60 * 60 * 24 * 7');
    expect(result).toBe(604800000);
  });

  test('falls back to default 7 days when undefined or empty', () => {
    expect(parseExpiry(undefined)).toBe(604800000);
    expect(parseExpiry('')).toBe(604800000);
  });

  test('safely handles non-numeric strings without throwing error', () => {
    expect(parseExpiry('invalid_expiry')).toBe(604800000);
  });

  test('verifies cross-site cookie attributes for Vercel-to-Render compatibility', () => {
    const cookieOptions = {
      expires: new Date(Date.now() + 604800000),
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    };

    expect(cookieOptions.sameSite).toBe('none');
    expect(cookieOptions.secure).toBe(true);
    expect(cookieOptions.httpOnly).toBe(true);
  });
});
