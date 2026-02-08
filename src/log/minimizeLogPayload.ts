import { analyticsCache } from "../loader/analyticsCache";
import { IRawLoggerData, IMinimizedPayload } from "./loger";
export const minimizeLogPayload = (
  eventType: string,
  actionType: string,
  totalClicks: number,
  rawData: IRawLoggerData,
  customData?: any
): IMinimizedPayload => {
  const shouldSendDeviceData = analyticsCache.isDevicesDataSend === false;
  const payload: IMinimizedPayload = {
    ET: eventType,
    AT: actionType,
    PT: rawData.page,
    TC: totalClicks,
    PID:analyticsCache.projectId,
    s_id:analyticsCache.s_id || undefined,
    DD: shouldSendDeviceData
      ? {
          ssc: analyticsCache.TotalSessionsCount,
          os: navigator.platform,
          sr: `${window.screen.width}x${window.screen.height}`,
          ram: (navigator as any).deviceMemory || "unknown",
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          cors: navigator.hardwareConcurrency || "unknown",
          pxr: window.devicePixelRatio,
          lang: navigator.language,
        }
      : undefined,
    TS: new Date().toISOString(),
    D: {
      el: rawData.element,
      tg: rawData.tag,
      u_id: rawData.userId,

      ...(rawData.additionalInfo && { addI: rawData.additionalInfo }),
    },
    ...(customData && { CD: customData }),
  };
  if (shouldSendDeviceData) {
    analyticsCache.isDevicesDataSend = true;
  }
  return payload;
};
