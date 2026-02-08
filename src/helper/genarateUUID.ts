export const generateUUID = (length: number = 10): string => {
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((b) => b.toString(36))
    .join("")
    .substring(0, length);
};
