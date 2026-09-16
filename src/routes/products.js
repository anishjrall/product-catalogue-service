// routes/products.js
// v1.0: list all products, fetch a single one.
// v1.1: + keyword search.

const express = require("express");
const products = require("../data/products.json");
const { searchByKeyword } = require("../lib/search");

const router = express.Router();

// GET /products/search?keyword=xxx
// NOTE: registered before "/:id" so "search" is never mistaken for an id.
router.get("/search", (req, res) => {
  const { keyword } = req.query;
  const results = searchByKeyword(products, keyword);
  res.status(200).json({ count: results.length, products: results });
});

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
