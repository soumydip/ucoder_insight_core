export const analyticsCache = {
  isInitialized: false,
  userId: "" as string,
  s_id: "" as string,
  isNewUser: false as boolean,
  lastSessionActive: 0 as number,
  TotalSessionsCount: 0 as number,
  isDevicesDataSend: false as boolean,
  projectId: "" as string,
};

export const SDKConfigCache = {
  projectId: "" as string,
  mode: "FREE" as "FREE" | "PRO",
  sendInterval: 10000,
  batchEventSize: 50,
  cacheOffline: true,
  trackClicks: true,
  trackPageViews: true,
  trackScroll: false,
  trackErrors: true,
  trackPerformance: false,
  trackCustomEvents: true,
  allowDomins: [] as string[],
};

export const optionalConfigCache = {
  debug: false as boolean,
}