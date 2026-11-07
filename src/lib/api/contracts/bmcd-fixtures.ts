/**
 * Responses as bmcd emits them today, copied from bmcd `bmcd/src/api/legacy.rs`.
 *
 * Typed against the UI response interfaces, so `tsc` fails when a field the UI
 * reads is renamed or removed. Excess properties are rejected too, so fields the
 * UI no longer uses must be dropped here. If bmcd changes, update the fixture
 * and the test that depends on it together.
 */
import type {
  AboutTabResponse,
  FlashStatus,
  PowerTabResponse,
  USBTabResponse,
} from "@/lib/api/get";

/** `get_about`, legacy.rs ~L266-L296. `version` is os-release VERSION (firmware). */
export const aboutFixture = {
  board_model: "Turing RK1 / Turing Pi 2.5",
  board_revision: "1.0",
  hostname: "turingpi",
  api: "1.1",
  version: "2.3.4",
  bmcd_version: "2.4.0",
  buildtime: "2026-11-06 10:00:00-00:00",
  buildroot: "Buildroot 2026.08",
} satisfies AboutTabResponse;

/** `usb_mode_body`, legacy.rs. `node` is `NodeId::api_name` (`node1` … `node4`). */
export const usbFixture = {
  mode: "Host",
  node: "node3",
  route: "Bmc",
  bus_type: "Single bus",
} satisfies USBTabResponse;

/** Inner object of `node_power_body`. The daemon sends that object inside a one-element array. */
export const powerFixture = {
  node1: "1",
  node2: "0",
  node3: "1",
  node4: "0",
} satisfies PowerTabResponse;

/** Upgrade failure: HTTP 200 with an Error field (upgrade_worker.rs:202, BMC-UI #19). */
export const firmwareErrorFixture = {
  Error: "failed os_update (exit status: 255)",
} satisfies FlashStatus;

/** Upgrade success, `Done` is `[Duration, u8]` in bmcd. */
export const firmwareDoneFixture = {
  Done: [{ secs: 42, nanos: 0 }, 0],
} satisfies FlashStatus;

/** Wrap a result the way every legacy `/bmc` GET does: `{ response: [{ result }] }`. */
export function wrapResult<T>(result: T): { response: { result: T }[] } {
  return { response: [{ result }] };
}
