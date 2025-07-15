/**
 * Breakpoint Iteration Helpers
 *
 * Centralized utilities for iterating through responsive breakpoint configurations.
 * Reduces code duplication and provides consistent patterns for breakpoint handling.
 *
 * Performance-optimized for both exact and cascade responsive modes.
 */

import { BREAKPOINT_CONFIGS, BreakpointSize, BreakpointConfig } from "../types/BreakpointTypes";
import { normalizeValue } from "./stringHelpers";

/**
 * Responsive mode type for future cascade feature
 */
export type ResponsiveMode = "exact" | "cascade";

/**
 * Performance-optimized function to find the currently active breakpoint
 * Used in exact mode to process only the relevant breakpoint
 */
export function findActiveBreakpoint<T extends Record<string, any>>(
    currentWidth: number,
    props: T
): BreakpointConfig | null {
    // Iterate from largest to smallest to find the active breakpoint
    for (let i = BREAKPOINT_CONFIGS.length - 1; i >= 0; i--) {
        const config = BREAKPOINT_CONFIGS[i];
        const enabledKey = `${config.size}Enabled` as keyof T;

        if (!props[enabledKey]) {
            continue;
        }

        const inRange = config.maxWidth
            ? currentWidth >= config.minWidth && currentWidth <= config.maxWidth
            : currentWidth >= config.minWidth;

        if (inRange) {
            return config;
        }
    }
    return null;
}

/**
 * Performance-optimized function to get breakpoints to process
 * Supports both exact mode (current) and cascade mode (future)
 */
export function getBreakpointsToProcess<T extends Record<string, any>>(
    responsiveMode: ResponsiveMode = "exact",
    currentWidth: number,
    props: T
): BreakpointConfig[] {
    if (responsiveMode === "exact") {
        // Exact mode: Only process the currently active breakpoint
        const activeBreakpoint = findActiveBreakpoint(currentWidth, props);
        return activeBreakpoint ? [activeBreakpoint] : [];
    } else {
        // Cascade mode: Process enabled breakpoints up to current width in order
        return BREAKPOINT_CONFIGS.filter(config => {
            const enabledKey = `${config.size}Enabled` as keyof T;
            return props[enabledKey] && currentWidth >= config.minWidth;
        }).sort((a, b) => a.minWidth - b.minWidth); // Ensure correct cascade order
    }
}

/**
 * Callback function type for breakpoint iteration
 */
type BreakpointCallback = (
    config: { size: BreakpointSize; label: string },
    getProperty: (prop: string) => any,
    getNormalizedProperty: (prop: string) => string | undefined,
    setProperty: (prop: string, value: any) => void
) => void;

/**
 * Iterates through enabled breakpoints and executes callback for each
 *
 * @param props - Object containing breakpoint properties
 * @param callback - Function to execute for each enabled breakpoint
 * @param options - Additional options for iteration
 */
export function forEachEnabledBreakpoint<T extends Record<string, any>>(
    props: T,
    callback: BreakpointCallback,
    options: {
        includeDisabled?: boolean;
        propertyPrefix?: string;
    } = {}
): void {
    const { includeDisabled = false, propertyPrefix = "" } = options;

    BREAKPOINT_CONFIGS.forEach(bpConfig => {
        const enabledKey = `${bpConfig.size}Enabled` as keyof T;
        const isEnabled = props[enabledKey];

        if (isEnabled || includeDisabled) {
            const config = {
                size: bpConfig.size,
                label: bpConfig.label
            };

            const getProperty = (prop: string) => {
                const key = `${propertyPrefix}${bpConfig.size}${prop}` as keyof T;
                return props[key];
            };

            const getNormalizedProperty = (prop: string): string | undefined => {
                const key = `${propertyPrefix}${bpConfig.size}${prop}` as keyof T;
                return normalizeValue(props[key] as string | undefined);
            };

            const setProperty = (prop: string, value: any) => {
                const key = `${propertyPrefix}${bpConfig.size}${prop}` as keyof T;
                (props as any)[key] = value;
            };

            callback(config, getProperty, getNormalizedProperty, setProperty);
        }
    });
}

/**
 * Generates responsive property keys for a given breakpoint
 *
 * @param breakpoint - Breakpoint size
 * @param baseProperty - Base property name
 * @returns Object with responsive property keys
 */
export function getResponsivePropertyKeys(breakpoint: BreakpointSize, baseProperty?: string): Record<string, string> {
    const keys: Record<string, string> = {
        enabled: `${breakpoint}Enabled`,
        columns: `${breakpoint}Columns`,
        rows: `${breakpoint}Rows`,
        areas: `${breakpoint}Areas`,
        gap: `${breakpoint}Gap`,
        rowGap: `${breakpoint}RowGap`,
        columnGap: `${breakpoint}ColumnGap`,
        autoFlow: `${breakpoint}AutoFlow`,
        autoRows: `${breakpoint}AutoRows`,
        autoColumns: `${breakpoint}AutoColumns`,
        justifyItems: `${breakpoint}JustifyItems`,
        alignItems: `${breakpoint}AlignItems`,
        justifyContent: `${breakpoint}JustifyContent`,
        alignContent: `${breakpoint}AlignContent`,
        minHeight: `${breakpoint}MinHeight`,
        maxHeight: `${breakpoint}MaxHeight`,
        minWidth: `${breakpoint}MinWidth`,
        maxWidth: `${breakpoint}MaxWidth`
    };

    if (baseProperty) {
        return {
            [baseProperty]: keys[baseProperty] || `${breakpoint}${baseProperty}`
        };
    }

    return keys;
}

/**
 * Checks if a breakpoint has any meaningful configuration
 *
 * @param props - Object containing breakpoint properties
 * @param breakpoint - Breakpoint size to check
 * @returns True if breakpoint has configuration
 */
export function hasBreakpointConfiguration<T extends Record<string, any>>(
    props: T,
    breakpoint: BreakpointSize
): boolean {
    const keys = getResponsivePropertyKeys(breakpoint);

    // Exclude the 'enabled' key from the check
    const configKeys = Object.values(keys).filter(key => key !== `${breakpoint}Enabled`);

    return configKeys.some(key => {
        const value = props[key as keyof T];
        return value !== undefined && value !== null && value !== "";
    });
}

/**
 * Gets all enabled breakpoints from props
 *
 * @param props - Object containing breakpoint properties
 * @returns Array of enabled breakpoint sizes
 */
export function getEnabledBreakpoints<T extends Record<string, any>>(props: T): BreakpointSize[] {
    return BREAKPOINT_CONFIGS.map(config => config.size).filter(size => {
        const enabledKey = `${size}Enabled` as keyof T;
        return props[enabledKey];
    });
}

/**
 * Validates responsive configuration for common patterns
 *
 * @param props - Object containing breakpoint properties
 * @param validationRules - Custom validation rules
 * @returns Array of validation errors
 */
export function validateResponsiveConfiguration<T extends Record<string, any>>(
    props: T,
    validationRules: {
        requireConfiguration?: boolean;
    } = {}
): Array<{ breakpoint: BreakpointSize; message: string; severity: "error" | "warning" | "info" }> {
    const { requireConfiguration = true } = validationRules;
    const errors: Array<{ breakpoint: BreakpointSize; message: string; severity: "error" | "warning" | "info" }> = [];

    forEachEnabledBreakpoint(props, config => {
        if (requireConfiguration && !hasBreakpointConfiguration(props, config.size)) {
            errors.push({
                breakpoint: config.size,
                message: `${config.label} is enabled but has no configuration`,
                severity: "warning"
            });
        }
    });

    return errors;
}

/**
 * Iterates through all breakpoints (regardless of enabled status) for specific property checks
 * Useful for properties like "Hidden" that apply even when breakpoint is disabled
 *
 * @param props - Object containing breakpoint properties
 * @param callback - Function to execute for each breakpoint
 */
export function forEachBreakpoint<T extends Record<string, any>>(props: T, callback: BreakpointCallback): void {
    BREAKPOINT_CONFIGS.forEach(bpConfig => {
        const config = {
            size: bpConfig.size,
            label: bpConfig.label
        };

        const getProperty = (prop: string) => {
            const key = `${bpConfig.size}${prop}` as keyof T;
            return props[key];
        };

        const getNormalizedProperty = (prop: string): string | undefined => {
            const key = `${bpConfig.size}${prop}` as keyof T;
            return normalizeValue(props[key] as string | undefined);
        };

        const setProperty = (prop: string, value: any) => {
            const key = `${bpConfig.size}${prop}` as keyof T;
            (props as any)[key] = value;
        };

        callback(config, getProperty, getNormalizedProperty, setProperty);
    });
}

/**
 * Builds CSS custom properties for responsive values
 * Follows the pattern used in the grid components
 *
 * @param props - Object containing breakpoint properties
 * @param cssPrefix - CSS custom property prefix
 * @param propertyMap - Map of property names to CSS property names
 * @returns Object with CSS custom properties
 */
export function buildResponsiveCSSProperties<T extends Record<string, any>>(
    props: T,
    cssPrefix: string,
    propertyMap: Record<string, string>
): Record<string, string> {
    const cssVars: Record<string, string> = {};

    forEachEnabledBreakpoint(props, (config, getProperty) => {
        Object.entries(propertyMap).forEach(([propKey, cssProp]) => {
            const value = getProperty(propKey);
            if (value) {
                cssVars[`${cssPrefix}-${config.size}-${cssProp}`] = value;
            }
        });
    });

    return cssVars;
}

// ============================================================================
// Item-Specific Helpers
// ============================================================================

/**
 * Gets responsive property keys for grid items
 * Item properties are different from container properties
 *
 * @param breakpoint - Breakpoint size
 * @param baseProperty - Base property name (optional)
 * @returns Object with responsive item property keys
 */
export function getItemResponsivePropertyKeys(
    breakpoint: BreakpointSize,
    baseProperty?: string
): Record<string, string> {
    const keys: Record<string, string> = {
        enabled: `${breakpoint}Enabled`,
        placementType: `${breakpoint}PlacementType`,
        gridArea: `${breakpoint}GridArea`,
        columnStart: `${breakpoint}ColumnStart`,
        columnEnd: `${breakpoint}ColumnEnd`,
        rowStart: `${breakpoint}RowStart`,
        rowEnd: `${breakpoint}RowEnd`,
        justifySelf: `${breakpoint}JustifySelf`,
        alignSelf: `${breakpoint}AlignSelf`,
        zIndex: `${breakpoint}ZIndex`,
        hidden: `${breakpoint}Hidden`
    };

    if (baseProperty) {
        return {
            [baseProperty]: keys[baseProperty] || `${breakpoint}${baseProperty}`
        };
    }

    return keys;
}

/**
 * Iterates through enabled item breakpoints and executes callback for each
 * Similar to forEachEnabledBreakpoint but for item properties
 *
 * @param props - Object containing item breakpoint properties
 * @param callback - Function to execute for each enabled breakpoint
 * @param options - Additional options for iteration
 */
export function forEachEnabledItemBreakpoint<T extends Record<string, any>>(
    props: T,
    callback: BreakpointCallback,
    options: {
        includeDisabled?: boolean;
        propertyPrefix?: string;
    } = {}
): void {
    const { includeDisabled = false, propertyPrefix = "" } = options;

    BREAKPOINT_CONFIGS.forEach(bpConfig => {
        const enabledKey = `${bpConfig.size}Enabled` as keyof T;
        const isEnabled = props[enabledKey];

        if (isEnabled || includeDisabled) {
            const config = {
                size: bpConfig.size,
                label: bpConfig.label
            };

            const getProperty = (prop: string) => {
                const key = `${propertyPrefix}${bpConfig.size}${prop}` as keyof T;
                return props[key];
            };

            const getNormalizedProperty = (prop: string): string | undefined => {
                const key = `${propertyPrefix}${bpConfig.size}${prop}` as keyof T;
                return normalizeValue(props[key] as string | undefined);
            };

            const setProperty = (prop: string, value: any) => {
                const key = `${propertyPrefix}${bpConfig.size}${prop}` as keyof T;
                (props as any)[key] = value;
            };

            callback(config, getProperty, getNormalizedProperty, setProperty);
        }
    });
}

/**
 * Checks if an item breakpoint has any meaningful configuration
 * Item properties are different from container properties
 *
 * @param props - Object containing item breakpoint properties
 * @param breakpoint - Breakpoint size to check
 * @returns True if breakpoint has configuration
 */
export function hasItemBreakpointConfiguration<T extends Record<string, any>>(
    props: T,
    breakpoint: BreakpointSize
): boolean {
    const keys = getItemResponsivePropertyKeys(breakpoint);

    // Exclude the 'enabled' key from the check
    const configKeys = Object.values(keys).filter(key => key !== `${breakpoint}Enabled`);

    return configKeys.some(key => {
        const value = props[key as keyof T];
        // For items, also check for non-default values like "auto" or null
        return value !== undefined && value !== null && value !== "" && value !== "auto";
    });
}
