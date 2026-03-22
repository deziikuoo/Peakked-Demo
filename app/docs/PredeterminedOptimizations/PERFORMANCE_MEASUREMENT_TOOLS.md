# Performance Measurement Tools

This document describes which tools to use to measure frontend and backend hotspots and bottlenecks when the time comes (e.g. before considering native modules or off-main-thread work per README line 35). No single “dev tools” suite does everything—use a combination of the following.

---

## Frontend (React Native / Expo)

### What dev tools give you

| Tool | What it measures | Use for |
|------|------------------|--------|
| **React DevTools (Profiler)** | Which components re-render, how often, how long they take | Finding unnecessary re-renders and heavy components |
| **Flipper** / **React Native Debugger** | JS thread activity, layout, network | Seeing if the JS thread is busy during scroll/taps |
| **Chrome DevTools** (remote JS debugging) | CPU flame graphs, memory, JS execution | Inspecting where time is spent in JS; note that debugging can change timing |
| **React Native Performance Monitor** | FPS and JS thread load (shake device or dev menu) | Quick check: “Is the JS thread busy when I scroll?” |
| **Hermes** (if enabled) | Better JS perf and memory; profiling with Hermes | Part of the toolchain; still need to decide what to measure |

### What they don’t fully cover

- **Real-device CPU usage** (per-thread: JS vs UI vs native).
- **Frame drops** and jank in real conditions (e.g. long lists, many charts).
- **Sustained load** (long sessions, many navigations) and memory growth over time.

### What to add when profiling

- **Light instrumentation:** e.g. `console.time` / `performance.now()` around suspected hotspots (e.g. `getPoints`, list derivation) on real devices with larger data to see if they’re actually slow.
- **Repeatable scenarios:** e.g. “Popular list with 100 items,” “Compare with 3 games,” “scroll through sectioned list” so you can compare before/after and know what “good” looks like.

**Bottom line:** Dev tools cover a lot of frontend measurement, but you still need to run the app on device, trigger the right scenarios, and interpret FPS/Profiler/CPU to find real hotspots.

---

## Backend

### What “dev tools” typically means

| Tool / practice | What it measures | Use for |
|-----------------|------------------|--------|
| **APM / observability** (e.g. Datadog, New Relic, OpenTelemetry backends) | Latency, throughput, errors; often CPU/memory of the API process | “Which endpoints are slow?” and “Where is CPU time spent?” |
| **Database / query profiling** | Slow query logs, query plans | Finding heavy or N+1 queries |
| **Logging and tracing** | Request IDs, spans across API → DB → cache | Following the full path of a slow request |

### What they don’t do by themselves

- They don’t tell you which frontend actions drive the most backend load.
- They don’t define your SLOs (e.g. “p95 < 200 ms”); you define those and use the tools to see if you meet them.

**Bottom line:** Backend tooling (APM, DB profiling, logs) handles much of backend performance testing, but you still need to define “good” and correlate with frontend usage.

---

## When to use these tools (and when to consider line 35)

The README marks **“Native modules or true off-main-thread processing”** as **Future** because it’s only worth doing for **real hotspots**:

- **Frontend:** Use React DevTools Profiler + Performance Monitor (and optional `performance.now()` around heavy JS) to see when the JS thread is the bottleneck (e.g. during chart render or list scroll). When you see sustained high JS load or frame drops during those actions, that’s when to consider native or off-thread work.
- **Backend:** Use APM and DB profiling to see which endpoints or jobs are CPU-heavy; that’s when backend-side “heavy processing” might need optimization or offloading.

Dev tools (frontend + backend) are what you’ll use to measure those hotspots when the time comes; they don’t automate “all” performance testing, but they’re the right place to start.

---

## Simple performance checklist (for when you’re ready)

Use this when you want to validate performance or before investing in native/off-thread work:

**Frontend**

- [ ] Profile Popular list with 100+ items (scroll, filter, layout switch).
- [ ] Profile Compare screen with 3 games and chart visible.
- [ ] Check FPS and JS thread during scroll (Performance Monitor).
- [ ] If something feels slow, add `performance.now()` around the suspected code path and measure on a real device.

**Backend**

- [ ] Define SLOs for key endpoints (e.g. p95 latency).
- [ ] Use APM or tracing to see which routes are slow or CPU-heavy.
- [ ] Use DB profiling for slow or frequent queries.

**Correlation**

- [ ] Map slow UI actions to the API calls they trigger so frontend and backend hotspots are aligned.
