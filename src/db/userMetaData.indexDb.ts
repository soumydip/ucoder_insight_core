const dbCache: { [key: string]: IDBDatabase } = {};

// init indexedDB and create object store if not exists
export const initDB = (
  DB_NAME: string,
  STORE_NAME: string,
): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbCache[DB_NAME]) {
      return resolve(dbCache[DB_NAME]);
    }

    const request = indexedDB.open(DB_NAME, 1);
    // Create object store if it doesn't exist
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      dbCache[DB_NAME] = db;

      db.onclose = () => {
        delete dbCache[DB_NAME];
      };

      resolve(db);
    };

    request.onerror = () => reject(request.error);
  });
};

const DB_NAME = "UcoderInsightDB";
const STORE_NAME = "user_metadata";


// Save user metadata to IndexedDB help to count unique users and store user traits for better analysis also help to find bounce rate 
export const saveMetadata = async (id: string, data: any): Promise<boolean> => {
  const db = await initDB(DB_NAME, STORE_NAME);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const request = store.put({ ...data, id: id });

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};


export const getMetadata = async (id: string): Promise<any | null> => {
  const db = await initDB(DB_NAME, STORE_NAME);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};
