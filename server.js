require("dotenv").config();
const express = require("express");
const app = express();
const axios = require("axios");
const { createProxyMiddleware } = require("http-proxy-middleware");

const port = 3005;

// Log de requisições
app.use((req, res, next) => {
  console.log(`\n📢 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/ping", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.get("/teste-ssl", async (req, res) => {
  try {
    const response = await axios.get(
      "https://scope-api-qas.weg.net/api/v1/scopes/projection/scopeId/0K71HF7HWQ4DP",
      {
        httpsAgent: new (require("https").Agent)({ rejectUnauthorized: false }),
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Erro direto:", error.response?.data || error.message);
    res.status(500).json({ error: "Falha na comunicação SSL" });
  }
});

app.use(
  "/scope_api",
  createProxyMiddleware({
    target: "https://scope-api-qas.weg.net",
    changeOrigin: true,
    secure: false,
    pathRewrite: { "^/scope_api": "" },
    on: {
      proxyReq: (proxyReq, req, res) => {
        // pega todos os headers atuais
        const headers = proxyReq.getHeaders();

        Object.keys(headers)
          .filter(
            (name) =>
              // aqui vc define o que remover; por ex., cookies e sec-fetch-*
              name === "cookie" ||
              name.startsWith("sec-fetch-") ||
              name === "referer"
          )
          .forEach((name) => {
            proxyReq.removeHeader(name);
            console.log(`🗑️ Removido header: ${name}`);
          });
          console.log("headers", headers);
        console.log(`🔁 Proxy → ${req.method} ${proxyReq.path}`);
      },
      proxyRes: (proxyRes, req, res) => {
        console.log(`🔁 Resposta: ${proxyRes.statusCode}`);
      },
      error: (err, req, res) => {
        console.error("⚠️ Proxy error:", err.message);
        res.status(500).json({ error: err.message });
      },
    },
  })
);

app.listen(port, () => {
  console.log(`\nServidor proxy rodando em http://localhost:${port}`);
  console.log(`Endpoint configurado: https://scope-api-qas.weg.net`);
  console.log(
    `Teste:\nhttp://localhost:${port}/scope_api/api/v1/scopes/projection/scopeId/0K71HF7HWQ4DP`
  );
});


//https://8zl74slh-3005.brs.devtunnels.ms/scope_api/api/v1/scopes/projection/scopeId/0K71HF7HWQ4DP