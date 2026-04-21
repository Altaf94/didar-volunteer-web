const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'https://api-mhip.azurewebsites.net',
      changeOrigin: true,
      secure: true,
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying:', req.method, req.path);
      },
    })
  );
};
