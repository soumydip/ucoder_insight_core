import { isTestingMode } from "../utils/environment";

let counter = 0;
let lastReset = Date.now();

export function allowLog() {
  const limit = 15; // Max 15 events per window
  const windowMs = 10000;

  const now = Date.now();

  // Reset window (Time Logic)
  if (now - lastReset > windowMs) {
    counter = 0;
    lastReset = now;
  }

  let hasWarned = false;
  if (counter >= limit) {
    if (!hasWarned) {
      hasWarned = true;
      if (isTestingMode())
        console.warn(
          `Rate limit exceeded: ${limit} events per ${windowMs / 1000} seconds. Further events will be dropped until the window resets.`,
        );
    }
    return false;
  }
  counter++;
  return true;
}
