# ---- Build stage -----------------------------------------------------------
# Installs dependencies in a throwaway layer so dev tooling / npm cache never
# ends up in the final image.
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY src ./src

# ---- Production stage -------------------------------------------------------
FROM node:20-alpine AS production

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Run as a non-root user for defense in depth.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY package.json ./

USER appuser

EXPOSE 3000

# Container-level health check, backed by the app's /health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:${PORT}/health || exit 1

CMD ["node", "src/server.js"]
