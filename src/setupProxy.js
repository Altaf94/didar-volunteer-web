const { createProxyMiddleware } = require('http-proxy-middleware');

// The dev app uses absolute API URLs to `REACT_APP_API_URL` (see apiBaseUrl.js), so the browser
// no longer needs /api on port 3000. Kept in case a tool requests same-origin /api in dev.
const DEFAULT_LOCAL_API = 'http://127.0.0.1:8001';

function isLoopbackUrl(u) {
  if (!u || typeof u !== 'string') return false;
  const s = u.trim();
  const tryHost = (url) => {
    const { hostname } = new URL(url);
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

function proxyTarget() {
  const e = process.env.REACT_APP_API_URL;
  const allowLocal = process.env.REACT_APP_ALLOW_LOCAL_API === '1';
  if (e && e.trim() && (allowLocal || !isLoopbackUrl(e))) {
    return e.trim().replace(/\/$/, '');
  }
  return DEFAULT_LOCAL_API;
}

function makeProxy() {
  return {
    target: proxyTarget(),
    changeOrigin: true,
    secure: true,
    onProxyReq: (_proxyReq, req) => {
      console.log('Proxying:', req.method, req.path);
    },
  };
}

module.exports = function (app) {
  app.use('/api', createProxyMiddleware(makeProxy()));
  // /health is on the API host root, not /api/health (testConnection in api.js)
  app.use('/health', createProxyMiddleware(makeProxy()));
};
