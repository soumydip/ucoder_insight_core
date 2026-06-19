import { ActionType, ErrorType, EventType } from "../enums/event.enum";
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
      stack: event.error?.stack || "no-stack",
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
      outerHTML: target.outerHTML.substring(0, 200),
    },
  });
};

// UNHANDLED PROMISE REJECTION
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  const error =
    event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

  const reason = String(event.reason);
  const stack = error?.stack || "no-stack";

  // V8 (Chrome): "at fn (file.js:10:5)"
  // Firefox:     "fn@file.js:10:5"
  const lineMatch = stack.match(/[:\s](\d+):\d+[\)?\s]?/);
  const fileMatch = stack.match(/(?:at\s+.*?\(|@)(.*?):\d+:\d+/);

  logError(ErrorType.UNHANDLED_REJECTION, {
    element: reason.substring(0, 100),
    tag: "promise",
    page: location.pathname,
    key: `promise_rejection:${location.pathname}:${reason.substring(0, 50)}`,
    additionalInfo: {
      reason: reason,
      stack: stack,
      lineNumber: lineMatch ? lineMatch[1] : "unknown",
      fileName: fileMatch ? fileMatch[1] : "unknown",
    },
  });
};

// Main function to register all error tracking
export function registerErrorTracking() {
  if (!SDKConfigCache.trackErrors) {
    return;
  }

  if (is404Page(location.pathname) || isNotTrackPage(location.pathname)) {
    console.log(
      " Error tracking is disabled for this page:",
      location.pathname,
    );
    return;
  }

  window.addEventListener("error", handleJsError);
  window.addEventListener("error", handleResourceError, true);
  window.addEventListener("unhandledrejection", handleUnhandledRejection);

  return () => {
    window.removeEventListener("error", handleJsError);
    window.removeEventListener("error", handleResourceError, true);
    window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  };
}
