// routes/products.js (v1.0)
// Base product catalogue endpoints: list all products, fetch a single one.

const express = require("express");
const products = require("../data/products.json");

const router = express.Router();

// GET /products - list the full catalogue.
router.get("/", (req, res) => {
  res.status(200).json({ count: products.length, products });
});

// GET /products/:id - fetch a single product.
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const product = products.find((p) => p.id === id);

  if (!Number.isInteger(id) || !product) {
    return res.status(404).json({ error: "Product not found." });
  }

  res.status(200).json({ product });
});

module.exports = router;
