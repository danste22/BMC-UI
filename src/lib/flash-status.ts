import type { FlashStatus } from "@/lib/api/get";

export type FlashKind = "firmware" | "node" | null;

export type FlashOutcome =
  | { kind: "error"; message: string }
  | { kind: "done"; nodeImage: boolean }
  | { kind: "transferring"; bytesWritten: number };

export interface ResolveFlashOutcomeInput {
  /** Latest body returned by the status endpoint. */
  status: FlashStatus | undefined;
  flashType: FlashKind;
  isFlashing: boolean;
  /** Epoch ms when the upload finished and flashing started. */
  startedAt: number;
  /** Epoch ms of the fetch that produced `status` (TanStack `dataUpdatedAt`). */
  dataUpdatedAt: number;
}

/**
 * Decide what a status response means for the current flash.
 *
 * The device reports failures as HTTP 200 with an `Error` field, so the body
 * must be inspected even when the request "succeeded". Responses fetched before
 * the current flash started (cached from an earlier upgrade) are ignored so an
 * old `Done` cannot end a new flash.
 */
export function resolveFlashOutcome({
  status,
  flashType,
  isFlashing,
  startedAt,
  dataUpdatedAt,
}: ResolveFlashOutcomeInput): FlashOutcome | null {
  if (!isFlashing || !status || dataUpdatedAt < startedAt) return null;

  if (status.Error) {
    return { kind: "error", message: status.Error };
  }
  if (status.Done) {
    return { kind: "done", nodeImage: flashType === "node" };
  }
  if (status.Transferring) {
    return {
      kind: "transferring",
      bytesWritten: status.Transferring.bytes_written ?? 0,
    };
  }
  return null;
}
