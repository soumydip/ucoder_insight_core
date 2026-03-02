import { NotTrackPageConfig } from "../interface/event.interface";

let userConfig: Partial<NotTrackPageConfig> = {};

export function configureTracker(errorConfig: Partial<NotTrackPageConfig>) {
  userConfig = errorConfig;
}

export function is404Page(currentPath: string): boolean {
  // 1. Check Configured 404 Path
  if (userConfig.notFoundPath) {
    let configPath = userConfig.notFoundPath.toLowerCase();
    const pathToCheck = currentPath.toLowerCase();

    //  Separate Wildcard vs Exact Match
    if (configPath.endsWith("*")) {
      configPath = configPath.slice(0, -1);
      if (pathToCheck.startsWith(configPath)) {
        return true;
      }
    } else if (pathToCheck === configPath) {
      return true;
    }
  }

  //  Check if running in browser (SSR Safety)
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  // 2. DOM Heuristics
  const title = document.title.toLowerCase();
  const h1 = document.querySelector("h1")?.innerText?.toLowerCase() || "";
  const bodyText = document.body.innerText.toLowerCase();

  const errorKeywords = [
    "404",
    "page not found",
    "not found",
    "page missing",
    "error 404",
  ];

  if (errorKeywords.some((key) => title.includes(key))) return true;
  if (errorKeywords.some((key) => h1.includes(key))) return true;
  if (bodyText.includes("this page could not be found")) return true;

  if (
    bodyText.length < 600 &&
    (bodyText.includes("oops") || bodyText.includes("could not find"))
  ) {
    return true;
  }

  return false;
}

export function isNotTrackPage(currentPath: string): boolean {
  if (!userConfig.notTrackPath) return false;

  //  Check if running in browser (SSR Safety)
  if (typeof window === "undefined") return false;

  const notTrackPagesList: string[] = Array.isArray(userConfig.notTrackPath)
    ? userConfig.notTrackPath
    : [userConfig.notTrackPath];

  const currentPathLower = currentPath.toLowerCase();

  for (const path of notTrackPagesList) {
    let configPath = path.toLowerCase();

    //  Separate Wildcard vs Exact Match
    if (configPath.endsWith("*")) {
      configPath = configPath.slice(0, -1);
      if (currentPathLower.startsWith(configPath)) {
        // console.log("Not tracking page (wildcard):", currentPathLower, configPath);
        return true;
      }
    } else {
      if (currentPathLower === configPath) {
        // console.log("Not tracking page (exact):", currentPathLower);
        return true;
      }
    }
  }

  //  Explicitly return false
  return false;
}

