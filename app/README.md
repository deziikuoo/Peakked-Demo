<!-- 
  PEAKKED — README TEMPLATE
  Replace all [brackets] and remove this comment block when you publish.
-->

<div align="center">

# Peakked

### Discover what’s trending in games — players, streams, and discovery in one place.

[![Expo](https://img.shields.io/badge/Expo-SDK%2055-000020?style=flat&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.83-61DAFB?style=flat&logo=react&logoColor=black)](https://reactnative.dev/)
[![License](https://img.shields.io/badge/license-[YOUR_LICENSE]-blue.svg)](#license)

**[YOUR_TAGLINE — one line, e.g. “A mobile hub for game popularity and AI-assisted discovery.”]**

<br />

<!-- HERO: Replace with your app banner (recommended 1200×630 or similar) -->
<p align="center">
  <img src="docs/assets/hero-placeholder.png" alt="Peakked app hero" width="85%" />
  <br />
  <sub><em>Add <code>docs/assets/hero-placeholder.png</code> or change this path to your image.</em></sub>
</p>

</div>

---

## What is Peakked?

**Peakked** is a cross-platform mobile app (built with **Expo** / **React Native**) focused on **game popularity**, **comparison**, and **discovery**. It brings together ideas you’d expect from a “trending games” experience — live-style stats presentation, layouts for browsing, and a **NEXA**-style flow for exploring recommendations — in a single installable demo.

This repository is a **work-in-progress** by an **independent developer**. It is shared to showcase UI/UX direction, architecture choices, and roadmap — not as a finished commercial product (yet).

---

## Demo vs. production

> **Important:** The default build runs in **frontend-only demo mode**.  
> Game lists, charts, and NEXA-style flows use **curated mock data** and public image URLs (e.g. Steam header CDN) so the app **does not require your own backend or API keys** to explore the experience.

| Mode | What happens |
|------|----------------|
| **Demo (default)** | No calls to your GameTrend / NEXA backend; realistic mocks in `config/demoMode.js` and `data/mock/`. |
| **Live API** | Set `EXPO_PUBLIC_DEMO_MODE=false` in `.env`, configure `EXPO_PUBLIC_API_URL` and keys per `.env.example`, then restart Metro. |

---

## About the developer

| | |
|---|--|
| **Name** | *[Your name or studio]* |
| **Role** | *Indie developer — design, product, and engineering* |
| **Links** | *[Portfolio](https://example.com) · [LinkedIn](https://linkedin.com/in/yourprofile) · [X / Bluesky / etc.]* |
| **Contact** | *[your.email@domain.com]* |

*Short bio (2–4 sentences): who you are, what you’re building toward, and why games / data / mobile matter to you.*

---

## Screenshots

<!-- Replace paths with your own under docs/assets/screenshots/ or .github/ -->

| Home / Popular | NEXA discovery | Compare / detail |
|:---:|:---:|:---:|
| ![Popular tab](docs/assets/screenshots/01-popular.png) | ![NEXA](docs/assets/screenshots/02-nexa.png) | ![Compare](docs/assets/screenshots/03-compare.png) |
| *Caption: trending-style list & sparklines* | *Caption: filters & cards* | *Caption: side-by-side metrics* |

<p align="center">
  <sub>Add images at e.g. <code>docs/assets/screenshots/</code> and update the paths above.</sub>
</p>

---

## GIFs / screen recordings

<!-- Drop short MP4s in repo and link, or use GitHub-uploaded assets / Giphy / Loom. -->

| Flow | Preview |
|------|---------|
| **Onboarding / first launch** | ![GIF placeholder](docs/assets/gifs/01-launch.gif) |
| **Pull to refresh / layout switch** | ![GIF placeholder](docs/assets/gifs/02-interactions.gif) |
| **NEXA recommendation flow** | ![GIF placeholder](docs/assets/gifs/03-nexa.gif) |

<p align="center">
  <sub>Tip: keep GIFs under ~5–10 MB for GitHub; or link to YouTube / Loom for longer demos.</sub>
</p>

---

## Current features (demo)

- **Popular** — Multiple layouts, genre filters, cards with player / stream / view framing and sparkline-style history *(mock data)*.
- **NEXA** — Recommendation-style UI with filters and detail modal *(offline demo responses)*.
- **Compare** — Slot-based comparison and charts *(mock-backed)*.
- **My Games** — Watchlist-style experience tied to local persistence.
- **Chat** — Placeholder / UX shell for future assistant-style features.

---

## Tech stack

| Layer | Choices |
|--------|---------|
| **App** | Expo ~55, React Native, React Navigation |
| **UI** | Custom theming, Reanimated, Skia where used, `expo-image` for cached remote art |
| **Data (demo)** | In-app mocks + optional FastAPI backend when demo mode is off |
| **Backend (optional)** | Python / FastAPI — recommendations, RAWG, Twitch, Steam trending *(see `backend/`)* |

---

## Getting started

From this directory (`app/`):

```bash
npm install
npx expo start
```

- **Android:** press `a` or `npm run android`
- **iOS (macOS):** press `i` or `npm run ios`
- **Expo Go:** scan the QR code (use **`npx expo start --tunnel`** on restrictive Wi‑Fi, e.g. hotels)

Copy `.env.example` → `.env` when you move off demo mode.

---

## Roadmap & future goals

*Prioritize and dates are yours to fill in — below is a sensible default structure.*

- [ ] **Live data** — Wire Popular / Compare to stable APIs (Steam, Twitch, aggregators) with caching and rate limits.
- [ ] **Time series** — Real 24h / 7d / 30d history for sparklines and “peak time” insights.
- [ ] **NEXA production** — Secure API keys, prompt/tool design, and cost-aware recommendation pipeline.
- [ ] **Accounts & sync** — Optional sign-in and cloud watchlist (e.g. Firebase / custom backend).
- [ ] **Chat** — Intent + tools (player counts, streams, compare) backed by your stack of choice.
- [ ] **Store readiness** — EAS Build, icons, privacy policy, analytics, crash reporting.
- [ ] **Your idea** — *[e.g. widgets, Wear OS glance, Steam Deck–friendly web]*

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

*[Choose one: e.g. MIT, “All rights reserved”, or “Source available — no license granted”]*

**Copyright (c) [YEAR] [YOUR NAME OR STUDIO]**

---

## Acknowledgments

- *[Game data / imagery: e.g. “Header art loads from public Steam CDN URLs for demo purposes only.”]*
- *[Libraries: Expo, React Native, and authors of key dependencies — see package.json.]*
- *[Anyone you want to thank.]*

---

<div align="center">

**Built with care by an indie dev — thanks for looking.**

[⭐ Star this repo](https://github.com/deziikuoo/Peakked-Demo) · *[Add website when ready]*

</div>
