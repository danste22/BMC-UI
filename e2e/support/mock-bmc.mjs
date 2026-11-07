// Mock of the legacy BMC HTTP API, shaped like bmcd's responses (bmcd/src/api/legacy.rs).
// Used by Playwright via webServer; the dev server proxies /api here (CLUSTER_URL).
//
// Test-only: POST /__reset clears the firmware-upload state between tests.
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_BMC_PORT ?? 18788);

const state = { uploadDone: false };

const ABOUT = {
  board_model: "Turing RK1 / Turing Pi 2.5",
  board_revision: "1.0",
  hostname: "turingpi",
  api: "1.1",
  version: "2.3.4", // firmware (os-release VERSION)
  bmcd_version: "2.4.0", // daemon (Cargo version)
  buildtime: "2026-11-06 10:00:00-00:00",
  buildroot: "Buildroot 2026.08",
};

const wrap = (result) => ({ response: [{ result }] });

function send(res, code, body) {
  const data = JSON.stringify(body);
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  await readBody(req);

  if (req.method === "POST" && url.pathname === "/__reset") {
    state.uploadDone = false;
    return send(res, 200, { ok: true });
  }

  if (req.method === "POST" && url.pathname === "/api/bmc/authenticate") {
    return send(res, 200, { id: "mock-token", description: "", name: "root" });
  }

  if (req.method === "POST" && url.pathname.startsWith("/api/bmc/upload/")) {
    state.uploadDone = true;
    return send(res, 200, {});
  }

  if (req.method !== "GET" || url.pathname !== "/api/bmc") {
    return send(res, 404, { error: "not found" });
  }

  const opt = url.searchParams.get("opt");
  const ty = url.searchParams.get("type");

  if (opt === "set" && ty === "firmware") {
    // URL and file upgrades both start the failing status immediately.
    state.uploadDone = true;
    return send(res, 200, { handle: 7 });
  }
  if (opt === "get" && ty === "firmware") {
    if (state.uploadDone) {
      // Device failure reported as HTTP 200 + Error body (BMC-UI #19).
      return send(res, 200, { Error: "failed os_update (exit status: 255)" });
    }
    return send(res, 200, {});
  }
  if (opt === "get" && ty === "flash") return send(res, 200, {});
  if (opt === "get" && ty === "about") return send(res, 200, wrap(ABOUT));
  if (opt === "get" && ty === "power") {
    return send(
      res,
      200,
      wrap({ node1: "1", node2: "0", node3: "1", node4: "0" })
    );
  }
  if (opt === "get" && ty === "usb") {
    // bmcd today: NodeId::api_name -> "node3" (BMC-Firmware #164).
    return send(
      res,
      200,
      wrap([
        { mode: "Host", node: "node3", route: "Bmc", bus_type: "Single bus" },
      ])
    );
  }
  if (opt === "get" && ty === "usb_node1") return send(res, 200, wrap(false));
  if (opt === "get" && ty === "info")
    return send(res, 200, wrap({ ip: [], storage: [] }));
  if (opt === "get" && ty === "node_info") {
    const empty = {
      module_name: null,
      name: null,
      power_on_time: null,
      uart_baud: null,
    };
    return send(res, 200, wrap([empty, empty, empty, empty]));
  }
  return send(res, 200, wrap({}));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`mock BMC listening on ${PORT}`);
});
