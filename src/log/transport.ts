import { analyticsCache, SDKConfigCache } from "../loader/analyticsCache";
import {
  saveOfflineBatch,
  getOfflineBatches,
  deleteSpecificBatches,
  getOfflineDataCount,
} from "../db/cache.offline";
import { shouldLogToConsole } from "../utils/environment";

const API_URL = "http://insight-api.ucoder.in/event/log";
let isSyncing = false;

export const isLogEnabled = (): boolean => {
  if (!SDKConfigCache.projectId) {
    return false;
  }

  if (!analyticsCache.projectId) {
    return false;
  }

  return true;
};

let manualOverride: boolean | null = null;

export const setLogEnabled = (enabled: boolean) => {
  manualOverride = enabled;
  console.log(`Logging manually ${enabled ? "ENABLED" : "DISABLED"}`);
};

export const isLoggingAllowed = (): boolean => {
  if (manualOverride !== null) {
    return manualOverride;
  }

  return isLogEnabled();
};

export const sendEvents = async (batch: any[]) => {
  if (!isLoggingAllowed()) {
    console.warn("SDK not configured or logging disabled. Batch dropped.");
    return;
  }

  if (!analyticsCache.projectId) {
    console.warn("SDK: Project ID missing, dropping batch.");
    return;
  }

  // Debug mode - console only, no API
  if (shouldLogToConsole()) {
    console.log("[Debug Mode] Analytics Events:", {
      projectId: analyticsCache.projectId,
      eventsCount: batch.length,
      timestamp: new Date().toISOString(),
      events: batch,
    });
    return;
  }

  // Offline handling
  if (!navigator.onLine) {
    if (SDKConfigCache.cacheOffline) {
      console.log("Device Offline. Saving to DB.");
      await saveOfflineBatch(batch);
    }
    return;
  }

  const payload = {
    projectId: analyticsCache.projectId,
    events: batch,
  };

  try {
    if (navigator.sendBeacon && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });

      const beaconSent = navigator.sendBeacon(API_URL, blob);

      if (beaconSent) {
        return;
      } else {
        console.warn("Beacon API failed, falling back to fetch");
      }
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      console.error("Server Rejected Data:", result.message);
      return;
    }
  } catch (error) {
    if (SDKConfigCache.cacheOffline) {
      console.warn("Network/Server failed. Saving to Offline DB.");
      await saveOfflineBatch(batch);
    } else {
      console.error("Failed to send events:", error);
    }
  }
};

const processOfflineQueue = async (): Promise<boolean> => {
  if (!isLoggingAllowed()) {
    return false;
  }

  if (shouldLogToConsole()) {
    return false;
  }

  const SYNC_CHUNK_SIZE = SDKConfigCache.batchEventSize || 50;
  if (isSyncing) return false;
  if (!navigator.onLine) return false;

  try {
    isSyncing = true;

    const offlineRecords = await getOfflineBatches(SYNC_CHUNK_SIZE);

    if (offlineRecords.length === 0) {
      isSyncing = false;
      return true;
    }

    const allOfflineEvents = offlineRecords.flatMap((r: any) => r.events);
    const batchIdsToDelete = offlineRecords.map((r: any) => r.id);

    const payload = {
      projectId: analyticsCache.projectId,
      events: allOfflineEvents,
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      await deleteSpecificBatches(batchIdsToDelete);
      return true;
    } else {
      // console.error("Data Rejected. Deleting bad batches.");
      await deleteSpecificBatches(batchIdsToDelete);
      return true;
    }
  } catch (error) {
    console.error("Sync Failed (Network Error). Will retry later.");
    return false;
  } finally {
    isSyncing = false;
  }
};

export const startBackgroundSync = async () => {
  let nextDelay = 5000;

  try {
    if (!isLoggingAllowed()) {
      nextDelay = 30000;
    } else if (shouldLogToConsole()) {
      nextDelay = 10000;
    } else if (navigator.onLine) {
      const pendingCount = await getOfflineDataCount();

      if (pendingCount > 0) {
        const success = await processOfflineQueue();
        nextDelay = success ? 1000 : 5000;
      } else {
        nextDelay = 5000;
      }
    } else {
      nextDelay = 5000;
    }
  } catch (error) {
    console.error("Background Sync Error:", error);
  }

  setTimeout(() => {
    startBackgroundSync();
  }, nextDelay);
};
