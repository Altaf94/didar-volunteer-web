/**
 * API origin (no path) — all requests use: API_BASE_URL + path (e.g. /api/volunteers/...).
 *
 * CRA inlines `REACT_APP_*` at build time. Set in `.env` / `.env.local` and
 * in Vercel → Project → Environment Variables.
 *
 * Local development
 * -----------------
 * The browser should NOT send API calls to the CRA dev server (localhost:3000);
 * that origin is the UI only. Here we always set API_BASE_URL to your API host
 * (REACT_APP_API_URL or http://127.0.0.1:8001).
 *
 * Production
 * ----------
 * 1) Same-origin mode:
 *    API_BASE_URL is "" so the browser uses relative /api/... on the deployed host.
 *
 * 2) Direct API mode:
 *    REACT_APP_SAME_ORIGIN_API=0 and REACT_APP_API_URL points to public API origin.
 */

const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

const useSameOrigin = process.env.REACT_APP_SAME_ORIGIN_API !== '0';
const allowLocal = process.env.REACT_APP_ALLOW_LOCAL_API === '1';

const fromEnv = (process.env.REACT_APP_API_URL || '').trim().replace(/\/$/, '');

const LOCAL_DEV_DEFAULT = 'http://127.0.0.1:8001';

function isLoopbackUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const s = url.trim();

  const tryHost = (u) => {
    const { hostname } = new URL(u);

    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '[::1]'
    );
  };

  try {
    return tryHost(s);
  } catch {
    try {
      if (!/^https?:/i.test(s)) {
        return tryHost(`http://${s}`);
      }
    } catch {
      // ignore invalid URL
    }
  }

  return false;
}

function canUseDirectUrl(targetUrl) {
  if (!targetUrl) {
    return false;
  }

  if (isProd && isLoopbackUrl(targetUrl)) {
    return false;
  }

  if (allowLocal && !isProd) {
    return true;
  }

  if (!isLoopbackUrl(targetUrl)) {
    return true;
  }

  return false;
}

let resolved = '';

if (isDev) {
  // In development, always use real backend, not localhost:3000.
  resolved = (fromEnv || LOCAL_DEV_DEFAULT).replace(/\/$/, '');
} else if (useSameOrigin) {
  // In production same-origin mode, use relative URLs.
  resolved = '';
} else {
  if (fromEnv && canUseDirectUrl(fromEnv)) {
    resolved = fromEnv;
  } else if (isProd && fromEnv && !canUseDirectUrl(fromEnv)) {
    console.error(
      '[api] REACT_APP_API_URL is not usable in production. ' +
        'Set a public Heroku https:// origin, or use same-origin mode with rewrites.'
    );
    resolved = '';
  } else if (isProd && !fromEnv) {
    console.error(
      '[api] REACT_APP_SAME_ORIGIN_API=0 but REACT_APP_API_URL is missing. ' +
        'Set REACT_APP_API_URL to your public API origin.'
    );
    resolved = '';
  }
}

// Final API base URL.
// IMPORTANT: do not force 8000 here. Backend is running on 8001.
export const API_BASE_URL = resolved || LOCAL_DEV_DEFAULT;

export const HEALTH_CHECK_URL = API_BASE_URL
  ? `${API_BASE_URL}/health`
  : '/health';

console.log('apiBaseUrl config:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
  REACT_APP_SAME_ORIGIN_API: process.env.REACT_APP_SAME_ORIGIN_API,
  API_BASE_URL,
  HEALTH_CHECK_URL,
});