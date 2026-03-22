/**
 * Frontend-only demo mode: skips all HTTP calls to the GameTrend / NEXA backend.
 *
 * Default is ON so Expo runs with zero backend.
 * To use the live API again, set in `app/.env`:
 *   EXPO_PUBLIC_DEMO_MODE=false
 * Then restart Metro (`npx expo start --clear`).
 */
export const DEMO_MODE =
  String(process.env.EXPO_PUBLIC_DEMO_MODE ?? 'true').toLowerCase() !== 'false';
