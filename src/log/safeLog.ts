import { log, IRawLoggerData } from "./loger";
import { allowLog } from "../spam/rateLimiter";
import { isLoggingAllowed } from "./transport";

/**
 *
 * @param ET event type
 * @param AT Action type
 * @param rawData  Data that will be sent to the server, it should include at least:
 * - element: The name of the element interacted with (e.g., "Submit Button")
 * - `tag`: A category or tag for the event (e.g., "form", "navigation")
 * - `page`: The current page or screen name (e.g., "/home", "Product Page")
 * - `key`: A unique key for this event type (e.g., "submit_button_click")
 * - `userId`: The ID of the user performing the action (e.g., "user_12345")
 * - `additionalInfo`: (Optional) Any extra data relevant to the event (e.g., { productId: "prod_67890" })
 * @param customData (Optional) Any custom data that should be merged into additionalInfo
 * @returns The minimized payload that was logged, or null if logging was not allowed or rate-limited
 *
 * This function serves as a safe wrapper around the core logging mechanism. It first checks if logging is allowed based on SDK configuration and rate limits. If both checks pass, it proceeds to create and log the event using the provided parameters.
 */

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
