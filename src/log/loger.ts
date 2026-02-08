import { logBuffer } from "./logBuffer";
import { minimizeLogPayload } from "./minimizeLogPayload";
import { isLoggingAllowed } from "./transport";

export interface IRawLoggerData {
  element: string;
  tag: string;
  page: string;
  key: string;
  userId: string;
  additionalInfo?: Record<string, any>;
}

export interface IMinimizedPayload {
  ET: string;
  AT: string;
  PT: string;
  TC: number;
  TS: string;
  DD?: any;
  PID: string;
  s_id?: string;
  D: {
    el: string;
    tg: string;
    u_id: string;
    addI?: any;
  };
  CD?: any;
}

export const log = (
  eventType: string,
  actionType: string,
  rawData: IRawLoggerData,
  devicesDetails?: string,
  customData?: any,
): IMinimizedPayload | null => {
  //  If SDK not configured or logging disabled, don't create log
  if (!isLoggingAllowed()) {
    console.warn(" SDK not ready. Event dropped:", eventType);
    return null;
  }

  const { key } = rawData;

  if (!logBuffer[key]) {
    logBuffer[key] = { count: 0, payload: null as any };
  }
  logBuffer[key].count++;

  const data =
    customData !== undefined
      ? {
          ...rawData,
          additionalInfo: { ...(rawData.additionalInfo || {}), customData },
        }
      : rawData;

  const payload = minimizeLogPayload(
    eventType,
    actionType,
    logBuffer[key].count,
    data,
    devicesDetails,
  );

  logBuffer[key].payload = payload;
  return payload;
};
