/**
 * Enums for event types (High-level categories).
 * For example, CLICK, PAGE_VIEW, ERROR, etc.
 */
export enum EventType {
  CLICK = "click",
  PERFORMANCE = "performance",
  PAGE_VIEW = "page_view",
  SCROLL = "scroll",
  FORM_SUBMIT = "form_submit",
  FORM_CHANGE = "form_change",
  ERROR = "error",
  CUSTOM = "custom",
}

/**
 * Action types represent the nature of the interaction. Sub categories of EventType.
 * For example, UI_INTERACTION for clicks, NAVIGATION for page views, etc.
 */
export enum ActionType {
  UI_INTERACTION = "ui_interaction",
  OUTBOUND_LINK = "outbound_link",
  NAVIGATION = "navigation",
  TIME_TRACKING = "time_tracking",
  ENGAGEMENT = "engagement",
  FORM_INTERACTION = "form_interaction",
  PERFORMANCE = "performance",
  SYSTEM_ERROR = "system_error",
  PAGE_PERFORMANCE = "page_performance",
  CUSTOM = "custom",
}

/**
 * Tracking modes represent different levels or plans.
 */
export enum TrackingMode {
  FREE = "FREE",
  PRO = "PRO",
}

/**
 * Element types represent HTML elements.
 */
export enum ElementType {
  BUTTON = "button",
  LINK = "a",
  FORM = "form",
  DIV = "div",
  SPAN = "span",
  IMG = "img",
  SVG = "svg",
  VIDEO = "video",
  INPUT = "input",
  UNKNOWN = "unknown",
}

/**
 * Error types categories.
 */
export enum ErrorType {
  JS_ERROR = "js_error",
  RESOURCE_ERROR = "resource_error",
  UNHANDLED_REJECTION = "unhandled_rejection",
  CUSTOM_ERROR = "custom_error",
}

/**
 * Event names 
 * 
 */
export enum EventName {
  CLICK = "click",
  VIEW_PAGE = "view_page",
  SCROLL = "scroll",
  CUSTOM_EVENT = "custom_event",
  PERFORMANCE = "performance",
}

/**
 * Form specific event names.
 */
export enum FormEventName {
  FORM_SUBMIT = "form_submit",
  FORM_FAILURE = "form_failure",
  FORM_SUCCESS = "form_success",
}
