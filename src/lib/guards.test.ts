import { describe, expect, it } from "vitest";

import {
  parseRemoteFileUrl,
  parseSha256,
  safeDownloadName,
  safeReturnPath,
} from "./guards";

describe("safeReturnPath", () => {
  it.each([
    "/info",
    "/nodes",
    "/usb",
    "/about",
    "/flash-node",
    "/firmware-upgrade",
  ])("allows %s", (path) => {
    expect(safeReturnPath(path)).toBe(path);
  });

  it("keeps a known path and drops the query", () => {
    expect(safeReturnPath("/nodes?edit=1")).toBe("/nodes");
  });

  it.each([
    undefined,
    "",
    "https://evil.example/info",
    "//evil.example",
    "/login",
    "/info/../login",
  ])("rejects %s", (value) => {
    expect(safeReturnPath(value)).toBe("/info");
  });
});

describe("safeDownloadName", () => {
  it("falls back when the header is missing", () => {
    expect(safeDownloadName(undefined)).toBe("backup.tar.gz");
  });

  it("keeps a quoted basename", () => {
    expect(safeDownloadName('attachment; filename="node-backup.tar.gz"')).toBe(
      "node-backup.tar.gz"
    );
  });

  it("strips directories and odd characters", () => {
    expect(
      safeDownloadName('attachment; filename="../../etc/passwd\n.tar.gz"')
    ).toBe("passwd_.tar.gz");
  });
});

describe("parseRemoteFileUrl", () => {
  it("accepts http and https", () => {
    expect(parseRemoteFileUrl("https://example.com/node.img")).toBe(
      "https://example.com/node.img"
    );
    expect(parseRemoteFileUrl(" http://192.168.1.5/a.tpu ")).toBe(
      "http://192.168.1.5/a.tpu"
    );
  });

  it.each([
    "",
    "   ",
    "file:///mnt/sd/node.img",
    "/tmp/firmware.tpu",
    "javascript:alert(1)",
  ])("rejects %s", (value) => {
    expect(() => parseRemoteFileUrl(value)).toThrow(/http or https/);
  });
});

describe("parseSha256", () => {
  const digest = "a".repeat(64);

  it("treats an empty value as omitted", () => {
    expect(parseSha256(undefined)).toBeUndefined();
    expect(parseSha256("  ")).toBeUndefined();
  });

  it("normalizes a 64-character hex digest", () => {
    expect(parseSha256(digest.toUpperCase())).toBe(digest);
  });

  it("rejects a malformed digest", () => {
    expect(() => parseSha256("abc")).toThrow(/64 hex/);
    expect(() => parseSha256(`${digest}g`)).toThrow(/64 hex/);
  });
});
