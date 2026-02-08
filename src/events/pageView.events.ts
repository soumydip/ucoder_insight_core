import { safeLog } from "../log/safeLog";
import { EventType, ActionType } from "../enums/event.enum";
import { normalizeUrl } from "../helper/normalizePath";
import { is404Page, isNotTrackPage } from "../loader/notTrakingPath";
import { getReferralSource } from "../helper/getReferralSource";
import { analyticsCache, SDKConfigCache } from "../loader/analyticsCache";

let currentPage = "";
let pageStartTime = 0;
let enterTimeout: ReturnType<typeof setTimeout> | null = null;

const DEBOUNCE_DELAY_MS = 500;
const MIN_DURATION_MS = 1000; // Minimum 1 second
const referralSource = getReferralSource() || "direct";

function trackPageEnter(rawPage: string) {
  //  Check if page view tracking is enabled
  if (!SDKConfigCache.trackPageViews) {
    console.log(" Page view tracking is disabled");
    return;
  }

  // not track if not traking page or 404 page
  if (isNotTrackPage(rawPage) || is404Page(rawPage)) {
    console.log(" Page view tracking is disabled for this page:", rawPage);
    return;
  }

  // Clear previous timeout
  if (enterTimeout) {
    clearTimeout(enterTimeout);
  }

  enterTimeout = setTimeout(() => {
    // Check for 404 page
    if (isNotTrackPage(rawPage) || is404Page(rawPage)) {
      console.warn(" Not tracking page:", rawPage);
      return;
    }

    const normalizedPage = normalizeUrl(rawPage);
    currentPage = normalizedPage;
    pageStartTime = Date.now();

    safeLog(EventType.PAGE_VIEW, ActionType.NAVIGATION, {
      element: normalizedPage,
      key: `page_view:${normalizedPage}`,
      page: normalizedPage,
      tag: "page",
      userId: analyticsCache.userId,
      additionalInfo: {
        rawUrl: rawPage,
        referral: referralSource,
        UT: analyticsCache.isNewUser ? 1 : 0,
      },
    });

    console.log(" Page view tracked:", normalizedPage);
  }, DEBOUNCE_DELAY_MS);
}

function trackPageExit() {
  if (!currentPage) return;

  const duration = Date.now() - pageStartTime;

  //  Skip if duration too short
  if (duration < MIN_DURATION_MS) {
    console.log(" Page duration too short, skipping exit tracking");
    currentPage = "";
    pageStartTime = 0;
    return;
  }

  safeLog(EventType.PAGE_VIEW, ActionType.TIME_TRACKING, {
    element: currentPage, //  Use page name instead of "duration"
    key: `duration:${currentPage}`,
    page: currentPage,
    tag: "page",
    userId: analyticsCache.userId,
    additionalInfo: {
      referralSource: referralSource,
      durationMs: duration,
      durationSec: Math.round(duration / 1000),
      UT: analyticsCache.isNewUser ? 1 : 0,
    },
  });

  console.log(
    ` Page exit tracked: ${currentPage} (${Math.round(duration / 1000)}s)`,
  );

  //  Reset state
  currentPage = "";
  pageStartTime = 0;
}

interface PageChangeCallback {
  (newPage: string): void;
}

function trackVanillaNavigation() {
  window.addEventListener("DOMContentLoaded", () => {
    trackPageEnter(location.pathname + location.search);
  });
}

function trackHashNavigation() {
  window.addEventListener("hashchange", () => {
    trackPageExit();
    trackPageEnter(location.pathname + location.hash);
  });
}

function enableSpaNavigationTracking(onPageChange: PageChangeCallback): void {
  const pushState = history.pushState;
  const replaceState = history.replaceState;

  // Override pushState
  history.pushState = function (
    ...args: Parameters<typeof pushState>
  ): ReturnType<typeof pushState> {
    const prevPath = location.pathname + location.search;
    const result = pushState.apply(this, args);
    const newPath = location.pathname + location.search;

    if (prevPath !== newPath) {
      onPageChange(newPath);
    }
    return result;
  };

  // Override replaceState
  history.replaceState = function (
    ...args: Parameters<typeof replaceState>
  ): ReturnType<typeof replaceState> {
    const prevPath = location.pathname + location.search;
    const result = replaceState.apply(this, args);
    const newPath = location.pathname + location.search;

    if (prevPath !== newPath) {
      onPageChange(newPath);
    }
    return result;
  };

  // Browser back/forward navigation
  window.addEventListener("popstate", (): void => {
    onPageChange(location.pathname + location.search);
  });

  // Hash change navigation
  window.addEventListener("hashchange", (): void => {
    onPageChange(location.pathname + location.hash);
  });
}

export function initSpaPageTracking() {
  //  Check if page tracking is enabled
  if (!SDKConfigCache.trackPageViews) {
    console.log(" SPA page tracking is disabled");
    return;
  }
  // if not traking page or 404 page
  if (is404Page(location.pathname) || isNotTrackPage(location.pathname)) {
    console.log(
      " SPA page tracking is disabled for this page:",
      location.pathname,
    );
    return;
  }

  let lastTrackedPage = location.pathname + location.search;
  trackPageEnter(lastTrackedPage);

  enableSpaNavigationTracking((newPage: string): void => {
    if (newPage === lastTrackedPage) return;

    trackPageExit();
    trackPageEnter(newPage);
    lastTrackedPage = newPage;
  });

  // Track exit on page unload
  window.addEventListener("beforeunload", () => {
    trackPageExit();
  });

  //  Track exit on tab visibility change
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      trackPageExit();
    }
  });

  console.log(" SPA page tracking initialized");
}
