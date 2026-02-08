import { SDKConfigCache } from "../loader/analyticsCache";
import { initDB } from "./userMetaData.indexDb";

const LOG_DB_NAME = "Ucoder_Offline_Logs";
const STORE_NAME = "queue";
const MAX_BATCH_LIMIT = SDKConfigCache.batchEventSize || 50;

// Save a batch of events to IndexedDB for offline storage
export const saveOfflineBatch = async (batch: any[]) => {
  try {
    const db = await initDB(LOG_DB_NAME, STORE_NAME);
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const countRequest = store.count();

    // when the count request succeeds , check if we can add more
    countRequest.onsuccess = () => {
      const currentCount = countRequest.result;

      if (currentCount >= MAX_BATCH_LIMIT) {
        console.warn(
          ` Offline Storage Full (${MAX_BATCH_LIMIT} batches). Dropping new data to preserve old logs.`,
        );
        return;
      }
      // Proceed to save the batch
      const record = {
        id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        events: batch,
      };

      store.put(record);
      console.log("Offline Batch Saved.");
    };

    countRequest.onerror = () => {
      console.error("Error checking DB count");
    };
  } catch (error) {
    console.error(" Failed to save offline:", error);
  }
};

// Retrieve offline batches from IndexedDB
export const getOfflineBatches = async (limit: number): Promise<any[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB(LOG_DB_NAME, STORE_NAME);
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll(null, limit);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    } catch (error) {
      reject(error);
    }
  });
};
// delete specific processed batches from IndexedDB
export const deleteSpecificBatches = async (keys: any[]) => {
  try {
    const db = await initDB(LOG_DB_NAME, STORE_NAME);
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    keys.forEach((key) => {
      store.delete(key);
    });

    console.log(`Deleted ${keys.length} processed batches.`);
  } catch (error) {
    console.error(" Failed to delete batches:", error);
  }
};

// get total ofline batch count stored
export const getOfflineDataCount = async (): Promise<number> => {
  return new Promise(async (resolve) => {
    try {
      const db = await initDB(LOG_DB_NAME, STORE_NAME);
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    } catch (error) {
      resolve(0);
    }
  });
};
