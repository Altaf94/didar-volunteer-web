/**
 * Single backend origin. CRA inlines this at build time.
 *
 * If REACT_APP_API_URL is missing or points to loopback, we use the Heroku
 * app — a shell `export REACT_APP_API_URL=http://localhost:8001` overrides
 * .env in CRA and was still baking :8001 into the bundle.
 *
 * For local backend dev, set in .env:
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

const allowLocal = process.env.REACT_APP_ALLOW_LOCAL_API === '1';
const fromEnv = process.env.REACT_APP_API_URL;

let resolved = DEFAULT_API_BASE;
if (fromEnv && fromEnv.trim() !== '') {
  const t = fromEnv.trim().replace(/\/$/, '');
  if (allowLocal || !isLoopbackUrl(t)) {
    resolved = t;
  }
}

export const API_BASE_URL = resolved;
