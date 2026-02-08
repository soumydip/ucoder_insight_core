import { analyticsCache } from "./analyticsCache";
import { getMetadata, saveMetadata } from "../db/userMetaData.indexDb";
import { generateUUID } from "../helper/genarateUUID";

const IDENTITY_KEY = "CURRENT_USER_IDENTITY";
const SESSION_ID_KEY = "__UC_SESSION_ID__";
const SESSION_TIMEOUT = 30*60 * 1000; // 30 min

export async function loadUserToken() {
  if (analyticsCache.isInitialized) return analyticsCache;

  const now = Date.now();
  let finalUserId = "";
  let currentSessionId = localStorage.getItem(SESSION_ID_KEY);
  let sessionCount = 0;
  let isNewUser = false;

  const record = await getMetadata(IDENTITY_KEY);

  if (record && record.userId) {
    finalUserId = record.userId;
    sessionCount = record.sc || 1;
    const lastSeen = record.lastSeen || 0;

    if (!currentSessionId || now - lastSeen > SESSION_TIMEOUT) {
      currentSessionId = generateUUID(10);
      sessionCount += 1;
      localStorage.setItem(SESSION_ID_KEY, currentSessionId);

      await saveMetadata(IDENTITY_KEY, {
        ...record,
        sc: sessionCount,
        lastSeen: now,
      });
    } else {
      await saveMetadata(IDENTITY_KEY, {
        ...record,
        lastSeen: now,
      });
    }
    isNewUser = false;
  } else {
    finalUserId = generateUUID(16);
    currentSessionId = generateUUID(10);
    sessionCount = 1;
    isNewUser = true;

    localStorage.setItem(SESSION_ID_KEY, currentSessionId);

    await saveMetadata(IDENTITY_KEY, {
      userId: finalUserId,
      sc: sessionCount,
      firstSeen: now,
      lastSeen: now,
    });
  }

  analyticsCache.userId = finalUserId;
  analyticsCache.s_id = currentSessionId!;
  analyticsCache.TotalSessionsCount = sessionCount;
  analyticsCache.lastSessionActive = now;
  analyticsCache.isNewUser = isNewUser;
  analyticsCache.isInitialized = true;
  analyticsCache.isDevicesDataSend = false;

  return analyticsCache;
}
