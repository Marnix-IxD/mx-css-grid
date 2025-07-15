/**
 * Centralized constants for the CSS Grid Widget
 *
 * This file contains all constants used throughout the widget to ensure
 * consistency and make it easy to update values in one place.
 */

// ============================================================================
// Virtualization & Performance Constants
// ============================================================================
export const DEFAULT_VIRTUALIZATION_THRESHOLD = 100;
export const VIRTUALIZATION_ROOT_MARGIN = "200px";
export const VIRTUALIZATION_THRESHOLD_RATIO = 0.1;
export const VIRTUALIZATION_BUFFER_SIZE = 10;
export const RESIZE_DEBOUNCE_DELAY = 150;
export const MEASUREMENT_DELAY = 100;
export const INITIAL_RENDER_DELAY = 0;
export const LARGE_GRID_THRESHOLD = 10;

// ============================================================================
// Preview & Editor Constants
// ============================================================================
export const DEFAULT_CONTAINER_WIDTH = 1024;
export const DEFAULT_BREAKPOINT = "lg";
export const EMPTY_ITEM_MIN_HEIGHT = 40;

// ============================================================================
// Z-Index Constants (Layering)
// ============================================================================
export const Z_INDEX = {
    AREA_BACKGROUND: -1,
    RESPONSIVE_INDICATOR: 100,
    DEBUG_OVERLAY: 100,
    AREA_LABEL_MAX: 999
};

// ============================================================================
// Debug Overlay Constants
// ============================================================================
export const DEBUG_OVERLAY = {
    LINE_OPACITY: 0.6,
    GAP_OPACITY: 0.25,
    LINE_COLOR: "#ff003d",
    LINE_WIDTH: 1,
    LINE_LABEL_SIZE: 11,
    LINE_LABEL_PADDING: { x: 20, y: 16 },
    GAP_LABEL_SIZE: 10
};

// ============================================================================
// Grid Area Visualization Constants
// ============================================================================
export const AREA_VISUALIZATION = {
    COLOR_OPACITY: 0.15,
    BORDER_OPACITY: 0.3,
    BORDER_WIDTH: 2,
    BORDER_RADIUS: 4,
    LABEL_BACKGROUND_OPACITY: 0.9
};

// ============================================================================
// CSS Units & Keywords
// ============================================================================
export const CSS_UNITS = ["px", "%", "em", "rem", "vw", "vh", "vmin", "vmax", "ch", "ex", "fr"];

export const CSS_KEYWORDS = {
    // Grid alignment keywords
    alignment: ["start", "end", "center", "stretch", "baseline"],
    justifyItems: ["start", "end", "center", "stretch"],
    justifyContent: ["start", "end", "center", "stretch", "space-between", "space-around", "space-evenly"],
    alignItems: ["start", "end", "center", "stretch", "baseline"],
    alignContent: ["start", "end", "center", "stretch", "space-between", "space-around", "space-evenly"],
    placeItems: ["start", "end", "center", "stretch"],
    placeContent: ["start", "end", "center", "stretch", "space-between", "space-around", "space-evenly"],

    // General CSS keywords
    dimensions: ["auto", "min-content", "max-content", "fit-content", "initial", "inherit", "unset"],
    zIndex: ["auto", "initial", "inherit", "unset"],
    gap: ["normal", "initial", "inherit", "unset"]
};

// ============================================================================
// Breakpoint Configuration
// ============================================================================
export type BreakpointSizeType = "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl" | "xxxxl";

export const BREAKPOINT_SIZES: BreakpointSizeType[] = ["xs", "sm", "md", "lg", "xl", "xxl", "xxxl", "xxxxl"];

export const BREAKPOINT_LABELS: Record<BreakpointSizeType, string> = {
    xs: "Extra Small (0-639px)",
    sm: "Small (640-767px)",
    md: "Medium (768-1023px)",
    lg: "Large (1024-1439px)",
    xl: "Extra Large (1440-1919px)",
    xxl: "2X Large (1920-2559px)",
    xxxl: "2K (2560-3839px)",
    xxxxl: "4K (3840px+)"
};

// ============================================================================
// UI Colors
// ============================================================================
export const COLORS = {
    // Grid lines and debug
    GRID_LINE: "#ff003d",

    // Text colors
    TEXT_MUTED: "#666",
    TEXT_LIGHT: "#999",
    TEXT_PRIMARY: "#3b82f6",

    // Focus and selection
    FOCUS_OUTLINE: "#0066cc",
    FOCUS_SHADOW: "rgba(0, 102, 204, 0.1)",

    // Background colors
    BG_WHITE_TRANSLUCENT: "rgba(255, 255, 255, 0.95)",
    BG_BLACK_SUBTLE: "rgba(0, 0, 0, 0.02)",
    BG_BLACK_LIGHT: "rgba(0, 0, 0, 0.1)",
    BG_BLACK_MEDIUM: "rgba(0, 0, 0, 0.15)",

    // Status colors
    ERROR_TRANSLUCENT: "rgba(255, 0, 0, 0.1)",
    ERROR_BORDER: "rgba(255, 0, 0, 0.5)",
    WARNING_TRANSLUCENT: "rgba(251, 191, 36, 0.02)",
    PRIMARY_TRANSLUCENT: "rgba(59, 130, 246, 0.05)",
    PRIMARY_BORDER: "rgba(59, 130, 246, 0.3)"
};

// ============================================================================
// Typography
// ============================================================================
export const TYPOGRAPHY = {
    FONT_WEIGHT_MEDIUM: 500,
    FONT_SIZE_SMALL: 10,
    FONT_SIZE_NORMAL: 11,
    FONT_SIZE_LARGE: 12,
    LETTER_SPACING_WIDE: "0.5px"
};

// ============================================================================
// Animation & Timing
// ============================================================================
export const ANIMATION = {
    TRANSITION_FAST: "0.2s ease",
    TRANSITION_NORMAL: "0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    HOVER_TRANSLATE_Y: "-1px",
    HOVER_SHADOW: "0 4px 12px rgba(0, 0, 0, 0.1)",
    DEFAULT_SHADOW: "0 1px 3px rgba(0, 0, 0, 0.1)",
    ELEVATED_SHADOW: "0 2px 8px rgba(0, 0, 0, 0.15)"
};

// ============================================================================
// Spacing
// ============================================================================
export const SPACING = {
    XXS: 2,
    XS: 4,
    SM: 8,
    MD: 12,
    LG: 16,
    XL: 20,
    XXL: 24,
    INDICATOR_PADDING: "2px 6px"
};

// ============================================================================
// Border Radius
// ============================================================================
export const BORDER_RADIUS = {
    SM: 4,
    MD: 8,
    LG: 12,
    FULL: 9999
};

// ============================================================================
// Editor & Validation Constants
// ============================================================================
export const EDITOR = {
    Z_INDEX_MIN: -999,
    Z_INDEX_MAX: 999,
    VIRTUALIZATION_MIN_THRESHOLD: 10,
    VIRTUALIZATION_MAX_THRESHOLD: 1000,
    PERFORMANCE_ITEM_THRESHOLD: 50,
    DEFAULT_VIRTUALIZATION_THRESHOLD: 100
};

// ============================================================================
// Character Code Constants
// ============================================================================
export const CHAR_CODES = {
    UPPERCASE_A: 65,
    UPPERCASE_Z: 90,
    LOWERCASE_A: 97,
    LOWERCASE_Z: 122,
    DIGIT_0: 48,
    DIGIT_9: 57,
    HYPHEN: 45,
    UNDERSCORE: 95
};

// ============================================================================
// Layout & Interaction Constants
// ============================================================================
export const LAYOUT = {
    VIEWPORT_CHANGE_THRESHOLD: 200,
    KEYBOARD_FOCUS_DELAY: 50,
    HYSTERESIS_BUFFER: 10,
    DEFAULT_COLUMN_COUNT: 1,
    DEFAULT_ROW_COUNT: 1
};

// ============================================================================
// SVG & Visual Constants
// ============================================================================
export const SVG = {
    PATTERN_SIZE: 20,
    PATTERN_HALF_SIZE: 10,
    STRIPE_ROTATION_ANGLE: 45,
    DEBUG_LINE_OPACITY_MULTIPLIER: 0.6
};

// ============================================================================
// CSS Property Values
// ============================================================================
export const CSS_VALUES = {
    FOCUS_RING_OPACITY: 0.1,
    FOCUS_RING_BLUR: 4,
    BACKGROUND_WHITE_OPACITY: 0.95,
    CONTENT_Z_INDEX: 2,
    FONT_WEIGHT_SEMIBOLD: 600,
    LINE_HEIGHT_TIGHT: 1.4,
    BORDER_RADIUS_CIRCLE: "50%",
    FULL_WIDTH: "100%",
    FULL_HEIGHT: "100%",
    HIDDEN_ITEM_OPACITY: 0.3
};
