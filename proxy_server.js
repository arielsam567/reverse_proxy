const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const ini = require('ini');
const fs = require('fs');
const path = require('path');

// Lê o arquivo de configuração
const configPath = path.join(__dirname, 'proxy_config.ini');
const config = ini.parse(fs.readFileSync(configPath, 'utf-8'));

const listenPort = config.proxy.listen_port || 8080;
const targetUrl = config.proxy.target_url;
const timeout = (parseInt(config.proxy.timeout, 10) || 60) * 1000;

const app = express();

app.use('/', createProxyMiddleware({
  target: targetUrl,
  changeOrigin: true,
  secure: config.proxy.ssl === 'true',
  timeout: timeout,
  logLevel: config.logging.level?.toLowerCase() || 'info',
  onProxyReq: (proxyReq, req, res) => {
    // Log básico
    fs.appendFileSync(
      config.logging.log_file || 'proxy_server.log',
      `[${new Date().toISOString()}] ${req.method} ${req.url}\n`
    );
  }
}));

app.listen(listenPort, () => {
  console.log(`Proxy rodando em http://localhost:${listenPort} -> ${targetUrl}`);
});