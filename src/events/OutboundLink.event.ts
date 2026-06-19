// OutboundLink.event.ts
import { ActionType, ElementType, EventType } from "../enums/event.enum";
import { normalizeUrl } from "../helper/normalizePath";
import { analyticsCache } from "../loader/analyticsCache";
import { safeLog } from "../log/safeLog";

export const registerOutboundLinkEvent = () => {
  document.addEventListener(
    "click",
    (event) => {
      try {
        const target = event.target as HTMLElement;
        const anchorElement = target.closest("a");
        if (!anchorElement) return;

        const href = anchorElement.getAttribute("href") || "";
        if (!href || href.startsWith("javascript:")) return;

        const currentDomain = window.location.hostname;
        const targetDomain = anchorElement.hostname;
        const currentPageURL = window.location.href;
        const filterURL = normalizeUrl(currentPageURL);

        const isSpecialProtocol =
          href.startsWith("mailto:") || href.startsWith("tel:");
        const isExternalLink =
          isSpecialProtocol ||
          (!!targetDomain && targetDomain !== currentDomain);
        const isNewTab = anchorElement.target === "_blank";

        if (!isExternalLink && !isNewTab) return;

        // element name resolution
        let elementName = anchorElement.innerText?.trim();

        if (!elementName) {
          const svg = anchorElement.querySelector("svg");
          if (svg) {
            const ariaLabel = svg.getAttribute("aria-label");
            if (ariaLabel) {
              elementName = ariaLabel;
            }
          }
        }

        if (!elementName) {
          const icon = anchorElement.querySelector("i");
          if (icon) {
            const rawIconName = icon.getAttribute("class") || "Icon Link";
            elementName =
              rawIconName.length > 40
                ? rawIconName.substring(0, 40) + "..."
                : rawIconName;
          }
        }

        if (!elementName) {
          // id fallback
          elementName = anchorElement.id || anchorElement.className || "Unknown Link";
        }

        // parent context — nav আগে check করো
        let parentContext = "Unknown Section";
        let el: HTMLElement | null = anchorElement.parentElement;

        while (el && el !== document.body) {
          // data-section check
          const dataSection = el.getAttribute("data-section");
          if (dataSection) {
            parentContext = dataSection;
            break;
          }
          // data-testid check
          const dataTestId = el.getAttribute("data-testid");
          if (dataTestId) {
            parentContext = dataTestId;
            break;
          }
          // semantic tags
          const tag = el.tagName.toLowerCase();
          if (["header", "footer", "nav", "main"].includes(tag)) {
            parentContext = tag;
            break;
          }
          // id check
          if (el.id) {
            parentContext = el.id;
            break;
          }
          el = el.parentElement;
        }

        const logUrl = isSpecialProtocol ? href : anchorElement.href;

        safeLog(EventType.CLICK, ActionType.OUTBOUND_LINK, {
          element: elementName,
          key: `outbound_link:${elementName}`,
          page: filterURL,
          tag: ElementType.LINK,
          userId: analyticsCache.userId,
          additionalInfo: {
            url: logUrl,
            parentSection: parentContext,
          },
        });
      } catch (error) {
        console.error("Outbound link tracking error:", error);
      }
    },
    true,
  );
};