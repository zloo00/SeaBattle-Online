import { useEffect } from 'react';

type Cleanup = (() => void) | void;

export const useSubscription = (
  subscribe: () => Cleanup,
  deps: unknown[],
  enabled = true
) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const cleanup = subscribe();
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);
};
