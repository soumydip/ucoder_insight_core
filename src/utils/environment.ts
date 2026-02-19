import { optionalConfigCache, SDKConfigCache } from "../loader/analyticsCache";

/**
 *  Check if running on localhost
 */
export const isLocalhost = (): boolean => {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.endsWith(".local")
  );
};

/**
 *  Check if in testing mode
 * Testing mode: console log only, no API calls
 */
export const isTestingMode = (): boolean => {
  return optionalConfigCache.debug === true;
};

/**
 *  Should log to console instead of API?
 */
export const shouldLogToConsole = (): boolean => {
  // Testing mode explicitly enabled
  if (isTestingMode()) {
    return true; // In testing mode, we want to log to console, not send to API
  }

  // Localhost detection (unless testing mode is explicitly false)
  if (isLocalhost() && optionalConfigCache.debug !== false) {
    return true; // On localhost, we want to log to console, not send to API;
  }

  return false;
};

/**
 *  Get current environment
 */
export const getEnvironment = (): "localhost" | "testing" | "production" => {
  if (isTestingMode()) {
    return "testing";
  }

  if (isLocalhost()) {
    return "localhost";
  }

  return "production";
};

/**
 *  Get environment display name
 */
export const getEnvironmentLabel = (): string => {
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

/**
 *  Check if should send to API
 */
export const shouldSendToAPI = (): boolean => {
  return !shouldLogToConsole();
};

/**
 *  Log with environment prefix
 */
export const envLog = (message: string, data?: any) => {
  const label = getEnvironmentLabel();
  if (data) {
    console.log(`${label} ${message}`, data);
  } else {
    console.log(`${label} ${message}`);
  }
};

/**
 *  Conditional console log (only in testing/localhost)
 */
export const debugLog = (message: string, data?: any) => {
  if (shouldLogToConsole() && !SDKConfigCache.projectId) {
    envLog(message, data);
  }
};
