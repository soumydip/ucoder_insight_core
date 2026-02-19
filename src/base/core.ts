import { resolveConfig } from "../config/resolveConfig";
import { registerClickEvent } from "../events/click.events";
import { startLogReporter } from "../log/logReporter";
import { loadUserToken } from "../loader/getUser";
import { registerErrorTracking } from "../events/error.events";
import { enableAutoPageTracking } from "../events/pageView.events";
import { normalizeUrl } from "../helper/normalizePath";
import { configureTracker } from "../loader/notTrakingPath";
import { NotTrackPageConfig } from "../interface/event.interface";
import { registerScrollTracker } from "../events/scroll.event";
import { registerPerformanceTracking } from "../events/performence.event";

// Check if running in browser
const isBrowser = typeof window !== "undefined";
const isVanillaMode = isBrowser && !!(window as any).ucoderInsight;

// check initialization status , to prevent multiple initializations ( when in localhost or dev environment, hot reloads may cause multiple inits)
let isInitialized = false;

// Initialize the project with given project ID and optional user config
export async function initProject(
  projectId: string,
  userConfig?: NotTrackPageConfig,
) {
  // Environment check
  if (!isBrowser) {
    console.warn(
      " [Ucoder Insight] Cannot initialize in non-browser environment",
    );
    return null;
  }

  // Check if already initialized
  if (isInitialized) {
    console.warn(" [Ucoder Insight] SDK is already initialized!");
    return null;
  }

  console.log("[Ucoder Insight] Initializing...");
  console.log("   Mode:", isVanillaMode ? "Vanilla JS" : "Framework");
  console.log("   Project ID:", projectId);

  // Load user config first
  if (userConfig) {
    configureTracker(userConfig);
  }
  if (userConfig?.debug) {
    console.log(
      " [Ucoder Insight] Running in Testing Mode - No data will be sent to server",
    );
  }

  // Try to fetch remote config
  const config = await resolveConfig(projectId);

  // If config is null, stop initialization
  if (!config) {
    console.error(
      " [Ucoder Insight] Init Failed: Server Unreachable or Invalid Project ID",
    );
    return null;
  }

  // ceck is testing mode

  isInitialized = true;

  // Normalize current page URL
  const rawPage = location.pathname || "/";
  const page = normalizeUrl(rawPage) ?? rawPage;

  // Load user token data from storage
  await loadUserToken();

  // Register event listeners based on config
  if (config.trackClicks) registerClickEvent(page);
  if (config.trackPageViews) enableAutoPageTracking();
  if (config.trackScroll) registerScrollTracker();
  if (config.trackErrors) registerErrorTracking();
  if (config.trackPerformance) registerPerformanceTracking();

  // Start log reporter
  startLogReporter(config.sendInterval);

  console.log("[Ucoder Insight] Initialized successfully!");

  return config;
}
