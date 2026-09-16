// test/v1.test.js
// Covers the v1.0 surface: /health, GET /products, GET /products/:id

const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/server");

let server, baseUrl;

test.before(() => {
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

test("GET /health returns ok", async () => {
  const res = await fetch(`${baseUrl}/health`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.status, "ok");
});

test("GET /products lists the catalogue", async () => {
  const res = await fetch(`${baseUrl}/products`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.products));
  assert.ok(body.products.length > 0);
});

test("GET /products/:id returns a single product", async () => {
  const res = await fetch(`${baseUrl}/products/1`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.product.id, 1);
});

test("GET /products/:id 404s for an unknown id", async () => {
  const res = await fetch(`${baseUrl}/products/9999`);
  assert.equal(res.status, 404);
});
