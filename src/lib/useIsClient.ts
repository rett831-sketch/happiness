import { useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};

/** False during server rendering and hydration, true once running in the browser. */
export function useIsClient() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}
