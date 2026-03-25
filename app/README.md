<!--
  PEAKKED — README TEMPLATE
  Replace all [brackets] and remove this comment block when you publish.
-->

<div align="center">

# Peakked

### Analytics for **players**, **streams**, and **discovery** — read the momentum behind what people are playing.

[![Expo](https://img.shields.io/badge/Expo-SDK%2055-000020?style=flat&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.83-61DAFB?style=flat&logo=react&logoColor=black)](https://reactnative.dev/)
[![License](https://img.shields.io/badge/license-[YOUR_LICENSE]-blue.svg)](#license)

**Power the charts.**

<br />

<!-- HERO: Banner under assets/Logos/ (path relative to this app/README.md) -->
<p align="center">
  <img src="assets/Logos/Full%20Logo%20WO%20BG.png" alt="Peakked app hero" width="85%" />
  <br />
  <sub><em>Swap the file in <code>assets/Logos/</code> or change <code>src</code> above.</em></sub>
</p>

</div>

---

## What is Peakked?

As a streamer and gamer, I always found myself jumping between Twitch, TikTok, YouTube, and Steam just to figure out what people were actually playing and watching at any given moment. Each platform only showed part of the picture, and piecing it all together every time got old. I wanted one place where I could see player counts, stream activity, and overall popularity side by side — real-time, without the tab juggling.

Peakked is that idea turned into an app. It pulls trending data, comparisons, and discovery into a single view built with Expo and React Native. Charts track how games rise and fall over time, and Nexa (the AI layer) helps surface recommendations when you’re not sure what to play next. The goal is to keep expanding what sources it pulls from so the picture gets more complete over time.

This repository is a work-in-progress demo by an independent developer. It’s shared to showcase UI/UX direction, architecture choices, and roadmap — not a finished commercial product (yet).

---

## About the developer

|             |                                                                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**    | _[Dawan Rashad Wright - Sensophy]_                                                                                                                  |
| **Role**    | _Indie developer — design, product, and engineering_                                                                                                |
| **Links**   | _[Github](https://github.com/deziikuoo) · [LinkedIn](https://www.linkedin.com/in/dawan-wright/) · [ByMeACoffe](https://buymeacoffee.com/deziikuoo)_ |
| **Contact** | _[ifdawanprintqualified14@gmail.com]_                                                                                                               |

---

## Screenshots

GIFs live under `assets/gifs/` (paths below are relative to this `app/README.md`).

|               Home / Popular                |          NEXA discovery          |            Compare / detail            |
| :-----------------------------------------: | :------------------------------: | :------------------------------------: |
| ![Popular tab](assets/gifs/populargif.gif)  | ![NEXA](assets/gifs/nexagif.gif) | ![Compare](assets/gifs/comparegif.gif) |
| _Caption: trending-style list & sparklines_ |    _Caption: filters & cards_    |    _Caption: side-by-side metrics_     |

<p align="center">
  <sub>On GitHub, use <code>/</code> in image paths, not Windows <code>\</code>.</sub>
</p>

---

## Tech stack

| Layer                  | Choices                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------- |
| **App**                | Expo ~55, React Native, React Navigation                                            |
| **UI**                 | Custom theming, Reanimated, Skia where used, `expo-image` for cached remote art     |
| **Data (demo)**        | In-app mocks + optional FastAPI backend when demo mode is off                       |
| **Backend (optional)** | Python / FastAPI — recommendations, RAWG, Twitch, Steam trending _(see `backend/`)_ |

---

## Getting started

From this directory (`app/`):

```bash
npm install
npx expo start
```

- **Android:** press `a` or **`npm run android`** (uses **LAN**; same Wi‑Fi as your PC).
- **iOS (macOS):** press `i` or `npm run ios`
- **Expo Go:** scan the QR code. Use **`npm run android:tunnel`** / **`npx expo start --tunnel`** only when you need a public URL (different network, hotel Wi‑Fi, etc.).

### If you see `Tunnel URL not found` then `reading 'body'` (tunnel crash)

Expo tried **ngrok**, couldn’t get a tunnel URL, fell back, and the CLI can still throw. **Your app is fine.**

**Fastest fix (phone + PC on same Wi‑Fi):** do **not** pass `--tunnel`. Use:

```bash
npm run android
# or
npx expo start --lan --android
```

**If you really need a tunnel:** run `npm install` in `app/` (this repo pins **`@expo/ngrok@4.1.0`**, which avoids some CLI crashes), add an [ngrok authtoken](https://dashboard.ngrok.com/get-started/your-authtoken) (`ngrok config add-authtoken <token>`), then try `npm run android:tunnel` again. Check [ngrok status](https://status.ngrok.com/). Free port **8081** or use e.g. `--port 8082` if something else is using 8081.

Copy `.env.example` → `.env` when you move off demo mode.

---

## Roadmap & future goals

_Prioritize and dates are yours to fill in — below is a sensible default structure._

- [ ] **Live data** — Wire Popular / Compare to stable APIs (Steam, Twitch, aggregators) with caching and rate limits.
- [ ] **Time series** — Real 24h / 7d / 30d history for sparklines and “peak time” insights.
- [ ] **NEXA production** — Secure API keys, prompt/tool design, and cost-aware recommendation pipeline.
- [ ] **Accounts & sync** — Optional sign-in and cloud watchlist (e.g. Firebase / custom backend).
- [ ] **Chat** — Intent + tools (player counts, streams, compare) backed by your stack of choice.
- [ ] **Store readiness** — EAS Build, icons, privacy policy, analytics, crash reporting.
- [ ] **Your idea** — _[e.g. widgets, Wear OS glance, Steam Deck–friendly web]_

---

## Project layout (high level)

```
app/
├── App.js                 # Entry & navigation
├── config/                # e.g. demo mode flags
├── components/            # Shared UI + NEXA components
├── screens/               # Tab screens
├── data/mock/             # Demo datasets
├── services/api/          # Client for backend (bypassed in demo)
└── backend/               # Optional FastAPI service (separate run)
```

---

## License

_[Choose one: e.g. MIT, “All rights reserved”, or “Source available — no license granted”]_

**Copyright (c) [YEAR] [YOUR NAME OR STUDIO]**

---

## Acknowledgments

- _[Game data / imagery: e.g. “Header art loads from public Steam CDN URLs for demo purposes only.”]_
- _[Libraries: Expo, React Native, and authors of key dependencies — see package.json.]_
- _[Anyone you want to thank.]_

---

<div align="center">

**Built with innovation and curiosity by Dawan Wright — thanks for checking it out!**

[⭐ Star this repo](https://github.com/deziikuoo/Peakked-Demo) · _[Add website when ready]_

</div>
