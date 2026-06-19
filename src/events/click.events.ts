import { getElementName } from "../helper/getElementName";
import { buildSelector } from "../config/buildSelector";
import { EventType, ActionType } from "../enums/event.enum";
import { shouldTrackElement } from "../helper/shouldTrackElement";
import { analyticsCache, SDKConfigCache } from "../loader/analyticsCache";
import { safeLog } from "../log/safeLog";
import { is404Page, isNotTrackPage } from "../loader/notTrakingPath";

let lastEventKey = "";
let lastEventTime = 0;
const CLICK_DEBOUNCE_MS = 300;
const DOM_CHANGE_WAIT_MS = 500;

let clickHistory: { time: number; key: string }[] = [];
const RAGE_CLICK_THRESHOLD = 3;
const RAGE_TIME_WINDOW_MS = 1000;

const pendingTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

const STRUCTURAL_TAGS = [
  "body",
  "html",
  "main",
  "header",
  "footer",
  "section",
  "article",
  "aside",
  "nav",
  "div",
  "span",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
  "img",
  "svg",
  "path",
  "figure",
  "figcaption",
];

const isDeadClick = (element: HTMLElement): boolean => {
  const tag = element.tagName.toLowerCase();

  if (STRUCTURAL_TAGS.includes(tag)) return false;

  const clickableTags = [
    "button",
    "a",
    "input",
    "select",
    "textarea",
    "summary",
    "details",
    "area",
    "label",
    "option",
    "optgroup",
    "audio",
    "video",
    "iframe",
  ];
  if (clickableTags.includes(tag)) return false;

  const style = window.getComputedStyle(element);
  if (style.cursor === "pointer") return false;

  if (
    element.hasAttribute("onclick") ||
    element.getAttribute("role") === "button" ||
    element.getAttribute("role") === "link" ||
    element.hasAttribute("href") ||
    element.hasAttribute("tabindex")
  ) {
    return false;
  }

  return true;
};

// after 500ms, deside if it's a normal click (DOM/URL changed) or dead click (no change)
const scheduleClickDecision = (
  beforeHTML: string,
  beforeURL: string,
  name: string,
  tag: string,
  key: string,
  page: string,
) => {
  // same click if old timer exists -> old timer cancel 
  const existing = pendingTimers.get(key);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    pendingTimers.delete(key);

    const domChanged = document.body.innerHTML !== beforeHTML;
    const urlChanged = window.location.href !== beforeURL;

    if (domChanged || urlChanged) {
      // check if DOM or URL change , its a normal click
      safeLog(EventType.CLICK, ActionType.UI_INTERACTION, {
        element: name,
        key,
        page,
        tag,
        userId: analyticsCache.userId,
        additionalInfo: {},
      });
    } else {
      // else dead click
      safeLog(EventType.CLICK, ActionType.UI_INTERACTION, {
        element: name,
        key: `dead_click:${page}:${name}`,
        page,
        tag,
        userId: analyticsCache.userId,
        additionalInfo: { isDeadClick: true },
      });
    }
  }, DOM_CHANGE_WAIT_MS);

  pendingTimers.set(key, timer);
};

// id rage cick detect korle noraml / dead click does not log , cencel the pending timer if exist
const cancelPendingTimer = (key: string) => {
  const timer = pendingTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    pendingTimers.delete(key);
  }
};

export function registerClickEvent(page: string) {
  if (!SDKConfigCache.trackClicks) return;
  if (isNotTrackPage(page) || is404Page(page)) return;

  const selector = buildSelector();

  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target) return;

    const matchedElement = target.closest(selector) as HTMLElement | null;

    // Dead click path match 
    if (!matchedElement) {
      const tag = target.tagName.toLowerCase();

      // structural element -> skip
      if (STRUCTURAL_TAGS.includes(tag)) return;

      const name = getElementName(target);
      const key = `click:${page}:${name}`;
      const now = Date.now();

      // debounce
      if (key === lastEventKey && now - lastEventTime < CLICK_DEBOUNCE_MS)
        return;
      lastEventKey = key;
      lastEventTime = now;

      // genuinely dead click check
      if (isDeadClick(target)) {
        safeLog(EventType.CLICK, ActionType.UI_INTERACTION, {
          element: name,
          key,
          page,
          tag,
          userId: analyticsCache.userId,
          additionalInfo: { isDeadClick: true },
        });
      }

      return;
    }

    // ── NORMAL / RAGE CLICK PATH ──
    const element = matchedElement;
    const name = getElementName(element);
    const tag = element.tagName.toLowerCase();

    if (!shouldTrackElement(element)) return;

    const key = `click:${page}:${name}`;
    const now = Date.now();

    // rage click detection
    clickHistory.push({ time: now, key });
    clickHistory = clickHistory.filter(
      (c) => now - c.time < RAGE_TIME_WINDOW_MS,
    );

    const recentClicks = clickHistory.filter((c) => c.key === key);

    if (recentClicks.length >= RAGE_CLICK_THRESHOLD) {
      // pending normal/dead timer cancel 
      cancelPendingTimer(key);

      safeLog(EventType.CLICK, ActionType.ENGAGEMENT, {
        element: name,
        key: `rage_click:${page}:${name}`,
        page,
        tag,
        userId: analyticsCache.userId,
        additionalInfo: {
          isRageClick: true,
          clickCount: recentClicks.length,
        },
      });

      clickHistory = clickHistory.filter((c) => c.key !== key);
      return;
    }

    // debounce
    if (key === lastEventKey && now - lastEventTime < CLICK_DEBOUNCE_MS) return;

    lastEventKey = key;
    lastEventTime = now;

    // snapshot
    const beforeHTML = document.body.innerHTML;
    const beforeURL = window.location.href;

    // wait for DOM/URL change and decide click type
    scheduleClickDecision(beforeHTML, beforeURL, name, tag, key, page);
  };

  document.addEventListener("click", handleClick, { passive: true });

  return () => {
    document.removeEventListener("click", handleClick);
    pendingTimers.forEach((timer) => clearTimeout(timer));
    pendingTimers.clear();
  };
}
