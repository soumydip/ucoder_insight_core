<div align="center">
  <img src="https://insights.ucoder.in/your-logo-link.png" alt="UCoder Insight Logo" width="150" />
  
  <h1>UCoder Insight</h1>
  <p><strong>Powerful analytics and user insights tracking SDK for modern web applications</strong></p>
  
  [![npm version](https://img.shields.io/npm/v/ucoder-insight.svg)](https://www.npmjs.com/package/ucoder-insight)
  [![npm downloads](https://img.shields.io/npm/dm/ucoder-insight.svg)](https://www.npmjs.com/package/ucoder-insight)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
</div>

---

## Features

- **Lightweight & Fast** - Minimal bundle size with zero dependencies
- **Real-time Analytics** - Track user behavior, events, and custom metrics
- **Privacy-First** - GDPR compliant with built-in consent management
- **Custom Events** - Track anything from clicks to complex user journeys
- **Cross-Platform** - Works seamlessly on web, mobile, and desktop
- **Framework Agnostic** - Works with React, Vue, Angular, Next.js, and vanilla JS
- **Easy Integration** - Get started in under 2 minutes
- **Advanced Insights** - User sessions, funnels, retention, and more
- **Geo-location** - Automatic location detection and tracking
- **Bot Detection** - Filters out bot traffic automatically

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

## Dashboard Features

Visit [insights.ucoder.in](https://insights.ucoder.in) to access:

- **Real-user Analytics** - Track real users
- **User Segments** - Create custom user segments
- **Retention** - Analyze user retention rates
- **Geo Analytics** - Location-based insights
- **Device Breakdown** - Browser, OS, device stats
- **Custom Reports** - Build your own reports

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

See [https://insights.ucoder.in/docs/changelog](https://insights.ucoder.in/docs/changelog) for release history.

---

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

---

<div align="center">
  <p>Made with ❤️ by <a href="https://www.ucoder.in">UCoder</a></p>
  <p>
    <a href="https://github.com/soumydip/ucoder_insight_core">⭐ Star us on GitHub</a>
  </p>
</div>
