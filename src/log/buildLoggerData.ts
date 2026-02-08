import { DEFAULT_CONFIG } from "../config/defaultConfig";
import { IRawLoggerData } from "./loger";

export function buildLoggerData(raw: IRawLoggerData) {
  return {
    el: raw.element,
    key: raw.key,
    pg: raw.page,
    tg: raw.tag,
    u_id: raw.userId,
    ...(DEFAULT_CONFIG.additionalInfo && raw.additionalInfo
      ? { addI: raw.additionalInfo }
      : {}),
  };
}
