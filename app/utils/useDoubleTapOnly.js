import { useRef, useEffect, useCallback } from "react";

const DEFAULT_DELAY_MS = 280;

/**
 * Fires `onDoubleTap` only when two taps occur within `delayMs`.
 * A single tap does nothing (no delayed callback). Use on hero/detail images where
 * there is no single-tap action.
 */
export function useDoubleTapOnly(onDoubleTap, delayMs = DEFAULT_DELAY_MS) {
  const doubleRef = useRef(onDoubleTap);
  doubleRef.current = onDoubleTap;

  const lastTapRef = useRef(0);
  const timeoutRef = useRef(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    },
    []
  );

  return useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < delayMs) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      lastTapRef.current = 0;
      doubleRef.current?.();
      return;
    }
    lastTapRef.current = now;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      lastTapRef.current = 0;
    }, delayMs);
  }, [delayMs]);
}
