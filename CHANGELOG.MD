# Changelog

All notable changes to [ucoder-insight](https://www.npmjs.com/package/ucoder-insight) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

> Upcoming changes will be listed here before a release.

---

## [1.1.2] - 2026-05-19

#### Patch Release

- Moved `web-vitals` from `dependencies` to `peerDependencies` (optional)
  to reduce bundle size. Performance tracking now uses dynamic import with
  graceful fallback — if `web-vitals` is not available, tracking is silently
  skipped without breaking the SDK.
- React and Next.js users get Web Vitals tracking automatically (pre-installed).
- Vanilla JS users can optionally install `web-vitals` to enable it.
- Added `"sideEffects": false` for better tree-shaking support.
- Added `--treeshake --minify` to build pipeline.
- Added `--global-name UcoderInsight` for correct IIFE/CDN exports.
- Bundle size ~25kb -> 20kb minified, ~9.3kb ->7-8 kb gzipped.

## [1.0.1] - 2026-03-03

#### Bug Fixes

- Fixed an issue where the SDK would crash when receiving malformed data from the server.
- Resolve `next.js` SSR hydration mismatch by ensuring consistent event tracking on both server and client sides.
- Improved error handling for network failures during event tracking.

---

## [1.0.0] - 2026-03-01

#### 🎉 Initial Release

##### Added

- **SDK Initialization** — `initUcoderInsight(trackingId, options)` function to set up tracking with a single line of code.
- **Custom Event Tracking** — `trackCustomEvent()` supports both simple string events and detailed event objects with `event_name`, `action_category`, `object_id`, and `status` fields.
- **Path Exclusion** — `notTrackPath` option to exclude specific pages or path patterns (e.g. `/admin/*`) from being tracked.
- **Debug Mode** — `debug` option for verbose logging during local development.
- **Real-time Analytics** — Live user behavior and event tracking sent to the [UCoder Insight dashboard](https://insights.ucoder.in).
- **Geo-location Detection** — Automatic location detection and tracking for geo-based analytics.
- **Bot Detection** — Built-in filtering to exclude bot traffic from analytics data.
- **Session Tracking** — Cookie-free, session-based user tracking with zero personally identifiable data.
- **Performance Monitoring** — Core Web Vitals and performance data capture.
- **Error Tracking** — Automatic JavaScript error capture and reporting.
- **Device & Browser Breakdown** — Tracks browser, OS, and device type automatically.
- **GDPR Compliance** — Privacy-first design with built-in consent management; no cookies or IP address collection.

## BETA Release ()

- Initial beta release with core tracking features and basic analytics support. Feedback from early adopters will guide future enhancements and stability improvements.

##### Framework Support

- React (via `useEffect` hook)
- Next.js (App Router with `"use client"` directive)
- Vue 3 (via `main.js` initialization)
- Vanilla JavaScript (via CDN global `UcoderInsight.init()`)
- Angular and other SPA frameworks

##### Distribution

- Available via `npm`, `yarn`, `pnpm`
- CDN support via jsDelivr: `https://cdn.jsdelivr.net/npm/ucoder-insight@latest/dist/index.global.js`
- Zero external runtime dependencies

---

## Links

- **npm**: [npmjs.com/package/ucoder-insight](https://www.npmjs.com/package/ucoder-insight)
- **GitHub**: [github.com/soumydip/ucoder_insight_core](https://github.com/soumydip/ucoder_insight_core)
- **Dashboard**: [insights.ucoder.in](https://insights.ucoder.in)
- **Docs**: [insights.ucoder.in/docs](https://insights.ucoder.in/docs)
