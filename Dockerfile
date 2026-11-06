# syntax=docker/dockerfile:1
#
# Targets:
#   dev    Vite dev server on :5173 (docker compose up dev)
#   test   lint, typecheck, unit and component tests (fails the build on error)
#   build  production bundle in /app/dist
#   dist   only dist/ as the build output (docker build --target dist --output type=local,dest=out .)
#   e2e    Playwright suite against the mock BMC (docker compose run --rm e2e)
#
# Node version follows .nvmrc. The e2e image must match the pinned @playwright/test version.

ARG NODE_IMAGE=node:24-bookworm-slim
ARG PLAYWRIGHT_IMAGE=mcr.microsoft.com/playwright:v1.65.0-noble

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
ENV npm_config_update_notifier=false
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM deps AS source
COPY . .

FROM source AS dev
EXPOSE 5173
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]

FROM source AS test
RUN npm run lint && npx tsc -b && npm run test

FROM source AS build
RUN npm run build

FROM scratch AS dist
COPY --from=build /app/dist /

FROM ${PLAYWRIGHT_IMAGE} AS e2e
WORKDIR /app
ENV npm_config_update_notifier=false
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
CMD ["npm", "run", "test:e2e"]
