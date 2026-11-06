import { describe, expect, it } from "vitest";

import { resolveFlashOutcome } from "./flash-status";

const STARTED = 1_000;
const FRESH = 2_000;
const STALE = 500;

const base = {
  isFlashing: true,
  startedAt: STARTED,
  dataUpdatedAt: FRESH,
} as const;

describe("resolveFlashOutcome", () => {
  it("reports a 200 body carrying Error as a failure (issue BMC-UI #19)", () => {
    expect(
      resolveFlashOutcome({
        ...base,
        flashType: "firmware",
        status: { Error: "failed os_update (exit status: 255)" },
      })
    ).toEqual({
      kind: "error",
      message: "failed os_update (exit status: 255)",
    });
  });

  it("reports an Error from a node flash the same way", () => {
    expect(
      resolveFlashOutcome({
        ...base,
        flashType: "node",
        status: { Error: "Compute module's USB interface not found" },
      })
    ).toEqual({
      kind: "error",
      message: "Compute module's USB interface not found",
    });
  });

  it("prefers Error over Done if both are present", () => {
    expect(
      resolveFlashOutcome({
        ...base,
        flashType: "firmware",
        status: {
          Error: "boom",
          Done: [{ secs: 1, nanos: 0 }, 1],
        },
      })
    ).toEqual({ kind: "error", message: "boom" });
  });

  it("ignores a cached response fetched before the flash started", () => {
    expect(
      resolveFlashOutcome({
        ...base,
        dataUpdatedAt: STALE,
        flashType: "firmware",
        status: { Error: "old failure" },
      })
    ).toBeNull();
  });

  it("ignores status while no flash is running", () => {
    expect(
      resolveFlashOutcome({
        ...base,
        isFlashing: false,
        flashType: "firmware",
        status: { Error: "late response" },
      })
    ).toBeNull();
  });

  it("ignores missing status", () => {
    expect(
      resolveFlashOutcome({
        ...base,
        flashType: "firmware",
        status: undefined,
      })
    ).toBeNull();
  });

  it("maps Done for firmware to a reboot-required outcome", () => {
    expect(
      resolveFlashOutcome({
        ...base,
        flashType: "firmware",
        status: { Done: [{ secs: 3, nanos: 0 }, 1] },
      })
    ).toEqual({ kind: "done", nodeImage: false });
  });

  it("maps Done for a node flash to a node-image outcome", () => {
    expect(
      resolveFlashOutcome({
        ...base,
        flashType: "node",
        status: { Done: [{ secs: 3, nanos: 0 }, 1] },
      })
    ).toEqual({ kind: "done", nodeImage: true });
  });

  it("reports transfer progress as bytes written", () => {
    expect(
      resolveFlashOutcome({
        ...base,
        flashType: "firmware",
        status: {
          Transferring: {
            id: 1,
            process_name: "os_update",
            size: 100,
            cancelled: false,
            bytes_written: 42,
          },
        },
      })
    ).toEqual({ kind: "transferring", bytesWritten: 42 });
  });

  it("returns null for an empty status body", () => {
    expect(
      resolveFlashOutcome({
        ...base,
        flashType: "firmware",
        status: {},
      })
    ).toBeNull();
  });
});
