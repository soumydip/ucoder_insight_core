interface ReferralInfo {
  source: string;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
}

// Known ad-click-id parameters
const AD_CLICK_ID_PARAMS: Record<string, string> = {
  gclid: "google_ads",
  fbclid: "facebook_ads",
  msclkid: "microsoft_ads",
  ttclid: "tiktok_ads",
  li_fat_id: "linkedin_ads",
  twclid: "twitter_ads",
};

// Common social/search hostnames — referrer hostname mormalize
const KNOWN_HOSTNAME_MAP: Record<string, string> = {
  "google.com": "google",
  "www.google.com": "google",
  "bing.com": "bing",
  "www.bing.com": "bing",
  "duckduckgo.com": "duckduckgo",
  "facebook.com": "facebook",
  "m.facebook.com": "facebook",
  "l.facebook.com": "facebook",
  "instagram.com": "instagram",
  "twitter.com": "twitter",
  "x.com": "twitter",
  "linkedin.com": "linkedin",
  "youtube.com": "youtube",
  "reddit.com": "reddit",
  "t.co": "twitter",
};

function normalizeHostname(hostname: string): string {
  const cleaned = hostname.replace(/^www\./, "");
  return KNOWN_HOSTNAME_MAP[hostname] ?? KNOWN_HOSTNAME_MAP[cleaned] ?? cleaned;
}

export const getReferralSource = (): string => {
  if (typeof window === "undefined") return "unknown";

  const searchParams = new URLSearchParams(window.location.search);
  const utmSource = searchParams.get("utm_source");
  if (utmSource) return utmSource;

  const ref = searchParams.get("ref");
  if (ref) return ref;

  const source = searchParams.get("source");
  if (source) return source;

  const via = searchParams.get("via");
  if (via) return via;

  const affiliateId =
    searchParams.get("aff_id") ?? searchParams.get("affiliate");
  if (affiliateId) return `affiliate:${affiliateId}`;

  for (const [param, label] of Object.entries(AD_CLICK_ID_PARAMS)) {
    if (searchParams.has(param)) return label;
  }

  const referrer = document.referrer;
  if (referrer) {
    try {
      const referrerUrl = new URL(referrer);
      if (referrerUrl.hostname !== window.location.hostname) {
        return normalizeHostname(referrerUrl.hostname);
      }
    } catch {
      return "unknown";
    }
  }
  return "direct";
};

export const getUTMParams = (): ReferralInfo => {
  if (typeof window === "undefined") {
    return {
      source: "unknown",
      medium: null,
      campaign: null,
      term: null,
      content: null,
    };
  }

  const searchParams = new URLSearchParams(window.location.search);

  return {
    source: getReferralSource(),
    medium: searchParams.get("utm_medium"),
    campaign: searchParams.get("utm_campaign"),
    term: searchParams.get("utm_term"),
    content: searchParams.get("utm_content"),
  };
};
