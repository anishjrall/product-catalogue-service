// test/search.unit.test.js
// Pure unit tests for src/lib/search.js - run with `node --test`, no Express
// or network access required.

const test = require("node:test");
const assert = require("node:assert/strict");
const { searchByKeyword } = require("../src/lib/search");

const sample = [
  { id: 1, name: "Flux Capacitor", description: "makes time travel possible" },
  { id: 2, name: "Hoverboard", description: "no roads needed" },
  { id: 3, name: "Time Circuits Display", description: "shows destination time" },
];

test("v1.1 searchByKeyword: matches on name (case-insensitive)", () => {
  const res = searchByKeyword(sample, "flux");
  assert.equal(res.length, 1);
  assert.equal(res[0].id, 1);
});

test("v1.1 searchByKeyword: matches on description too", () => {
  const res = searchByKeyword(sample, "time");
  assert.equal(res.length, 2);
  assert.deepEqual(res.map((r) => r.id).sort(), [1, 3]);
});

test("v1.1 searchByKeyword: no keyword returns everything", () => {
  const res = searchByKeyword(sample, undefined);
  assert.equal(res.length, sample.length);
});

test("v1.1 searchByKeyword: no matches returns empty array", () => {
  const res = searchByKeyword(sample, "delorean");
  assert.deepEqual(res, []);
});
