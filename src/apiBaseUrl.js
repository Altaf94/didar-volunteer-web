/**
 * API origin (no path) — all requests use: API_BASE_URL + path (e.g. /api/volunteers/...).
 *
 * CRA inlines `REACT_APP_*` at build time. Set in `.env` / `.env.local` and
 * in Vercel → Project → Environment Variables.
 *
 * Local development
 * -----------------
 * The browser should **not** send API calls to the CRA dev server (localhost:3000); that
 * origin is the UI only. Here we always set `API_BASE_URL` to your API host
 * (`REACT_APP_API_URL` or `http://127.0.0.1:8001`). The API must allow CORS for
 * `http://localhost:3000` (or your dev URL).
 *
 * Production
 * ----------
 * 1) **Same-origin (default, `REACT_APP_SAME_ORIGIN_API` not `0`)** — `API_BASE_URL` is
 *    `""` so the browser uses relative `/api/...` on the Vercel host; `vercel.json` rewrites
 *    forward to Heroku. No CORS to Heroku in the client bundle.
 * 2) **Direct to API** — `REACT_APP_SAME_ORIGIN_API=0` and `REACT_APP_API_URL` to your
 *    public API origin. Heroku must list your Vercel origin in CORS. Use
 *    `REACT_APP_ALLOW_LOCAL_API=1` only for loopback in non-production-like builds if needed
 *    (not typical on Vercel).
 *
 * Auth: `Authorization: Bearer <token>` is added in `api.js` / `tokenService`.
 */
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

const useSameOrigin = process.env.REACT_APP_SAME_ORIGIN_API !== '0';
const allowLocal = process.env.REACT_APP_ALLOW_LOCAL_API === '1';
const fromEnv = (process.env.REACT_APP_API_URL || '').trim().replace(/\/$/, '');

const LOCAL_DEV_DEFAULT = 'http://127.0.0.1:8001';

function isLoopbackUrl(url) {
  if (!url || typeof url !== 'string') return false;
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
      if (!/^https?:/i.test(s)) return tryHost(`http://${s}`);
    } catch {
      // ignore
    }
  }
  return false;
}

function canUseDirectUrl(t) {
  if (!t) return false;
  if (isProd && isLoopbackUrl(t)) return false;
  if (allowLocal || !isLoopbackUrl(t)) return true;
  return false;
}

let resolved = '';

if (isDev) {
  // Never use same-origin to port 3000 for API: always hit the real backend.
  resolved = (fromEnv || LOCAL_DEV_DEFAULT).replace(/\/$/, '');
} else if (useSameOrigin) {
  resolved = '';
} else {
  if (fromEnv && canUseDirectUrl(fromEnv)) {
    resolved = fromEnv;
  } else if (isProd && fromEnv && !canUseDirectUrl(fromEnv)) {
    console.error(
      '[api] REACT_APP_API_URL is not usable in production (e.g. loopback). ' +
        'Set a public Heroku `https://…` origin, or use same-origin mode and vercel rewrites.'
    );
    resolved = '';
  } else if (isProd && !fromEnv) {
    console.error(
      '[api] REACT_APP_SAME_ORIGIN_API=0 but REACT_APP_API_URL is missing. ' +
        'Set REACT_APP_API_URL on Vercel to your Heroku API origin, or use same-origin mode with vercel.json rewrites.'
    );
    resolved = '';
  }
}

export const API_BASE_URL = resolved;

/**
 * `GET` target for the API health check — same API host as other calls (not the page origin
 * in development).
 */
export const HEALTH_CHECK_URL = (() => {
  if (API_BASE_URL) {
    return `${API_BASE_URL}/health`;
  }
  if (fromEnv) {
    return `${fromEnv}/health`;
  }
  return '/health';
})();
