import { analyticsCache, SDKConfigCache } from "../loader/analyticsCache";
import {
  saveOfflineBatch,
  getOfflineBatches,
  deleteSpecificBatches,
  getOfflineDataCount,
} from "../db/cache.offline";

const API_URL = "http://localhost:5000/event/log";

let isSyncing = false;

// 🎯 Logging enabled hobe jokhon SDK properly configured
export const isLogEnabled = (): boolean => {
  // Check if SDK is properly initialized
  if (!SDKConfigCache.projectId) {
    return false;
  }

  // Check if project ID is valid
  if (!analyticsCache.projectId) {
    return false;
  }

  return true;
};

// Manual override (optional, for testing)
let manualOverride: boolean | null = null;

export const setLogEnabled = (enabled: boolean) => {
  manualOverride = enabled;
  console.log(`📡 Logging manually ${enabled ? "ENABLED" : "DISABLED"}`);
};

export const isLoggingAllowed = (): boolean => {
  // Manual override takes priority
  if (manualOverride !== null) {
    return manualOverride;
  }

  // Otherwise check SDK config
  return isLogEnabled();
};

export const sendEvents = async (batch: any[]) => {
  //  If SDK not configured properly, don't send
  if (!isLoggingAllowed()) {
    console.warn(" SDK not configured or logging disabled. Batch dropped.");
    return;
  }

  if (!analyticsCache.projectId) {
    console.warn("⛔ SDK: Project ID missing, dropping batch.");
    return;
  }

  // Offline handling
  if (!navigator.onLine) {
    if (SDKConfigCache.cacheOffline) {
      console.log("📥 Device Offline. Saving to DB.");
      await saveOfflineBatch(batch);
    }
    return;
  }

  const payload = {
    projectId: analyticsCache.projectId,
    events: batch,
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    const result = await response.json();

    if (!result.success) {
      console.error(" Server Rejected Data:", result.message);
      return;
    }

    console.log(" Batch sent successfully");
  } catch (error) {
    if (SDKConfigCache.cacheOffline) {
      console.warn(" Network/Server failed. Saving to Offline DB.");
      await saveOfflineBatch(batch);
    } else {
      console.error(" Failed to send events:", error);
    }
  }
};

const processOfflineQueue = async (): Promise<boolean> => {
  //  Skip sync if logging not allowed
  if (!isLoggingAllowed()) {
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

    console.log(`♻️ Syncing ${offlineRecords.length} offline batches...`);

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

    const result = await response.json();

    if (result.success) {
      await deleteSpecificBatches(batchIdsToDelete);
      console.log(" Offline Sync Successful!");
      return true;
    } else {
      console.error(" Data Rejected. Deleting bad batches.");
      await deleteSpecificBatches(batchIdsToDelete);
      return true;
    }
  } catch (error) {
    console.error(" Sync Failed (Network Error). Will retry later.");
    return false;
  } finally {
    isSyncing = false;
  }
};

export const startBackgroundSync = async () => {
  let nextDelay = 5000;

  try {
    if (!isLoggingAllowed()) {
      // SDK not ready - longer wait
      nextDelay = 30000; // 30s
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
