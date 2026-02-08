import { TrackingMode } from "../enums/event.enum";

export interface TrackerConfig {
  projectId: string;
  mode: TrackingMode;
  allowDomains: string[];
  
  autoTrack: boolean;
  trackPageViews: boolean;
  trackClicks: boolean;
  trackErrors: boolean;
  trackScroll: boolean;
  trackCustomEvents: boolean;
  trackPerformance: boolean;
  customEvents: boolean;

  // --- Transport & System ---
  cacheOffline?: boolean;
  sendInterval: number;
  batchEventSize: number; 
  
  // --- Data Options ---
  sendUserId?: boolean;
  sendAdditionalInfo?: boolean;

  // --- Metadata Toggles ---
  userId: boolean;
  device: boolean;
  geo?: boolean;
  network?: boolean;
  additionalInfo?: boolean;
}