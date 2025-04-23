require("dotenv").config();
const express = require("express");
const axios = require("axios");
const https = require("https");
const app = express();
const port = 3005;

// Middleware para log das requisições
app.use((req, res, next) => {
  console.log(
    `\n[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
  );
  next();
});

// Middleware para parsear JSON
app.use(express.json());

// Health Check
app.get("/ping", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Handler para todas as rotas /scope_api
app.use("/scope_api", async (req, res) => {
  const targetBase = "http://scope-api-qas.weg.net";
  const apiPath = req.originalUrl.replace("/scope_api", "");
  const targetUrl = targetBase + apiPath;

  console.log(`🔁 Proxying to: ${targetUrl}`);

  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      // headers: {
      //   ...req.headers,
      //   host: new URL(targetBase).hostname,
      // },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    console.log(`✅ Received ${response.status} from target`);

    // Encaminha os headers necessários
    res
      .status(response.status)
      .set({
        "Content-Type": response.headers["content-type"],
        "Cache-Control": response.headers["cache-control"],
      })
      .send(response.data);
  } catch (error) {
    console.error("⚠️ Proxy error:", error.message);

    const statusCode = error.response?.status || 500;
    const errorData = error.response?.data || {
      error: "Proxy error",
      details: error.message,
    };

    res.status(statusCode).json(errorData);
  }
});

app.listen(port, () => {
  console.log(`\n🚀 Proxy server running at http://localhost:${port}`);
  console.log(`🔗 Proxying to: http://scope-api-qas.weg.net`);
  console.log(
    `📌 Test with: curl http://localhost:${port}/scope_api/api/v1/scopes/projection/scopeId/0K71HF7HWQ4DP`
  );
});
