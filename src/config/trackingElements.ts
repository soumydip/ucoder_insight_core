import { TrackingMode } from "../enums/event.enum";
import { BASIC_ELEMENTS, ADVANCED_ELEMENTS } from "../interface/eventType";

// Stores allowed elements for this mode
export const trackingElements: Record<string, boolean> = {};

// INITIAL → basic mode
BASIC_ELEMENTS.forEach((el) => (trackingElements[el] = true));
ADVANCED_ELEMENTS.forEach((el) => (trackingElements[el] = false));

export function applyTrackingMode(mode:TrackingMode) {
  // Reset all first
  BASIC_ELEMENTS.forEach((el) => (trackingElements[el] = true));

  ADVANCED_ELEMENTS.forEach((el) => {
    trackingElements[el] = mode === TrackingMode.PRO;
  });
}
