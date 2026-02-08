import { logBuffer } from "./logBuffer";
import { sendEvents } from "./transport";
import { isLoggingAllowed } from "./transport";

export function startLogReporter(
  intervalMs = 5000,
  onBatchReady?: (batch: any[]) => void,
) {
  setInterval(() => {
    //  Skip batch processing if SDK not configured
    if (!isLoggingAllowed()) {
      console.log(" SDK not ready. Skipping batch processing.");
      return;
    }

    const keys = Object.keys(logBuffer);

    if (keys.length === 0) return;

    const batch = keys
      .map((key) => {
        const entry = logBuffer[key];
        if (!entry || !entry.payload) return null;
        return entry.payload;
      })
      .filter(Boolean);

    if (batch.length > 0) {
      onBatchReady?.(batch);
      sendEvents(batch);
      console.log("📤 Sending Batch:", batch.length, "events");
    }

    // Clean up sent logs
    keys.forEach((k) => delete logBuffer[k]);
  }, intervalMs);
}
