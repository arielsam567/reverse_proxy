require("dotenv").config();

const express = require("express");
const app = express();
const axios = require("axios");
const { createProxyMiddleware } = require("http-proxy-middleware");

const port = process.env.PORT || 3005;

// Novo: gera configurações a partir de process.env.URL
const apiConfigurations = [];
const url = process.env.URL;

if (url) {
  console.log(url);

  const urls = url.split(",");

  urls.forEach((urlAux, idx) => {
    // Usa o próprio valor da URL como prefixo (removendo http(s):// e barras)

    const prefix = urlAux
      .replace(/^https?:\/\//, "")
      .replace(/[\/:]/g, "_")
      .toLocaleLowerCase();

    const endpoint = process.env[`${urlAux}`];

    console.log(`Configuração da API: ${prefix} -> ${endpoint}`);

    apiConfigurations.push({
      prefix: prefix.toLowerCase(),

      endpoint: endpoint,
    });
  });
}

// Log de requisições

app.use((req, res, next) => {
  console.log(`\n📢 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  const realUrl = req.url; 
  const apiConfig = apiConfigurations.find((c) => c.prefix === realUrl.split("/")[1]);
  if (apiConfig) {
    const restOfPath = realUrl.split("/").slice(2).join("/");
    console.log(`🔗 URL da API: ${apiConfig.endpoint}/${restOfPath}`);
  }
  next();
});

app.get("/ping", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

 
/**

 * Creates a proxy middleware with common configuration

 * @param {string} target - The target URL to proxy to

 * @param {string} pathPrefix - The path prefix to remove from the request

 * @returns {Middleware} Configured proxy middleware

 */

const createApiProxy = (target, pathPrefix) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    secure: false,
    timeout: 120000,
    proxyTimeout: 120000,
    pathRewrite: { [`^/${pathPrefix}`]: "" },
    on: {
      proxyReq: (proxyReq, req, res) => {
        const headers = proxyReq.getHeaders();

        Object.keys(headers)
          .filter(
            (name) =>
              name === "cookie" ||
              name.startsWith("sec-fetch-") ||
              name === "referer"
          )
          .forEach((name) => {
            proxyReq.removeHeader(name); // console.log(`🗑️ Removido header: ${name}`);
          }); // console.log("headers", headers); // console.log(`🔁 Proxy → ${req.method} ${proxyReq.path}`);
      },

      proxyRes: (proxyRes, req, res) => {
        proxyRes.headers["content-type"] = "application/json"; // console.log(`🔁 Resposta: ${proxyRes.statusCode}`);
        console.log(`🔁 Resposta: ${proxyRes.statusCode}`)  ;
          let body = "";
          proxyRes.on("data", (chunk) => {
            body += chunk.toString("utf8");
          });

          proxyRes.on("end", () => {
            console.log("📦 Body da resposta:", body);
          });
      },
      error: (err, req, res) => {
        console.error("⚠️ Proxy error:", err.message);
        res.setHeader("Content-Type", "application/json");
        res.status(500).json({ error: err.message });
      },
    },
  });
};

// Setup proxies para todas APIs configuradas
apiConfigurations.forEach((config) => {
  app.use(`/${config.prefix}`, createApiProxy(config.endpoint, config.prefix));
});

app.listen(port, () => {
  console.log(`\nServidor proxy rodando em http://localhost:${port}`); // Log dos endpoints configurados
  apiConfigurations.forEach((config) => {
    console.log(
      `\nEndpoint configurado (${config.prefix}): ${config.endpoint}`
    );

    console.log(`Teste: http://localhost:${port}/${config.prefix}`);
  });
});
