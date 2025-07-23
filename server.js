require("dotenv").config();
const express = require("express");
const app = express();
const axios = require("axios");
const { createProxyMiddleware } = require("http-proxy-middleware");

const port = process.env.PORT || 3005;

// Configuration objects for each API endpoint
const apiConfigurations = [
  //task endoint
  {
    prefix: "task_api",
    endpoint: process.env.TASK_ENDPOINT,
    examplePath: "",
  },
  //SCOPE_LOCAL
  {
    prefix: "scope_local",
    endpoint: process.env.SCOPE_LOCAL,
    examplePath: "/api/v1/scopes/projection/scopeId/0K71HF7HWQ4DP",
  },

  //EDB_QA_API
  {
    prefix: "edb_qa_api",
    endpoint: process.env.EDB_QA_ENDPOINT,
    examplePath: "/api/v1/edb/objects/01849b03-b8bc-761e-80b7-4b851ccc8e4b",
  },

  //scope_api
  {
    prefix: "scope_qa_api",
    endpoint: process.env.SCOPE_QA_ENDPOINT,
    examplePath: "/api/v1/scopes/projection/scopeId/0K71HF7HWQ4DP",
  },
  {
    prefix: "studio_qa_api",
    endpoint: process.env.STUDIO_QA_ENDPOINT,
    examplePath:
      "/api/v1/content/search?type=MODEL_OBJECT&rootId=01849b03-b8bc-761e-80b7-4b851ccc8e4b&name=bici",
  },
  {
    prefix: "model_qa_api",
    endpoint: process.env.MODEL_QA_ENDPOINT,
    examplePath: "/api/v1/",
  },

  // dev
  //EDB_QA_API
  {
    prefix: "edb_dev_api",
    endpoint: process.env.EDB_DEV_ENDPOINT,
    examplePath: "/api/v1/edb/objects/01849b03-b8bc-761e-80b7-4b851ccc8e4b",
  },

  //scope_api
  {
    prefix: "scope_dev_api",
    endpoint: process.env.SCOPE_DEV_ENDPOINT,
    examplePath: "/api/v1/scopes/projection/scopeId/0K71HF7HWQ4DP",
  },
  {
    prefix: "studio_dev_api",
    endpoint: process.env.STUDIO_DEV_ENDPOINT,
    examplePath:
      "/api/v1/content/search?type=MODEL_OBJECT&rootId=01849b03-b8bc-761e-80b7-4b851ccc8e4b&name=bici",
  },
  {
    prefix: "model_dev_api",
    endpoint: process.env.MODEL_DEV_ENDPOINT,
    examplePath: "/api/v1/",
  },
];

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
    const scopeEndpoint = apiConfigurations.find(
      (c) => c.prefix === "scope_api"
    ).endpoint;
    const response = await axios.get(
      `${scopeEndpoint}/api/v1/scopes/projection/scopeId/0K71HF7HWQ4DP`,
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
            proxyReq.removeHeader(name);
            // console.log(`🗑️ Removido header: ${name}`);
          });

        // console.log("headers", headers);
        // console.log(`🔁 Proxy → ${req.method} ${proxyReq.path}`);
      },
      proxyRes: (proxyRes, req, res) => {
        proxyRes.headers["content-type"] = "application/json";
        // console.log(`🔁 Resposta: ${proxyRes.statusCode}`);
      },
      error: (err, req, res) => {
        console.error("⚠️ Proxy error:", err.message);
        res.setHeader("Content-Type", "application/json");
        res.status(500).json({ error: err.message });
      },
    },
  });
};

// Setup proxies for all configured APIs
apiConfigurations.forEach((config) => {
  app.use(`/${config.prefix}`, createApiProxy(config.endpoint, config.prefix));
});

app.listen(port, () => {
  console.log(`\nServidor proxy rodando em http://localhost:${port}`);

  // Log all configured endpoints
  apiConfigurations.forEach((config) => {
    console.log(
      `\nEndpoint configurado (${config.prefix}): ${config.endpoint}`
    );
    console.log(
      `Teste: http://localhost:${port}/${config.prefix}${config.examplePath}`
    );
  });
});
