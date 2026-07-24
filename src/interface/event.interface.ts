import { ErrorType } from "../enums/event.enum";

;

/**
 * Includes PageViewEvent, ClickEvent, FormEvent, ErrorEvent, and CustomEvent.
 */
export type TrackingEventType =
  | "page_view"
  | "click"
  | "scroll"
  | "error"
  | "custom_event"
  | "time_on_page";

/**
 * Includes details for a page view event such as title.
 */
export interface PageViewEvent {
  type: "page_view";
  title?: string;
}
/**
 * Includes details for a click event such as element and text.
 */
export interface ClickEvent {
  type: "click";
  element: string;
  text?: string;
  customAttributes?: Record<string, string>;
}

export interface FormEvent {
  type: "form_submit";
  fields: Record<string, any>;
}

export interface ErrorEvent {
  tyoe: "error";
  errorType: ErrorType;
  errorPageUrl: string;
  errorMessage: string;
}

export const BASIC_EVENTS = ["button", "a", "input", "form"] as const;

export const ADVANCED_EVENTS = ["iamge", "video", "audio", "scroll"] as const;

/**
 * Configuration options for initializing the error tracking system.
 * @optional - It is help to customize the not found page path,not traking page. Otherwise, default settings will be applied.
 * @option
 * `notFoundPath`: A string representing the custom path for the 'not found' page (e.g., '/404' or '/not-found'). Supports wildcard matching (e.g., '/error/*').
 *
 * `notTrackPath`: A string or an array of strings representing page paths to exclude from tracking (e.g., ['/privacy', '/terms','/admin/*',]).
 *
 * `debug`: A boolean flag to enable testing mode, which logs events to the console instead of sending them to the API. Useful for development and debugging. Not recommended for production use.
 * @example
 * ```typescript
 * initUcoderInsight('your-project-id', {
 * notFoundPath: '/404',
 * notTrackPath: ['/privacy', '/terms','/admin/*',],
 * debug: true
 * });
 */
export interface NotTrackPageConfig {
  /**
   * Custom path for the 'not found' page (e.g., '/404' or '/not-found').
   * Supports wildcard matching (e.g., '/error/*').
   */
  notFoundPath?: string;
  /**
   * Array of page paths to exclude from tracking (e.g., ['/privacy', '/terms','/admin/*',]).
   * @example
   * ```typescript
   * notTrackPages: ['/privacy', '/terms','/admin/*',]
   * ```
   */

  notTrackPath?: string | string[];

  /**
   * Flag to enable testing mode, which logs events to the console instead of sending them to the API. Useful for development and debugging. Not recommended for production use.
   */
  debug?: boolean;
}

export interface UcoderInsightConfig extends NotTrackPageConfig {
  /** Optional custom API URL for sending tracking data. If not provided, the default API endpoint will be used. This can be useful for testing or if you have a custom backend setup.
   */
  apiUrl?: string;
}

/**
 * Configuration for custom events. Helps track user-defined events within the application.
 *  @example
 * ```javascript
 * UcoderAnalytics.trackCustomEvent({
 * event_name: 'user_signup_attempt',
 * status: 'failure',
 * object_id: 'signup_form_1',
 * action_category: 'form'
 * // Additional custom attributes can be added as you needed
 * additionalData:{
 *  plan_type: 'premium',
 * size: 'large',
 * referral_source: 'social_media'
 * }
 *
 * });
 * ```
 */

export interface customEventConfig {
  /**
   * The primary name used to identify the custom event type. (e.g., 'user_signup_attempt')
   */
  event_name: string;

  /**
   * Optional unique identifier for the object related to the event (e.g., Form ID, Video ID).
   */
  object_id?: string;

  /**
   * The outcome of the action.
   */
  status?: "success" | "failure";

  /**
   * A human-readable description or error message for the event.
   */
  message?: string;

  /** * Used to group similar events together for high-level reporting
   * (e.g., 'form', 'media', 'ecommerce', 'navigation').
   */
  action_category: string;
  /**
   * Additional key-value pairs to provide more context about the event. You can snd data type as string, number, boolean, null or undefined. no other data types are allowed. These can include any relevant information that doesn't fit into the predefined fields.
   *
   * @example
   * ```javascript
   * additionalData: {
   * plan_type: 'premium',
   * size: 'large',
   * referral_source: 'social_media'
   * }
   *
   * ```
   */
  additionalData?: Record<string, string | number | boolean | null | undefined>;
}
