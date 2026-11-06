/**
 * Node number (1-4) from a node name returned by the BMC.
 *
 * The API has used different spellings for the same node: `"Node 3"` (USB
 * endpoint today), `"node3"` (power endpoint keys), or a bare `"3"`. Match on
 * the number, never on the display text.
 */
export function parseNodeNumber(value: string | undefined): number | undefined {
  const match = /(\d+)\s*$/.exec(value ?? "");
  if (!match) return undefined;

  const nodeNumber = Number(match[1]);
  return nodeNumber >= 1 && nodeNumber <= 4 ? nodeNumber : undefined;
}
