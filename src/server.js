// server.js (v1.0)
// Boots the product catalogue microservice.

const express = require("express");
const productsRouter = require("./routes/products");

const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = require("../package.json").version;

app.use(express.json());

// Liveness/readiness probe target for Docker/Kubernetes health checks.
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", version: VERSION });
});

app.use("/products", productsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[product-catalogue] unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Product catalogue service v${VERSION} listening on port ${PORT}`);
  });
}

module.exports = app;
