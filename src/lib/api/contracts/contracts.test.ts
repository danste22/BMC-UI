import { describe, expect, it } from "vitest";

import { resolveFlashOutcome } from "@/lib/flash-status";
import { parseNodeNumber } from "@/lib/node-id";

import {
  aboutFixture,
  firmwareDoneFixture,
  firmwareErrorFixture,
  powerFixture,
  usbFixture,
  wrapResult,
} from "./bmcd-fixtures";

describe("bmcd response contracts", () => {
  it("wraps results as { response: [{ result }] }", () => {
    const body = wrapResult(aboutFixture);
    expect(body.response[0].result).toEqual(aboutFixture);
  });

  describe("about (type=about)", () => {
    it("sends exactly the fields the UI reads", () => {
      expect(Object.keys(aboutFixture).sort()).toEqual(
        [
          "api",
          "board_model",
          "board_revision",
          "bmcd_version",
          "buildroot",
          "buildtime",
          "hostname",
          "version",
        ].sort()
      );
    });

    it("does not send build_version (BMC-UI #240 showed vundefined)", () => {
      expect(aboutFixture).not.toHaveProperty("build_version");
    });

    it("gives a parseable build time", () => {
      expect(Number.isNaN(new Date(aboutFixture.buildtime).getTime())).toBe(
        false
      );
    });
  });

  describe("usb (type=usb)", () => {
    it("names the node as 'Node N' and the UI parses it (BMC-Firmware #164)", () => {
      expect(usbFixture.node).toMatch(/^Node [1-4]$/);
      expect(parseNodeNumber(usbFixture.node)).toBe(3);
    });
  });

  describe("power (type=power)", () => {
    it("has node1..node4 with '0' or '1' values", () => {
      expect(Object.keys(powerFixture).sort()).toEqual([
        "node1",
        "node2",
        "node3",
        "node4",
      ]);
      for (const value of Object.values(powerFixture)) {
        expect(["0", "1"]).toContain(value);
      }
    });
  });

  describe("firmware status (type=firmware)", () => {
    it("reports failure as HTTP 200 + Error, and the UI treats it as a failure (BMC-UI #19)", () => {
      expect(
        resolveFlashOutcome({
          status: firmwareErrorFixture,
          flashType: "firmware",
          isFlashing: true,
          startedAt: 1,
          dataUpdatedAt: 2,
        })
      ).toEqual({
        kind: "error",
        message: "failed os_update (exit status: 255)",
      });
    });

    it("reports success as Done and the UI reboots the BMC", () => {
      expect(
        resolveFlashOutcome({
          status: firmwareDoneFixture,
          flashType: "firmware",
          isFlashing: true,
          startedAt: 1,
          dataUpdatedAt: 2,
        })
      ).toEqual({ kind: "done", nodeImage: false });
    });
  });
});
