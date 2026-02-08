export const getReferralSource = (): string => {
  if (typeof window === "undefined") return "unknown";

  const searchParams = new URLSearchParams(window.location.search);


//   common UTM and referral parameters
  const utmSource = searchParams.get("utm_source");
  const ref = searchParams.get("ref");
  const source = searchParams.get("source");

  if (utmSource) return utmSource;
  if (ref) return ref;
  if (source) return source;

//   fallback to document.referrer if no query parameters found
  const referrer = document.referrer;

  if (referrer) {
    try {
      const referrerUrl = new URL(referrer);

      if (referrerUrl.hostname !== window.location.hostname) {
        return referrerUrl.hostname;
      }
    } catch (error) {
      return "unknown";
    }
  }

  return "direct";
};
