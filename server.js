// Production server: serves the React build and proxies /api/* to the backend.
// This replaces `serve -s build` so that API calls are forwarded instead of
// returning the SPA's index.html (which caused "Unexpected token '<'" JSON errors).

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Backend API origin (the separate Heroku API app).
const API_TARGET =
  process.env.API_TARGET_URL ||
  'https://northen-volunteer-25070e7d956a.herokuapp.com';

// Proxy /api/* → backend
app.use(
  '/api',
  createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
  })
);

// Proxy /health → backend health check
app.use(
  '/health',
  createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
  })
);

// Serve static React build
app.use(express.static(path.join(__dirname, 'build')));

// SPA fallback — all other routes return index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Proxying /api/* → ${API_TARGET}`);
});
