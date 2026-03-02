import { safeLog } from "../log/safeLog";
import { EventType, ActionType } from "../enums/event.enum";
import { normalizeUrl } from "../helper/normalizePath";
import { is404Page, isNotTrackPage } from "../loader/notTrakingPath";
import { getReferralSource } from "../helper/getReferralSource";
import { analyticsCache, SDKConfigCache } from "../loader/analyticsCache";

// ==========================================
// STATE & CONFIG
// ==========================================
const DEBOUNCE_DELAY_MS = 500;
const MIN_DURATION_MS = 1000;

let currentPage = "";
let pageStartTime = 0;
let enterTimeout: ReturnType<typeof setTimeout> | null = null;
let isTrackingInitialized = false;


function trackPageEnter(rawPage: string): void {
  // 1. Config Check
  if (!SDKConfigCache.trackPageViews) return;

  // 2. Filter Check (404 or Excluded)
  if (isNotTrackPage(rawPage) || is404Page(rawPage)) {
    console.log("Skipping tracking for:", rawPage);
    return;
  }

  // 3. Debounce (To prevent double firing in some edge cases)
  if (enterTimeout) clearTimeout(enterTimeout);

  enterTimeout = setTimeout(() => {
    // 4. Double check if page changed or valid
    if (isNotTrackPage(rawPage) || is404Page(rawPage)) return;

    const normalizedPage = normalizeUrl(rawPage);

    // Prevent tracking the same page twice consecutively (Optional safety)
    if (currentPage === normalizedPage && Date.now() - pageStartTime < 1000) {
      return;
    }

    // Set new state
    currentPage = normalizedPage;
    pageStartTime = Date.now();

    // 5. Send Log
    safeLog(EventType.PAGE_VIEW, ActionType.NAVIGATION, {
      element: normalizedPage,
      key: `page_view:${normalizedPage}`,
      page: normalizedPage,
      tag: "page",
      userId: analyticsCache.userId,
      additionalInfo: {
        rawUrl: rawPage,
        referral: getReferralSource() || "direct", // Get fresh referral
        UT: analyticsCache.isNewUser ? 1 : 0,
        timestamp: Date.now(),
      },
    });

    // console.log(" Page View Tracked:", normalizedPage);
  }, DEBOUNCE_DELAY_MS);
}

function trackPageExit(): void {
  if (!currentPage || !pageStartTime) return;

  const duration = Date.now() - pageStartTime;

  if (duration < MIN_DURATION_MS) {
    // Reset but don't log if too short
    currentPage = "";
    pageStartTime = 0;
    return;
  }

  safeLog(EventType.PAGE_VIEW, ActionType.TIME_TRACKING, {
    element: currentPage,
    key: `duration:${currentPage}`,
    page: currentPage,
    tag: "page",
    userId: analyticsCache.userId,
    additionalInfo: {
      durationMs: duration,
      durationSec: Math.round(duration / 1000),
      UT: analyticsCache.isNewUser ? 1 : 0,
      timestamp: Date.now(),
    },
  });

  // console.log(` Page Exit: ${currentPage} (${Math.round(duration / 1000)}s)`);

  currentPage = "";
  pageStartTime = 0;
}


/**
 * This function handles BOTH Vanilla JS and SPAs automatically.
 * It monkey-patches the History API to detect SPA changes,
 * and uses standard DOM events for initial loads and exits.
 */
export function enableAutoPageTracking(): void {
  // Prevent double initialization
  if (isTrackingInitialized) {
    // console.warn("Page tracking already initialized.");
    return;
  }

  if (!SDKConfigCache.trackPageViews) {
    // console.log(" Page tracking disabled in config.");
    return;
  }

  isTrackingInitialized = true;
  // console.log(" Auto Page Tracking Initialized (Universal Mode)");

  // ---------------------------------------------
  // 1. INITIAL LOAD (Works for SPA & Vanilla)
  // ---------------------------------------------
  const handleInitialLoad = () => {
    trackPageEnter(location.pathname + location.search);
  };

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    handleInitialLoad();
  } else {
    window.addEventListener("DOMContentLoaded", handleInitialLoad);
  }

  // ---------------------------------------------
  // 2. SPA NAVIGATION (History API Interception)
  // ---------------------------------------------
  // Only intercept if History API is available
  if (typeof history !== "undefined") {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // Override pushState (Used by React Router, Vue Router, etc.)
    history.pushState = function (...args) {
      const prevUrl = location.pathname + location.search;
      const result = originalPushState.apply(this, args);
      const newUrl = location.pathname + location.search;

      if (prevUrl !== newUrl) {
        trackPageExit(); // End previous page
        trackPageEnter(newUrl); // Start new page
      }
      return result;
    };

    // Override replaceState
    history.replaceState = function (...args) {
      const prevUrl = location.pathname + location.search;
      const result = originalReplaceState.apply(this, args);
      const newUrl = location.pathname + location.search;

      if (prevUrl !== newUrl) {
        trackPageExit();
        trackPageEnter(newUrl);
      }
      return result;
    };
  }

  // ---------------------------------------------
  // 3. BROWSER NAVIGATION (Back/Forward Buttons)
  // ---------------------------------------------
  window.addEventListener("popstate", () => {
    trackPageExit();
    trackPageEnter(location.pathname + location.search);
  });

  // (Optional) Hash change for older routers
  window.addEventListener("hashchange", () => {
    trackPageExit();
    trackPageEnter(location.pathname + location.hash);
  });

  // ---------------------------------------------
  // 4. PAGE EXIT / TAB CLOSE (Works for Everyone)
  // ---------------------------------------------
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      trackPageExit();
    }
  });

  // Fallback for desktop close
  window.addEventListener("beforeunload", () => {
    trackPageExit();
  });
}
