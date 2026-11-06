import { describe, expect, it } from "vitest";

import { parseNodeNumber } from "./node-id";

describe("parseNodeNumber", () => {
  it.each([
    ["Node 1", 1],
    ["Node 3", 3],
    ["node3", 3],
    ["node4", 4],
    ["2", 2],
  ])("reads %s as node %i (issue BMC-Firmware #164)", (input, expected) => {
    expect(parseNodeNumber(input)).toBe(expected);
  });

  it.each([undefined, "", "Node 0", "Node 5", "Node", "usb"])(
    "rejects %s",
    (input) => {
      expect(parseNodeNumber(input)).toBeUndefined();
    }
  );
});
