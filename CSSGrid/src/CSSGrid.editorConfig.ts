import { CSSGridPreviewProps, ItemsPreviewType } from "../typings/CSSGridProps";
import {
    Properties,
    hidePropertiesIn,
    hidePropertyIn,
    hideNestedPropertiesIn,
    transformGroupsIntoTabs,
    Problem
} from "@mendix/pluggable-widgets-tools";
import {
    validateCssDimension,
    validateGap,
    validateGridTemplate,
    validateZIndex,
    validateGridTemplateAreas,
    validateItemPlacement,
    isEmpty
} from "./utils/validationHelpers";
import { BREAKPOINT_SIZES, BREAKPOINT_LABELS, BreakpointSizeType, EDITOR } from "./utils/constants";
import {
    getResponsivePropertyKeys,
    forEachEnabledBreakpoint,
    hasBreakpointConfiguration,
    getItemResponsivePropertyKeys,
    forEachEnabledItemBreakpoint,
    forEachBreakpoint
} from "./utils/breakpointHelpers";

/**
 * CSS Grid Editor Configuration
 *
 * Provides validation, custom captions, and preview styling
 * for the Mendix Studio Pro property editor
 *
 * Enhanced with container-level responsive validation
 *
 * NOTE: Validation functions avoid regex to ensure compatibility
 * with Mendix Studio Pro's Jint JavaScript interpreter
 */

// Type for the check function using Mendix's Problem type
type CheckFunction = (values: CSSGridPreviewProps) => Problem[];

// Type for the caption function
type CaptionFunction = (values: CSSGridPreviewProps) => string;

// Type for renderAs property
type RenderAsType = "auto" | "div" | "section" | "article" | "nav" | "aside" | "header" | "main" | "footer";

// Type for responsive properties that might exist on items
type ResponsiveProperties = {
    // XS breakpoint
    xsEnabled?: boolean;
    xsPlacementType?: string;
    xsGridArea?: string;
    xsColumnStart?: string;
    xsColumnEnd?: string;
    xsRowStart?: string;
    xsRowEnd?: string;

    // SM breakpoint
    smEnabled?: boolean;
    smPlacementType?: string;
    smGridArea?: string;
    smColumnStart?: string;
    smColumnEnd?: string;
    smRowStart?: string;
    smRowEnd?: string;

    // MD breakpoint
    mdEnabled?: boolean;
    mdPlacementType?: string;
    mdGridArea?: string;
    mdColumnStart?: string;
    mdColumnEnd?: string;
    mdRowStart?: string;
    mdRowEnd?: string;

    // LG breakpoint
    lgEnabled?: boolean;
    lgPlacementType?: string;
    lgGridArea?: string;
    lgColumnStart?: string;
    lgColumnEnd?: string;
    lgRowStart?: string;
    lgRowEnd?: string;

    // XL breakpoint
    xlEnabled?: boolean;
    xlPlacementType?: string;
    xlGridArea?: string;
    xlColumnStart?: string;
    xlColumnEnd?: string;
    xlRowStart?: string;
    xlRowEnd?: string;

    // XXL breakpoint
    xxlEnabled?: boolean;
    xxlPlacementType?: string;
    xxlGridArea?: string;
    xxlColumnStart?: string;
    xxlColumnEnd?: string;
    xxlRowStart?: string;
    xxlRowEnd?: string;

    // 2K breakpoint
    xxxlEnabled?: boolean;
    xxxlPlacementType?: string;
    xxxlGridArea?: string;
    xxxlColumnStart?: string;
    xxxlColumnEnd?: string;
    xxxlRowStart?: string;
    xxxlRowEnd?: string;

    // 4K breakpoint
    xxxxlEnabled?: boolean;
    xxxxlPlacementType?: string;
    xxxxlGridArea?: string;
    xxxxlColumnStart?: string;
    xxxxlColumnEnd?: string;
    xxxxlRowStart?: string;
    xxxxlRowEnd?: string;

    // Responsive alignment properties
    xsJustifySelf?: string;
    xsAlignSelf?: string;
    xsZIndex?: number;
    smJustifySelf?: string;
    smAlignSelf?: string;
    smZIndex?: number;
    mdJustifySelf?: string;
    mdAlignSelf?: string;
    mdZIndex?: number;
    lgJustifySelf?: string;
    lgAlignSelf?: string;
    lgZIndex?: number;
    xlJustifySelf?: string;
    xlAlignSelf?: string;
    xlZIndex?: number;
    xxlJustifySelf?: string;
    xxlAlignSelf?: string;
    xxlZIndex?: number;
    xxxlJustifySelf?: string;
    xxxlAlignSelf?: string;
    xxxlZIndex?: number;
    xxxxlJustifySelf?: string;
    xxxxlAlignSelf?: string;
    xxxxlZIndex?: number;
};

// Type for container responsive properties
type ResponsiveContainerProperties = {
    enableBreakpoints?: boolean;

    // Debug properties
    showGridLines?: boolean;
    showGridAreas?: boolean;
    showGridGaps?: boolean;

    // XS breakpoint
    xsEnabled?: boolean;
    xsColumns?: string;
    xsRows?: string;
    xsAreas?: string;
    xsGap?: string;
    xsRowGap?: string;
    xsColumnGap?: string;
    xsAutoFlow?: string;
    xsAutoRows?: string;
    xsAutoColumns?: string;
    xsJustifyItems?: string;
    xsAlignItems?: string;
    xsJustifyContent?: string;
    xsAlignContent?: string;
    xsMinHeight?: string;
    xsMaxHeight?: string;
    xsMinWidth?: string;
    xsMaxWidth?: string;

    // SM breakpoint
    smEnabled?: boolean;
    smColumns?: string;
    smRows?: string;
    smAreas?: string;
    smGap?: string;
    smRowGap?: string;
    smColumnGap?: string;
    smAutoFlow?: string;
    smAutoRows?: string;
    smAutoColumns?: string;
    smJustifyItems?: string;
    smAlignItems?: string;
    smJustifyContent?: string;
    smAlignContent?: string;
    smMinHeight?: string;
    smMaxHeight?: string;
    smMinWidth?: string;
    smMaxWidth?: string;

    // MD breakpoint
    mdEnabled?: boolean;
    mdColumns?: string;
    mdRows?: string;
    mdAreas?: string;
    mdGap?: string;
    mdRowGap?: string;
    mdColumnGap?: string;
    mdAutoFlow?: string;
    mdAutoRows?: string;
    mdAutoColumns?: string;
    mdJustifyItems?: string;
    mdAlignItems?: string;
    mdJustifyContent?: string;
    mdAlignContent?: string;
    mdMinHeight?: string;
    mdMaxHeight?: string;
    mdMinWidth?: string;
    mdMaxWidth?: string;

    // LG breakpoint
    lgEnabled?: boolean;
    lgColumns?: string;
    lgRows?: string;
    lgAreas?: string;
    lgGap?: string;
    lgRowGap?: string;
    lgColumnGap?: string;
    lgAutoFlow?: string;
    lgAutoRows?: string;
    lgAutoColumns?: string;
    lgJustifyItems?: string;
    lgAlignItems?: string;
    lgJustifyContent?: string;
    lgAlignContent?: string;
    lgMinHeight?: string;
    lgMaxHeight?: string;
    lgMinWidth?: string;
    lgMaxWidth?: string;

    // XL breakpoint
    xlEnabled?: boolean;
    xlColumns?: string;
    xlRows?: string;
    xlAreas?: string;
    xlGap?: string;
    xlRowGap?: string;
    xlColumnGap?: string;
    xlAutoFlow?: string;
    xlAutoRows?: string;
    xlAutoColumns?: string;
    xlJustifyItems?: string;
    xlAlignItems?: string;
    xlJustifyContent?: string;
    xlAlignContent?: string;
    xlMinHeight?: string;
    xlMaxHeight?: string;
    xlMinWidth?: string;
    xlMaxWidth?: string;

    // XXL breakpoint
    xxlEnabled?: boolean;
    xxlColumns?: string;
    xxlRows?: string;
    xxlAreas?: string;
    xxlGap?: string;
    xxlRowGap?: string;
    xxlColumnGap?: string;
    xxlAutoFlow?: string;
    xxlAutoRows?: string;
    xxlAutoColumns?: string;
    xxlJustifyItems?: string;
    xxlAlignItems?: string;
    xxlJustifyContent?: string;
    xxlAlignContent?: string;
    xxlMinHeight?: string;
    xxlMaxHeight?: string;
    xxlMinWidth?: string;
    xxlMaxWidth?: string;

    // 2K breakpoint
    xxxlEnabled?: boolean;
    xxxlColumns?: string;
    xxxlRows?: string;
    xxxlAreas?: string;
    xxxlGap?: string;
    xxxlRowGap?: string;
    xxxlColumnGap?: string;
    xxxlAutoFlow?: string;
    xxxlAutoRows?: string;
    xxxlAutoColumns?: string;
    xxxlJustifyItems?: string;
    xxxlAlignItems?: string;
    xxxlJustifyContent?: string;
    xxxlAlignContent?: string;
    xxxlMinHeight?: string;
    xxxlMaxHeight?: string;
    xxxlMinWidth?: string;
    xxxlMaxWidth?: string;

    // 4K breakpoint
    xxxxlEnabled?: boolean;
    xxxxlColumns?: string;
    xxxxlRows?: string;
    xxxxlAreas?: string;
    xxxxlGap?: string;
    xxxxlRowGap?: string;
    xxxxlColumnGap?: string;
    xxxxlAutoFlow?: string;
    xxxxlAutoRows?: string;
    xxxxlAutoColumns?: string;
    xxxxlJustifyItems?: string;
    xxxxlAlignItems?: string;
    xxxxlJustifyContent?: string;
    xxxxlAlignContent?: string;
    xxxxlMinHeight?: string;
    xxxxlMaxHeight?: string;
    xxxxlMinWidth?: string;
    xxxxlMaxWidth?: string;
};

// Use type intersection instead of interface extension
type ResponsiveItemPreview = ItemsPreviewType & ResponsiveProperties;
type ResponsiveContainerPreview = CSSGridPreviewProps & ResponsiveContainerProperties;

// Constants are imported from utils/constants.ts

/**
 * Dynamically configure which properties are visible based on other property values
 * This significantly reduces UI clutter by showing only relevant options
 */
export function getProperties(values: CSSGridPreviewProps, defaultProperties: Properties): Properties {
    // Start with default properties
    const properties = defaultProperties;
    const containerValues = values as ResponsiveContainerPreview;

    // 1. Grid Layout conditional properties
    // REMOVED the hiding of gridTemplateColumns and gridTemplateRows when useNamedAreas is true
    // These are still needed to define the grid structure
    if (!values.useNamedAreas) {
        // When not using named areas, hide the areas property
        hidePropertyIn(properties, values, "gridTemplateAreas");
    }

    // 2. Grid spacing optimization - hide individual gaps if general gap is set
    if (values.gap && values.gap.trim() !== "") {
        hidePropertiesIn(properties, values, ["rowGap", "columnGap"] as Array<keyof CSSGridPreviewProps>);
    }

    // 3. Container breakpoint properties
    if (!values.enableBreakpoints) {
        // Hide all breakpoint-related properties using helper
        const breakpointProps: Array<keyof CSSGridPreviewProps> = [];

        BREAKPOINT_SIZES.forEach((bp: BreakpointSizeType) => {
            const keys = getResponsivePropertyKeys(bp as any); // Convert to BreakpointSize
            Object.values(keys).forEach(key => {
                breakpointProps.push(key as keyof CSSGridPreviewProps);
            });
        });

        hidePropertiesIn(properties, values, breakpointProps);
    } else {
        // Hide detailed breakpoint properties if the breakpoint is not enabled
        forEachBreakpoint(values, (config, getProperty) => {
            const isEnabled = getProperty("Enabled");
            if (!isEnabled) {
                const keys = getResponsivePropertyKeys(config.size);
                // Exclude the 'enabled' key since we want to keep that visible
                const propsToHide = Object.values(keys)
                    .filter(key => key !== `${config.size}Enabled`)
                    .map(key => key as keyof CSSGridPreviewProps);
                hidePropertiesIn(properties, values, propsToHide);
            } else {
                // If gap is set for this breakpoint, hide individual gaps
                const gap = getProperty("Gap");
                if (gap) {
                    hidePropertiesIn(properties, values, [`${config.size}RowGap`, `${config.size}ColumnGap`] as Array<
                        keyof CSSGridPreviewProps
                    >);
                }

                // Hide areas if not using named areas
                if (!values.useNamedAreas) {
                    hidePropertyIn(properties, values, `${config.size}Areas` as keyof CSSGridPreviewProps);
                }
                // NOTE: We do NOT hide columns/rows when useNamedAreas is true
                // Both are needed to properly define the grid structure
            }
        });
    }

    // 4. Item-level conditional properties
    if (values.items && values.items.length > 0) {
        values.items.forEach((item, index) => {
            // Hide placement-specific properties based on placement type
            switch (item.placementType) {
                case "auto":
                    // Hide all placement properties for auto
                    hideNestedPropertiesIn(properties, values, "items", index, [
                        "gridArea",
                        "columnStart",
                        "columnEnd",
                        "rowStart",
                        "rowEnd"
                    ] as Array<keyof ItemsPreviewType>);
                    break;

                case "area":
                    // Hide coordinate properties for area placement
                    hideNestedPropertiesIn(properties, values, "items", index, [
                        "columnStart",
                        "columnEnd",
                        "rowStart",
                        "rowEnd"
                    ] as Array<keyof ItemsPreviewType>);

                    // Hide grid area if not using named areas at container level
                    if (!values.useNamedAreas) {
                        hideNestedPropertiesIn(properties, values, "items", index, ["gridArea"] as Array<
                            keyof ItemsPreviewType
                        >);
                    }
                    break;

                case "coordinates":
                    // Hide area property for coordinate placement
                    hideNestedPropertiesIn(properties, values, "items", index, ["gridArea"] as Array<
                        keyof ItemsPreviewType
                    >);
                    break;

                case "span":
                    // Hide area and end properties for span placement
                    hideNestedPropertiesIn(properties, values, "items", index, [
                        "gridArea",
                        "columnEnd",
                        "rowEnd"
                    ] as Array<keyof ItemsPreviewType>);
                    break;
            }

            // Hide all responsive properties if not enabled for this item OR if container responsiveness is disabled
            if (!item.enableResponsive || !values.enableBreakpoints) {
                const responsiveProps: Array<keyof ItemsPreviewType> = [];

                forEachEnabledItemBreakpoint(
                    item,
                    (_config, _getProperty) => {
                        const keys = getItemResponsivePropertyKeys(_config.size);
                        Object.values(keys).forEach(key => {
                            responsiveProps.push(key as keyof ItemsPreviewType);
                        });
                    },
                    { includeDisabled: true }
                ); // Include all breakpoints when hiding everything

                hideNestedPropertiesIn(properties, values, "items", index, responsiveProps);
            } else {
                // Hide detailed responsive properties based on enabled breakpoints and placement types
                forEachEnabledItemBreakpoint(
                    item,
                    (config, _getProperty) => {
                        const enabledKey = `${config.size}Enabled` as keyof ItemsPreviewType;
                        const placementTypeKey = `${config.size}PlacementType` as keyof ItemsPreviewType;

                        // Check if container has this breakpoint enabled
                        const containerBreakpointEnabledKey =
                            `${config.size}Enabled` as keyof ResponsiveContainerPreview;
                        const isContainerBreakpointEnabled = containerValues[containerBreakpointEnabledKey];

                        // Hide all breakpoint properties if container doesn't have this breakpoint enabled
                        if (!isContainerBreakpointEnabled) {
                            const keys = getItemResponsivePropertyKeys(config.size);
                            const propsToHide = Object.values(keys).map(key => key as keyof ItemsPreviewType);
                            hideNestedPropertiesIn(properties, values, "items", index, propsToHide);
                        } else if (!item[enabledKey]) {
                            // Hide all properties for this breakpoint if not enabled
                            const keys = getItemResponsivePropertyKeys(config.size);
                            // Exclude the 'enabled' key since we want to keep that visible
                            const propsToHide = Object.values(keys)
                                .filter(key => key !== `${config.size}Enabled`)
                                .map(key => key as keyof ItemsPreviewType);
                            hideNestedPropertiesIn(properties, values, "items", index, propsToHide);
                        } else {
                            // Hide properties based on placement type for this breakpoint
                            const placementType = item[placementTypeKey];

                            switch (placementType) {
                                case "auto":
                                    hideNestedPropertiesIn(properties, values, "items", index, [
                                        `${config.size}GridArea`,
                                        `${config.size}ColumnStart`,
                                        `${config.size}ColumnEnd`,
                                        `${config.size}RowStart`,
                                        `${config.size}RowEnd`
                                    ] as Array<keyof ItemsPreviewType>);
                                    break;

                                case "area":
                                    hideNestedPropertiesIn(properties, values, "items", index, [
                                        `${config.size}ColumnStart`,
                                        `${config.size}ColumnEnd`,
                                        `${config.size}RowStart`,
                                        `${config.size}RowEnd`
                                    ] as Array<keyof ItemsPreviewType>);

                                    // Hide area if container doesn't use named areas
                                    if (!values.useNamedAreas) {
                                        hideNestedPropertiesIn(properties, values, "items", index, [
                                            `${config.size}GridArea`
                                        ] as Array<keyof ItemsPreviewType>);
                                    }
                                    break;

                                case "coordinates":
                                    hideNestedPropertiesIn(properties, values, "items", index, [
                                        `${config.size}GridArea`
                                    ] as Array<keyof ItemsPreviewType>);
                                    break;

                                case "span":
                                    hideNestedPropertiesIn(properties, values, "items", index, [
                                        `${config.size}GridArea`,
                                        `${config.size}ColumnEnd`,
                                        `${config.size}RowEnd`
                                    ] as Array<keyof ItemsPreviewType>);
                                    break;
                            }
                        }
                    },
                    { includeDisabled: true }
                ); // Need to check all breakpoints to see container status
            }
        });
    }

    // 5. Performance properties
    if (!values.enableVirtualization) {
        hidePropertyIn(properties, values, "virtualizeThreshold");
    }

    // 6. Debug properties - only show relevant ones
    const debugValues = values as ResponsiveContainerPreview;
    if (!debugValues.useNamedAreas) {
        hidePropertyIn(properties, debugValues, "showGridAreas" as keyof ResponsiveContainerPreview);
    }

    // 7. Transform property groups into tabs for better organization
    // This makes the property panel much more manageable
    transformGroupsIntoTabs(properties);

    return properties;
}

/**
 * Get all defined areas across all breakpoints
 *
 * @param values - Widget property values
 * @returns Set of all defined area names
 */
function getAllDefinedAreas(values: ResponsiveContainerPreview): Set<string> {
    const allAreas = new Set<string>();

    // Add base areas
    if (values.useNamedAreas && values.gridTemplateAreas) {
        const validation = validateGridTemplateAreas(values.gridTemplateAreas);
        if (validation.valid && validation.lines) {
            validation.lines.flat().forEach(area => {
                if (area !== ".") {
                    allAreas.add(area);
                }
            });
        }
    }

    // Add areas from enabled breakpoints
    if (values.enableBreakpoints) {
        forEachEnabledBreakpoint(values, (_config, getProperty) => {
            const areas = getProperty("Areas") as string;
            if (areas) {
                const validation = validateGridTemplateAreas(areas);
                if (validation.valid && validation.lines) {
                    validation.lines.flat().forEach(area => {
                        if (area !== ".") {
                            allAreas.add(area);
                        }
                    });
                }
            }
        });
    }

    return allAreas;
}

/**
 * Validates the CSS Grid configuration
 *
 * @param values - Widget property values
 * @returns Array of validation errors and warnings
 */
export const check: CheckFunction = values => {
    const errors: Problem[] = [];
    const containerValues = values as ResponsiveContainerPreview;

    // Get all defined areas across all breakpoints
    const allDefinedAreas = getAllDefinedAreas(containerValues);

    // Check for multiple main elements
    const mainElements = values.items.filter(item => {
        const itemWithRenderAs = item as ItemsPreviewType & { renderAs?: RenderAsType };

        // Check explicit main
        if (itemWithRenderAs.renderAs === "main") {
            return true;
        }

        // Check auto-detected main
        if (itemWithRenderAs.renderAs === "auto") {
            const areaName = (item.gridArea || item.itemName || "").toLowerCase().trim();
            return areaName === "main" || areaName === "content";
        }

        return false;
    });

    if (mainElements.length > 1) {
        errors.push({
            severity: "warning",
            message: `Multiple items (${mainElements.length}) are set to render as <main>. Only one <main> element should exist per page for proper accessibility.`
        });
    }

    // Validate grid template based on useNamedAreas
    if (values.useNamedAreas) {
        // Validate grid template areas (required when using named areas)
        const areasValidation = validateGridTemplateAreas(values.gridTemplateAreas, true);

        if (!areasValidation.valid) {
            errors.push({
                severity: "error",
                message: areasValidation.error || "Invalid grid template areas format"
            });
        }

        // Still validate columns and rows when using named areas
        const columnsValidation = validateGridTemplate(values.gridTemplateColumns, "Grid Template Columns", false);
        if (!columnsValidation.isValid) {
            errors.push({
                property: "gridTemplateColumns",
                severity: columnsValidation.severity || "warning",
                message:
                    columnsValidation.error ||
                    columnsValidation.warning ||
                    "Grid Template Columns is recommended even when using named areas"
            });
        } else if (isEmpty(values.gridTemplateColumns)) {
            errors.push({
                property: "gridTemplateColumns",
                severity: "warning",
                message:
                    "Grid Template Columns is recommended even when using named areas to define the column structure"
            });
        }

        // Rows are optional
        const rowsValidation = validateGridTemplate(values.gridTemplateRows, "Grid Template Rows", false);
        if (!rowsValidation.isValid) {
            errors.push({
                property: "gridTemplateRows",
                severity: rowsValidation.severity || "warning",
                message: rowsValidation.error || "Invalid grid template rows syntax"
            });
        }
    } else {
        // Not using named areas
        if (!isEmpty(values.gridTemplateAreas)) {
            errors.push({
                severity: "warning",
                message:
                    "Grid Template Areas is only used when 'Use Named Areas' is enabled. Enable it to use area-based placement."
            });
        }

        // Validate grid template columns (required when not using named areas)
        const columnsValidation = validateGridTemplate(values.gridTemplateColumns, "Grid Template Columns", true);
        if (!columnsValidation.isValid) {
            errors.push({
                property: "gridTemplateColumns",
                severity: columnsValidation.severity || "error",
                message: columnsValidation.error || "Grid Template Columns is required"
            });
        }

        // Validate rows if provided
        const rowsValidation = validateGridTemplate(values.gridTemplateRows, "Grid Template Rows", false);
        if (!rowsValidation.isValid) {
            errors.push({
                property: "gridTemplateRows",
                severity: rowsValidation.severity || "warning",
                message: rowsValidation.error || "Invalid grid template rows syntax"
            });
        }
    }

    // ============================================================================
    // Enhanced Validation Warnings for Common CSS Grid Mistakes
    // ============================================================================

    // 1. auto-fit without minmax() warning
    if (
        values.gridTemplateColumns &&
        values.gridTemplateColumns.includes("auto-fit") &&
        !values.gridTemplateColumns.includes("minmax")
    ) {
        errors.push({
            property: "gridTemplateColumns",
            severity: "warning",
            message:
                "auto-fit usually requires minmax() for responsive behavior. Example: repeat(auto-fit, minmax(300px, 1fr))"
        });
    }

    // 2. Performance warning for too many columns
    if (values.gridTemplateColumns && !isEmpty(values.gridTemplateColumns)) {
        // Count columns by counting spaces + 1 (avoiding regex)
        const trimmed = values.gridTemplateColumns.trim();
        let columnCount = 1;
        let inParens = 0;
        let lastWasSpace = false;
        
        for (let i = 0; i < trimmed.length; i++) {
            const char = trimmed[i];
            if (char === '(') inParens++;
            else if (char === ')') inParens--;
            else if (char === ' ' && inParens === 0) {
                if (!lastWasSpace) {
                    columnCount++;
                }
                lastWasSpace = true;
            } else {
                lastWasSpace = false;
            }
        }
        
        if (columnCount > 12) {
            errors.push({
                property: "gridTemplateColumns",
                severity: "warning",
                message:
                    "More than 12 columns may impact performance. Consider using auto-fit/auto-fill for responsive layouts."
            });
        }
    }

    // 3. Fractional units with large gaps warning
    if (values.gridTemplateColumns && values.gridTemplateColumns.includes("fr") && values.gap && !isEmpty(values.gap)) {
        const gapValue = parseInt(values.gap, 10);
        if (!isNaN(gapValue) && gapValue > 40) {
            errors.push({
                property: "gap",
                severity: "warning",
                message:
                    "Large gaps with fractional units may cause overflow on small screens. Consider responsive gap values."
            });
        }
    }

    // 4. Accessibility warning for complex grids without ARIA labels
    if (values.items.length > 1 && !values.ariaLabel && !values.ariaLabelledBy) {
        errors.push({
            severity: "warning",
            message: "Consider adding ARIA label for complex grids to improve accessibility for screen reader users."
        });
    }

    // 5. Mixed placement type warnings for items
    values.items?.forEach((item, index) => {
        if (item.placementType === "area" && (item.columnStart || item.rowStart || item.columnEnd || item.rowEnd)) {
            errors.push({
                property: `items/${index}/placementType`,
                severity: "warning",
                message: `Item ${
                    index + 1
                }: Using area placement with coordinates. Area placement will take precedence over coordinate properties.`
            });
        }
    });

    // Validate base container dimension properties
    const baseGapValidation = validateGap(values.gap, false);
    if (!baseGapValidation.isValid) {
        errors.push({
            property: "gap",
            severity: baseGapValidation.severity || "error",
            message: baseGapValidation.error || ""
        });
    }

    const baseRowGapValidation = validateGap(values.rowGap, false);
    if (!baseRowGapValidation.isValid) {
        errors.push({
            property: "rowGap",
            severity: baseRowGapValidation.severity || "error",
            message: baseRowGapValidation.error || ""
        });
    }

    const baseColumnGapValidation = validateGap(values.columnGap, false);
    if (!baseColumnGapValidation.isValid) {
        errors.push({
            property: "columnGap",
            severity: baseColumnGapValidation.severity || "error",
            message: baseColumnGapValidation.error || ""
        });
    }

    // Validate base dimension properties
    const baseDimensions = [
        { key: "minWidth", label: "Min Width" },
        { key: "maxWidth", label: "Max Width" },
        { key: "minHeight", label: "Min Height" },
        { key: "maxHeight", label: "Max Height" }
    ];

    baseDimensions.forEach(dim => {
        const value = values[dim.key as keyof CSSGridPreviewProps] as string | undefined;
        if (!isEmpty(value)) {
            const validation = validateCssDimension(value, dim.label, false);
            if (!validation.isValid) {
                errors.push({
                    property: dim.key,
                    severity: validation.severity || "error",
                    message: validation.error || ""
                });
            }
        }
    });

    // Validate container responsive settings
    if (containerValues.enableBreakpoints) {
        let hasAnyBreakpoint = false;

        forEachEnabledBreakpoint(containerValues, (config, getProperty) => {
            hasAnyBreakpoint = true;

            // Only validate properties that have values (responsive overrides)
            const columns = getProperty("Columns") as string | undefined;
            const rows = getProperty("Rows") as string | undefined;
            const areas = getProperty("Areas") as string | undefined;
            const gap = getProperty("Gap") as string | undefined;
            const rowGap = getProperty("RowGap") as string | undefined;
            const columnGap = getProperty("ColumnGap") as string | undefined;

            // Validate columns only if provided
            if (!isEmpty(columns)) {
                const validation = validateGridTemplate(columns, `${config.label} Columns`, false);
                if (!validation.isValid) {
                    errors.push({
                        property: `${config.size}Columns` as keyof ResponsiveContainerPreview,
                        severity: validation.severity || "warning",
                        message: validation.error || validation.warning || ""
                    });
                }
            }

            // Validate rows only if provided
            if (!isEmpty(rows)) {
                const validation = validateGridTemplate(rows, `${config.label} Rows`, false);
                if (!validation.isValid) {
                    errors.push({
                        property: `${config.size}Rows` as keyof ResponsiveContainerPreview,
                        severity: validation.severity || "warning",
                        message: validation.error || validation.warning || ""
                    });
                }
            }

            // Validate areas only if provided and using named areas
            if (!isEmpty(areas)) {
                if (values.useNamedAreas) {
                    const validation = validateGridTemplateAreas(areas, false);
                    if (!validation.valid) {
                        errors.push({
                            property: `${config.size}Areas` as keyof ResponsiveContainerPreview,
                            severity: "error",
                            message: `${config.label}: ${validation.error}`
                        });
                    }
                } else {
                    errors.push({
                        severity: "warning",
                        message: `${config.label}: Template areas property is ignored when 'Use Named Areas' is disabled`
                    });
                }
            }

            // Validate gaps only if provided
            if (!isEmpty(gap)) {
                const validation = validateGap(gap, false);
                if (!validation.isValid) {
                    errors.push({
                        property: `${config.size}Gap` as keyof ResponsiveContainerPreview,
                        severity: validation.severity || "error",
                        message: `${config.label}: ${validation.error}`
                    });
                }
            }

            if (!isEmpty(rowGap)) {
                const validation = validateGap(rowGap, false);
                if (!validation.isValid) {
                    errors.push({
                        property: `${config.size}RowGap` as keyof ResponsiveContainerPreview,
                        severity: validation.severity || "error",
                        message: `${config.label} Row Gap: ${validation.error}`
                    });
                }
            }

            if (!isEmpty(columnGap)) {
                const validation = validateGap(columnGap, false);
                if (!validation.isValid) {
                    errors.push({
                        property: `${config.size}ColumnGap` as keyof ResponsiveContainerPreview,
                        severity: validation.severity || "error",
                        message: `${config.label} Column Gap: ${validation.error}`
                    });
                }
            }

            // Validate dimensions only if provided
            const dimensionProperties = ["MinWidth", "MaxWidth", "MinHeight", "MaxHeight"];

            dimensionProperties.forEach(dimProperty => {
                const value = getProperty(dimProperty) as string | undefined;
                if (!isEmpty(value)) {
                    const validation = validateCssDimension(value, `${config.label} ${dimProperty}`, false);
                    if (!validation.isValid) {
                        errors.push({
                            property: `${config.size}${dimProperty}` as keyof ResponsiveContainerPreview,
                            severity: validation.severity || "error",
                            message: validation.error || ""
                        });
                    }
                }
            });
        });

        if (!hasAnyBreakpoint) {
            errors.push({
                severity: "warning",
                message:
                    "Responsive grid is enabled but no breakpoints are configured. Enable at least one breakpoint size."
            });
        }

        // Enhanced validation: Check for enabled breakpoints with no meaningful configuration
        forEachEnabledBreakpoint(containerValues, config => {
            if (!hasBreakpointConfiguration(containerValues, config.size)) {
                errors.push({
                    severity: "warning",
                    message: `${config.label} breakpoint is enabled but has no configuration. Add responsive overrides or disable this breakpoint.`
                });
            }
        });
    }

    // Validate items
    values.items?.forEach((item, index) => {
        const responsiveItem = item as ResponsiveItemPreview;

        // Validate item placement
        const placementResults = validateItemPlacement(
            responsiveItem.placementType,
            responsiveItem.gridArea,
            responsiveItem.columnStart,
            responsiveItem.columnEnd,
            responsiveItem.rowStart,
            responsiveItem.rowEnd,
            values.useNamedAreas,
            allDefinedAreas,
            `Item ${index + 1}`
        );

        placementResults.forEach(result => {
            if (result.error) {
                const basePropKey = result.error.includes("Grid Area")
                    ? "gridArea"
                    : result.error.includes("column start")
                    ? "columnStart"
                    : result.error.includes("column end")
                    ? "columnEnd"
                    : result.error.includes("row start")
                    ? "rowStart"
                    : result.error.includes("row end")
                    ? "rowEnd"
                    : "placementType";

                errors.push({
                    property: `items/${index}/${basePropKey}`,
                    severity: result.severity || "error",
                    message: result.error
                });
            } else if (result.warning) {
                errors.push({
                    property: `items/${index}/gridArea`,
                    severity: "warning",
                    message: result.warning
                });
            } else if (result.info) {
                errors.push({
                    severity: "warning",
                    message: result.info
                });
            }
        });

        // Validate z-index
        const zIndexValidation = validateZIndex(responsiveItem.zIndex);
        if (!zIndexValidation.isValid) {
            errors.push({
                property: `items/${index}/zIndex`,
                severity: "error",
                message: `Item ${index + 1}: ${zIndexValidation.error}`
            });
        } else if (!zIndexValidation.isKeyword && zIndexValidation.numericValue !== undefined) {
            if (
                zIndexValidation.numericValue < EDITOR.Z_INDEX_MIN ||
                zIndexValidation.numericValue > EDITOR.Z_INDEX_MAX
            ) {
                errors.push({
                    property: `items/${index}/zIndex`,
                    severity: "warning",
                    message: `Item ${index + 1}: Z-index should be between ${EDITOR.Z_INDEX_MIN} and ${
                        EDITOR.Z_INDEX_MAX
                    } for best compatibility`
                });
            }
        }

        // Validate responsive settings for items
        if (responsiveItem.enableResponsive) {
            let hasAnyBreakpoint = false;

            BREAKPOINT_SIZES.forEach((size: BreakpointSizeType) => {
                const enabledKey = `${size}Enabled` as keyof ResponsiveItemPreview;
                if (responsiveItem[enabledKey]) {
                    hasAnyBreakpoint = true;

                    const placementTypeKey = `${size}PlacementType` as keyof ResponsiveItemPreview;
                    const placementType = responsiveItem[placementTypeKey] as string;

                    // Validate placement for this breakpoint
                    const areaKey = `${size}GridArea` as keyof ResponsiveItemPreview;
                    const colStartKey = `${size}ColumnStart` as keyof ResponsiveItemPreview;
                    const colEndKey = `${size}ColumnEnd` as keyof ResponsiveItemPreview;
                    const rowStartKey = `${size}RowStart` as keyof ResponsiveItemPreview;
                    const rowEndKey = `${size}RowEnd` as keyof ResponsiveItemPreview;

                    // Get responsive values
                    const gridArea = responsiveItem[areaKey] as string | undefined;
                    const columnStart = responsiveItem[colStartKey] as string | undefined;
                    const columnEnd = responsiveItem[colEndKey] as string | undefined;
                    const rowStart = responsiveItem[rowStartKey] as string | undefined;
                    const rowEnd = responsiveItem[rowEndKey] as string | undefined;

                    // Validate responsive placement (only if values are provided)
                    const responsivePlacementResults = validateItemPlacement(
                        placementType,
                        gridArea,
                        columnStart,
                        columnEnd,
                        rowStart,
                        rowEnd,
                        values.useNamedAreas,
                        allDefinedAreas,
                        `Item ${index + 1} ${BREAKPOINT_LABELS[size]}`
                    );

                    responsivePlacementResults.forEach(result => {
                        if (result.error) {
                            const propKey = result.error.includes("Grid Area")
                                ? areaKey
                                : result.error.includes("column start")
                                ? colStartKey
                                : result.error.includes("column end")
                                ? colEndKey
                                : result.error.includes("row start")
                                ? rowStartKey
                                : result.error.includes("row end")
                                ? rowEndKey
                                : placementTypeKey;

                            errors.push({
                                property: `items/${index}/${propKey}`,
                                severity: result.severity || "error",
                                message: result.error
                            });
                        } else if (result.warning) {
                            errors.push({
                                property: `items/${index}/${areaKey}`,
                                severity: "warning",
                                message: result.warning
                            });
                        } else if (result.info) {
                            errors.push({
                                severity: "warning",
                                message: result.info
                            });
                        }
                    });

                    // Validate responsive z-index (only if provided)
                    const zIndexKey = `${size}ZIndex` as keyof ResponsiveItemPreview;
                    const zIndexValue = responsiveItem[zIndexKey] as string | undefined;

                    if (!isEmpty(zIndexValue)) {
                        const zIndexValidation = validateZIndex(zIndexValue);
                        if (!zIndexValidation.isValid) {
                            errors.push({
                                property: `items/${index}/${zIndexKey}`,
                                severity: "error",
                                message: `Item ${index + 1} ${BREAKPOINT_LABELS[size]}: ${zIndexValidation.error}`
                            });
                        } else if (!zIndexValidation.isKeyword && zIndexValidation.numericValue !== undefined) {
                            if (
                                zIndexValidation.numericValue < EDITOR.Z_INDEX_MIN ||
                                zIndexValidation.numericValue > EDITOR.Z_INDEX_MAX
                            ) {
                                errors.push({
                                    property: `items/${index}/${zIndexKey}`,
                                    severity: "warning",
                                    message: `Item ${index + 1} ${BREAKPOINT_LABELS[size]}: Z-index should be between ${
                                        EDITOR.Z_INDEX_MIN
                                    } and ${EDITOR.Z_INDEX_MAX} for best compatibility`
                                });
                            }
                        }
                    }
                }
            });

            if (!hasAnyBreakpoint) {
                errors.push({
                    severity: "warning",
                    message: `Item ${
                        index + 1
                    }: Responsive placement is enabled but no breakpoints are configured. Enable at least one breakpoint size.`
                });
            }
        }
    });

    // ============================================================================
    // Enhanced Performance and Virtualization Validation
    // ============================================================================

    // Check for large grids that should use virtualization
    if (values.items.length >= 500 && !values.enableVirtualization) {
        errors.push({
            property: "enableVirtualization",
            severity: "warning",
            message: `Grid has ${values.items.length} items. Consider enabling virtualization for grids with 500+ items to improve performance.`
        });
    } else if (values.items.length >= 100 && values.items.length < 500 && !values.enableVirtualization) {
        errors.push({
            severity: "warning",
            message: `Grid has ${values.items.length} items. Virtualization may improve performance for large datasets.`
        });
    }

    // Validate virtualization threshold
    if (values.enableVirtualization && values.virtualizeThreshold !== null) {
        if (values.virtualizeThreshold < EDITOR.VIRTUALIZATION_MIN_THRESHOLD) {
            errors.push({
                property: "virtualizeThreshold",
                severity: "warning",
                message: `Virtualization threshold below ${EDITOR.VIRTUALIZATION_MIN_THRESHOLD} items may cause performance issues`
            });
        } else if (values.virtualizeThreshold > EDITOR.VIRTUALIZATION_MAX_THRESHOLD) {
            errors.push({
                property: "virtualizeThreshold",
                severity: "warning",
                message: `Very high virtualization threshold may impact initial render performance`
            });
        }
    } else if (!values.enableVirtualization && values.virtualizeThreshold && values.virtualizeThreshold !== 100) {
        errors.push({
            severity: "warning",
            message:
                "Virtualization threshold is configured but virtualization is not enabled. Enable 'Enable Virtualization' to use it."
        });
    }

    // General tips based on configuration
    if (values.items.length === 0) {
        errors.push({
            severity: "warning",
            message: "No grid items configured. Add items to the grid to see your layout."
        });
    }

    return errors;
};

/**
 * Generates a custom caption for the widget in the page editor
 *
 * @param values - Widget property values
 * @returns Custom caption string
 */
export const getCustomCaption: CaptionFunction = values => {
    const containerValues = values as ResponsiveContainerPreview;

    // Build caption parts
    const parts: string[] = [];

    if (values.useNamedAreas) {
        let areaCount = 0;
        if (values.gridTemplateAreas) {
            // Count lines manually to avoid split
            let lineCount = 1;
            for (let i = 0; i < values.gridTemplateAreas.length; i++) {
                if (values.gridTemplateAreas[i] === '\n') {
                    lineCount++;
                }
            }
            areaCount = lineCount;
        }
        parts.push(`Grid (${areaCount} areas)`);
    } else {
        // Parse grid dimensions without regex
        const columnsParts: string[] = [];
        const columnsStr = values.gridTemplateColumns || "1fr 1fr";
        let current = "";
        let depth = 0;

        for (let i = 0; i < columnsStr.length; i++) {
            const char = columnsStr[i];

            if (char === "(") {
                depth++;
            }
            if (char === ")") {
                depth--;
            }

            if ((char === " " || char === "\t") && depth === 0) {
                if (current.trim()) {
                    columnsParts.push(current.trim());
                }
                current = "";
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            columnsParts.push(current.trim());
        }

        const columns = columnsParts.length || 1;

        // Parse rows without using split() with regex
        const rowsStr = values.gridTemplateRows || "auto";
        const rowsParts: string[] = [];
        current = "";
        depth = 0;

        for (let i = 0; i < rowsStr.length; i++) {
            const char = rowsStr[i];

            if (char === "(") {
                depth++;
            }
            if (char === ")") {
                depth--;
            }

            if ((char === " " || char === "\t") && depth === 0) {
                if (current.trim()) {
                    rowsParts.push(current.trim());
                }
                current = "";
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            rowsParts.push(current.trim());
        }

        const rows = rowsParts.length || 1;

        parts.push(`Grid (${columns}×${rows})`);
    }

    if (values.items.length > 0) {
        const responsiveItems = values.items.filter(item => item.enableResponsive).length;
        if (responsiveItems > 0) {
            parts.push(`${values.items.length} items (${responsiveItems} responsive)`);
        } else {
            parts.push(`${values.items.length} items`);
        }
    }

    if (containerValues.enableBreakpoints) {
        const breakpointCount = BREAKPOINT_SIZES.filter(size => {
            const key = `${size}Enabled` as keyof ResponsiveContainerPreview;
            return containerValues[key];
        }).length;

        if (breakpointCount > 0) {
            parts.push(`${breakpointCount} breakpoints`);
        }
    }

    return parts.join(" - ");
};

/**
 * Preview CSS for the widget configuration panel
 *
 * @returns CSS string for configuration preview
 */
export function getPreviewCss(): string {
    return `
        /* Widget configuration preview styles */
        .widget-css-grid-preview {
            display: flex;
            flex-direction: column;
            padding: 12px;
            background: linear-gradient(to bottom, #f8f9fa, #ffffff);
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .widget-css-grid-preview-header {
            font-weight: 600;
            font-size: 13px;
            margin-bottom: 6px;
            color: #1f2937;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .widget-css-grid-preview-header::before {
            content: "";
            display: inline-block;
            width: 4px;
            height: 4px;
            background-color: #3b82f6;
            border-radius: 50%;
        }
        
        .widget-css-grid-preview-info {
            font-size: 11px;
            color: #6b7280;
            line-height: 1.4;
        }
        
        .widget-css-grid-preview-grid {
            margin-top: 10px;
            padding: 10px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .widget-css-grid-preview-grid-visual {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(2, 20px);
            gap: 4px;
            margin-bottom: 8px;
        }
        
        .widget-css-grid-preview-grid-cell {
            background-color: #eff6ff;
            border: 1px solid #3b82f6;
            border-radius: 2px;
        }
        
        .widget-css-grid-preview-stats {
            display: flex;
            gap: 12px;
            font-size: 10px;
            color: #6b7280;
        }
        
        .widget-css-grid-preview-stat {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .widget-css-grid-preview-stat strong {
            color: #374151;
            font-weight: 600;
        }
        
        /* Animation for configuration changes */
        @keyframes configUpdate {
            0% { opacity: 0.5; transform: scale(0.98); }
            100% { opacity: 1; transform: scale(1); }
        }
        
        .widget-css-grid-preview[data-updated="true"] {
            animation: configUpdate 0.3s ease-out;
        }
        
        /* Responsive preview adjustments */
        @media (max-width: 400px) {
            .widget-css-grid-preview {
                padding: 8px;
            }
            
            .widget-css-grid-preview-stats {
                flex-direction: column;
                gap: 4px;
            }
        }
        
        /* High contrast mode */
        @media (prefers-contrast: high) {
            .widget-css-grid-preview {
                border-width: 2px;
            }
            
            .widget-css-grid-preview-grid {
                border-width: 2px;
            }
        }
    `;
}
