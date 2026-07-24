import { TrackingMode } from "../enums/event.enum";
import { TrackerConfig } from "../interface/config.interface";

export const DEFAULT_CONFIG: Required<TrackerConfig> = {
  // Core Behavior
  mode: TrackingMode.FREE,
  autoTrack: true,
  projectId: "",
  allowDomains: [],

  // Event Tracking Toggles
  trackPageViews: true,
  trackClicks: true,
  trackErrors: true,
  trackCustomEvents: true,

  // Optional Features
  trackScroll: false,
  trackPerformance: false,
  customEvents: true,
  sendUserId: true,
  sendAdditionalInfo: true,
  batchEventSize: 20,

  // Data Handling
  cacheOffline: false,
  sendInterval: 10000, // 10 sec batching

  // Backend / Endpoints
  userId: true,
  device: true,
  geo: true,
  network: false,
  additionalInfo: true,
};
