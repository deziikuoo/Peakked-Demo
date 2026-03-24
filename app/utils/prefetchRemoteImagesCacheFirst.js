/**
 * Warm the expo-image disk cache for a list of remote URLs (fire-and-forget).
 *
 * Avoids top-level `import { Image } from "expo-image"` and `getCachePathAsync`:
 * some Hermes / Expo Go builds throw `ReferenceError: Property 'Image' doesn't exist`
 * when probing or binding statics too early.
 *
 * Rendering still uses `GameImage` (memory + disk); the loader checks disk first.
 */
function getPrefetchFn() {
  try {
    // eslint-disable-next-line global-require
    const mod = require("expo-image");
    const Ctor = mod?.Image;
    if (Ctor && typeof Ctor.prefetch === "function") {
      return Ctor.prefetch.bind(Ctor);
    }
  } catch {
    // module unavailable in this environment
  }
  return null;
}

export function prefetchRemoteImagesCacheFirst(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return;

  const unique = [...new Set(urls.filter((u) => typeof u === "string" && u.length > 0))];
  if (unique.length === 0) return;

  const prefetch = getPrefetchFn();
  if (!prefetch) return;

  prefetch(unique, { cachePolicy: "disk" }).catch(() => {});
}
