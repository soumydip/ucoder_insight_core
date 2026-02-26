import { optionalConfigCache } from "../loader/analyticsCache";

export const isTestingMode = (): boolean => {
  return optionalConfigCache.debug === true;
};

export const shouldLogToConsole = (): boolean => {
  if (isTestingMode()) {
    return true;
  }
  return false;
};