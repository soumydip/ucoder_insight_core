/**
 *
 * @param rawUrl raw URL
 * @returns a new path , grouping dynamic segments like IDs,mongoDB ObjectIds and UUIDs
 * @example
 * normalizeUrl("/users/12345/profile") => "/users/[id]/profile"
 * normalizeUrl("/posts/60b8d295f1d2c12a34567890/comments") => "/posts/[id]/comments"
 * normalizeUrl("/orders/550e8400-e29b-41d4-a716-446655440000/details") => "/orders/[uuid]/details"
 */
export function normalizeUrl(rawUrl: string) {
  try {
    const parsedUrl = new URL(rawUrl, window.location.origin);
    let path = parsedUrl.pathname;

    // remove trailing slash
    if (path.endsWith("/") && path.length > 1) {
      path = path.slice(0, -1);
    }

    const segments = path.split("/").filter(Boolean);

    const normalizedSegments = segments.map((segment) => {
      // Mongo ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(segment)) return "[id]";

      // UUID
      if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          segment,
        )
      )
        return "[uuid]";

      // Numeric
      if (/^\d+$/.test(segment)) return "[id]";

      // Random mixed (not slug)
      if (
        /[0-9]/.test(segment) &&
        /[a-zA-Z]/.test(segment) &&
        segment.length > 5 &&
        !segment.includes("-")
      ) {
        return "[id]";
      }

      return segment;
    });

    return "/" + normalizedSegments.join("/");
  } catch {
    return rawUrl.split("?")[0] || "/";
  }
}
