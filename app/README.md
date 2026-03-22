# GameTrend Mobile (Expo)

React Native app: **Popular**, **Nexa**, **Compare**, **My Games**, **Chat**.

## Frontend-only demo mode (default)

By default the app **does not call your backend**: trending games and NEXA use rich mocks (`config/demoMode.js`, `data/mock/`).

- **Turn off demo** (use live FastAPI): in `app/.env` set `EXPO_PUBLIC_DEMO_MODE=false` and restart Metro with `npx expo start --clear`.
- Copy `app/.env.example` to `app/.env` and add real keys + `EXPO_PUBLIC_API_URL` when demo is off.

---

_Legacy title below referred to an earlier template; run instructions still apply._

# ShaqGPT Mobile App

React Native app built with **Expo** for the ShaqGPT sports chatbot.

## Run the app

From this directory (`app/`):

```bash
npm install   # if you haven't already
npm start
```

Then:

- **Android:** press `a` or run `npm run android`
- **iOS (Mac only):** press `i` or run `npm run ios`
- **Expo Go:** scan the QR code with Expo Go on your device (same Wi-Fi as your machine)

## Hot reloading (Fast Refresh)

Hot reloading is **on by default** in Expo development:

- **Native (iOS/Android):** When you run `npm start` (or `expo start`), Fast Refresh is enabled. Edit and save any component or style and the app updates without a full reload.
- **Web:** Run `npm run web`; the dev server also uses Fast Refresh.

No extra config is required. If the app does not update after a save, shake the device (or press `r` in the terminal) to reload once.

## "Failed to download remote update"

If you see this in Expo Go:

1. **Same Wi-Fi** - Phone and computer should be on the same network when using `npm start`.
2. **Use LAN clear mode** - Run:
   ```bash
   npx expo start --lan --clear
   ```
   Then scan the newly generated QR code.
3. **Use tunnel as fallback** - Run:
   ```bash
   npm run start:tunnel
   ```
   If tunnel fails, it is often an ngrok issue.
4. **Clear Expo Go app data/cache** (or reinstall Expo Go) if it keeps opening a stale project URL.
