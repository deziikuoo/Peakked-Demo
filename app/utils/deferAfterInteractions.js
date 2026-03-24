/**
 * Schedules non-urgent work for when the JS thread is less busy.
 * Uses requestIdleCallback when available (React Native replaces deprecated InteractionManager);
 * falls back to setTimeout(0).
 *
 * @param {() => void} callback - Deferred work
 * @param {string} [_tag] - Optional label (reserved for future use / debugging)
 * @returns {{ cancel: () => void }} Call cancel() on unmount or when superseded
 */
export function deferAfterInteractions(callback, _tag) {
  let cancelled = false;
  const run = () => {
    if (cancelled) return;
    callback();
  };

  if (
    typeof requestIdleCallback === "function" &&
    typeof cancelIdleCallback === "function"
  ) {
    const id = requestIdleCallback(() => run(), { timeout: 300 });
    return {
      cancel: () => {
        cancelled = true;
        cancelIdleCallback(id);
      },
    };
  }

  const t = setTimeout(run, 0);
  return {
    cancel: () => {
      cancelled = true;
      clearTimeout(t);
    },
  };
}
