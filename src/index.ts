import { initUcoderInsight } from "./base/core";
import { trackCustomEvent } from "./events/custom.event";
import { customEventConfig } from "./interface/event.interface";

// FIX: UcoderInsightConfig ar TrackingToggles age export hocchilo na,
// tai developer-ra nijer config variable-e ei type use korte parto na
export type {
  NotTrackPageConfig,
  UcoderInsightConfig,
  TrackingToggles,
} from "./interface/event.interface";
export { initUcoderInsight, trackCustomEvent };

// Global flags
let isVanillaJS = false;
let isReady = false;
const eventQueue: customEventConfig[] = [];

// Helper to process queued events
const processQueue = () => {
  if (eventQueue.length > 0) {
    console.log(`Processing ${eventQueue.length} queued events...`);
    eventQueue.forEach((event) => trackCustomEvent(event));
    eventQueue.length = 0; // Clear queue
  }
};

// Vanilla JS export for browser usage
if (typeof window !== "undefined") {
  isVanillaJS = true;

  (window as any).ucoderInsight = {
    isReady: () => isReady,
    isVanilla: () => isVanillaJS,

    // Initialize
    init: async (projectId: string, options = {}) => {
      console.log(" [Ucoder Insight] Initializing in Vanilla JS mode...");

      const config = await initUcoderInsight(projectId, options);

      if (config) {
        isReady = true;
        processQueue(); // Send queued events
      }

      return config;
    },

    track: (config: customEventConfig) => {
      //  If not ready, add to queue
      if (!isReady) {
        // console.log(
        //   " [Ucoder Insight] SDK initializing, event queued:",
        //   config.event_name,
        // );
        eventQueue.push(config);
        return;
      }

      // If ready, send immediately
      return trackCustomEvent(config);
    },

    healthCheck: () => {
      console.log(" [Ucoder Insight] Status Check");
      console.log("  Ready:", isReady);
      console.log("  Queue Size:", eventQueue.length);
      return true;
    },
  };

  // Emit ready event
  window.dispatchEvent(
    new CustomEvent("ucoderInsightReady", {
      detail: { version: "1.0.0", mode: "vanilla" },
    }),
  );
}

export { isVanillaJS };
