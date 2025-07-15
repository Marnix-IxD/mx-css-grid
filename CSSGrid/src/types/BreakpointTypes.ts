/**
 * CSS Grid Breakpoint Type Definitions
 *
 * These types extend the auto-generated types from CSSGridProps.d.ts
 * to provide better type safety for the new breakpoint system
 */

import { LAYOUT } from "../utils/constants";

export type BreakpointSize = "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl" | "xxxxl";

export interface BreakpointConfig {
    size: BreakpointSize;
    minWidth: number;
    maxWidth?: number;
    label: string;
}

export const BREAKPOINT_CONFIGS: BreakpointConfig[] = [
    { size: "xs", minWidth: 0, maxWidth: 639, label: "Extra Small" },
    { size: "sm", minWidth: 640, maxWidth: 767, label: "Small" },
    { size: "md", minWidth: 768, maxWidth: 1023, label: "Medium" },
    { size: "lg", minWidth: 1024, maxWidth: 1439, label: "Large" },
    { size: "xl", minWidth: 1440, maxWidth: 1919, label: "Extra Large" },
    { size: "xxl", minWidth: 1920, maxWidth: 2559, label: "2X Large" },
    { size: "xxxl", minWidth: 2560, maxWidth: 3839, label: "2K" },
    { size: "xxxxl", minWidth: 3840, label: "4K" }
];

/**
 * Get the active breakpoint based on current width
 */
export function getActiveBreakpoint(width: number): BreakpointSize {
    // Start from largest and work down
    for (let i = BREAKPOINT_CONFIGS.length - 1; i >= 0; i--) {
        if (width >= BREAKPOINT_CONFIGS[i].minWidth) {
            return BREAKPOINT_CONFIGS[i].size;
        }
    }
    return "xs"; // Fallback
}

/**
 * Get the active breakpoint with hysteresis to prevent rapid switching
 * Uses a buffer zone around breakpoint thresholds to provide stability
 */
export function getActiveBreakpointWithHysteresis(newWidth: number, currentBreakpoint: BreakpointSize): BreakpointSize {
    const HYSTERESIS = LAYOUT.HYSTERESIS_BUFFER; // Buffer to prevent rapid switching

    // Find the breakpoint that matches the new width
    for (let i = BREAKPOINT_CONFIGS.length - 1; i >= 0; i--) {
        const config = BREAKPOINT_CONFIGS[i];
        const isCurrentBreakpoint = currentBreakpoint === config.size;

        // Apply hysteresis: use lower threshold when leaving, higher when entering
        const minThreshold = isCurrentBreakpoint ? config.minWidth - HYSTERESIS : config.minWidth;
        const maxThreshold = config.maxWidth
            ? isCurrentBreakpoint
                ? config.maxWidth + HYSTERESIS
                : config.maxWidth
            : Infinity;

        if (newWidth >= minThreshold && newWidth <= maxThreshold) {
            return config.size;
        }
    }

    // If no breakpoint matches, return current to prevent unnecessary changes
    return currentBreakpoint;
}

/**
 * Get all active breakpoint classes for a given width
 * This returns cumulative classes (e.g., at lg width: ['xs-active', 'sm-active', 'md-active', 'lg-active'])
 */
export function getActiveBreakpointClasses(width: number, prefix = "mx-grid"): string[] {
    const classes: string[] = [];
    const activeBreakpoint = getActiveBreakpoint(width);

    // Add current breakpoint class
    classes.push(`${prefix}-${activeBreakpoint}`);

    // Add cumulative classes for all smaller breakpoints
    for (const config of BREAKPOINT_CONFIGS) {
        if (width >= config.minWidth) {
            classes.push(`${prefix}-${config.size}-up`);
        }
        if (config.maxWidth && width <= config.maxWidth) {
            classes.push(`${prefix}-${config.size}-down`);
        }
        // Add exact match class
        if (width >= config.minWidth && (!config.maxWidth || width <= config.maxWidth)) {
            classes.push(`${prefix}-${config.size}-only`);
        }
    }

    return classes;
}
