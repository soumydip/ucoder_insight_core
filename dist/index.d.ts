/**
 * Tracking modes represent different levels or plans.
 */
declare enum TrackingMode {
    FREE = "FREE",
    PRO = "PRO"
}

interface TrackerConfig {
    projectId: string;
    mode: TrackingMode;
    allowDomains: string[];
    autoTrack: boolean;
    trackPageViews: boolean;
    trackClicks: boolean;
    trackErrors: boolean;
    trackScroll: boolean;
    trackCustomEvents: boolean;
    trackPerformance: boolean;
    customEvents: boolean;
    cacheOffline?: boolean;
    sendInterval: number;
    batchEventSize: number;
    sendUserId?: boolean;
    sendAdditionalInfo?: boolean;
    userId: boolean;
    device: boolean;
    geo?: boolean;
    network?: boolean;
    additionalInfo?: boolean;
}

/**
 * Configuration options for initializing the error tracking system.
 * @optional - It is help to customize the not found page path,not traking page. Otherwise, default settings will be applied.
 */
interface NotTrackPageConfig {
    /**
     * Custom path for the 'not found' page (e.g., '/404' or '/not-found').
     * Supports wildcard matching (e.g., '/error/*').
     */
    notFoundPath?: string;
    /**
     * Array of page paths to exclude from tracking (e.g., ['/privacy', '/terms','/admin/*',]).
     * @example
     * ```javascript
     * notTrackPages: ['/privacy', '/terms','/admin/*',]
     * ```
     */
    notTrackPath?: string | string[];
    /**
     * Flag to enable testing mode, which logs events to the console instead of sending them to the API. Useful for development and debugging. Not recommended for production use.
     */
    debug?: boolean;
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
interface customEventConfig {
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

declare function initUcoderInsight(projectId: string, userConfig?: NotTrackPageConfig): Promise<TrackerConfig | null>;

declare const trackCustomEvent: (config: customEventConfig) => void;

declare let isVanillaJS: boolean;

export { type NotTrackPageConfig, initUcoderInsight, isVanillaJS, trackCustomEvent };
