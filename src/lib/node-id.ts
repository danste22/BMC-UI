/**
 * Node number (1-4) from a node name returned by the BMC.
 *
 * The USB endpoint sends `NodeId::api_name` (`"node3"`). Older responses and
 * the power keys have also used `"Node 3"` and `"3"`. Match on the number.
 */
export function parseNodeNumber(value: string | undefined): number | undefined {
  const match = /(\d+)\s*$/.exec(value ?? "");
  if (!match) return undefined;

  const nodeNumber = Number(match[1]);
  return nodeNumber >= 1 && nodeNumber <= 4 ? nodeNumber : undefined;
}
