import { EventType, ActionType } from "../enums/event.enum";
import { safeLog } from "../log/safeLog";
import { analyticsCache, SDKConfigCache } from "../loader/analyticsCache";
import { normalizeUrl } from "../helper/normalizePath";
import { is404Page, isNotTrackPage } from "../loader/notTrakingPath";

const ACTIVATION_DELAY = 500; // Start tracking after 500ms
const SCROLL_THRESHOLD = 25; // Don't log if less than 25%
const SCROLL_DEBOUNCE = 200; // Debounce scroll events

let currentPath = "";
let maxScrollDepth = 0;
let isTrackingActive = false;
let activationTimer: ReturnType<typeof setTimeout> | null = null;
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

// Start new page timer
const startNewPageTimer = () => {
  maxScrollDepth = 0; // Reset scroll depth
  isTrackingActive = false; // Tracking off initially

  if (activationTimer) {
    clearTimeout(activationTimer);
  }

  // Activate scroll tracking after delay
  activationTimer = setTimeout(() => {
    isTrackingActive = true;
    console.log(" Scroll tracking activated for:", currentPath);
  }, ACTIVATION_DELAY);
};

// Send scroll log to server
const sendScrollLog = (path: string) => {
  //  Skip if tracking disabled
  if (!SDKConfigCache.trackScroll) {
    return;
  }

  // Skip if below threshold
  if (maxScrollDepth < SCROLL_THRESHOLD) {
    console.log(
      ` Scroll depth ${maxScrollDepth}% below threshold, skipping log`,
    );
    return;
  }

  const docHeight = document.documentElement.scrollHeight;
  const winHeight = window.innerHeight;
  const totalScrollable = docHeight - winHeight;

  //  Handle edge case: non-scrollable pages
  if (totalScrollable <= 0) {
    console.log(" Page is not scrollable, skipping scroll log");
    return;
  }

  const scrolledPixels = Math.round(totalScrollable * (maxScrollDepth / 100));

  safeLog(EventType.SCROLL, ActionType.ENGAGEMENT, {
    element: path,
    key: `scroll:max:${path}`,
    page: path,
    tag: "page",
    userId: analyticsCache.userId,
    additionalInfo: {
      percentage: maxScrollDepth,
      depthString: `${maxScrollDepth}%`,
      scrollHeight: docHeight,
      viewportHeight: winHeight,
      scrolledPixels: scrolledPixels,
      totalScrollable: totalScrollable,
      type: "scroll_summary",
    },
  });

  console.log(`📊 Scroll logged: ${maxScrollDepth}% on ${path}`);
};

// Scroll event handler
const handleScrollLogic = () => {
  if (!isTrackingActive) return;

  //  Check if scroll tracking is enabled
  if (!SDKConfigCache.trackScroll) {
    return;
  }

  if (is404Page(currentPath) || isNotTrackPage(currentPath)) {
    return;
  }

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight;
  const winHeight = window.innerHeight;
  const totalScrollable = docHeight - winHeight;

  // Skip if page is not scrollable
  if (totalScrollable <= 0) return;

  const scrollPercent = Math.min(
    100,
    Math.round((scrollTop / totalScrollable) * 100),
  );

  // Update max scroll depth
  if (scrollPercent > maxScrollDepth) {
    maxScrollDepth = scrollPercent;
  }
};

// Route change handler (for SPA)
const handleRouteChange = () => {
  const newPath = normalizeUrl(window.location.pathname);

  // If page actually changed
  if (currentPath && currentPath !== newPath) {
    console.log(`🔄 Route changed: ${currentPath} → ${newPath}`);

    // 1. Send previous page scroll data
    sendScrollLog(currentPath);

    // 2. Update current path and start new timer
    currentPath = newPath;
    startNewPageTimer();
  } else if (!currentPath) {
    // Initial page load
    currentPath = newPath;
    startNewPageTimer();
  }
};

// Cleanup function
const cleanup = () => {
  if (activationTimer) {
    clearTimeout(activationTimer);
    activationTimer = null;
  }
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
    scrollTimeout = null;
  }
};

// Register scroll tracker
export const registerScrollTracker = () => {
  //  Check if scroll tracking is enabled
  if (!SDKConfigCache.trackScroll) {
    console.log(" Scroll tracking is disabled");
    return;
  }

  // Initialize current path
  currentPath = normalizeUrl(window.location.pathname);
  startNewPageTimer();

  // 1. Scroll listener with debouncing
  const handleScroll = () => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(handleScrollLogic, SCROLL_DEBOUNCE);
  };

  window.addEventListener("scroll", handleScroll, { passive: true });

  // 2. SPA route change detection (History API Patching)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args: Parameters<typeof originalPushState>) {
    const result = originalPushState.apply(this, args);
    handleRouteChange();
    return result;
  };

  history.replaceState = function (
    ...args: Parameters<typeof originalReplaceState>
  ) {
    const result = originalReplaceState.apply(this, args);
    handleRouteChange();
    return result;
  };

  // 3. Browser back/forward navigation
  window.addEventListener("popstate", handleRouteChange);

  // 4. Page unload - send final scroll data
  window.addEventListener("beforeunload", () => {
    sendScrollLog(currentPath);
    cleanup();
  });

  // 5. Tab visibility change - send scroll data when user leaves
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      sendScrollLog(currentPath);
    }
  });

  console.log(" Scroll tracker initialized");

  //  Return cleanup function (for future use)
  return () => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("popstate", handleRouteChange);
    cleanup();
  };
};
