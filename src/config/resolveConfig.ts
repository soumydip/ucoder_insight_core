import { DEFAULT_CONFIG } from "./defaultConfig";
import { applyTrackingMode } from "./trackingElements";
import { TrackerConfig } from "../interface/config.interface";
import { TrackingMode } from "../enums/event.enum";
import { analyticsCache, SDKConfigCache } from "../loader/analyticsCache";

// Update the SDK config cache based on resolved configuration or remote config
export const updateSDKCache = (config: TrackerConfig) => {
  SDKConfigCache.projectId = config.projectId;
  SDKConfigCache.mode = config.mode === TrackingMode.PRO ? "PRO" : "FREE";

  SDKConfigCache.sendInterval = config.sendInterval || 10000;
  SDKConfigCache.batchEventSize = config.batchEventSize || 50;
  SDKConfigCache.cacheOffline = config.cacheOffline ?? true;

  SDKConfigCache.trackClicks = config.trackClicks ?? true;
  SDKConfigCache.trackPageViews = config.trackPageViews ?? true;
  SDKConfigCache.trackScroll = config.trackScroll ?? false;
  SDKConfigCache.trackErrors = config.trackErrors ?? false;
  SDKConfigCache.trackPerformance = config.trackPerformance ?? false;
  SDKConfigCache.trackCustomEvents = config.trackCustomEvents ?? true;
  SDKConfigCache.allowDomins = config.allowDomains || [];
};

interface RemoteResponse {
  projectId: string;
  mode: string;
  allowDomins: string[];
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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Simple checksum function for data integrity
const generateChecksum = (str: string): string => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString();
};
// Encode data with checksum for integrity verification
const encodeData = (data: any): string => {
  try {
    const jsonString = JSON.stringify(data);
    const checksum = generateChecksum(jsonString);
    const payload = JSON.stringify({ d: jsonString, s: checksum });

    return btoa(
      encodeURIComponent(payload).replace(/%([0-9A-F]{2})/g, (match, p1) =>
        String.fromCharCode(parseInt(p1, 16)),
      ),
    );
  } catch (e) {
    return "";
  }
};
// Decode data and verify checksum
const decodeData = (base64String: string): any => {
  try {
    if (!base64String) return null;

    if (base64String.trim().startsWith("{")) {
      return JSON.parse(base64String);
    }

    const decodedString = decodeURIComponent(
      atob(base64String)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const payload = JSON.parse(decodedString);
    const calculatedChecksum = generateChecksum(payload.d);

    if (calculatedChecksum !== payload.s) {
      console.warn("SDK: Config Tampered! Ignoring local cache.");
      return null;
    }

    return JSON.parse(payload.d);
  } catch (e) {
    return null;
  }
};

// Fetch remote configuration with retry logic
const fetchRemoteConfig = async (
  projectId: string,
): Promise<RemoteResponse | null> => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(
        `https://insight-api.ucoder.in/project/SDK-config/${projectId}`,
      );
      const result = await response.json();
      // if any error in response not config the project
      if (result.success === false) {
        console.error("SDK Error: Project not found or inactive.");
        return null;
      }
      if (result.success === true) {
        return result.data;
      }
    } catch (error) {
      // if network , any other error , retry 3 times
      console.warn(
        ` SDK Config fetch failed (attempt ${attempt}/${MAX_RETRIES})`,
      );
      if (attempt < MAX_RETRIES) await delay(RETRY_DELAY);
    }
  }

  console.error(" SDK: Failed to fetch config after all retries");
  return null;
};

// Resolve final configuration by merging default, user, and remote configs
export async function resolveConfig(
  projectId: string,
  userConfig?: Partial<TrackerConfig>,
): Promise<TrackerConfig | null> {
  let finalConfig: TrackerConfig = {
    ...DEFAULT_CONFIG,
    ...userConfig,
    projectId,
  };

  let remoteData: RemoteResponse | null = null;
  const CACHE_KEY = `tracker_config_${projectId}`;

  const cached = decodeData(localStorage.getItem(CACHE_KEY) || "");
  // Check cache validity
  if (cached) {
    const now = Date.now();
    if (cached.data && now - cached.timestamp < CACHE_TTL) {
      console.log(" [ Ucoder Insight ] Loaded config from Cache");
      remoteData = cached.data;
    }
  }

  if (!remoteData) {
    // if cache not found retry via network
    console.log("[Ucoder Insight] Fetching config from Server...");
    remoteData = await fetchRemoteConfig(projectId);

    if (remoteData) {
      try {
        const payload = {
          timestamp: Date.now(),
          data: remoteData,
        };
        localStorage.setItem(CACHE_KEY, encodeData(payload));
        console.log("[Ucoder Insight] Config cached successfully");
      } catch (e) {
        console.warn(" Unable to save config to cache.");
      }
    }
  }

  //  If no remote data, SDK initialization failed
  if (!remoteData) {
    console.error(
      " [ Ucoder Insight ] Initialization FAILED - No config available",
    );
    // Clear any stale cache
    localStorage.removeItem(CACHE_KEY);
    return null;
  }

  const allowedList = remoteData.allowDomins || [];
  const currentOrigin = window.location.origin;

  // Validate current domain against allowed list
  const isAllowed =
    allowedList.length === 0 ||
    allowedList.some((allowedUrl) => {
      const normalizedUrl = allowedUrl.replace(/\/$/, "");
      return currentOrigin === normalizedUrl;
    });

  if (!isAllowed) {
    console.error(
      ` [ Ucoder Insight ] Domain ${currentOrigin} is not authorized.`,
    );
    localStorage.removeItem(CACHE_KEY);
    return null;
  }

  const isPro = remoteData.mode === "PRO";
  const features = remoteData.features;

  finalConfig = {
    ...finalConfig,
    mode: isPro ? TrackingMode.PRO : TrackingMode.FREE,
    sendInterval: remoteData.sendInterval,
    autoTrack: features.autoTrack,
    trackPageViews: features.trackPageViews,
    trackClicks: features.trackClicks,
    trackErrors: features.trackErrors,
    trackScroll: features.trackScroll,
    trackCustomEvents: features.trackCustomEvents,
    trackPerformance: features.trackPerformance,
    customEvents: features.customEvents,
    cacheOffline: features.cacheOffline,
    sendUserId: features.sendUserId,
    sendAdditionalInfo: features.sendAdditionalInfo,
    batchEventSize: features.batchEventsSize,
  };
  // Apply tracking mode settings
  applyTrackingMode(isPro ? TrackingMode.PRO : TrackingMode.FREE);
  analyticsCache.projectId = projectId;
  // update SDK cache
  updateSDKCache(finalConfig);

  console.log(" SDK: Configuration resolved successfully");

  return finalConfig;
}
