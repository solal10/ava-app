const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 8080;

// Proxy vers le tunnel Cloudflare
const proxy = createProxyMiddleware({
  target: 'https://shortly-bind-careers-irish.trycloudflare.com',
  changeOrigin: true,
  secure: true,
  logLevel: 'debug'
});

// Rediriger tout le trafic
app.use('/', proxy);

app.listen(PORT, () => {
  console.log(`🔄 Proxy server running on port ${PORT}`);
  console.log(`🎯 Redirecting https://ava-garmin-webhook.loca.lt → https://shortly-bind-careers-irish.trycloudflare.com`);
});