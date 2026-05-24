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

  // Check Limit
  if (counter >= limit) {
    if (counter === limit) {
     if(isTestingMode()) {
      console.warn(
        " [Ucoder Insight] Rate limit reached: Too many events being tracked. Further events will be dropped until the window resets.",
      );
     }
    }
    return false;
  }

  counter++;
  return true;
}
