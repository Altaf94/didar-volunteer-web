/**
 * API origin for fetches. CRA inlines env vars at build time.
 *
 * Same-origin (default): requests go to /api/... on the *page* origin so the
 * browser does not need CORS to Heroku. Local dev: setupProxy; production:
 * vercel.json / netlify.toml must proxy /api to the real API.
 *
 * Opt out of same-origin (call Heroku from the browser — requires CORS for your
 * origin, not only http://localhost:3000):
 *   REACT_APP_SAME_ORIGIN_API=0
 *   REACT_APP_API_URL=https://northen-volunteer-25070e7d956a.herokuapp.com
 *
 * Local API:
 *   REACT_APP_ALLOW_LOCAL_API=1
 *   REACT_APP_API_URL=http://127.0.0.1:8001
 */
const DEFAULT_API_BASE = 'https://northen-volunteer-25070e7d956a.herokuapp.com';

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

// Default true: Vercel/CI often omit .env; === '1' was leaving production on full Heroku URL (CORS fail).
const useSameOrigin = process.env.REACT_APP_SAME_ORIGIN_API !== '0';
const allowLocal = process.env.REACT_APP_ALLOW_LOCAL_API === '1';
const fromEnv = process.env.REACT_APP_API_URL;

let resolved;

if (useSameOrigin) {
  // "" => fetch("/api/...") on current host; proxy forwards to the real API.
  resolved = '';
} else {
  resolved = DEFAULT_API_BASE;
  if (fromEnv && fromEnv.trim() !== '') {
    const t = fromEnv.trim().replace(/\/$/, '');
    if (allowLocal || !isLoopbackUrl(t)) {
      resolved = t;
    }
  }
}

export const API_BASE_URL = resolved;
