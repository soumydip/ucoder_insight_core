import { getElementName } from "../helper/getElementName";
import { buildSelector } from "../config/buildSelector";
import { EventType, ActionType } from "../enums/event.enum";
import { shouldTrackElement } from "../helper/shouldTrackElement";
import { analyticsCache, SDKConfigCache } from "../loader/analyticsCache";
import { safeLog } from "../log/safeLog";
import { is404Page, isNotTrackPage } from "../loader/notTrakingPath";

// Prevent double/triple clicking spam
let lastEventKey = "";
let lastEventTime = 0;
const CLICK_DEBOUNCE_MS = 300;


export function registerClickEvent(page: string) {
  //  Check if click tracking is enabled
  if (!SDKConfigCache.trackClicks) {
    // console.log(" Click tracking is disabled");
    return;
  }

  // check is page is valid
  if (isNotTrackPage(page) || is404Page(page)) {
    // console.log(" Click tracking is disabled for this page:", page);
    return;
  }

  const selector = buildSelector();

  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target) return;

    // Find valid element
    const element = target.closest(selector) as HTMLElement;
    if (!element) return;

    // Extract element name and tag
    const name = getElementName(element);
    const tag = element.tagName.toLowerCase();

    // Check if tracking is disabled for this element
    if (!shouldTrackElement(element)) {
      // console.log(" Click not tracked for element:", name, "tag:", tag);
      return;
    }

    const key = `click:${page}:${name}`;
    const now = Date.now();

    // Prevent same-click spam (within 300ms)
    if (key === lastEventKey && now - lastEventTime < CLICK_DEBOUNCE_MS) {
      return;
    }

    lastEventKey = key;
    lastEventTime = now;

    // Log click event
    safeLog(EventType.CLICK, ActionType.UI_INTERACTION, {
      element: name,
      key,
      page,
      tag,
      userId: analyticsCache.userId,
    });
  };

  // Add event listener
  document.addEventListener("click", handleClick, { passive: true });

  console.log(" Click tracker initialized");

  // Return cleanup function
  return () => {
    document.removeEventListener("click", handleClick);
  };
}
