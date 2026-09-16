// routes/products.js

// v1.0: list all products, fetch a single one.
// v1.1: + keyword search.
// v2.0: search gains category/price/pagination filters and input validation.

const express = require("express");

const catalogue = require("../data/products.json");

const { filterProducts, ValidationError } = require("../lib/search");

const router = express.Router();

// GET /products/search?keyword=&category=&minPrice=&maxPrice=&page=&limit=

// NOTE: registered before "/:id" so "search" is never mistaken for an id.

router.get("/search", (req, res) => {
  try {
    const { products: results, pagination } = filterProducts(
      catalogue,
      req.query
    );

    res.status(200).json({
      count: results.length,
      pagination,
      products: results,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }

    throw err;
  }
});

// GET /products - list catalogue with pagination.

router.get("/", (req, res) => {
  try {
    const { products: results, pagination } = filterProducts(
      catalogue,
      req.query
    );

    res.status(200).json({
      count: results.length,
      pagination,
      products: results,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }

    throw err;
  }
});

// GET /products/:id - fetch a single product.

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);

  const product = catalogue.find((p) => p.id === id);

  if (!Number.isInteger(id) || !product) {
    return res.status(404).json({ error: "Product not found." });
  }

  res.status(200).json({ product });
});

module.exports = router;