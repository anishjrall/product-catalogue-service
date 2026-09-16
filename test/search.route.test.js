// test/search.route.test.js
// End-to-end check that the /products/search route wires filterProducts()
// correctly (status codes, response shape) - the filtering rules themselves
// are covered in detail by test/filter.unit.test.js.

const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/server");

let server, baseUrl;

test.before(() => {
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

test("GET /products/search with no params returns everything, paginated", async () => {
  const res = await fetch(`${baseUrl}/products/search`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.products));
  assert.ok(body.pagination);
});

test("GET /products/search?keyword= filters results", async () => {
  const res = await fetch(`${baseUrl}/products/search?keyword=time`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(body.products.length > 0);
  assert.ok(body.products.every((p) => `${p.name} ${p.description}`.toLowerCase().includes("time")));
});

test("GET /products/search?minPrice=notanumber returns 400", async () => {
  const res = await fetch(`${baseUrl}/products/search?minPrice=notanumber`);
  assert.equal(res.status, 400);
});

test("GET /products/search?page=0 returns 400", async () => {
  const res = await fetch(`${baseUrl}/products/search?page=0`);
  assert.equal(res.status, 400);
});
