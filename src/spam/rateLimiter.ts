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
      // console.warn(
      //   ` Rate Limit Exceeded: Max ${limit} events per ${windowMs}ms`,
      // );
    }
    return false;
  }

  counter++;
  return true;
}
