// lib/search.js (introduced in v1.1)
// Pure filtering functions with no framework dependency, so they can be unit
// tested directly with Node's built-in test runner - no npm install needed.

/**
 * v1.1: simple case-insensitive substring match against name/description.
 */
function searchByKeyword(products, keyword) {
  if (!keyword) return products;
  const needle = String(keyword).toLowerCase();
  return products.filter(
    (p) => p.name.toLowerCase().includes(needle) || p.description.toLowerCase().includes(needle)
  );
}

module.exports = { searchByKeyword };
