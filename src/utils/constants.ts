// Shared Constants

// Type for accessing shared constants with proper typing
export type SharedConstants = typeof SHARED_CONSTANTS;

// All values are frozen to prevent accidental modification
export const SHARED_CONSTANTS = {
    CDN_URLS: {
        FONT_AWESOME: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css'
    },

    // Timeout configurations in milliseconds
    TIMEOUTS: {
        // Default timeout for fetch operations
        DEFAULT_FETCH: 10000,

        // Primary endpoint timeout for data loading
        PRIMARY_ENDPOINT: 10000,

        // Fallback endpoint timeout (shorter for faster failover)
        FALLBACK_ENDPOINT: 5000,

        // Minimum debounce delay for search input
        DEBOUNCE_MIN: 100,

        // Maximum debounce delay for search input
        DEBOUNCE_MAX: 1000,

        // Default debounce delay for search
        DEFAULT_DEBOUNCE: 300
    },

    // Validation constraints
    VALIDATION: {
        // Minimum search query length
        MIN_SEARCH_LENGTH: 1,

        // Maximum number of results to display
        MAX_RESULTS: 100,

        // Minimum allowed value for configuration options
        MIN_CONFIG_VALUE: 1,

        // Minimum debounce delay (must be >= 0)
        MIN_DEBOUNCE_DELAY: 100
    },

    // Default fallback values for configuration
    DEFAULTS: {
        // Default minimum search length if not configured
        FALLBACK_MIN_SEARCH: 2,

        // Default debounce delay if not configured
        FALLBACK_DEBOUNCE: 300,

        // Default maximum results if not configured
        FALLBACK_MAX_RESULTS: 10
    },

    // UI-related constants
    UI: {
        // Minimum dropdown height in pixels
        DROPDOWN_MIN_HEIGHT: 300,

        // Default selected index when no item is selected
        DEFAULT_SELECTED_INDEX: -1,

        // Minimum query length to show clear button
        MIN_QUERY_LENGTH_FOR_CLEAR: 0,

        // JSON indentation spaces for formatted output
        JSON_INDENT_SPACES: 2
    },

    // Navigation constants for keyboard interaction
    NAVIGATION: {
        // Direction value for moving down in results
        DOWN: 1,

        // Direction value for moving up in results
        UP: -1
    },

    // Performance and caching configuration
    PERFORMANCE: {
        // Maximum number of search results to cache
        SEARCH_CACHE_SIZE: 50,

        // Cache expiry time in milliseconds (5 minutes)
        CACHE_EXPIRY_MS: 300000,

        // Height of each item in virtual scroll (in pixels)
        VIRTUAL_SCROLL_ITEM_HEIGHT: 60,

        // Number of buffer items to render outside viewport
        VIRTUAL_SCROLL_BUFFER: 5
    }
} as const;
