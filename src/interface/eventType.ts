// eventTypes.ts

export const BASIC_ELEMENTS = [
  "button",
  "a",
  "form",
] as const;

export const ADVANCED_ELEMENTS = [
  "scroll",
] as const;

export type BasicElement = (typeof BASIC_ELEMENTS)[number];
export type AdvancedElement = (typeof ADVANCED_ELEMENTS)[number];
export type AllElements = BasicElement | AdvancedElement;