require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3005;

app.use((req, res, next) => {
  console.log(`\n📢 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/ping", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

const { createProxyMiddleware } = require("http-proxy-middleware");
const apiProxy = createProxyMiddleware({
  target: process.env.SCOPE_ENDPOINT,
  changeOrigin: true,
  pathRewrite: { "^/scope": "" },
  followRedirects: false, // Isso evita redirecionamentos
  onProxyReq: (proxyReq, req, res) => {
    console.log(
      "🔥 Proxy chamado! URL:",
      `${process.env.SCOPE_ENDPOINT}${req.originalUrl.replace("/scope", "")}`
    );
  },
  onProxyRes: (proxyRes, req, res) => {
    // Impede redirecionamentos do servidor de destino
    if ([301, 302, 307, 308].includes(proxyRes.statusCode)) {
      delete proxyRes.headers.location;
      proxyRes.statusCode = 200;
    }
  },
});

app.use("/scope", apiProxy);

app.listen(port, () => {
  console.log(`\nServidor rodando em http://localhost:${port}`);
  console.log(
    `Teste:\ncurl http://localhost:3005/scope/api/v1/scopes/projection/scopeId/0K71HF7HWQ4DP`
  );
});
