import { onLCP, onCLS, onINP, onFCP, onTTFB, Metric } from "web-vitals";
import { normalizeUrl } from "../helper/normalizePath";
import { safeLog } from "../log/safeLog";
import { ActionType, EventType } from "../enums/event.enum";
import { analyticsCache, SDKConfigCache } from "../loader/analyticsCache";
import { is404Page, isNotTrackPage } from "../loader/notTrakingPath";

export function registerPerformanceTracking() {
  //  Check if performance tracking is enabled
  if (!SDKConfigCache.trackPerformance) {
    console.log(" Performance tracking is disabled");
    return;
  }
  
  if(isNotTrackPage(location.pathname)|| is404Page(location.pathname)){
    console.log(" Performance tracking is disabled for this page:", location.pathname);
    return;
  }


  // Function to send performance metrics
  const sendAnalyticsMetric = (metric: Metric) => {
    const value = Math.round(metric.value);
    const metricName = metric.name;
    const pagePath = window.location.pathname;
    const normalizedPath = normalizeUrl(pagePath);

    safeLog(EventType.PERFORMANCE, ActionType.PERFORMANCE, {
      element: metricName,
      key: `performance:${metricName}:${normalizedPath}`,
      page: normalizedPath,
      tag: "performance",
      userId: analyticsCache.userId,
      additionalInfo: {
        metricName,
        value,
        delta: Math.round(metric.delta),
        id: metric.id,
        rating: metric.rating,
      },
    });

    console.log(`Performance metric: ${metricName} = ${value}ms`);
  };

  try {
    // Register web vitals metrics
    onLCP(sendAnalyticsMetric);
    onCLS(sendAnalyticsMetric);
    onINP(sendAnalyticsMetric);
    onFCP(sendAnalyticsMetric);
    onTTFB(sendAnalyticsMetric);

    console.log(" Performance tracking initialized");
  } catch (error) {
    console.error(" Error initializing performance tracking:", error);
  }
}
