const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const ini = require('ini');
const fs = require('fs');
const path = require('path');

// Lê o arquivo de configuração
const configPath = path.join(__dirname, 'proxy_config.ini');
const config = ini.parse(fs.readFileSync(configPath, 'utf-8'));

const proxies = [
  {
    config: config.proxy,
    route: '/',
  },
  {
    config: config.studio,
    route: '/',
  }
];

proxies.forEach(({ config, route }) => {
  const listenPort = config.listen_port || 8080;
  const targetUrl = config.target_url;
  const timeout = (parseInt(config.timeout, 10) || 60) * 1000;

  const app = express();

  app.use(route, createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    secure: config.ssl === 'true',
    timeout: timeout,
    logLevel: config.logging?.level?.toLowerCase() || 'info',
    onProxyReq: (proxyReq, req, res) => {
      fs.appendFileSync(
        config.logging?.log_file || 'proxy_server.log',
        `[${new Date().toISOString()}] ${req.method} ${req.url}\n`
      );
    }
  }));

  app.listen(listenPort, () => {
    console.log(`Proxy rodando em http://localhost:${listenPort}${route} -> ${targetUrl}`);
  });
});