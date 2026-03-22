import { InteractionManager } from 'react-native';

/**
 * Schedules non-urgent work to run after animations and user interactions complete.
 * Use for: filter recalculation side effects, cache cleanup, sync reconciliation,
 * and post-navigation work so taps, scrolls, and transitions stay smooth.
 *
 * @param {() => void} callback - Work to run after interactions settle
 * @param {string} [tag] - Optional label (reserved for future use)
 * @returns {{ cancel: () => void }} Handle with cancel() to clear if component unmounts
 */
export function deferAfterInteractions(callback, tag) {
  const promise = InteractionManager.runAfterInteractions(() => {
    callback();
  });
  return {
    cancel: () => promise.cancel?.(),
  };
}
