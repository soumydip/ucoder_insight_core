import { ActionType, ErrorType, EventType } from "../enums/event.enum";
import { normalizeUrl } from "../helper/normalizePath";
import { analyticsCache, SDKConfigCache } from "../loader/analyticsCache";
import { is404Page, isNotTrackPage } from "../loader/notTrakingPath";
import { safeLog } from "../log/safeLog";

const logError = (type: ErrorType, extra: any = {}) => {
  safeLog(EventType.ERROR, ActionType.SYSTEM_ERROR, {
    element: extra.element,
    key: extra.key,
    page: extra.page,
    tag: extra.tag,
    userId: analyticsCache.userId,
    additionalInfo: {
      errorType: type,
      ...(extra.additionalInfo ?? {}),
    },
  });
};

// JS RUNTIME ERROR (ReferenceError, TypeError, etc)
const handleJsError = (event: ErrorEvent) => {
  if (!event.error) return;

  logError(ErrorType.JS_ERROR, {
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
      stack: event.error?.stack,
    },
  });
};

// RESOURCE ERROR (IMG, SCRIPT, LINK)
const handleResourceError = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target || !["IMG", "SCRIPT", "LINK"].includes(target.tagName)) return;

  const resourceUrl =
    target.getAttribute("src") || target.getAttribute("href") || "unknown";

  logError(ErrorType.RESOURCE_ERROR, {
    element: resourceUrl,
    tag: target.tagName.toLowerCase(),
    page: location.pathname,
    key: `resource_error:${location.pathname}:${target.tagName.toLowerCase()}`,
    additionalInfo: {
      resourceType: target.tagName.toLowerCase(),
      resourceUrl,
      outerHTML: target.outerHTML.substring(0, 200), //  Truncate
    },
  });
};

// UNHANDLED PROMISE REJECTION
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  const reason = String(event.reason);

  logError(ErrorType.UNHANDLED_REJECTION, {
    element: reason.substring(0, 100),
    tag: "promise",
    page: location.pathname,
    key: `promise_rejection:${location.pathname}:${reason.substring(0, 50)}`,
    additionalInfo: {
      reason: reason,
      stack: event.reason?.stack || "no-stack",
    },
  });
};


// Main function to register all error tracking
export function registerErrorTracking() {
  //  Check if error tracking is enabled
  if (!SDKConfigCache.trackErrors) {
    // console.log(" Error tracking is disabled");
    return;
  }

  // track is a 404 page or not track page
  if (is404Page(location.pathname) || isNotTrackPage(location.pathname)) {
    console.log(
      " Error tracking is disabled for this page:",
      location.pathname,
    );
    return;
  }

  // Register JS errors
  window.addEventListener("error", handleJsError);

  // Register resource errors (capture phase)
  window.addEventListener("error", handleResourceError, true);

  // Register unhandled promise rejections
  window.addEventListener("unhandledrejection", handleUnhandledRejection);

  console.log(" Error tracking initialized");

  // Return cleanup function
  return () => {
    window.removeEventListener("error", handleJsError);
    window.removeEventListener("error", handleResourceError, true);
    window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  };
}
