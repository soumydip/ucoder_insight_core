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

        const href = anchorElement.href;
        if (!href || href.startsWith("javascript:")) return;

        const currentDomain = window.location.hostname;
        const targetDomain = anchorElement.hostname;

        // get current page URL
        const currentPageURL = window.location.href;
        const filterURL = normalizeUrl(currentPageURL);
        // Check if the link is external or opens in a new tab
        const isSpecialProtocol =
          href.startsWith("mailto:") || href.startsWith("tel:");
          // Consider it an outbound link if it's a special protocol or if the target domain is different from the current domain
        const isExternalLink =
          isSpecialProtocol || (targetDomain && targetDomain !== currentDomain);
        const isNewTab = anchorElement.target === "_blank";
        // if the domin and protocol are the same, it's not an outbound link, so we can skip logging
        if(!isExternalLink && !isNewTab) return;

        // if cuurrent domain is different from target domain or if the link opens in a new tab, log the outbound link click event
        if (isExternalLink || isNewTab) {
          let elementName = anchorElement.innerText?.trim();

          if (!elementName) {
            const icon = anchorElement.querySelector(
              "svg, i, img, span.material-icons",
            );
            if (icon) {
              const rawIconName =
                icon.getAttribute("aria-label") ||
                icon.getAttribute("class") ||
                "Icon Link";
              elementName =
                rawIconName.length > 40
                  ? rawIconName.substring(0, 40) + "..."
                  : rawIconName;
            } else {
              elementName =
                anchorElement.id || anchorElement.className || "Unknown Link";
            }
          }

          let parentContext = "Unknown Section";

          const parentClass = anchorElement.closest(
            "header, footer, nav, section, main, [id], [data-section], [data-testid]",
          );

          if (parentClass) {
            parentContext =
              parentClass.getAttribute("data-section") ||
              parentClass.getAttribute("data-testid") ||
              parentClass.id ||
              parentClass.tagName.toLowerCase();
          }

          safeLog(EventType.CLICK, ActionType.OUTBOUND_LINK, {
            element: elementName,
            key: `outbound_link:${elementName}`,
            page: filterURL,
            tag: ElementType.LINK,
            userId: analyticsCache.userId,
            additionalInfo: {
              url: href,
              parentSection: parentContext,
            },
          });
        }
      } catch (error) {
        console.error("Outbound link tracking error:", error);
      }
    },
    true,
  ); // Capture phase
};
