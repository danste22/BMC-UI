# BMC-UI

BMC-UI is a web-based user interface for managing and configuring the BMC of a Turing Pi cluster.

The API is [bmcd](https://github.com/turing-machines/bmcd). The board image that installs a BMC-UI release is [BMC-Firmware](https://github.com/turing-machines/BMC-Firmware). Agent instructions for building, testing, and changing this repo are in [AGENTS.md](AGENTS.md).

## Technologies Used

- [React](https://reactjs.org/) - JavaScript library for building user interfaces
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [TanStack Router](https://tanstack.com/router) - Routing library for React applications
  - Handles route management and route protection
- [TanStack Query](https://tanstack.com/query) - Data fetching and caching library for React
- [react-i18next](https://react.i18next.com/) - Internationalization library for React
- [Vite](https://vitejs.dev/) - Fast build tool and development server
- [TypeScript](https://www.typescriptlang.org/) - Typed superset of JavaScript

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/turing-machines/BMC-UI.git
   ```

2. Install dependencies:

   ```bash
   cd BMC-UI
   npm install
   ```

3. Start the development server:

   There are multiple ways to run the development server:

   a. Connect to a local Turing Pi cluster (default):

   ```bash
   npm run dev
   ```

   This will connect to `https://turingpi.local` for the API by default.

   b. Connect to a specific Turing Pi cluster:

   If your Turing Pi cluster is using a different hostname, domain or IP address, you can specify it using the `CLUSTER_URL` environment variable:

   ```bash
   CLUSTER_URL=https://your-cluster.lan npm run dev
   ```

   or

   ```bash
   CLUSTER_URL=https://192.168.1.100 npm run dev
   ```

   c. Use bmcd-api-mock:

   If you want to use [bmcd-api-mock](https://github.com/barrenechea/bmcd-api-mock) as the API for development:

   - Clone and set up the bmcd-api-mock repository.
   - Run the mock server (usually on `http://localhost:4460`).
   - Start the BMC-UI development server with the CLUSTER_URL environment variable:

     ```bash
     CLUSTER_URL=http://localhost:4460 npm run dev
     ```

4. Open your browser and visit `http://localhost:5173` to see the application running.

The same dev server, the unit-test gate, and the Playwright suite also run from the containers in `docker-compose.yml`. The commands are in that file's header. Container dependencies stay in the image and a named volume.

## Deployment

Releases are cut from the `version` field in `package.json`. A pull request runs lint, an `npm audit` at high severity, the production build, and the unit and component tests (`.github/workflows/quality.yml`).

After the pull request is merged to `main`, `.github/workflows/tag-and-build.yml` tags `v<version>` when that tag does not already exist and publishes `bmc-ui-<tag>.tar.gz`. BMC-Firmware consumes that tarball.

To release:

1. Create a branch and set `version` in `package.json` (for example `3.3.8`).
2. Open a pull request into `main` and merge it.
3. The push to `main` tags the new version and attaches the tarball to the GitHub release.

Playwright and the containerized build run from `.github/workflows/build-on-demand.yml`, which is started by hand (`workflow_dispatch`). Set `run_e2e` to run the browser suite. Ordinary pushes do not start that workflow.

## Contributing

Contributions are welcome. Open an issue or a pull request.

The production bundle stays at or under 4MB. The BMC rootfs is small. Keep new dependencies and assets inside that limit.

## License

This project is licensed under the [GNU General Public License v2.0](LICENSE).
