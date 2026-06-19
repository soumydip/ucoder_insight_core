// scroll.event.ts
import { EventType, ActionType } from "../enums/event.enum";
import { safeLog } from "../log/safeLog";
import { analyticsCache, SDKConfigCache } from "../loader/analyticsCache";
import { normalizeUrl } from "../helper/normalizePath";
import { is404Page, isNotTrackPage } from "../loader/notTrakingPath";

const ACTIVATION_DELAY = 500;
const SCROLL_THRESHOLD = 25;
const SCROLL_DEBOUNCE = 200;

export const registerScrollTracker = () => {
  if (!SDKConfigCache.trackScroll) return;

  // local state — module level variable না, function scope এ
  let currentPath = normalizeUrl(window.location.pathname);
  let maxScrollDepth = 0;
  let isTrackingActive = false;
  let activationTimer: ReturnType<typeof setTimeout> | null = null;
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

  const startNewPageTimer = () => {
    maxScrollDepth = 0;
    isTrackingActive = false;
    if (activationTimer) clearTimeout(activationTimer);
    activationTimer = setTimeout(() => {
      isTrackingActive = true;
    }, ACTIVATION_DELAY);
  };

  const sendScrollLog = (path: string) => {
    if (!SDKConfigCache.trackScroll) return;
    if (maxScrollDepth < SCROLL_THRESHOLD) return;

    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const totalScrollable = docHeight - winHeight;
    if (totalScrollable <= 0) return;

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
        scrolledPixels,
        totalScrollable,
        type: "scroll_summary",
      },
    });
  };

  const handleScrollLogic = () => {
    if (!isTrackingActive) return;
    if (!SDKConfigCache.trackScroll) return;
    if (is404Page(currentPath) || isNotTrackPage(currentPath)) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const totalScrollable = docHeight - winHeight;
    if (totalScrollable <= 0) return;

    // Math.floor — exactly 25% at 300/1200 = 0.25 * 100 = 25
    const scrollPercent = Math.min(
      100,
      Math.floor((scrollTop / totalScrollable) * 100),
    );

    if (scrollPercent > maxScrollDepth) {
      maxScrollDepth = scrollPercent;
    }
  };

  const handleRouteChange = () => {
    const newPath = normalizeUrl(window.location.pathname);
    if (currentPath && currentPath !== newPath) {
      sendScrollLog(currentPath);
      currentPath = newPath;
      startNewPageTimer();
    } else if (!currentPath) {
      currentPath = newPath;
      startNewPageTimer();
    }
  };

  const handleScroll = () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleScrollLogic, SCROLL_DEBOUNCE);
  };

  const handleBeforeUnload = () => {
    sendScrollLog(currentPath);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      sendScrollLog(currentPath);
    }
  };

  // patch history
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args: Parameters<typeof originalPushState>) {
    const result = originalPushState.apply(this, args);
    handleRouteChange();
    return result;
  };

  history.replaceState = function (...args: Parameters<typeof originalReplaceState>) {
    const result = originalReplaceState.apply(this, args);
    handleRouteChange();
    return result;
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("popstate", handleRouteChange);
  window.addEventListener("beforeunload", handleBeforeUnload);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  startNewPageTimer();

  // cleanup
  return () => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("popstate", handleRouteChange);
    window.removeEventListener("beforeunload", handleBeforeUnload);
    document.removeEventListener("visibilitychange", handleVisibilityChange);

    // history restore
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;

    if (activationTimer) clearTimeout(activationTimer);
    if (scrollTimeout) clearTimeout(scrollTimeout);
  };
};