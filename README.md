# Product Catalogue Microservice — Containerization, Versioning & Scalable Deployment

A REST API for managing a product catalogue, containerized with Docker and
deployed as three parallel versions (v1.0, v1.1, v2.0) on Kubernetes, with an
automated CI/CD pipeline. See [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md) for the
architectural reasoning and [`CHANGELOG.md`](./CHANGELOG.md) for what changed
between versions.

## Project layout

```
src/                   Application source (Express)
  server.js            App entry point: /health + mounts /products
  routes/products.js   /products, /products/:id, /products/search
  lib/search.js        Pure filter/validation logic (framework-free, unit-testable)
  data/products.json   Sample in-memory catalogue
test/                  Unit + integration tests (Node's built-in test runner)
Dockerfile             Multi-stage, non-root, health-checked image
docker-compose.yml     Local single-version run with .env support
k8s/
  v1/                  Namespace + Deployment + Service + HPA + Ingress for v1.0
  v1.1/                Same, for v1.1
  v2/                  Same, for v2.0
  rbac.yaml            Bonus: least-privilege ServiceAccount/Role per namespace
  tls-example.yaml     Bonus: how to add TLS termination at the ingress
terraform/             Bonus: example cluster-provisioning Terraform (GKE)
.github/workflows/     CI/CD pipeline (GitHub Actions)
```

## Versions

| Version | Endpoints | Git tag |
|---|---|---|
| v1.0 | `/health`, `/products`, `/products/:id` | `v1.0.0` |
| v1.1 | + `/products/search?keyword=` | `v1.1.0` |
| v2.0 | `/products/search` gains `category`, `minPrice`, `maxPrice`, `page`, `limit` + input validation | `v2.0.0` |

Each version is a real, tagged commit (`git log --oneline --all`,
`git tag`), with a matching branch (`release/v1.0`, `release/v1.1`,
`release/v2.0`) — this is what's actually built into each version's Docker
image and deployed to its own namespace.

## Running locally (no Docker)

```bash
npm install
npm start          # listens on :3000
npm test           # unit + integration tests
```

## Running locally with Docker

```bash
cp .env.example .env
docker compose up --build
curl http://localhost:3000/health
```

Or without compose:

```bash
docker build -t product-catalogue:local .
docker run -p 3000:3000 --env-file .env product-catalogue:local
```

## Deploying to Kubernetes (Minikube or any cluster)

1. **Build and make the image available to the cluster.** For Minikube:
   ```bash
   eval $(minikube docker-env)
   docker build -t <your-dockerhub-user>/product-catalogue:v1.0.0 .
   ```
   For a real cluster, push to a registry instead:
   ```bash
   docker build -t <your-dockerhub-user>/product-catalogue:v1.0.0 .
   docker push <your-dockerhub-user>/product-catalogue:v1.0.0
   ```
2. **Point the manifests at your image** — replace
   `REPLACE_WITH_YOUR_DOCKERHUB_USER` in each `k8s/*/deployment.yaml`
   (or `sed` it, as the CI pipeline does).
3. **Apply a version's manifests:**
   ```bash
   kubectl apply -f k8s/v1/namespace.yaml
   kubectl apply -f k8s/v1/deployment.yaml
   kubectl apply -f k8s/v1/service.yaml
   kubectl apply -f k8s/v1/hpa.yaml
   kubectl apply -f k8s/v1/ingress.yaml
   ```
   Repeat with `k8s/v1.1/` and `k8s/v2/` (using each version's own image tag)
   to run all three side by side.
4. **Bonus manifests:**
   ```bash
   kubectl apply -f k8s/rbac.yaml
   ```
   `tls-example.yaml` is a documented snippet to merge into an `ingress.yaml`
   once you have a real TLS secret — not meant to be applied standalone.
5. **If you're using an ingress**, enable the addon (Minikube: `minikube
   addons enable ingress`) and point `product-catalogue.local` at your
   cluster IP (`echo "$(minikube ip) product-catalogue.local" | sudo tee -a
   /etc/hosts`). Then:
   ```bash
   curl http://product-catalogue.local/v1/health
   curl http://product-catalogue.local/v1.1/products/search?keyword=time
   curl http://product-catalogue.local/v2/products/search?category=electronics&minPrice=100
   ```
   Without ingress, `kubectl port-forward svc/product-catalogue-svc -n
   product-catalogue-v1 8080:80` and hit `localhost:8080` instead.

## CI/CD pipeline

`.github/workflows/ci-cd.yml` runs on every push/PR:

1. **test** — installs deps, runs `npm test`.
2. **build-and-push** — builds the Docker image and pushes it to Docker Hub,
   tagged with the git tag (on a version tag push) or the short commit SHA.
   Requires two repository secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`.
3. **deploy-and-integration-test** — spins up a disposable `kind` cluster
   inside the runner, deploys the v1 manifests with the freshly-built image,
   waits for the rollout, then `curl`s `/health` and `/products` through a
   port-forward to confirm the deployment actually serves traffic. Point
   `KUBECONFIG` at a real cluster (self-hosted runner, or a cloud
   credentials step) instead of `kind` to deploy for real.

## Logging & monitoring setup guide

- The app logs structured request errors to stdout/stderr
  (`console.error(...)` in the centralized error handler); in Kubernetes this
  is picked up automatically by the container runtime and can be shipped
  with any log-aggregation sidecar/daemonset (e.g. Fluent Bit → your log
  store of choice).
- `GET /health` is wired into both the Docker `HEALTHCHECK` and the
  Kubernetes `readinessProbe`/`livenessProbe`, so a stuck or crash-looping
  pod is detected and cycled automatically without any extra tooling.
- The HPA (`k8s/*/hpa.yaml`) relies on the cluster's `metrics-server` for CPU
  utilization data — this ships by default with Minikube and most managed
  Kubernetes offerings.

## Bonus tasks — status

| Bonus | Where |
|---|---|
| Vulnerability scan of the Docker image | Run `docker scout cves product-catalogue:local` or `trivy image product-catalogue:local` locally — not wired into CI here since it needs a scanner credential/binary the assignment doesn't specify. |
| RBAC policies | `k8s/rbac.yaml` — least-privilege read-only ServiceAccount per namespace. |
| TLS | `k8s/tls-example.yaml` — ingress TLS termination snippet + cert-manager note. |
| Terraform cluster provisioning | `terraform/` — example GKE cluster module (needs real cloud credentials to apply; not run here). |
