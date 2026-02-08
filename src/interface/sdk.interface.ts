import { TrackingMode } from "../enums/event.enum";

export interface SDKConfig {
  mode: TrackingMode;
  allowDomins: string[];
  projectId: string;
  sendInterval: number;
   features: {
    autoTrack: boolean;
    trackPageViews: boolean;
    trackClicks: boolean;
    trackErrors: boolean;
    trackScroll: boolean;
    trackCustomEvents: boolean;
    trackPerformance: boolean;
    customEvents: boolean;
    cacheOffline: boolean;
    batchEvents: boolean;
    sendUserId: boolean;
    sendAdditionalInfo: boolean;
    batchEventsSize: number;
  };
}