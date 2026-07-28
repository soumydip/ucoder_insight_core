<div align="center">
  <img src="https://insights.ucoder.in/icon.png" alt="UCoder Insight Logo" width="150" />
  
  <h1>UCoder Insight</h1>
  <p><strong>Powerful analytics and user insights tracking SDK for modern web applications</strong></p>

<strong><a href="https://insights.ucoder.in">Live Dashboard</a></strong> &nbsp;•&nbsp;
<strong><a href="https://insights.ucoder.in/docs">Documentation</a></strong> &nbsp;•&nbsp;
<strong><a href="https://www.npmjs.com/package/ucoder-insight">NPM</a></strong>

[![npm version](https://img.shields.io/npm/v/ucoder-insight.svg)](https://www.npmjs.com/package/ucoder-insight)
[![npm downloads](https://img.shields.io/npm/dm/ucoder-insight.svg)](https://www.npmjs.com/package/ucoder-insight)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

<p>
    Core developed and maintained by <a href="https://soumyadip.ucoder.in">Soumyadip Maity</a>
  </p>
  
</div>

---

# UCoder Insight SDK - Core NPM Library

## Features

- **Lightweight & Fast** - Minimal bundle size with no required dependencies
- **Real-time Analytics** - Track user behavior, events, and custom metrics
- **Privacy-First** - GDPR compliant with built-in consent management
- **Custom Events** - Track anything from clicks to complex user journeys
- **Cross-Platform** - Works seamlessly on web, mobile, and desktop
- **Framework Agnostic** - Works with React, Vue, Angular, Next.js, and vanilla JS
- **Easy Integration** - Get started in under 2 minutes
- **Advanced Insights** - User sessions, funnels, retention, and more
- **Geo-location** - Automatic location detection and tracking
- **Bot Detection** - Filters out bot traffic automatically
- **Web Vitals** - Automatic performance tracking (LCP, CLS, INP, FCP, TTFB) when `web-vitals` is available
- **Configurable Tracking** - Fine-tune which PRO features (performance, scroll depth) run per project, right from your code

---

## Installation

### npm

```bash
npm install ucoder-insight
```

### yarn

```bash
yarn add ucoder-insight
```

### pnpm

```bash
pnpm add ucoder-insight
```

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/ucoder-insight@latest/dist/index.global.js"></script>
```

---

## Configuration Options

| Option             | Type                 | Default     | Description                                                                                                                                                                                          |
| ------------------ | -------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `notFoundPath`     | `string`             | `undefined` | Custom 404 page path                                                                                                                                                                                 |
| `notTrackPath`     | `string \| string[]` | `undefined` | Paths to exclude from tracking                                                                                                                                                                       |
| `debug`            | `boolean`            | `false`     | Log to console instead of API                                                                                                                                                                        |
| `apiUrl`           | `string`             | `undefined` | Custom backend API endpoint                                                                                                                                                                          |
| `trackPerformance` | `false`              | `undefined` | Opt out of Web Vitals performance tracking. Only takes effect on PRO-plan projects where the dashboard has this feature enabled — it cannot be used to force the feature on for a FREE-plan project. |
| `trackScroll`      | `false`              | `undefined` | Opt out of scroll-depth tracking. Same PRO-only, opt-out-only behavior as `trackPerformance`.                                                                                                        |

> **Note:** `trackPerformance` and `trackScroll` only accept `false`. Your dashboard plan (FREE/PRO) always decides what's _allowed_; these options let a PRO project locally turn an allowed feature _off_ when it isn't needed. Passing `true` is a TypeScript compile error by design.

## Quick Start

### 1. Get Your API Key

Sign up at [insights.ucoder.in](https://insights.ucoder.in) and get your tracking ID.

### 2. Initialize the SDK

#### JavaScript / TypeScript

```typescript
import { initUcoderInsight } from "ucoder-insight";

initUcoderInsight("YOUR_TRACKING_ID", {
  notTrackPath: ["/privacy", "/terms", "/admin/*"], // all pages under /admin will be ignored
});
```

#### React

```jsx
import { useEffect } from "react";
import { initUcoderInsight } from "ucoder-insight";

function App() {
  useEffect(() => {
    initUcoderInsight("YOUR_TRACKING_ID", {
      notTrackPath: ["/privacy", "/terms", "/admin/*"], // all pages under /admin will be ignored
      // added more config
    });
  }, []);

  return <div>Your App</div>;
}
```

#### Next.js (App Router)

Create a client component for analytics first:

```tsx
// app/components/Analytics.tsx
"use client";
import { useEffect } from "react";
import { initUcoderInsight } from "ucoder-insight";

export default function Analytics() {
  useEffect(() => {
    initUcoderInsight("YOUR_TRACKING_ID", {
      notTrackPath: ["/privacy", "/terms", "/admin/*"],
      debug: process.env.NODE_ENV !== "production", // Optional: helps in local dev
      // added more config
    });
  }, []);

  return null;
}
```

Then include it in your root layout:

```tsx
// app/layout.tsx
import Analytics from "./components/Analytics";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

#### Vue 3

```javascript
// main.js
import { createApp } from "vue";
import { initUcoderInsight } from "ucoder-insight";
import App from "./App.vue";

initUcoderInsight("YOUR_TRACKING_ID", {
  notTrackPath: ["/privacy", "/terms", "/admin/*"], // all pages under /admin will be ignored
});

createApp(App).mount("#app");
```

#### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/ucoder-insight@latest/dist/index.global.js"></script>
  </head>
  <body>
    <script>
      UcoderInsight.init("YOUR_TRACKING_ID", {
        notTrackPath: ["/privacy", "/terms", "/admin/*"], // all pages under /admin will be ignored
        // added more config
      });
    </script>
  </body>
</html>
```

---

## Usage

### Track Custom Events

```typescript
import { trackCustomEvent } from "ucoder-insight";

// Simple event
trackCustomEvent("button_click");

// Event with properties
trackCustomEvent({
  event_name: "email_input_clicked",
  action_category: "interaction",
  object_id: "email_input_field",
  status: "success",
});
```

### Opting Out of PRO Features (Performance / Scroll Tracking)

If your project is on the PRO plan (where the dashboard has performance and/or scroll tracking enabled) but a specific site doesn't need one of them, turn it off locally:

```typescript
import { initUcoderInsight } from "ucoder-insight";

initUcoderInsight("YOUR_TRACKING_ID", {
  trackPerformance: false, // e.g. you already run your own Web Vitals monitoring
  trackScroll: false, // e.g. a single-page site where scroll depth isn't meaningful
});
```

This is opt-out only — your dashboard plan always decides what's available for the project; these flags cannot enable a feature your plan doesn't already allow.

---

## Web Vitals (Performance Tracking)

UCoder Insight automatically collects Web Vitals metrics (LCP, CLS, INP, FCP, TTFB) if `web-vitals` is available in your project **and** performance tracking is enabled for your project (PRO plan, and not locally disabled via `trackPerformance: false`).

**React / Next.js users** — `web-vitals` comes pre-installed, so performance tracking works out of the box with zero extra setup.

**Vanilla JS / other frameworks** — Install `web-vitals` manually to enable performance tracking:

```bash
npm install web-vitals
```

If `web-vitals` is not installed, all other tracking features (page views, custom events, sessions, etc.) will continue to work normally. Performance tracking is silently skipped.

---

## Dashboard Features

Visit [insights.ucoder.in](https://insights.ucoder.in) to access:

## What you get with Ucoder Insights

### Analytics

- **Page Views & Sessions** — Track visits, unique users, and session duration
- **Geo Analytics** — See where your users are coming from, country and city level
- **Device Breakdown** — Browser, OS, screen size, and device type
- **Referrer Tracking** — Know which sources drive your traffic
- **OutBound Link Tracking** — See which external links users click on
- **6-Month Data Retention** — All your analytics data kept for 6 months

### User Behavior

- **Click Tracking** — See exactly what users click on
- **Rage Clicks** — Detect frustrated users clicking repeatedly
- **Dead Clicks** — Find buttons and links that don't respond
- **Custom Events** — Track anything with `trackCustomEvent()`

### Error Monitoring

- **JS Error Tracking** — Catch TypeErrors, ReferenceErrors with file name and line number
- **Unhandled Promise Rejections** — Never miss a silent async failure
- **Resource Errors** — Detect broken images, scripts, and stylesheets
- **Error Management** — Resolve, ignore, or mark errors in progress with full activity history
- **Regression Detection** — Know when a fixed bug comes back

### Privacy & Performance

- **No Cookies** — Zero cookie consent banners needed
- **Privacy First** — No PII collected by default
- **Lightweight SDK** — Under 7.4kb (Minified + Gzipped), no performance impact
- **Offline Support** — IndexedDB queue, events sent when connection restores

---

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Changelog

## For a detailed list of changes, please see the [CHANGELOG](CHANGELOG.md).

## Bug Reports

Found a bug? Please open an issue on [GitHub](https://github.com/soumydip/ucoder_insight_core/issues) with:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment details
- Code examples (if applicable)

---

## Support

- [Documentation](https://insights.ucoder.in/docs)
- Email: support@ucoder.in

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with ❤️ by the UCoder team
- Inspired by modern analytics tools
- Thanks to all contributors!

---

## Links

- **GitHub**: [github.com/soumydip/ucoder_insight_core](https://github.com/soumydip/ucoder_insight_core)
- **npm**: [ucoder-insight](https://www.npmjs.com/package/ucoder-insight)
- **Dashboard**: [insights.ucoder.in](https://insights.ucoder.in)
- **Documentation**: [insights.ucoder.in/docs](https://insights.ucoder.in/docs)
- **Support**: [insights.ucoder.in/contact](https://insights.ucoder.in/contact)

---

<div align="center">
  <p>Made with ❤️ by <a href="https://www.ucoder.in">UCoder</a></p>
  <p>
    <a href="https://github.com/soumydip/ucoder_insight_core">⭐ Star us on GitHub</a>
  </p>
</div>
