import { trackingElements } from "../config/trackingElements";

/**
 * Determines if an element should be tracked
 *
 * Priority:
 * 1. Developer override (data-uca-track)
 * 2. Sensitive input fields (NEVER track)
 * 3. Config-based tracking rules
 */
export function shouldTrackElement(el: HTMLElement): boolean {
  // ========================================
  // 1. DEVELOPER OVERRIDE (Highest Priority)
  // ========================================
  const attr = el.getAttribute("data-uca-track");

  if (attr === "false") {
    // console.log(" Element tracking disabled by developer:", el);
    return false; // NEVER track
  }

  if (attr === "true") {
    // console.log(" Element tracking forced by developer:", el);
    return true; // ALWAYS track (even inputs if developer wants)
  }

  // ========================================
  // 2. SENSITIVE INPUT FIELDS (Security)
  // ========================================
  const tag = el.tagName.toLowerCase();

  // NEVER track sensitive input fields by default
  if (tag === "input") {
    const inputType = (el as HTMLInputElement).type?.toLowerCase();

    const sensitiveInputTypes = [
      "password",
      "email",
      "text",
      "tel",
      "number",
      "search",
      "url",
      "date",
      "time",
      "datetime-local",
      "month",
      "week",
      "color",
      "range",
      "file",
      "hidden",
    ];

    if (sensitiveInputTypes.includes(inputType)) {
      // console.log(" Input field blocked (sensitive):", inputType);
      return false;
    }

    //  Only track safe input types
    const safeInputTypes = ["checkbox", "radio", "submit", "button", "reset"];

    if (safeInputTypes.includes(inputType)) {
      // console.log(" Safe input type allowed:", inputType);
      return trackingElements[tag] === true;
    }

    // Default: block unknown input types
    // console.log(" Unknown input type blocked:", inputType);
    return false;
  }

  // NEVER track textarea (user-entered text)
  if (tag === "textarea") {
    // console.log("Textarea blocked (sensitive)");
    return false;
  }

  //  NEVER track select with sensitive data attribute
  if (tag === "select") {
    const isSensitive = el.hasAttribute("data-sensitive");
    if (isSensitive) {
      // console.log(" Select blocked (marked sensitive)");
      return false;
    }
  }

  // ========================================
  // 3. CONFIG-BASED TRACKING
  // ========================================
  const isAllowed = trackingElements[tag] === true;

  if (isAllowed) {
    // console.log(" Element allowed by config:", tag);
  } else {
    // console.log(" Element not in tracking config:", tag);
  }

  return isAllowed;
}
