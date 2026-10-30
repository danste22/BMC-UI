const RETURN_PATHS = [
  "/info",
  "/nodes",
  "/usb",
  "/about",
  "/flash-node",
  "/firmware-upgrade",
] as const;

export type ReturnPath = (typeof RETURN_PATHS)[number];

const RETURN_PATH_SET = new Set<string>(RETURN_PATHS);

export function safeReturnPath(value: unknown): ReturnPath {
  if (typeof value !== "string" || value.length === 0) return "/info";
  const pathname = value.split(/[?#]/)[0] ?? "";
  if (!RETURN_PATH_SET.has(pathname)) return "/info";
  return pathname as ReturnPath;
}

const DOWNLOAD_FALLBACK = "backup.tar.gz";

export function safeDownloadName(
  contentDisposition: string | undefined
): string {
  const match = /filename="([^"]*)"/.exec(contentDisposition ?? "");
  const raw = match?.[1] ?? DOWNLOAD_FALLBACK;
  const base = raw.split(/[/\\]/).pop() ?? DOWNLOAD_FALLBACK;
  const cleaned = base
    .replace(/[^\w.-]+/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 200);
  return cleaned || DOWNLOAD_FALLBACK;
}

export function parseRemoteFileUrl(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw new Error("Remote file must be an http or https URL");
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Remote file must be an http or https URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Remote file must be an http or https URL");
  }
  return url.toString();
}

export function parseSha256(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return undefined;
  if (!/^[a-fA-F0-9]{64}$/.test(trimmed)) {
    throw new Error("SHA-256 must be 64 hex characters");
  }
  return trimmed.toLowerCase();
}
