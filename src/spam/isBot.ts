export const isBot = (): boolean => {
  // SSR rander (next.js or NUXT.js)
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return true;
  }
  const userAgent = navigator.userAgent.toLowerCase();
  //   Check for common bot user agents
  const commonBotRegex =
    /bot|spider|crawl|slurp|lighthouse|puppeteer|headlesschrome|googlebot|bingbot|yandexbot|duckduckbot|baiduspider|facebookexternalhit|twitterbot/i;
  if (commonBotRegex.test(userAgent)) {
    return true;
  }
  //   WebDriver (Selenium, Puppeteer, etc.)
  if (navigator.webdriver) {
    return true;
  }

  //   Check for headless browsers (Puppeteer, Playwright, etc.)
  const headlessBrowserRegex = /headlesschrome|headless/i;
  if (headlessBrowserRegex.test(userAgent)) {
    return true;
  }
  //   Check for PhantomJS
  if (
    (window as any)._phantom ||
    (window as any).__nightmare ||
    (window as any).callPhantom
  ) {
    return true;
  }

  //   Headless Chrome
  if (
    navigator.plugins &&
    navigator.plugins.length === 0 &&
    /Chrome/i.test(userAgent)
  ) {
    return true;
  }

  return false;
};
