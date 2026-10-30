import { useSyncExternalStore } from "react";

function subscribe(query: string, onStoreChange: () => void) {
  const result = matchMedia(query);
  result.addEventListener("change", onStoreChange);
  return () => result.removeEventListener("change", onStoreChange);
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onStoreChange) => subscribe(query, onStoreChange),
    () => matchMedia(query).matches,
    () => false
  );
}
