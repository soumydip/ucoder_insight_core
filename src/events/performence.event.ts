import { normalizeUrl } from "../helper/normalizePath";
import { safeLog } from "../log/safeLog";
import { ActionType, EventType } from "../enums/event.enum";
import { analyticsCache, SDKConfigCache } from "../loader/analyticsCache";
import { is404Page, isNotTrackPage } from "../loader/notTrakingPath";

export async function registerPerformanceTracking() {
  if (!SDKConfigCache.trackPerformance) return;

  if (isNotTrackPage(location.pathname) || is404Page(location.pathname)) return;

  // if web vitals is not installed, skip static performance tracking , it is by defult use react, but if user not use react, it will not be installed, so we need to check it before importing  ref: (https://web-vitals.dev/) , (https://www.npmjs.com/package/web-vitals)
  let webVitals: typeof import("web-vitals") | null = null;

  try {
    webVitals = await import("web-vitals");
  } catch {
    // web-vitals not install, performance tracking skip
    return;
  }

  const { onLCP, onCLS, onINP, onFCP, onTTFB } = webVitals;

  const sendAnalyticsMetric = (metric: {
    name: string;
    value: number;
    delta: number;
    id: string;
    rating: string;
  }) => {
    const value = Math.round(metric.value);
    const normalizedPath = normalizeUrl(window.location.pathname);

    safeLog(EventType.PERFORMANCE, ActionType.PERFORMANCE, {
      element: metric.name,
      key: `performance:${metric.name}:${normalizedPath}`,
      page: normalizedPath,
      tag: "performance",
      userId: analyticsCache.userId,
      additionalInfo: {
        metricName: metric.name,
        value,
        delta: Math.round(metric.delta),
        id: metric.id,
        rating: metric.rating,
      },
    });
  };

  onLCP(sendAnalyticsMetric);
  onCLS(sendAnalyticsMetric);
  onINP(sendAnalyticsMetric);
  onFCP(sendAnalyticsMetric);
  onTTFB(sendAnalyticsMetric);
}
