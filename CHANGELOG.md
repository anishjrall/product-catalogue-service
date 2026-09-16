# Changelog

All notable changes to this microservice are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] - Base release

### Added
- `GET /health` - liveness/readiness probe.
- `GET /products` - list the full product catalogue.
- `GET /products/:id` - fetch a single product by id.
- Multi-stage, non-root Dockerfile with a container health check.
