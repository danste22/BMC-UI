// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import BasicInfo from "@/components/BasicInfo";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Shape matches bmcd `get_about` (legacy.rs): version = firmware, bmcd_version = daemon.
vi.mock("@/lib/api/get", () => ({
  useAboutTabData: () => ({
    data: {
      board_model: "Turing RK1 / Turing Pi 2.5",
      board_revision: "1.0",
      hostname: "turingpi",
      api: "1.1",
      version: "2.3.4",
      bmcd_version: "2.4.0",
      buildtime: new Date("2026-11-06T10:00:00Z"),
      buildroot: "Buildroot 2026.08",
    },
  }),
}));

describe("BasicInfo header (BMC-Firmware #240)", () => {
  afterEach(cleanup);

  it("labels the firmware version as firmware", () => {
    render(<BasicInfo />);

    expect(screen.getByText("about.firmwareVersion")).toBeTruthy();
    expect(screen.getByText("v2.3.4")).toBeTruthy();
  });

  it("does not label the firmware version as daemon", () => {
    render(<BasicInfo />);

    expect(screen.queryByText("daemon")).toBeNull();
  });
});
