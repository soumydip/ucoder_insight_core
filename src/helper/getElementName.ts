export function getElementName(el: HTMLElement): string {
  const manual =
    el.getAttribute("data-track") ||
    el.getAttribute("aria-label") ||
    el.getAttribute("title") ||
    el.id;

  if (manual) return normalize(manual);

  const tag = el.tagName.toUpperCase();

  // Links
  if (tag === "A") {
    const text = el.innerText || el.getAttribute("href") || "link";
    return normalize(text);
  }

  // Buttons
  if (tag === "BUTTON") {
    return normalize(el.innerText || "button");
  }

  // Inputs
  if (tag === "INPUT") {
    const name =
      el.getAttribute("name") ||
      el.getAttribute("placeholder") ||
      (el as HTMLInputElement).type;
    return normalize(name);
  }
  // Images
  if (tag === "IMG") {
    return normalize(el.getAttribute("alt") || "image");
  }

  // videos
  if (tag === "VIDEO") {
    return normalize("video");
  }

  // Audio
  if (tag === "AUDIO") {
    return normalize("audio");
  }


  // Fallback text
  const text = el.innerText?.trim();
  if (text) return normalize(text);

  // Last fallback: tag name
  return normalize(tag.toLowerCase());
}

function normalize(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 5)
      .join("_") || "element"
  );
}
