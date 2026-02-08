import { normalizeUrl } from "../helper/normalizePath";
import { customEventConfig } from "../interface/event.interface";
import { safeLog } from "../log/safeLog";
import { EventType, ActionType } from "../enums/event.enum";
import { analyticsCache, SDKConfigCache } from "../loader/analyticsCache";

export const trackCustomEvent = (config: customEventConfig) => {
  //  Check if custom event tracking is enabled
  if (!SDKConfigCache.trackCustomEvents) {
    console.log(" Custom event tracking is disabled");
    return;
  }

  if (!config.event_name) {
    console.error(" Event name is required for tracking custom event.");
    return;
  }

  const rawPage = window.location.pathname;
  const normalizedPage = normalizeUrl(rawPage);

  const customEventDataPayload = {
    event_name: config.event_name,
    action_category: config.action_category,
    ...(config.object_id !== undefined && { object_id: config.object_id }),
    ...(config.status !== undefined && { status: config.status }),
    ...(config.message !== undefined && { message: config.message }),
    ...(config.additionalData !== undefined && {
      additionalData: config.additionalData,
    }),
  };

  safeLog(
    EventType.CUSTOM,
    ActionType.CUSTOM,
    {
      element: config.event_name, //  Use event name instead of "custom_event"
      key: `custom_event:${normalizedPage}:${config.event_name}`,
      page: normalizedPage,
      tag: "custom",
      userId: analyticsCache.userId,
    },
    customEventDataPayload,
  );

  console.log("📊 Custom event tracked:", config.event_name);
};
