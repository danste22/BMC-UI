# BMC-UI

Web UI for the Turing Pi BMC. [bmcd](https://github.com/turing-machines/bmcd) is the API. [BMC-Firmware](https://github.com/turing-machines/BMC-Firmware) packages the release tarball onto the board.

Terms live in [GLOSSARY.md](GLOSSARY.md). The session-token decision is [docs/adr/0001-session-token-in-browser-storage.md](docs/adr/0001-session-token-in-browser-storage.md). Human setup and the release steps are in [README.md](README.md). Commands live in `package.json`, the header of `docker-compose.yml`, and the target list at the top of the `Dockerfile`.

## Sibling repos

| Repo | Owns | Local checkout |
| --- | --- | --- |
| BMC-UI (this repo) | The web UI | this directory |
| [bmcd](https://github.com/turing-machines/bmcd) | The daemon and the HTTP API | `../bmcd` when checked out beside this repo |
| [BMC-Firmware](https://github.com/turing-machines/BMC-Firmware) | The board image that consumes `bmc-ui-<version>.tar.gz` | `../BMC-Firmware` when checked out beside this repo |

A UI bug is often filed on BMC-Firmware. When the report describes the web UI, fix it in this repo. Change bmcd when the API payload or daemon behavior is wrong. Change BMC-Firmware when the image build or how it installs the tarball is wrong.

bmcd crates that link `gpiod` build on Linux. Run those tests in a Linux container.

## API

bmcd is the source of truth for response shapes. Types are `src/lib/api/get.ts` and `src/lib/api/set.ts`. Fixtures that must keep matching those types are `src/lib/api/contracts`. A field change updates the type, the fixture, and the bmcd handler together.

`version` is the BMC firmware version from os-release. `bmcd_version` is the daemon version. `buildtime` arrives as a string.

Node identity on the USB endpoint is `NodeId::api_name` (`"node3"`). `parseNodeNumber` in `src/lib/node-id.ts` also accepts the older `"Node 3"` and a bare `"3"`.

A firmware status body can be HTTP 200 and still carry `Error`. The outcome rules are `resolveFlashOutcome` in `src/lib/flash-status.ts`. `FlashContext` applies that result in an effect keyed on the status query.

## Local work

Node is the version in `.nvmrc`. The package manager is the `packageManager` field in `package.json`.

Host gate, when `node_modules` is already present:

```bash
npm test && npx tsc -b && npm run lint && npm run build
```

Container gate. Dependencies stay in the image and the named volume:

```bash
docker compose run --rm test
docker compose run --rm e2e
```

`npm run dev` and `docker compose up dev` both serve the UI. `CLUSTER_URL` is the BMC or mock that the Vite `/api` proxy targets. The default is `https://turingpi.local`. The dev proxy skips TLS verification because a local BMC presents a self-signed certificate.

After `package.json` or `package-lock.json` changes, rebuild the image and remove the `node_modules` volume named in `docker-compose.yml`.

Playwright lives in `e2e/` and talks to `e2e/support/mock-bmc.mjs`. The `@playwright/test` version and the Playwright base image in the `Dockerfile` stay on the same release. `docker compose run --rm e2e` is the run that already contains the browsers. A UI behavior change is verified by that suite or by using the changed flow in the dev server. The first paint is not the check.

The production `dist` stays at or under 4MB. The BMC rootfs is small.

## Code

User-visible copy is a key in `src/locale/en.ts` and the same key in `es`, `de`, `nl`, `pl`, and `zh-Hans`. `en.ts` defines the key shape.

Routes live under `src/routes`. Commit the regenerated `src/routeTree.gen.ts` with the route change.

`@` maps to `src/`. API calls stay in `src/lib/api`; components use the query hooks from there. Remote file inputs are `http` or `https` URLs the BMC fetches (`parseRemoteFileUrl` in `src/lib/guards.ts`). The production content security policy is injected at build time in `vite.config.ts`; a new origin, font, or script gets a matching directive.

Component tests set `// @vitest-environment jsdom`. The default Vitest environment is `node`.

## CI

Three workflows. The files are the step list.

- `.github/workflows/quality.yml` runs on every pull request: lint, `npm audit --audit-level=high`, production build, unit and component tests. Playwright is outside this workflow.
- `.github/workflows/tag-and-build.yml` runs on a push to `main`. A `package.json` version with no existing `v<version>` tag is tagged, and the job publishes `bmc-ui-<tag>.tar.gz` for BMC-Firmware.
- `.github/workflows/build-on-demand.yml` runs only on `workflow_dispatch`. It builds the Docker `test` and `dist` targets. Playwright runs when the `run_e2e` input is true. It stays manual so ordinary pushes do not spend Actions minutes.

A version bump is the `version` field in `package.json`. The release workflow reads that field.

## Done

Logic changes leave `npm test` and `npx tsc -b` green. UI behavior changes leave a Playwright spec or a browser pass of that flow green. API shape changes leave a contract fixture that matches the bmcd handler. `npm run lint` and `npm run build` pass, and `dist` stays within 4MB.
