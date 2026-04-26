const { createProxyMiddleware } = require('http-proxy-middleware');

// Keep in sync with src/apiBaseUrl.js (same hostnames = loopback, same default).
const DEFAULT_API = 'https://northen-volunteer-25070e7d956a.herokuapp.com';

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
  return DEFAULT_API;
}

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: proxyTarget(),
      changeOrigin: true,
      secure: true,
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying:', req.method, req.path);
      },
    })
  );
};
