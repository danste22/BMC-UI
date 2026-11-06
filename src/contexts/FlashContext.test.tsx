// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type FlashContextValue, FlashProvider } from "@/contexts/FlashContext";
import { useFlash } from "@/hooks/use-flash";
import {
  firmwareDoneFixture,
  firmwareErrorFixture,
} from "@/lib/api/contracts/bmcd-fixtures";
import type { FlashStatus } from "@/lib/api/get";

// Mocks are hoisted, so shared state lives in vi.hoisted.
const h = vi.hoisted(() => ({
  toast: vi.fn(),
  firmwareStatus: {
    data: undefined as FlashStatus | undefined,
    dataUpdatedAt: 0,
    isStale: false,
    refetch: vi.fn(),
  },
  flashStatus: {
    data: undefined as FlashStatus | undefined,
    dataUpdatedAt: 0,
    isStale: false,
    refetch: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: () => null,
}));

vi.mock("@/hooks/use-toast", () => ({ toast: h.toast }));

vi.mock("@/components/RebootModal", () => ({ default: () => null }));

vi.mock("@/lib/api/file", () => ({
  // Upload succeeds immediately, which starts the flash.
  useFirmwareUpdateMutation: () => ({
    mutateAsync: (_vars: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
      return Promise.resolve();
    },
  }),
  useNodeUpdateMutation: () => ({
    mutateAsync: (_vars: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
      return Promise.resolve();
    },
  }),
}));

vi.mock("@/lib/api/get", () => ({
  useFirmwareStatusQuery: () => h.firmwareStatus,
  useFlashStatusQuery: () => h.flashStatus,
}));

vi.mock("@/lib/api/set", () => ({
  useRebootBMCMutation: () => ({ mutate: vi.fn() }),
}));

type Ctx = FlashContextValue;

function renderProvider() {
  const ref: { current: Ctx | null } = { current: null };
  function Probe() {
    ref.current = useFlash();
    return null;
  }
  // Build a new element on every render: React skips re-rendering an identical element.
  const tree = () => (
    <FlashProvider>
      <Probe />
    </FlashProvider>
  );
  const utils = render(tree());
  return {
    ref,
    rerender: () => utils.rerender(tree()),
  };
}

/** Start a firmware upload and wait until the UI is flashing. */
async function startFirmwareUpload(ref: { current: Ctx | null }) {
  await act(async () => {
    await ref.current!.handleFirmwareUpload({
      file: new File(["fake"], "bmc.tpu"),
    });
  });
}

/** Deliver a status response, then re-render so the effect runs. */
function deliverStatus(
  rerender: () => void,
  status: FlashStatus,
  updatedAt = Date.now()
) {
  h.firmwareStatus.data = status;
  h.firmwareStatus.dataUpdatedAt = updatedAt;
  act(() => rerender());
}

describe("FlashProvider firmware status (BMC-UI #19)", () => {
  beforeEach(() => {
    h.toast.mockClear();
    h.firmwareStatus.data = undefined;
    h.firmwareStatus.dataUpdatedAt = 0;
  });

  afterEach(cleanup);

  it("shows an error toast when the BMC returns HTTP 200 with Error", async () => {
    const { ref, rerender } = renderProvider();
    await startFirmwareUpload(ref);

    deliverStatus(rerender, firmwareErrorFixture);

    expect(h.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "failed os_update (exit status: 255)",
        variant: "destructive",
      })
    );
    expect(ref.current!.isFlashing).toBe(false);
    expect(ref.current!.statusMessage).toBe(
      "failed os_update (exit status: 255)"
    );
  });

  it("ignores a cached response fetched before the upload started", async () => {
    const { ref, rerender } = renderProvider();
    await startFirmwareUpload(ref);

    deliverStatus(rerender, firmwareErrorFixture, 0);

    expect(h.toast).not.toHaveBeenCalled();
    expect(ref.current!.isFlashing).toBe(true);
  });

  it("reports success for Done and stops flashing", async () => {
    const { ref, rerender } = renderProvider();
    await startFirmwareUpload(ref);

    deliverStatus(rerender, firmwareDoneFixture);

    expect(h.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "firmwareUpgrade.success" })
    );
    expect(ref.current!.isFlashing).toBe(false);
  });

  it("keeps flashing and reports progress while Transferring", async () => {
    const { ref, rerender } = renderProvider();
    await startFirmwareUpload(ref);

    deliverStatus(rerender, {
      Transferring: {
        id: 1,
        process_name: "os_update",
        size: 100,
        cancelled: false,
        bytes_written: 42,
      },
    });

    expect(ref.current!.isFlashing).toBe(true);
    expect(ref.current!.uploadProgress?.pct).toBe(100);
    expect(h.toast).not.toHaveBeenCalled();
  });
});
