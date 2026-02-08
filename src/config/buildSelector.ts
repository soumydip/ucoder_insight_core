import { trackingElements } from "../config/trackingElements";

// Build a CSS selector string for tracking elements based on configuration
export function buildSelector(): string {
  const enabled = Object.keys(trackingElements).filter(
    (el) => trackingElements[el] === true
  );

  // Always allow explicit data-track
  enabled.push("[data-track]");

  return enabled.join(",");
}
