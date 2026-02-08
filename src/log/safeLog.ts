import { log, IRawLoggerData } from "./loger";
import { allowLog } from "../spam/rateLimiter";
import { isLoggingAllowed } from "./transport";

export function safeLog(
  ET: string,
  AT: string,
  rawData: IRawLoggerData,
  customData?: any,
) {
  //  First check if SDK is properly configured
  if (!isLoggingAllowed()) {
    return null;
  }

  // Then check rate limit
  if (!allowLog()) {
    return null;
  }

  return log(ET, AT, rawData, customData);
}
