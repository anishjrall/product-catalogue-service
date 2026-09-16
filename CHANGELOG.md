# Changelog

All notable changes to this microservice are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [2.0.0]

### Changed
- `GET /products/search` is enhanced with `category`, `minPrice`, `maxPrice`,
  `page`, and `limit` query parameters, combinable with `keyword`.
- Invalid query parameters (non-numeric prices, `minPrice > maxPrice`, an
  out-of-range `page`/`limit`) now return `400` with a descriptive message
  instead of silently misbehaving.
- A search with no matches returns `200` with an empty `products` array
  (not a `404`) since "no results" is a valid, successful search outcome.

## [1.1.0]

### Added
- `GET /products/search?keyword=xxx` - case-insensitive keyword search over
  product name and description.

## [1.0.0] - Base release

### Added
- `GET /health` - liveness/readiness probe.
- `GET /products` - list the full product catalogue.
- `GET /products/:id` - fetch a single product by id.
- Multi-stage, non-root Dockerfile with a container health check.
