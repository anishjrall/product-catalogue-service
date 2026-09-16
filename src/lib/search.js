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

/**
 * v2.0: full-featured filter used by /products/search.
 * Supports keyword, category, min/max price, and pagination.
 * Throws a ValidationError (with a client-safe .message) for bad input,
 * so the route layer can translate it into a clean 400 response.
 */
class ValidationError extends Error {}

function filterProducts(products, query = {}) {
  const { keyword, category, minPrice, maxPrice, page = "1", limit = "10" } = query;

  let results = searchByKeyword(products, keyword);

  if (category !== undefined) {
    results = results.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
  }

  const min = minPrice !== undefined ? Number(minPrice) : undefined;
  const max = maxPrice !== undefined ? Number(maxPrice) : undefined;

  if (minPrice !== undefined && Number.isNaN(min)) {
    throw new ValidationError("minPrice must be a number.");
  }
  if (maxPrice !== undefined && Number.isNaN(max)) {
    throw new ValidationError("maxPrice must be a number.");
  }
  if (min !== undefined && max !== undefined && min > max) {
    throw new ValidationError("minPrice cannot be greater than maxPrice.");
  }

  if (min !== undefined) results = results.filter((p) => p.price >= min);
  if (max !== undefined) results = results.filter((p) => p.price <= max);

  const pageNum = Number(page);
  const limitNum = Number(limit);

  if (!Number.isInteger(pageNum) || pageNum < 1) {
    throw new ValidationError("page must be a positive integer.");
  }
  if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new ValidationError("limit must be a positive integer between 1 and 100.");
  }

  const total = results.length;
  const start = (pageNum - 1) * limitNum;
  const paged = results.slice(start, start + limitNum);

  return {
    products: paged,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
}

module.exports = { searchByKeyword, filterProducts, ValidationError };
