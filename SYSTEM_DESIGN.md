# System Design

## Overview

A single stateless REST microservice (product catalogue) is built once as a
Docker image and deployed **three times side by side** — one deployment per
API version (v1.0, v1.1, v2.0) — each in its own Kubernetes namespace, with a
shared ingress routing by URL path. This mirrors how real teams run parallel
API versions during a migration window rather than forcing every client to
upgrade at once.

## Why these choices

**Namespace-per-version, not label-per-version in one namespace.**
Putting each version in its own namespace (`product-catalogue-v1`,
`product-catalogue-v1-1`, `product-catalogue-v2`) gives each version its own
resource quota, RBAC boundary, and blast radius: a bad rollout or a runaway
pod in v2 can't starve v1's resources or leak v1's service accounts. It also
keeps `kubectl get pods -n product-catalogue-v2` immediately readable instead
of grepping through a shared namespace by label.

**In-memory data, no database.** The assignment's focus is the
container/deploy lifecycle, not persistence. A JSON fixture keeps the image
tiny, the health check trivial ("is the process serving requests"), and
removes an entire class of infrastructure (DB provisioning, migrations,
connection pooling) that would be a distraction here. Swapping in a real
datastore later only touches `src/data` and `src/lib/search.js` — the routes
and Kubernetes objects don't need to change.

**Multi-stage, non-root, alpine-based Docker image.** The build stage
installs dependencies with the full `node:20-alpine` toolchain; only
`node_modules` and `src` are copied into the final image, so build-time
artifacts never ship. Running as a non-root `appuser` and setting
`readOnlyRootFilesystem: true` in the Kubernetes Deployment both narrow what
a compromised container process could do.

**HPA on CPU, not on request rate.** CPU-based autoscaling needs nothing
beyond the metrics-server that ships with most clusters (including Minikube),
so the deployment works out of the box. A request-rate-based HPA (via a
custom metrics adapter) would scale more responsively but adds an extra
moving part that isn't justified for a catalogue-lookup service with cheap,
CPU-light handlers.

**Path-based routing at a single ingress host, not three separate
hostnames.** `/v1`, `/v1.1`, `/v2` on one host means one DNS entry / one TLS
certificate to manage, and it's immediately obvious from the URL which
version a client is hitting — useful for gradual client migration and for
side-by-side manual testing.

**Version bumps are real git history, not a runtime feature flag.** Each
version (v1.0.0, v1.1.0, v2.0.0) is its own tagged commit with its own
branch, and the code differences between them are genuine diffs (new files,
new logic), not an `if (VERSION === 'v2')` branch in one file. This is closer
to how the versions would actually ship — each namespace runs an image built
from a specific tag — and makes `git diff v1.0.0 v1.1.0` a meaningful way to
review what changed.

**Search logic lives in a pure, framework-free module
(`src/lib/search.js`).** Keeping the filtering/validation logic free of
Express request/response objects means it can be unit tested directly with
Node's built-in test runner (no server, no network, no test framework
dependency), and the route handler's only job is translating HTTP query
params in and HTTP status codes out.

## Request flow

```
client
  └─> Ingress (nginx, path-based: /v1, /v1.1, /v2)
        └─> Service (ClusterIP, per namespace)
              └─> Deployment (2-5 pods via HPA)
                    └─> Express app (/health, /products, /products/:id, /products/search)
```

## Trade-offs / what a production version would add

- A shared datastore (with its own HA story) instead of an in-memory fixture,
  once the catalogue needs to be written to, not just read.
- A request-rate or latency-based HPA metric once traffic patterns are known.
- `NetworkPolicy` objects to also restrict which namespaces can reach each
  other at the network layer, complementing the RBAC restrictions in
  `k8s/rbac.yaml`.
- Centralized logging/metrics (e.g. shipping stdout JSON logs to a log
  aggregator, exposing a `/metrics` endpoint for Prometheus) — noted in the
  README as a setup guide pointer but not implemented here to keep the
  service dependency-light.
