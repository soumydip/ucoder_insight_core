import { resolveConfig } from "../config/resolveConfig";
import { registerClickEvent } from "../events/click.events";
import { startLogReporter } from "../log/logReporter";
import { loadUserToken } from "../loader/getUser";
import { registerErrorTracking } from "../events/error.events";
import { enableAutoPageTracking } from "../events/pageView.events";
import { normalizeUrl } from "../helper/normalizePath";
import { configureTracker } from "../loader/notTrakingPath";
import {
  NotTrackPageConfig,
  TrackPerformaceConfig,
} from "../interface/event.interface";
import { registerScrollTracker } from "../events/scroll.event";
import { registerPerformanceTracking } from "../events/performence.event";
import { isTestingMode } from "../utils/environment";
import { isBot } from "../spam/isBot";
import { registerOutboundLinkEvent } from "../events/OutboundLink.event";
import { optionalConfigCache } from "../loader/analyticsCache";
import { initPerformanceTracking } from "./performance.base";
//
const isBrowser = typeof window !== "undefined";
const isVanillaMode = isBrowser && !!(window as any).ucoderInsight;

// race condition prevention variables
let isInitialized = false;
let isInitializing = false;

// cleanup functions for event listeners and trackers
let cleanupFns: Array<() => void> = [];

export async function initUcoderInsight(
  projectId: string,
  userConfig?: NotTrackPageConfig,
  performanceConfig?: TrackPerformaceConfig,
) {
  if (!isBrowser) {
    console.warn(
      " [Ucoder Insight] Cannot initialize in non-browser environment",
    );
    return null;
  }

  // bot detection check - if it's a bot, skip initialization entirely
  if (isBot()) {
    console.warn(" [Ucoder Insight] Bot detected, initialization skipped.");
    return null;
  }

  // race condition check! (if it's already initialized or initializing)
  if (isInitialized || isInitializing) {
    if (isTestingMode()) {
      console.warn(
        " [Ucoder Insight] SDK is already initialized or initializing!",
      );
    }
    return null;
  }

  // if debug mode is enabled in user config, we should log a warning that SDK is running in debug mode and no data will be sent to server (but events will still be tracked and logged in console for testing and debugging purposes)
  if (userConfig?.debug) {
    optionalConfigCache.debug = true;
  }

  isInitializing = true; // initialization process started, set the flag to prevent

  if (isTestingMode()) {
    console.log("[Ucoder Insight] Initializing...");
    console.log("   Mode:", isVanillaMode ? "Vanilla JS" : "Framework");
    console.log("   Project ID:", projectId);
  }

  // if user provided custom config, apply it before fetching server config (so that notTrackPath and debug mode can work immediately)
  if (userConfig) {
    configureTracker(userConfig);
    if (userConfig.debug) {
      console.log(
        " [Ucoder Insight] Running in Testing Mode - No data will be sent to server",
      );
    }
  }

  try {
    // if config fetching fails, we should not proceed with initialization, but we should also release the lock (isInitializing) so that user can try again later without refreshing the page
    const config = await resolveConfig(projectId);

    // if config is null or undefined, it means fetching failed or project ID is invalid, we should log an error and exit initialization gracefully

    if (!config) {
      console.error(
        " [Ucoder Insight] Init Failed: Server Unreachable or Invalid Project ID",
      );
      isInitializing = false; // release the lock so that user can try again
      return null;
    }

    isInitialized = true; // initialization successful, set the flag

    // URL normalization for consistent page tracking (e.g. remove trailing slashes, lowercase, etc.)
    const rawPage = location.pathname || "/";
    const page = normalizeUrl(rawPage) ?? rawPage;

    await loadUserToken();

    // all trackers should be registered after config is successfully fetched, so that we can ensure the config is applied correctly (e.g. notTrackPath should work immediately without waiting for next page load)
    if (config.trackClicks) cleanupFns.push(registerClickEvent(page) as any);
    if (config.trackPageViews)
      cleanupFns.push(registerOutboundLinkEvent() as any);
    if (config.trackPageViews) cleanupFns.push(enableAutoPageTracking() as any);
    if (config.trackScroll) cleanupFns.push(registerScrollTracker() as any);
    if (config.trackErrors) cleanupFns.push(registerErrorTracking() as any);
    if (config.trackPerformance) {
      registerPerformanceTracking();
      await initPerformanceTracking(performanceConfig || {});
    }

    // start the log reporter
    startLogReporter(config.sendInterval);

    if (isTestingMode()) {
      console.log(
        "[Ucoder Insight] Initialization Complete with Config:",
        config,
      );
    }

    return config;
  } catch (error) {
    console.error(
      " [Ucoder Insight] Critical error during initialization:",
      error,
    );
  } finally {
    isInitializing = false;
  }
}

export function stopUcoderInsight() {
  if (!isInitialized) return;
  // call all cleanup functions to remove event listeners and trackers need for future cleanup (e.g. if user wants to re-initialize with a different project ID or config without refreshing the page)
  cleanupFns.forEach((fn) => {
    if (typeof fn === "function") fn();
  });
  cleanupFns = [];
  isInitialized = false;
  if (isTestingMode())
    console.log("[Ucoder Insight] Tracking stopped and cleaned up.");
}
