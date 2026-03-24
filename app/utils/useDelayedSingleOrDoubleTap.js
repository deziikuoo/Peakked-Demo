import { useRef, useEffect, useCallback } from "react";

const DEFAULT_DELAY_MS = 280;

/**
 * For Pressable `onPress`: first tap starts a timer for `onSingleTap`; a second tap
 * within `delayMs` cancels that timer and runs `onDoubleTap` instead (Instagram-style).
 */
export function useDelayedSingleOrDoubleTap(
  onSingleTap,
  onDoubleTap,
  delayMs = DEFAULT_DELAY_MS
) {
  const singleRef = useRef(onSingleTap);
  const doubleRef = useRef(onDoubleTap);
  singleRef.current = onSingleTap;
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
      singleRef.current?.();
    }, delayMs);
  }, [delayMs]);
}
