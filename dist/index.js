"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  initUcoderInsight: () => initUcoderInsight,
  isVanillaJS: () => isVanillaJS,
  trackCustomEvent: () => trackCustomEvent
});
module.exports = __toCommonJS(index_exports);

// src/config/defaultConfig.ts
var DEFAULT_CONFIG = {
  // Core Behavior
  mode: "FREE" /* FREE */,
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
  sendInterval: 1e4,
  // 10 sec batching
  // Backend / Endpoints
  userId: true,
  device: true,
  geo: true,
  network: false,
  additionalInfo: true
};

// src/interface/eventType.ts
var BASIC_ELEMENTS = [
  "button",
  "a",
  "form"
];
var ADVANCED_ELEMENTS = [
  "scroll"
];

// src/config/trackingElements.ts
var trackingElements = {};
BASIC_ELEMENTS.forEach((el) => trackingElements[el] = true);
ADVANCED_ELEMENTS.forEach((el) => trackingElements[el] = false);
function applyTrackingMode(mode) {
  BASIC_ELEMENTS.forEach((el) => trackingElements[el] = true);
  ADVANCED_ELEMENTS.forEach((el) => {
    trackingElements[el] = mode === "PRO" /* PRO */;
  });
}

// src/loader/analyticsCache.ts
var analyticsCache = {
  isInitialized: false,
  userId: "",
  s_id: "",
  isNewUser: false,
  lastSessionActive: 0,
  TotalSessionsCount: 0,
  isDevicesDataSend: false,
  projectId: ""
};
var SDKConfigCache = {
  projectId: "",
  mode: "FREE",
  sendInterval: 1e4,
  batchEventSize: 50,
  cacheOffline: true,
  trackClicks: true,
  trackPageViews: true,
  trackScroll: false,
  trackErrors: true,
  trackPerformance: false,
  trackCustomEvents: true,
  allowDomins: []
};
var optionalConfigCache = {
  debug: false
};

// src/config/resolveConfig.ts
var updateSDKCache = (config) => {
  SDKConfigCache.projectId = config.projectId;
  SDKConfigCache.mode = config.mode === "PRO" /* PRO */ ? "PRO" : "FREE";
  SDKConfigCache.sendInterval = config.sendInterval || 1e4;
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
var delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var CACHE_TTL = 60 * 60 * 1e3;
var generateChecksum = (str) => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString();
};
var encodeData = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    const checksum = generateChecksum(jsonString);
    const payload = JSON.stringify({ d: jsonString, s: checksum });
    return btoa(
      encodeURIComponent(payload).replace(
        /%([0-9A-F]{2})/g,
        (match, p1) => String.fromCharCode(parseInt(p1, 16))
      )
    );
  } catch (e) {
    return "";
  }
};
var decodeData = (base64String) => {
  try {
    if (!base64String) return null;
    if (base64String.trim().startsWith("{")) {
      return JSON.parse(base64String);
    }
    const decodedString = decodeURIComponent(
      atob(base64String).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    const payload = JSON.parse(decodedString);
    const calculatedChecksum = generateChecksum(payload.d);
    if (calculatedChecksum !== payload.s) {
      return null;
    }
    return JSON.parse(payload.d);
  } catch (e) {
    return null;
  }
};
var fetchRemoteConfig = async (projectId) => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1e3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(
        `https://insight-api.ucoder.in/project/SDK-config/${projectId}`
      );
      const result = await response.json();
      if (result.success === false) {
        console.error("SDK Error: Project not found or inactive.");
        return null;
      }
      if (result.success === true) {
        return result.data;
      }
    } catch (error) {
      console.warn(
        ` SDK Config fetch failed (attempt ${attempt}/${MAX_RETRIES})`
      );
      if (attempt < MAX_RETRIES) await delay(RETRY_DELAY);
    }
  }
  console.error(" SDK: Failed to fetch config after all retries");
  return null;
};
async function resolveConfig(projectId, userConfig2) {
  let finalConfig = {
    ...DEFAULT_CONFIG,
    ...userConfig2,
    projectId
  };
  let remoteData = null;
  const CACHE_KEY = `tracker_config_${projectId}`;
  const cached = decodeData(localStorage.getItem(CACHE_KEY) || "");
  if (cached) {
    const now = Date.now();
    if (cached.data && now - cached.timestamp < CACHE_TTL) {
      console.log(" [ Ucoder Insight ] Loaded config from Cache");
      remoteData = cached.data;
    }
  }
  if (!remoteData) {
    remoteData = await fetchRemoteConfig(projectId);
    if (remoteData) {
      try {
        const payload = {
          timestamp: Date.now(),
          data: remoteData
        };
        localStorage.setItem(CACHE_KEY, encodeData(payload));
      } catch (e) {
        console.warn(" Unable to save config to cache.");
      }
    }
  }
  if (!remoteData) {
    console.error(
      " [ Ucoder Insight ] Initialization FAILED - No config available"
    );
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
  const allowedList = remoteData.allowDomins || [];
  const currentOrigin = window.location.origin;
  const isAllowed = allowedList.length === 0 || allowedList.some((allowedUrl) => {
    const normalizedUrl = allowedUrl.replace(/\/$/, "");
    return currentOrigin === normalizedUrl;
  });
  if (!isAllowed) {
    console.error(
      ` [ Ucoder Insight ] Domain ${currentOrigin} is not authorized.`
    );
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
  const isPro = remoteData.mode === "PRO";
  const features = remoteData.features;
  finalConfig = {
    ...finalConfig,
    mode: isPro ? "PRO" /* PRO */ : "FREE" /* FREE */,
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
    batchEventSize: features.batchEventsSize
  };
  applyTrackingMode(isPro ? "PRO" /* PRO */ : "FREE" /* FREE */);
  analyticsCache.projectId = projectId;
  updateSDKCache(finalConfig);
  console.log(" SDK: Configuration resolved successfully");
  return finalConfig;
}

// src/helper/getElementName.ts
function getElementName(el) {
  const manual = el.getAttribute("data-track") || el.getAttribute("aria-label") || el.getAttribute("title") || el.id;
  if (manual) return normalize(manual);
  const tag = el.tagName.toUpperCase();
  if (tag === "A") {
    const text2 = el.innerText || el.getAttribute("href") || "link";
    return normalize(text2);
  }
  if (tag === "BUTTON") {
    return normalize(el.innerText || "button");
  }
  if (tag === "INPUT") {
    const name = el.getAttribute("name") || el.getAttribute("placeholder") || el.type;
    return normalize(name);
  }
  if (tag === "IMG") {
    return normalize(el.getAttribute("alt") || "image");
  }
  if (tag === "VIDEO") {
    return normalize("video");
  }
  if (tag === "AUDIO") {
    return normalize("audio");
  }
  const text = el.innerText?.trim();
  if (text) return normalize(text);
  return normalize(tag.toLowerCase());
}
function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).slice(0, 5).join("_") || "element";
}

// src/config/buildSelector.ts
function buildSelector() {
  const enabled = Object.keys(trackingElements).filter(
    (el) => trackingElements[el] === true
  );
  enabled.push("[data-track]");
  return enabled.join(",");
}

// src/helper/shouldTrackElement.ts
function shouldTrackElement(el) {
  const attr = el.getAttribute("data-uca-track");
  if (attr === "false") {
    console.log(" Element tracking disabled by developer:", el);
    return false;
  }
  if (attr === "true") {
    console.log(" Element tracking forced by developer:", el);
    return true;
  }
  const tag = el.tagName.toLowerCase();
  if (tag === "input") {
    const inputType = el.type?.toLowerCase();
    const sensitiveInputTypes = [
      "password",
      "email",
      "text",
      "tel",
      "number",
      "search",
      "url",
      "date",
      "time",
      "datetime-local",
      "month",
      "week",
      "color",
      "range",
      "file",
      "hidden"
    ];
    if (sensitiveInputTypes.includes(inputType)) {
      console.log(" Input field blocked (sensitive):", inputType);
      return false;
    }
    const safeInputTypes = ["checkbox", "radio", "submit", "button", "reset"];
    if (safeInputTypes.includes(inputType)) {
      console.log(" Safe input type allowed:", inputType);
      return trackingElements[tag] === true;
    }
    console.log(" Unknown input type blocked:", inputType);
    return false;
  }
  if (tag === "textarea") {
    console.log("Textarea blocked (sensitive)");
    return false;
  }
  if (tag === "select") {
    const isSensitive = el.hasAttribute("data-sensitive");
    if (isSensitive) {
      console.log(" Select blocked (marked sensitive)");
      return false;
    }
  }
  const isAllowed = trackingElements[tag] === true;
  if (isAllowed) {
    console.log(" Element allowed by config:", tag);
  } else {
    console.log(" Element not in tracking config:", tag);
  }
  return isAllowed;
}

// src/log/logBuffer.ts
var logBuffer = {};

// src/log/minimizeLogPayload.ts
var minimizeLogPayload = (eventType, actionType, totalClicks, rawData, customData) => {
  const shouldSendDeviceData = analyticsCache.isDevicesDataSend === false;
  const payload = {
    ET: eventType,
    AT: actionType,
    PT: rawData.page,
    TC: totalClicks,
    PID: analyticsCache.projectId,
    s_id: analyticsCache.s_id || void 0,
    DD: shouldSendDeviceData ? {
      ssc: analyticsCache.TotalSessionsCount,
      os: navigator.platform,
      sr: `${window.screen.width}x${window.screen.height}`,
      ram: navigator.deviceMemory || "unknown",
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cors: navigator.hardwareConcurrency || "unknown",
      pxr: window.devicePixelRatio,
      lang: navigator.language
    } : void 0,
    TS: (/* @__PURE__ */ new Date()).toISOString(),
    D: {
      el: rawData.element,
      tg: rawData.tag,
      u_id: rawData.userId,
      ...rawData.additionalInfo && { addI: rawData.additionalInfo }
    },
    ...customData && { CD: customData }
  };
  if (shouldSendDeviceData) {
    analyticsCache.isDevicesDataSend = true;
  }
  return payload;
};

// src/db/userMetaData.indexDb.ts
var dbCache = {};
var initDB = (DB_NAME2, STORE_NAME3) => {
  return new Promise((resolve, reject) => {
    if (dbCache[DB_NAME2]) {
      return resolve(dbCache[DB_NAME2]);
    }
    const request = indexedDB.open(DB_NAME2, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME3)) {
        db.createObjectStore(STORE_NAME3, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      dbCache[DB_NAME2] = db;
      db.onclose = () => {
        delete dbCache[DB_NAME2];
      };
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
};
var DB_NAME = "UcoderInsightDB";
var STORE_NAME = "user_metadata";
var saveMetadata = async (id, data) => {
  const db = await initDB(DB_NAME, STORE_NAME);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put({ ...data, id });
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};
var getMetadata = async (id) => {
  const db = await initDB(DB_NAME, STORE_NAME);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

// src/db/cache.offline.ts
var LOG_DB_NAME = "Ucoder_Offline_Logs";
var STORE_NAME2 = "queue";
var MAX_BATCH_LIMIT = SDKConfigCache.batchEventSize || 50;
var saveOfflineBatch = async (batch) => {
  try {
    const db = await initDB(LOG_DB_NAME, STORE_NAME2);
    const tx = db.transaction(STORE_NAME2, "readwrite");
    const store = tx.objectStore(STORE_NAME2);
    const countRequest = store.count();
    countRequest.onsuccess = () => {
      const currentCount = countRequest.result;
      if (currentCount >= MAX_BATCH_LIMIT) {
        return;
      }
      const record = {
        id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        events: batch
      };
      store.put(record);
    };
    countRequest.onerror = () => {
    };
  } catch (error) {
  }
};

// src/utils/environment.ts
var isTestingMode = () => {
  return optionalConfigCache.debug === true;
};
var shouldLogToConsole = () => {
  if (isTestingMode()) {
    return true;
  }
  return false;
};

// src/log/transport.ts
var API_URL = "https://insight-api.ucoder.in/event/log";
var isLogEnabled = () => {
  if (!SDKConfigCache.projectId) {
    return false;
  }
  if (!analyticsCache.projectId) {
    return false;
  }
  return true;
};
var manualOverride = null;
var isLoggingAllowed = () => {
  if (manualOverride !== null) {
    return manualOverride;
  }
  return isLogEnabled();
};
var sendEvents = async (batch) => {
  if (!isLoggingAllowed()) {
    console.warn("SDK not configured or logging disabled. Batch dropped.");
    return;
  }
  if (!analyticsCache.projectId) {
    console.warn("SDK: Project ID missing, dropping batch.");
    return;
  }
  if (shouldLogToConsole()) {
    console.log("[Debug Mode] Analytics Events:", {
      projectId: analyticsCache.projectId,
      eventsCount: batch.length,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      events: batch
    });
    return;
  }
  if (!navigator.onLine) {
    if (SDKConfigCache.cacheOffline) {
      console.log("Device Offline. Saving to DB.");
      await saveOfflineBatch(batch);
    }
    return;
  }
  const payload = {
    projectId: analyticsCache.projectId,
    events: batch
  };
  try {
    if (navigator.sendBeacon && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json"
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
      keepalive: true
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

// src/log/loger.ts
var log = (eventType, actionType, rawData, devicesDetails, customData) => {
  if (!isLoggingAllowed()) {
    console.warn(" SDK not ready. Event dropped:", eventType);
    return null;
  }
  const { key } = rawData;
  if (!logBuffer[key]) {
    logBuffer[key] = { count: 0, payload: null };
  }
  logBuffer[key].count++;
  const data = customData !== void 0 ? {
    ...rawData,
    additionalInfo: { ...rawData.additionalInfo || {}, customData }
  } : rawData;
  const payload = minimizeLogPayload(
    eventType,
    actionType,
    logBuffer[key].count,
    data,
    devicesDetails
  );
  logBuffer[key].payload = payload;
  return payload;
};

// src/spam/rateLimiter.ts
var counter = 0;
var lastReset = Date.now();
function allowLog() {
  const limit = 15;
  const windowMs = 1e4;
  const now = Date.now();
  if (now - lastReset > windowMs) {
    counter = 0;
    lastReset = now;
  }
  if (counter >= limit) {
    if (counter === limit) {
    }
    return false;
  }
  counter++;
  return true;
}

// src/log/safeLog.ts
function safeLog(ET, AT, rawData, customData) {
  if (!isLoggingAllowed()) {
    return null;
  }
  if (!allowLog()) {
    return null;
  }
  return log(ET, AT, rawData, customData);
}

// src/loader/notTrakingPath.ts
var userConfig = {};
function configureTracker(errorConfig) {
  userConfig = errorConfig;
}
function is404Page(currentPath2) {
  if (userConfig.notFoundPath) {
    let configPath = userConfig.notFoundPath.toLowerCase();
    const pathToCheck = currentPath2.toLowerCase();
    if (configPath.endsWith("*")) {
      configPath = configPath.slice(0, -1);
      if (pathToCheck.startsWith(configPath)) {
        return true;
      }
    } else if (pathToCheck === configPath) {
      return true;
    }
  }
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  const title = document.title.toLowerCase();
  const h1 = document.querySelector("h1")?.innerText?.toLowerCase() || "";
  const bodyText = document.body.innerText.toLowerCase();
  const errorKeywords = [
    "404",
    "page not found",
    "not found",
    "page missing",
    "error 404"
  ];
  if (errorKeywords.some((key) => title.includes(key))) return true;
  if (errorKeywords.some((key) => h1.includes(key))) return true;
  if (bodyText.includes("this page could not be found")) return true;
  if (bodyText.length < 600 && (bodyText.includes("oops") || bodyText.includes("could not find"))) {
    return true;
  }
  return false;
}
function isNotTrackPage(currentPath2) {
  if (!userConfig.notTrackPath) return false;
  if (typeof window === "undefined") return false;
  const notTrackPagesList = Array.isArray(userConfig.notTrackPath) ? userConfig.notTrackPath : [userConfig.notTrackPath];
  const currentPathLower = currentPath2.toLowerCase();
  for (const path of notTrackPagesList) {
    let configPath = path.toLowerCase();
    if (configPath.endsWith("*")) {
      configPath = configPath.slice(0, -1);
      if (currentPathLower.startsWith(configPath)) {
        return true;
      }
    } else {
      if (currentPathLower === configPath) {
        return true;
      }
    }
  }
  return false;
}

// src/events/click.events.ts
var lastEventKey = "";
var lastEventTime = 0;
var CLICK_DEBOUNCE_MS = 300;
function registerClickEvent(page) {
  if (!SDKConfigCache.trackClicks) {
    return;
  }
  if (isNotTrackPage(page) || is404Page(page)) {
    return;
  }
  const selector = buildSelector();
  const handleClick = (event) => {
    const target = event.target;
    if (!target) return;
    const element = target.closest(selector);
    if (!element) return;
    const name = getElementName(element);
    const tag = element.tagName.toLowerCase();
    if (!shouldTrackElement(element)) {
      return;
    }
    const key = `click:${page}:${name}`;
    const now = Date.now();
    if (key === lastEventKey && now - lastEventTime < CLICK_DEBOUNCE_MS) {
      return;
    }
    lastEventKey = key;
    lastEventTime = now;
    safeLog("click" /* CLICK */, "ui_interaction" /* UI_INTERACTION */, {
      element: name,
      key,
      page,
      tag,
      userId: analyticsCache.userId
    });
  };
  document.addEventListener("click", handleClick, { passive: true });
  console.log(" Click tracker initialized");
  return () => {
    document.removeEventListener("click", handleClick);
  };
}

// src/log/logReporter.ts
function startLogReporter(intervalMs = 5e3, onBatchReady) {
  setInterval(() => {
    if (!isLoggingAllowed()) {
      console.log(" SDK not ready. Skipping batch processing.");
      return;
    }
    const keys = Object.keys(logBuffer);
    if (keys.length === 0) return;
    const batch = keys.map((key) => {
      const entry = logBuffer[key];
      if (!entry || !entry.payload) return null;
      return entry.payload;
    }).filter(Boolean);
    if (batch.length > 0) {
      onBatchReady?.(batch);
      sendEvents(batch);
    }
    keys.forEach((k) => delete logBuffer[k]);
  }, intervalMs);
}

// src/helper/genarateUUID.ts
var generateUUID = (length = 10) => {
  return Array.from(crypto.getRandomValues(new Uint8Array(length))).map((b) => b.toString(36)).join("").substring(0, length);
};

// src/loader/getUser.ts
var IDENTITY_KEY = "CURRENT_USER_IDENTITY";
var SESSION_ID_KEY = "__UC_SESSION_ID__";
var SESSION_TIMEOUT = 30 * 60 * 1e3;
async function loadUserToken() {
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
        lastSeen: now
      });
    } else {
      await saveMetadata(IDENTITY_KEY, {
        ...record,
        lastSeen: now
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
      lastSeen: now
    });
  }
  analyticsCache.userId = finalUserId;
  analyticsCache.s_id = currentSessionId;
  analyticsCache.TotalSessionsCount = sessionCount;
  analyticsCache.lastSessionActive = now;
  analyticsCache.isNewUser = isNewUser;
  analyticsCache.isInitialized = true;
  analyticsCache.isDevicesDataSend = false;
  return analyticsCache;
}

// src/events/error.events.ts
var logError = (type, extra = {}) => {
  safeLog("error" /* ERROR */, "system_error" /* SYSTEM_ERROR */, {
    element: extra.element,
    key: extra.key,
    page: extra.page,
    tag: extra.tag,
    userId: analyticsCache.userId,
    additionalInfo: {
      errorType: type,
      ...extra.additionalInfo ?? {}
    }
  });
};
var handleJsError = (event) => {
  if (!event.error) return;
  logError("js_error" /* JS_ERROR */, {
    element: event.message,
    tag: "js",
    page: location.pathname,
    key: `js_error:${location.pathname}:${event.message.substring(0, 50)}`,
    additionalInfo: {
      location: location.href,
      message: event.message,
      fileName: event.filename,
      lineNumber: event.lineno,
      columnNumber: event.colno,
      stack: event.error?.stack
    }
  });
};
var handleResourceError = (event) => {
  const target = event.target;
  if (!target || !["IMG", "SCRIPT", "LINK"].includes(target.tagName)) return;
  const resourceUrl = target.getAttribute("src") || target.getAttribute("href") || "unknown";
  logError("resource_error" /* RESOURCE_ERROR */, {
    element: resourceUrl,
    tag: target.tagName.toLowerCase(),
    page: location.pathname,
    key: `resource_error:${location.pathname}:${target.tagName.toLowerCase()}`,
    additionalInfo: {
      resourceType: target.tagName.toLowerCase(),
      resourceUrl,
      outerHTML: target.outerHTML.substring(0, 200)
      //  Truncate
    }
  });
};
var handleUnhandledRejection = (event) => {
  const reason = String(event.reason);
  logError("unhandled_rejection" /* UNHANDLED_REJECTION */, {
    element: reason.substring(0, 100),
    tag: "promise",
    page: location.pathname,
    key: `promise_rejection:${location.pathname}:${reason.substring(0, 50)}`,
    additionalInfo: {
      reason,
      stack: event.reason?.stack || "no-stack"
    }
  });
};
function registerErrorTracking() {
  if (!SDKConfigCache.trackErrors) {
    return;
  }
  if (is404Page(location.pathname) || isNotTrackPage(location.pathname)) {
    console.log(
      " Error tracking is disabled for this page:",
      location.pathname
    );
    return;
  }
  window.addEventListener("error", handleJsError);
  window.addEventListener("error", handleResourceError, true);
  window.addEventListener("unhandledrejection", handleUnhandledRejection);
  console.log(" Error tracking initialized");
  return () => {
    window.removeEventListener("error", handleJsError);
    window.removeEventListener("error", handleResourceError, true);
    window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  };
}

// src/helper/normalizePath.ts
function normalizeUrl(rawUrl) {
  try {
    const parsedUrl = new URL(rawUrl, window.location.origin);
    let path = parsedUrl.pathname;
    if (path.endsWith("/") && path.length > 1) {
      path = path.slice(0, -1);
    }
    const segments = path.split("/").filter(Boolean);
    const normalizedSegments = segments.map((segment) => {
      if (/^[0-9a-fA-F]{24}$/.test(segment)) return "[id]";
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        segment
      ))
        return "[uuid]";
      if (/^\d+$/.test(segment)) return "[id]";
      if (/[0-9]/.test(segment) && /[a-zA-Z]/.test(segment) && segment.length > 5 && !segment.includes("-")) {
        return "[id]";
      }
      return segment;
    });
    return "/" + normalizedSegments.join("/");
  } catch {
    return rawUrl.split("?")[0] || "/";
  }
}

// src/helper/getReferralSource.ts
var getReferralSource = () => {
  if (typeof window === "undefined") return "unknown";
  const searchParams = new URLSearchParams(window.location.search);
  const utmSource = searchParams.get("utm_source");
  const ref = searchParams.get("ref");
  const source = searchParams.get("source");
  if (utmSource) return utmSource;
  if (ref) return ref;
  if (source) return source;
  const referrer = document.referrer;
  if (referrer) {
    try {
      const referrerUrl = new URL(referrer);
      if (referrerUrl.hostname !== window.location.hostname) {
        return referrerUrl.hostname;
      }
    } catch (error) {
      return "unknown";
    }
  }
  return "direct";
};

// src/events/pageView.events.ts
var DEBOUNCE_DELAY_MS = 500;
var MIN_DURATION_MS = 1e3;
var currentPage = "";
var pageStartTime = 0;
var enterTimeout = null;
var isTrackingInitialized = false;
function trackPageEnter(rawPage) {
  if (!SDKConfigCache.trackPageViews) return;
  if (isNotTrackPage(rawPage) || is404Page(rawPage)) {
    console.log("Skipping tracking for:", rawPage);
    return;
  }
  if (enterTimeout) clearTimeout(enterTimeout);
  enterTimeout = setTimeout(() => {
    if (isNotTrackPage(rawPage) || is404Page(rawPage)) return;
    const normalizedPage = normalizeUrl(rawPage);
    if (currentPage === normalizedPage && Date.now() - pageStartTime < 1e3) {
      return;
    }
    currentPage = normalizedPage;
    pageStartTime = Date.now();
    safeLog("page_view" /* PAGE_VIEW */, "navigation" /* NAVIGATION */, {
      element: normalizedPage,
      key: `page_view:${normalizedPage}`,
      page: normalizedPage,
      tag: "page",
      userId: analyticsCache.userId,
      additionalInfo: {
        rawUrl: rawPage,
        referral: getReferralSource() || "direct",
        // Get fresh referral
        UT: analyticsCache.isNewUser ? 1 : 0,
        timestamp: Date.now()
      }
    });
  }, DEBOUNCE_DELAY_MS);
}
function trackPageExit() {
  if (!currentPage || !pageStartTime) return;
  const duration = Date.now() - pageStartTime;
  if (duration < MIN_DURATION_MS) {
    currentPage = "";
    pageStartTime = 0;
    return;
  }
  safeLog("page_view" /* PAGE_VIEW */, "time_tracking" /* TIME_TRACKING */, {
    element: currentPage,
    key: `duration:${currentPage}`,
    page: currentPage,
    tag: "page",
    userId: analyticsCache.userId,
    additionalInfo: {
      durationMs: duration,
      durationSec: Math.round(duration / 1e3),
      UT: analyticsCache.isNewUser ? 1 : 0,
      timestamp: Date.now()
    }
  });
  currentPage = "";
  pageStartTime = 0;
}
function enableAutoPageTracking() {
  if (isTrackingInitialized) {
    return;
  }
  if (!SDKConfigCache.trackPageViews) {
    return;
  }
  isTrackingInitialized = true;
  const handleInitialLoad = () => {
    trackPageEnter(location.pathname + location.search);
  };
  if (document.readyState === "complete" || document.readyState === "interactive") {
    handleInitialLoad();
  } else {
    window.addEventListener("DOMContentLoaded", handleInitialLoad);
  }
  if (typeof history !== "undefined") {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    history.pushState = function(...args) {
      const prevUrl = location.pathname + location.search;
      const result = originalPushState.apply(this, args);
      const newUrl = location.pathname + location.search;
      if (prevUrl !== newUrl) {
        trackPageExit();
        trackPageEnter(newUrl);
      }
      return result;
    };
    history.replaceState = function(...args) {
      const prevUrl = location.pathname + location.search;
      const result = originalReplaceState.apply(this, args);
      const newUrl = location.pathname + location.search;
      if (prevUrl !== newUrl) {
        trackPageExit();
        trackPageEnter(newUrl);
      }
      return result;
    };
  }
  window.addEventListener("popstate", () => {
    trackPageExit();
    trackPageEnter(location.pathname + location.search);
  });
  window.addEventListener("hashchange", () => {
    trackPageExit();
    trackPageEnter(location.pathname + location.hash);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      trackPageExit();
    }
  });
  window.addEventListener("beforeunload", () => {
    trackPageExit();
  });
}

// src/events/scroll.event.ts
var ACTIVATION_DELAY = 500;
var SCROLL_THRESHOLD = 25;
var SCROLL_DEBOUNCE = 200;
var currentPath = "";
var maxScrollDepth = 0;
var isTrackingActive = false;
var activationTimer = null;
var scrollTimeout = null;
var startNewPageTimer = () => {
  maxScrollDepth = 0;
  isTrackingActive = false;
  if (activationTimer) {
    clearTimeout(activationTimer);
  }
  activationTimer = setTimeout(() => {
    isTrackingActive = true;
  }, ACTIVATION_DELAY);
};
var sendScrollLog = (path) => {
  if (!SDKConfigCache.trackScroll) {
    return;
  }
  if (maxScrollDepth < SCROLL_THRESHOLD) {
    console.log(
      ` Scroll depth ${maxScrollDepth}% below threshold, skipping log`
    );
    return;
  }
  const docHeight = document.documentElement.scrollHeight;
  const winHeight = window.innerHeight;
  const totalScrollable = docHeight - winHeight;
  if (totalScrollable <= 0) {
    return;
  }
  const scrolledPixels = Math.round(totalScrollable * (maxScrollDepth / 100));
  safeLog("scroll" /* SCROLL */, "engagement" /* ENGAGEMENT */, {
    element: path,
    key: `scroll:max:${path}`,
    page: path,
    tag: "page",
    userId: analyticsCache.userId,
    additionalInfo: {
      percentage: maxScrollDepth,
      depthString: `${maxScrollDepth}%`,
      scrollHeight: docHeight,
      viewportHeight: winHeight,
      scrolledPixels,
      totalScrollable,
      type: "scroll_summary"
    }
  });
};
var handleScrollLogic = () => {
  if (!isTrackingActive) return;
  if (!SDKConfigCache.trackScroll) {
    return;
  }
  if (is404Page(currentPath) || isNotTrackPage(currentPath)) {
    return;
  }
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight;
  const winHeight = window.innerHeight;
  const totalScrollable = docHeight - winHeight;
  if (totalScrollable <= 0) return;
  const scrollPercent = Math.min(
    100,
    Math.round(scrollTop / totalScrollable * 100)
  );
  if (scrollPercent > maxScrollDepth) {
    maxScrollDepth = scrollPercent;
  }
};
var handleRouteChange = () => {
  const newPath = normalizeUrl(window.location.pathname);
  if (currentPath && currentPath !== newPath) {
    sendScrollLog(currentPath);
    currentPath = newPath;
    startNewPageTimer();
  } else if (!currentPath) {
    currentPath = newPath;
    startNewPageTimer();
  }
};
var cleanup = () => {
  if (activationTimer) {
    clearTimeout(activationTimer);
    activationTimer = null;
  }
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
    scrollTimeout = null;
  }
};
var registerScrollTracker = () => {
  if (!SDKConfigCache.trackScroll) {
    console.log(" Scroll tracking is disabled");
    return;
  }
  currentPath = normalizeUrl(window.location.pathname);
  startNewPageTimer();
  const handleScroll = () => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(handleScrollLogic, SCROLL_DEBOUNCE);
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  history.pushState = function(...args) {
    const result = originalPushState.apply(this, args);
    handleRouteChange();
    return result;
  };
  history.replaceState = function(...args) {
    const result = originalReplaceState.apply(this, args);
    handleRouteChange();
    return result;
  };
  window.addEventListener("popstate", handleRouteChange);
  window.addEventListener("beforeunload", () => {
    sendScrollLog(currentPath);
    cleanup();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      sendScrollLog(currentPath);
    }
  });
  return () => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("popstate", handleRouteChange);
    cleanup();
  };
};

// src/events/performence.event.ts
var import_web_vitals = require("web-vitals");
function registerPerformanceTracking() {
  if (!SDKConfigCache.trackPerformance) {
    return;
  }
  if (isNotTrackPage(location.pathname) || is404Page(location.pathname)) {
    return;
  }
  const sendAnalyticsMetric = (metric) => {
    const value = Math.round(metric.value);
    const metricName = metric.name;
    const pagePath = window.location.pathname;
    const normalizedPath = normalizeUrl(pagePath);
    safeLog("performance" /* PERFORMANCE */, "performance" /* PERFORMANCE */, {
      element: metricName,
      key: `performance:${metricName}:${normalizedPath}`,
      page: normalizedPath,
      tag: "performance",
      userId: analyticsCache.userId,
      additionalInfo: {
        metricName,
        value,
        delta: Math.round(metric.delta),
        id: metric.id,
        rating: metric.rating
      }
    });
  };
  try {
    (0, import_web_vitals.onLCP)(sendAnalyticsMetric);
    (0, import_web_vitals.onCLS)(sendAnalyticsMetric);
    (0, import_web_vitals.onINP)(sendAnalyticsMetric);
    (0, import_web_vitals.onFCP)(sendAnalyticsMetric);
    (0, import_web_vitals.onTTFB)(sendAnalyticsMetric);
  } catch (error) {
  }
}

// src/base/core.ts
var isBrowser = typeof window !== "undefined";
var isVanillaMode = isBrowser && !!window.ucoderInsight;
var isInitialized = false;
async function initUcoderInsight(projectId, userConfig2) {
  if (!isBrowser) {
    console.warn(
      " [Ucoder Insight] Cannot initialize in non-browser environment"
    );
    return null;
  }
  if (isInitialized) {
    console.warn(" [Ucoder Insight] SDK is already initialized!");
    return null;
  }
  if (isTestingMode()) {
    console.log("[Ucoder Insight] Initializing...");
    console.log("   Mode:", isVanillaMode ? "Vanilla JS" : "Framework");
    console.log("   Project ID:", projectId);
  }
  if (userConfig2) {
    configureTracker(userConfig2);
  }
  if (userConfig2?.debug) {
    console.log(
      " [Ucoder Insight] Running in Testing Mode - No data will be sent to server"
    );
  }
  const config = await resolveConfig(projectId);
  if (!config) {
    console.error(
      " [Ucoder Insight] Init Failed: Server Unreachable or Invalid Project ID"
    );
    return null;
  }
  isInitialized = true;
  const rawPage = location.pathname || "/";
  const page = normalizeUrl(rawPage) ?? rawPage;
  await loadUserToken();
  if (config.trackClicks) registerClickEvent(page);
  if (config.trackPageViews) enableAutoPageTracking();
  if (config.trackScroll) registerScrollTracker();
  if (config.trackErrors) registerErrorTracking();
  if (config.trackPerformance) registerPerformanceTracking();
  startLogReporter(config.sendInterval);
  if (isTestingMode()) {
    console.log(
      "[Ucoder Insight] Initialization Complete with Config:",
      config
    );
  }
  return config;
}

// src/events/custom.event.ts
var trackCustomEvent = (config) => {
  if (!SDKConfigCache.trackCustomEvents) {
    return;
  }
  if (!config.event_name) {
    return;
  }
  const rawPage = window.location.pathname;
  const normalizedPage = normalizeUrl(rawPage);
  const customEventDataPayload = {
    event_name: config.event_name,
    action_category: config.action_category,
    ...config.object_id !== void 0 && { object_id: config.object_id },
    ...config.status !== void 0 && { status: config.status },
    ...config.message !== void 0 && { message: config.message },
    ...config.additionalData !== void 0 && {
      additionalData: config.additionalData
    }
  };
  safeLog(
    "custom" /* CUSTOM */,
    "custom" /* CUSTOM */,
    {
      element: config.event_name,
      key: `custom_event:${normalizedPage}:${config.event_name}`,
      page: normalizedPage,
      tag: "custom",
      userId: analyticsCache.userId
    },
    customEventDataPayload
  );
};

// src/index.ts
var isVanillaJS = false;
var isReady = false;
var eventQueue = [];
var processQueue = () => {
  if (eventQueue.length > 0) {
    console.log(`Processing ${eventQueue.length} queued events...`);
    eventQueue.forEach((event) => trackCustomEvent(event));
    eventQueue.length = 0;
  }
};
if (typeof window !== "undefined") {
  isVanillaJS = true;
  window.ucoderInsight = {
    isReady: () => isReady,
    isVanilla: () => isVanillaJS,
    // Initialize
    init: async (projectId, options = {}) => {
      console.log(" [Ucoder Insight] Initializing in Vanilla JS mode...");
      const config = await initUcoderInsight(projectId, options);
      if (config) {
        isReady = true;
        processQueue();
      }
      return config;
    },
    track: (config) => {
      if (!isReady) {
        eventQueue.push(config);
        return;
      }
      return trackCustomEvent(config);
    },
    healthCheck: () => {
      console.log("\u2713 [Ucoder Insight] Status Check");
      console.log("  Ready:", isReady);
      console.log("  Queue Size:", eventQueue.length);
      return true;
    }
  };
  window.dispatchEvent(
    new CustomEvent("ucoderInsightReady", {
      detail: { version: "1.0.0", mode: "vanilla" }
    })
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  initUcoderInsight,
  isVanillaJS,
  trackCustomEvent
});
