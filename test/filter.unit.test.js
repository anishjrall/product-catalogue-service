// test/filter.unit.test.js
// Pure unit tests for the v2.0 filterProducts() helper.

const test = require("node:test");
const assert = require("node:assert/strict");
const { filterProducts, ValidationError } = require("../src/lib/search");

const sample = [
  { id: 1, name: "Flux Capacitor", description: "time travel", category: "electronics", price: 999.99 },
  { id: 2, name: "Hoverboard", description: "no roads needed", category: "sports", price: 249.5 },
  { id: 3, name: "Time Circuits Display", description: "shows time", category: "electronics", price: 150 },
  { id: 4, name: "Sports Almanac", description: "fifty years of results", category: "books", price: 39.99 },
];

test("v2.0 filters by category", () => {
  const { products } = filterProducts(sample, { category: "electronics" });
  assert.equal(products.length, 2);
});

test("v2.0 filters by price range", () => {
  const { products } = filterProducts(sample, { minPrice: "100", maxPrice: "300" });
  assert.deepEqual(products.map((p) => p.id).sort(), [2, 3]);
});

test("v2.0 combines keyword + category + price range", () => {
  const { products } = filterProducts(sample, { keyword: "time", category: "electronics", maxPrice: "500" });
  assert.equal(products.length, 1);
  assert.equal(products[0].id, 3);
});

test("v2.0 paginates results", () => {
  const page1 = filterProducts(sample, { limit: "2", page: "1" });
  const page2 = filterProducts(sample, { limit: "2", page: "2" });
  assert.equal(page1.products.length, 2);
  assert.equal(page2.products.length, 2);
  assert.equal(page1.pagination.totalPages, 2);
  assert.notDeepEqual(page1.products, page2.products);
});

test("v2.0 rejects a non-numeric minPrice", () => {
  assert.throws(() => filterProducts(sample, { minPrice: "cheap" }), ValidationError);
});

test("v2.0 rejects minPrice greater than maxPrice", () => {
  assert.throws(() => filterProducts(sample, { minPrice: "500", maxPrice: "100" }), ValidationError);
});

test("v2.0 rejects an invalid page number", () => {
  assert.throws(() => filterProducts(sample, { page: "0" }), ValidationError);
  assert.throws(() => filterProducts(sample, { page: "abc" }), ValidationError);
});

test("v2.0 rejects a limit outside 1-100", () => {
  assert.throws(() => filterProducts(sample, { limit: "500" }), ValidationError);
});

test("v2.0 returns an empty result set (not an error) when nothing matches", () => {
  const { products, pagination } = filterProducts(sample, { keyword: "delorean" });
  assert.deepEqual(products, []);
  assert.equal(pagination.total, 0);
});
