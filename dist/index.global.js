"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

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
    debug: true
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
    for (let i2 = 0; i2 < str.length; i2++) {
      const char = str.charCodeAt(i2);
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
    } catch (e2) {
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
        atob(base64String).split("").map((c2) => "%" + ("00" + c2.charCodeAt(0).toString(16)).slice(-2)).join("")
      );
      const payload = JSON.parse(decodedString);
      const calculatedChecksum = generateChecksum(payload.d);
      if (calculatedChecksum !== payload.s) {
        console.warn("SDK: Config Tampered! Ignoring local cache.");
        return null;
      }
      return JSON.parse(payload.d);
    } catch (e2) {
      return null;
    }
  };
  var fetchRemoteConfig = async (projectId) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1e3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(
          `http://localhost:5000/project/SDK-config/${projectId}`
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
      console.log("[Ucoder Insight] Fetching config from Server...");
      remoteData = await fetchRemoteConfig(projectId);
      if (remoteData) {
        try {
          const payload = {
            timestamp: Date.now(),
            data: remoteData
          };
          localStorage.setItem(CACHE_KEY, encodeData(payload));
          console.log("[Ucoder Insight] Config cached successfully");
        } catch (e2) {
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
          console.warn(
            ` Offline Storage Full (${MAX_BATCH_LIMIT} batches). Dropping new data to preserve old logs.`
          );
          return;
        }
        const record = {
          id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          events: batch
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

  // src/utils/environment.ts
  var isLocalhost = () => {
    if (typeof window === "undefined") return false;
    const hostname = window.location.hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.endsWith(".local");
  };
  var isTestingMode = () => {
    return optionalConfigCache.debug === true;
  };
  var shouldLogToConsole = () => {
    if (isTestingMode()) {
      return true;
    }
    if (isLocalhost() && optionalConfigCache.debug !== false) {
      return true;
    }
    return false;
  };
  var getEnvironment = () => {
    if (isTestingMode()) {
      return "testing";
    }
    if (isLocalhost()) {
      return "localhost";
    }
    return "production";
  };
  var getEnvironmentLabel = () => {
    const env = getEnvironment();
    switch (env) {
      case "testing":
        return "Testing Mode";
      case "localhost":
        return "Localhost";
      case "production":
        return "Production";
      default:
        return "Unknown";
    }
  };
  var envLog = (message, data) => {
    const label = getEnvironmentLabel();
    if (data) {
      console.log(`${label} ${message}`, data);
    } else {
      console.log(`${label} ${message}`);
    }
  };
  var debugLog = (message, data) => {
    if (shouldLogToConsole() && !SDKConfigCache.projectId) {
      envLog(message, data);
    }
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
      console.warn(" SDK not configured or logging disabled. Batch dropped.");
      return;
    }
    if (!analyticsCache.projectId) {
      console.warn(" SDK: Project ID missing, dropping batch.");
      return;
    }
    if (shouldLogToConsole()) {
      envLog("Logging to console instead of API");
      console.log(" Analytics Events:", {
        projectId: analyticsCache.projectId,
        eventsCount: batch.length,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        events: batch
      });
      return;
    }
    if (!navigator.onLine) {
      if (SDKConfigCache.cacheOffline) {
        debugLog("Device Offline. Saving to DB.");
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
          debugLog(" Batch sent via Beacon API");
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
        console.error(" Server Rejected Data:", result.message);
        return;
      }
      debugLog(" Batch sent successfully via fetch");
    } catch (error) {
      if (SDKConfigCache.cacheOffline) {
        console.warn(" Network/Server failed. Saving to Offline DB.");
        await saveOfflineBatch(batch);
      } else {
        console.error(" Failed to send events:", error);
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
    const limit = 10;
    const windowMs = 1e4;
    const now = Date.now();
    if (now - lastReset > windowMs) {
      counter = 0;
      lastReset = now;
    }
    if (counter >= limit) {
      if (counter === limit) {
        console.warn(
          ` Rate Limit Exceeded: Max ${limit} events per ${windowMs}ms`
        );
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
          console.log("Not tracking page (wildcard):", currentPathLower, configPath);
          return true;
        }
      } else {
        if (currentPathLower === configPath) {
          console.log("Not tracking page (exact):", currentPathLower);
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
      console.log(" Click tracking is disabled");
      return;
    }
    if (isNotTrackPage(page) || is404Page(page)) {
      console.log(" Click tracking is disabled for this page:", page);
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
        console.log(" Click not tracked for element:", name, "tag:", tag);
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
        console.log(" Sending Batch:", batch.length, "events");
      }
      keys.forEach((k2) => delete logBuffer[k2]);
    }, intervalMs);
  }

  // src/helper/genarateUUID.ts
  var generateUUID = (length = 10) => {
    return Array.from(crypto.getRandomValues(new Uint8Array(length))).map((b2) => b2.toString(36)).join("").substring(0, length);
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
      console.log(" Error tracking is disabled");
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
      console.log("\u{1F4CD} Page View Tracked:", normalizedPage);
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
    console.log(`\u23F1\uFE0F Page Exit: ${currentPage} (${Math.round(duration / 1e3)}s)`);
    currentPage = "";
    pageStartTime = 0;
  }
  function enableAutoPageTracking() {
    if (isTrackingInitialized) {
      console.warn("\u26A0\uFE0F Page tracking already initialized.");
      return;
    }
    if (!SDKConfigCache.trackPageViews) {
      console.log("\u{1F6AB} Page tracking disabled in config.");
      return;
    }
    isTrackingInitialized = true;
    console.log("\u{1F680} Auto Page Tracking Initialized (Universal Mode)");
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
      console.log(" Scroll tracking activated for:", currentPath);
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
      console.log(" Page is not scrollable, skipping scroll log");
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
    console.log(`\u{1F4CA} Scroll logged: ${maxScrollDepth}% on ${path}`);
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
      console.log(`\u{1F504} Route changed: ${currentPath} \u2192 ${newPath}`);
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
    console.log(" Scroll tracker initialized");
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("popstate", handleRouteChange);
      cleanup();
    };
  };

  // node_modules/web-vitals/dist/web-vitals.js
  var e = -1;
  var t = (t2) => {
    addEventListener("pageshow", ((n2) => {
      n2.persisted && (e = n2.timeStamp, t2(n2));
    }), true);
  };
  var n = (e2, t2, n2, i2) => {
    let s2, o2;
    return (r2) => {
      t2.value >= 0 && (r2 || i2) && (o2 = t2.value - (s2 ?? 0), (o2 || void 0 === s2) && (s2 = t2.value, t2.delta = o2, t2.rating = ((e3, t3) => e3 > t3[1] ? "poor" : e3 > t3[0] ? "needs-improvement" : "good")(t2.value, n2), e2(t2)));
    };
  };
  var i = (e2) => {
    requestAnimationFrame((() => requestAnimationFrame((() => e2()))));
  };
  var s = () => {
    const e2 = performance.getEntriesByType("navigation")[0];
    if (e2 && e2.responseStart > 0 && e2.responseStart < performance.now()) return e2;
  };
  var o = () => {
    const e2 = s();
    return e2?.activationStart ?? 0;
  };
  var r = (t2, n2 = -1) => {
    const i2 = s();
    let r2 = "navigate";
    e >= 0 ? r2 = "back-forward-cache" : i2 && (document.prerendering || o() > 0 ? r2 = "prerender" : document.wasDiscarded ? r2 = "restore" : i2.type && (r2 = i2.type.replace(/_/g, "-")));
    return { name: t2, value: n2, rating: "good", delta: 0, entries: [], id: `v5-${Date.now()}-${Math.floor(8999999999999 * Math.random()) + 1e12}`, navigationType: r2 };
  };
  var c = /* @__PURE__ */ new WeakMap();
  function a(e2, t2) {
    return c.get(e2) || c.set(e2, new t2()), c.get(e2);
  }
  var d = class {
    constructor() {
      __publicField(this, "t");
      __publicField(this, "i", 0);
      __publicField(this, "o", []);
    }
    h(e2) {
      if (e2.hadRecentInput) return;
      const t2 = this.o[0], n2 = this.o.at(-1);
      this.i && t2 && n2 && e2.startTime - n2.startTime < 1e3 && e2.startTime - t2.startTime < 5e3 ? (this.i += e2.value, this.o.push(e2)) : (this.i = e2.value, this.o = [e2]), this.t?.(e2);
    }
  };
  var h = (e2, t2, n2 = {}) => {
    try {
      if (PerformanceObserver.supportedEntryTypes.includes(e2)) {
        const i2 = new PerformanceObserver(((e3) => {
          Promise.resolve().then((() => {
            t2(e3.getEntries());
          }));
        }));
        return i2.observe({ type: e2, buffered: true, ...n2 }), i2;
      }
    } catch {
    }
  };
  var f = (e2) => {
    let t2 = false;
    return () => {
      t2 || (e2(), t2 = true);
    };
  };
  var u = -1;
  var l = /* @__PURE__ */ new Set();
  var m = () => "hidden" !== document.visibilityState || document.prerendering ? 1 / 0 : 0;
  var p = (e2) => {
    if ("hidden" === document.visibilityState) {
      if ("visibilitychange" === e2.type) for (const e3 of l) e3();
      isFinite(u) || (u = "visibilitychange" === e2.type ? e2.timeStamp : 0, removeEventListener("prerenderingchange", p, true));
    }
  };
  var v = () => {
    if (u < 0) {
      const e2 = o(), n2 = document.prerendering ? void 0 : globalThis.performance.getEntriesByType("visibility-state").filter(((t2) => "hidden" === t2.name && t2.startTime > e2))[0]?.startTime;
      u = n2 ?? m(), addEventListener("visibilitychange", p, true), addEventListener("prerenderingchange", p, true), t((() => {
        setTimeout((() => {
          u = m();
        }));
      }));
    }
    return { get firstHiddenTime() {
      return u;
    }, onHidden(e2) {
      l.add(e2);
    } };
  };
  var g = (e2) => {
    document.prerendering ? addEventListener("prerenderingchange", (() => e2()), true) : e2();
  };
  var y = [1800, 3e3];
  var E = (e2, s2 = {}) => {
    g((() => {
      const c2 = v();
      let a2, d2 = r("FCP");
      const f2 = h("paint", ((e3) => {
        for (const t2 of e3) "first-contentful-paint" === t2.name && (f2.disconnect(), t2.startTime < c2.firstHiddenTime && (d2.value = Math.max(t2.startTime - o(), 0), d2.entries.push(t2), a2(true)));
      }));
      f2 && (a2 = n(e2, d2, y, s2.reportAllChanges), t(((t2) => {
        d2 = r("FCP"), a2 = n(e2, d2, y, s2.reportAllChanges), i((() => {
          d2.value = performance.now() - t2.timeStamp, a2(true);
        }));
      })));
    }));
  };
  var b = [0.1, 0.25];
  var L = (e2, s2 = {}) => {
    const o2 = v();
    E(f((() => {
      let c2, f2 = r("CLS", 0);
      const u2 = a(s2, d), l2 = (e3) => {
        for (const t2 of e3) u2.h(t2);
        u2.i > f2.value && (f2.value = u2.i, f2.entries = u2.o, c2());
      }, m2 = h("layout-shift", l2);
      m2 && (c2 = n(e2, f2, b, s2.reportAllChanges), o2.onHidden((() => {
        l2(m2.takeRecords()), c2(true);
      })), t((() => {
        u2.i = 0, f2 = r("CLS", 0), c2 = n(e2, f2, b, s2.reportAllChanges), i((() => c2()));
      })), setTimeout(c2));
    })));
  };
  var P = 0;
  var T = 1 / 0;
  var _ = 0;
  var M = (e2) => {
    for (const t2 of e2) t2.interactionId && (T = Math.min(T, t2.interactionId), _ = Math.max(_, t2.interactionId), P = _ ? (_ - T) / 7 + 1 : 0);
  };
  var w;
  var C = () => w ? P : performance.interactionCount ?? 0;
  var I = () => {
    "interactionCount" in performance || w || (w = h("event", M, { type: "event", buffered: true, durationThreshold: 0 }));
  };
  var F = 0;
  var k = class {
    constructor() {
      __publicField(this, "u", []);
      __publicField(this, "l", /* @__PURE__ */ new Map());
      __publicField(this, "m");
      __publicField(this, "p");
    }
    v() {
      F = C(), this.u.length = 0, this.l.clear();
    }
    L() {
      const e2 = Math.min(this.u.length - 1, Math.floor((C() - F) / 50));
      return this.u[e2];
    }
    h(e2) {
      if (this.m?.(e2), !e2.interactionId && "first-input" !== e2.entryType) return;
      const t2 = this.u.at(-1);
      let n2 = this.l.get(e2.interactionId);
      if (n2 || this.u.length < 10 || e2.duration > t2.P) {
        if (n2 ? e2.duration > n2.P ? (n2.entries = [e2], n2.P = e2.duration) : e2.duration === n2.P && e2.startTime === n2.entries[0].startTime && n2.entries.push(e2) : (n2 = { id: e2.interactionId, entries: [e2], P: e2.duration }, this.l.set(n2.id, n2), this.u.push(n2)), this.u.sort(((e3, t3) => t3.P - e3.P)), this.u.length > 10) {
          const e3 = this.u.splice(10);
          for (const t3 of e3) this.l.delete(t3.id);
        }
        this.p?.(n2);
      }
    }
  };
  var A = (e2) => {
    const t2 = globalThis.requestIdleCallback || setTimeout;
    "hidden" === document.visibilityState ? e2() : (e2 = f(e2), addEventListener("visibilitychange", e2, { once: true, capture: true }), t2((() => {
      e2(), removeEventListener("visibilitychange", e2, { capture: true });
    })));
  };
  var B = [200, 500];
  var S = (e2, i2 = {}) => {
    if (!globalThis.PerformanceEventTiming || !("interactionId" in PerformanceEventTiming.prototype)) return;
    const s2 = v();
    g((() => {
      I();
      let o2, c2 = r("INP");
      const d2 = a(i2, k), f2 = (e3) => {
        A((() => {
          for (const t3 of e3) d2.h(t3);
          const t2 = d2.L();
          t2 && t2.P !== c2.value && (c2.value = t2.P, c2.entries = t2.entries, o2());
        }));
      }, u2 = h("event", f2, { durationThreshold: i2.durationThreshold ?? 40 });
      o2 = n(e2, c2, B, i2.reportAllChanges), u2 && (u2.observe({ type: "first-input", buffered: true }), s2.onHidden((() => {
        f2(u2.takeRecords()), o2(true);
      })), t((() => {
        d2.v(), c2 = r("INP"), o2 = n(e2, c2, B, i2.reportAllChanges);
      })));
    }));
  };
  var N = class {
    constructor() {
      __publicField(this, "m");
    }
    h(e2) {
      this.m?.(e2);
    }
  };
  var q = [2500, 4e3];
  var x = (e2, s2 = {}) => {
    g((() => {
      const c2 = v();
      let d2, u2 = r("LCP");
      const l2 = a(s2, N), m2 = (e3) => {
        s2.reportAllChanges || (e3 = e3.slice(-1));
        for (const t2 of e3) l2.h(t2), t2.startTime < c2.firstHiddenTime && (u2.value = Math.max(t2.startTime - o(), 0), u2.entries = [t2], d2());
      }, p2 = h("largest-contentful-paint", m2);
      if (p2) {
        d2 = n(e2, u2, q, s2.reportAllChanges);
        const o2 = f((() => {
          m2(p2.takeRecords()), p2.disconnect(), d2(true);
        })), c3 = (e3) => {
          e3.isTrusted && (A(o2), removeEventListener(e3.type, c3, { capture: true }));
        };
        for (const e3 of ["keydown", "click", "visibilitychange"]) addEventListener(e3, c3, { capture: true });
        t(((t2) => {
          u2 = r("LCP"), d2 = n(e2, u2, q, s2.reportAllChanges), i((() => {
            u2.value = performance.now() - t2.timeStamp, d2(true);
          }));
        }));
      }
    }));
  };
  var H = [800, 1800];
  var O = (e2) => {
    document.prerendering ? g((() => O(e2))) : "complete" !== document.readyState ? addEventListener("load", (() => O(e2)), true) : setTimeout(e2);
  };
  var $ = (e2, i2 = {}) => {
    let c2 = r("TTFB"), a2 = n(e2, c2, H, i2.reportAllChanges);
    O((() => {
      const d2 = s();
      d2 && (c2.value = Math.max(d2.responseStart - o(), 0), c2.entries = [d2], a2(true), t((() => {
        c2 = r("TTFB", 0), a2 = n(e2, c2, H, i2.reportAllChanges), a2(true);
      })));
    }));
  };

  // src/events/performence.event.ts
  function registerPerformanceTracking() {
    if (!SDKConfigCache.trackPerformance) {
      console.log(" Performance tracking is disabled");
      return;
    }
    if (isNotTrackPage(location.pathname) || is404Page(location.pathname)) {
      console.log(" Performance tracking is disabled for this page:", location.pathname);
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
      console.log(`Performance metric: ${metricName} = ${value}ms`);
    };
    try {
      x(sendAnalyticsMetric);
      L(sendAnalyticsMetric);
      S(sendAnalyticsMetric);
      E(sendAnalyticsMetric);
      $(sendAnalyticsMetric);
      console.log(" Performance tracking initialized");
    } catch (error) {
      console.error(" Error initializing performance tracking:", error);
    }
  }

  // src/base/core.ts
  var isBrowser = typeof window !== "undefined";
  var isVanillaMode = isBrowser && !!window.ucoderInsight;
  var isInitialized = false;
  async function initProject(projectId, userConfig2) {
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
    console.log("[Ucoder Insight] Initializing...");
    console.log("   Mode:", isVanillaMode ? "Vanilla JS" : "Framework");
    console.log("   Project ID:", projectId);
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
    console.log("[Ucoder Insight] Initialized successfully!");
    return config;
  }

  // src/events/custom.event.ts
  var trackCustomEvent = (config) => {
    if (!SDKConfigCache.trackCustomEvents) {
      console.log(" Custom event tracking is disabled");
      return;
    }
    if (!config.event_name) {
      console.error(" Event name is required for tracking custom event.");
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
        //  Use event name instead of "custom_event"
        key: `custom_event:${normalizedPage}:${config.event_name}`,
        page: normalizedPage,
        tag: "custom",
        userId: analyticsCache.userId
      },
      customEventDataPayload
    );
    console.log("\u{1F4CA} Custom event tracked:", config.event_name);
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
      version: "1.0.0",
      isReady: () => isReady,
      isVanilla: () => isVanillaJS,
      // Initialize
      init: async (projectId, options = {}) => {
        console.log(" [Ucoder Insight] Initializing in Vanilla JS mode...");
        const config = await initProject(projectId, options);
        if (config) {
          isReady = true;
          processQueue();
        }
        return config;
      },
      track: (config) => {
        if (!isReady) {
          console.log(
            " [Ucoder Insight] SDK initializing, event queued:",
            config.event_name
          );
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
})();
