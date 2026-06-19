export function getElementName(el: HTMLElement): string {
  const manual =
    el.getAttribute("data-track") ||
    el.getAttribute("aria-label") ||
    el.getAttribute("title") ||
    el.id;

  if (manual) return normalize(manual);
  const tag = el.tagName.toUpperCase();

  if (tag === "BUTTON" || tag === "INPUT" || tag === "A") {
    const parent =
      el.closest("form") || el.closest("section") || el.closest("div[id]");
    const context = parent ? parent.id || parent.tagName : "";

    let label = "";
    if (tag === "BUTTON") label = el.innerText || "button";
    else if (tag === "A")
      label = el.innerText || el.getAttribute("href") || "link";
    else if (tag === "INPUT")
      label =
        el.getAttribute("name") || el.getAttribute("placeholder") || "input";

    return normalize(`${context}_${label}`);
  }

  if (tag === "IMG") return normalize(el.getAttribute("alt") || "image");
  if (tag === "VIDEO") return normalize("video");
  if (tag === "AUDIO") return normalize("audio");

  const text = el.innerText?.trim();
  if (text && text.length < 50) return normalize(text);

  return normalize(tag.toLowerCase());
}

function normalize(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join("_") || "element"
  );
}
