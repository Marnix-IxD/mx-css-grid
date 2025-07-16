import { createElement, CSSProperties, useRef, useEffect, useState, useMemo, useCallback } from "react";
import {
    CSSGridPreviewProps,
    AutoFlowEnum,
    JustifyItemsEnum,
    AlignItemsEnum,
    JustifyContentEnum,
    AlignContentEnum,
    JustifySelfEnum,
    AlignSelfEnum
} from "../typings/CSSGridProps";
import {
    RuntimeGridItemPreview,
    RuntimeGridContainerPreview,
    GridItemPlacement,
    GridMetrics
} from "./types/ConditionalTypes";
import { parseGridTemplate, parseGridAreas } from "./utils/gridHelpers";
import { BREAKPOINT_CONFIGS, getActiveBreakpointWithHysteresis, BreakpointSize } from "./types/BreakpointTypes";
import {
    validateRuntimeGridContainerPreview,
    validateRuntimeGridItemPreview,
    getSafeEnumValue,
    isAutoFlowEnum,
    isJustifyItemsEnum,
    isAlignItemsEnum,
    isJustifyContentEnum,
    isAlignContentEnum,
    isRenderAsEnum,
    setTypeSafeStyle,
    isValidCSSProperty
} from "./utils/typeValidation";

// Import split components
import { ResponsiveIndicator } from "./components/preview/ResponsiveIndicator";
import { DebugOverlay } from "./components/preview/DebugOverlay";
import { GridAreaOverlay } from "./components/preview/GridAreaOverlay";
import { GridItemRenderer } from "./components/preview/GridItemRenderer";
import { generateAreaColors } from "./components/preview/areaColorGenerator";
import {
    DEFAULT_CONTAINER_WIDTH,
    DEFAULT_BREAKPOINT,
    EMPTY_ITEM_MIN_HEIGHT,
    Z_INDEX,
    MEASUREMENT_DELAY,
    RESIZE_DEBOUNCE_DELAY,
    CSS_VALUES,
    CHAR_CODES
} from "./utils/constants";
import { normalizeValue } from "./utils/stringHelpers";
import { getSafeCSSValue } from "./utils/cssEnumMappings";
import {
    forEachEnabledBreakpoint,
    getItemResponsivePropertyKeys,
    getBreakpointsToProcess,
    ResponsiveMode
} from "./utils/breakpointHelpers";

// Constants are imported from utils/constants.ts

/**
 * CSS Grid Editor Preview Component - Production Grade with Responsiveness
 *
 * Provides a visual preview of the CSS Grid configuration in the Mendix Studio Pro
 * Responds to container width changes to show accurate responsive behavior
 * Uses inline styles for compatibility with Mendix Studio Pro's Jint rendering
 */
export const preview: React.FC<CSSGridPreviewProps> = props => {
    // Validate and cast to runtime type to handle conditional properties
    const runtimeProps = validateRuntimeGridContainerPreview(props);

    const {
        gridTemplateColumns,
        gridTemplateRows,
        gap,
        rowGap,
        columnGap,
        useNamedAreas,
        gridTemplateAreas,
        items,
        autoFlow = "row",
        autoColumns = "auto",
        autoRows = "auto",
        justifyItems = "stretch",
        alignItems = "stretch",
        justifyContent = "start",
        alignContent = "stretch",
        minHeight,
        maxHeight,
        minWidth,
        maxWidth,
        enableBreakpoints,
        responsiveMode,
        showGridLines = false,
        showGridAreas = false,
        showGridGaps = false,
        class: className = "",
        style: customStyle = ""
    } = runtimeProps;

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const measurementRAFRef = useRef<number | null>(null);
    const nestedRAFRef = useRef<number | null>(null);

    // State for grid measurements and responsive behavior
    const [gridMetrics, setGridMetrics] = useState<GridMetrics | null>(null);
    const [containerWidth, setContainerWidth] = useState<number>(DEFAULT_CONTAINER_WIDTH);
    const [activeBreakpointSize, setActiveBreakpointSize] = useState<string>(DEFAULT_BREAKPOINT);
    const measurementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // normalizeValue function is now imported from utils/stringHelpers

    /**
     * Sanitize CSS value to prevent injection attacks
     * Removes dangerous CSS functions and properties
     *
     * @param value - CSS value to sanitize
     * @returns Sanitized CSS value
     */
    const sanitizeCSSValue = useCallback((value: string): string => {
        if (!value) {
            return value;
        }

        // Remove dangerous CSS functions and properties
        // Check for javascript:, expression(), @import, url(javascript:), url(data:)
        const dangerousPatterns = [
            "javascript:",
            "expression(",
            "@import",
            "url(javascript:",
            "url(data:",
            "vbscript:",
            "mocha:",
            "livescript:",
            "behavior:",
            "binding:",
            "-moz-binding",
            "-webkit-binding"
        ];

        let sanitizedValue = value;

        // Convert to lowercase for pattern matching
        const lowerValue = value.toLowerCase();

        for (const pattern of dangerousPatterns) {
            if (lowerValue.includes(pattern)) {
                // Replace the dangerous pattern with empty string
                const startIndex = lowerValue.indexOf(pattern);
                sanitizedValue =
                    sanitizedValue.substring(0, startIndex) + sanitizedValue.substring(startIndex + pattern.length);
            }
        }

        return sanitizedValue;
    }, []);

    /**
     * Parse custom style string into React CSSProperties
     * Converts CSS string format to React's camelCase object format
     * Modified to avoid regex for Mendix Studio Pro compatibility
     * Now includes CSS sanitization to prevent injection attacks
     *
     * @param styleStr - CSS style string
     * @returns CSSProperties object
     */
    const parseInlineStyles = useCallback(
        (styleStr: string): CSSProperties => {
            const styles: CSSProperties = {};
            if (!styleStr) {
                return styles;
            }

            // Simple string parsing without regex
            let currentProp = "";
            let currentValue = "";
            let inValue = false;

            for (let i = 0; i < styleStr.length; i++) {
                const char = styleStr[i];

                if (char === ":" && !inValue) {
                    inValue = true;
                } else if (char === ";" || i === styleStr.length - 1) {
                    if (i === styleStr.length - 1 && char !== ";") {
                        currentValue += char;
                    }

                    const prop = currentProp.trim();
                    const value = currentValue.trim();

                    if (prop && value) {
                        // Sanitize the CSS value before processing
                        const sanitizedValue = sanitizeCSSValue(value);

                        // Skip empty values after sanitization
                        if (!sanitizedValue) {
                            currentProp = "";
                            currentValue = "";
                            inValue = false;
                            continue;
                        }

                        // Convert kebab-case to camelCase manually
                        let camelCaseProperty = "";
                        let nextUpper = false;

                        for (let j = 0; j < prop.length; j++) {
                            if (prop[j] === "-") {
                                nextUpper = true;
                            } else {
                                camelCaseProperty += nextUpper ? prop[j].toUpperCase() : prop[j];
                                nextUpper = false;
                            }
                        }

                        // Use type-safe style setter with validation
                        if (isValidCSSProperty(camelCaseProperty)) {
                            setTypeSafeStyle(styles, camelCaseProperty, sanitizedValue);
                        }
                    }

                    currentProp = "";
                    currentValue = "";
                    inValue = false;
                } else if (inValue) {
                    currentValue += char;
                } else {
                    currentProp += char;
                }
            }

            return styles;
        },
        [sanitizeCSSValue]
    );

    // CSS enum mappings are now imported from utils/cssEnumMappings

    /**
     * Memoized parseGridAreas to avoid repeated parsing
     */
    const memoizedParseGridAreas = useMemo(() => {
        const cache = new Map<string, string[][] | null>();
        return (areas: string): string[][] | null => {
            if (cache.has(areas)) {
                return cache.get(areas)!;
            }
            const result = parseGridAreas(areas);
            cache.set(areas, result);
            return result;
        };
    }, []);

    /**
     * Get all defined areas across all configurations
     * Collects area names from base config and all enabled breakpoints
     *
     * @returns Set of all unique area names
     */
    const getAllDefinedAreas = useCallback((): Set<string> => {
        const allAreas = new Set<string>();

        // Add base areas
        if (useNamedAreas && gridTemplateAreas) {
            const parsed = memoizedParseGridAreas(gridTemplateAreas);
            if (parsed) {
                parsed.flat().forEach(area => {
                    if (area !== ".") {
                        allAreas.add(area);
                    }
                });
            }
        }

        // Add areas from enabled breakpoints
        if (enableBreakpoints) {
            forEachEnabledBreakpoint(runtimeProps, (_config, getProperty) => {
                const areas = getProperty("Areas") as string;
                if (areas) {
                    const parsed = memoizedParseGridAreas(areas);
                    if (parsed) {
                        parsed.flat().forEach(area => {
                            if (area !== ".") {
                                allAreas.add(area);
                            }
                        });
                    }
                }
            });
        }

        return allAreas;
    }, [useNamedAreas, gridTemplateAreas, enableBreakpoints, runtimeProps, memoizedParseGridAreas]);

    /**
     * Performance-optimized active breakpoint values using cascade-ready architecture
     * Determines which configuration values should be used based on container width
     * Currently uses exact mode, ready for future cascade mode implementation
     *
     * @returns Object containing all active grid configuration values
     */
    const getActiveBreakpointValues = useCallback(() => {
        // Define the return type interface
        interface ActiveBreakpointValues {
            columns: string;
            rows: string;
            areas: string | undefined;
            gap: string | undefined;
            rowGap: string | undefined;
            columnGap: string | undefined;
            autoFlow: AutoFlowEnum;
            autoRows: string;
            autoColumns: string;
            justifyItems: JustifyItemsEnum;
            alignItems: AlignItemsEnum;
            justifyContent: JustifyContentEnum;
            alignContent: AlignContentEnum;
            minHeight: string | undefined;
            maxHeight: string | undefined;
            minWidth: string | undefined;
            maxWidth: string | undefined;
        }

        // Start with base values
        const activeValues: ActiveBreakpointValues = {
            columns: normalizeValue(gridTemplateColumns) || "1fr",
            rows: normalizeValue(gridTemplateRows) || "auto",
            areas: useNamedAreas ? normalizeValue(gridTemplateAreas) : undefined,
            gap: normalizeValue(gap),
            rowGap: normalizeValue(rowGap),
            columnGap: normalizeValue(columnGap),
            autoFlow: autoFlow || "row",
            autoRows: normalizeValue(autoRows) || "auto",
            autoColumns: normalizeValue(autoColumns) || "auto",
            justifyItems: justifyItems || "stretch",
            alignItems: alignItems || "stretch",
            justifyContent: justifyContent || "start",
            alignContent: alignContent || "stretch",
            minHeight: normalizeValue(minHeight),
            maxHeight: normalizeValue(maxHeight),
            minWidth: normalizeValue(minWidth),
            maxWidth: normalizeValue(maxWidth)
        };

        if (!enableBreakpoints) {
            return activeValues;
        }

        // Use shared helper to get breakpoints to process (exact mode: only 1 active breakpoint)
        const mode: ResponsiveMode = responsiveMode === "cascade" ? "cascade" : "exact";
        const breakpointsToProcess = getBreakpointsToProcess(mode, containerWidth, runtimeProps);

        // Apply the active breakpoint's overrides
        breakpointsToProcess.forEach(activeBreakpointConfig => {
            const getBreakpointValue = (prop: string): string | undefined => {
                const key = `${activeBreakpointConfig.size}${prop}` as keyof RuntimeGridContainerPreview;
                return normalizeValue(runtimeProps[key] as string | undefined);
            };

            // Override with breakpoint-specific values if they exist
            const bpColumns = getBreakpointValue("Columns");
            const bpRows = getBreakpointValue("Rows");
            const bpGap = getBreakpointValue("Gap");
            const bpRowGap = getBreakpointValue("RowGap");
            const bpColumnGap = getBreakpointValue("ColumnGap");
            const bpAutoFlow = getSafeEnumValue(
                runtimeProps,
                `${activeBreakpointConfig.size}AutoFlow` as keyof RuntimeGridContainerPreview,
                isAutoFlowEnum,
                undefined
            );
            const bpAutoRows = getBreakpointValue("AutoRows");
            const bpAutoColumns = getBreakpointValue("AutoColumns");
            const bpJustifyItems = getSafeEnumValue(
                runtimeProps,
                `${activeBreakpointConfig.size}JustifyItems` as keyof RuntimeGridContainerPreview,
                isJustifyItemsEnum,
                undefined
            );
            const bpAlignItems = getSafeEnumValue(
                runtimeProps,
                `${activeBreakpointConfig.size}AlignItems` as keyof RuntimeGridContainerPreview,
                isAlignItemsEnum,
                undefined
            );
            const bpJustifyContent = getSafeEnumValue(
                runtimeProps,
                `${activeBreakpointConfig.size}JustifyContent` as keyof RuntimeGridContainerPreview,
                isJustifyContentEnum,
                undefined
            );
            const bpAlignContent = getSafeEnumValue(
                runtimeProps,
                `${activeBreakpointConfig.size}AlignContent` as keyof RuntimeGridContainerPreview,
                isAlignContentEnum,
                undefined
            );
            const bpMinHeight = getBreakpointValue("MinHeight");
            const bpMaxHeight = getBreakpointValue("MaxHeight");
            const bpMinWidth = getBreakpointValue("MinWidth");
            const bpMaxWidth = getBreakpointValue("MaxWidth");

            if (bpColumns) {
                activeValues.columns = bpColumns;
            }
            if (bpRows) {
                activeValues.rows = bpRows;
            }
            if (bpGap) {
                activeValues.gap = bpGap;
                activeValues.rowGap = undefined;
                activeValues.columnGap = undefined;
            } else {
                if (bpRowGap) {
                    activeValues.rowGap = bpRowGap;
                }
                if (bpColumnGap) {
                    activeValues.columnGap = bpColumnGap;
                }
            }
            if (bpAutoFlow) {
                activeValues.autoFlow = bpAutoFlow;
            }
            if (bpAutoRows) {
                activeValues.autoRows = bpAutoRows;
            }
            if (bpAutoColumns) {
                activeValues.autoColumns = bpAutoColumns;
            }
            if (bpJustifyItems) {
                activeValues.justifyItems = bpJustifyItems;
            }
            if (bpAlignItems) {
                activeValues.alignItems = bpAlignItems;
            }
            if (bpJustifyContent) {
                activeValues.justifyContent = bpJustifyContent;
            }
            if (bpAlignContent) {
                activeValues.alignContent = bpAlignContent;
            }
            if (bpMinHeight) {
                activeValues.minHeight = bpMinHeight;
            }
            if (bpMaxHeight) {
                activeValues.maxHeight = bpMaxHeight;
            }
            if (bpMinWidth) {
                activeValues.minWidth = bpMinWidth;
            }
            if (bpMaxWidth) {
                activeValues.maxWidth = bpMaxWidth;
            }

            if (useNamedAreas) {
                const bpAreas = getBreakpointValue("Areas");
                if (bpAreas) {
                    activeValues.areas = bpAreas;
                }
            }
        });

        return activeValues;
    }, [
        enableBreakpoints,
        containerWidth,
        gridTemplateColumns,
        gridTemplateRows,
        gridTemplateAreas,
        gap,
        rowGap,
        columnGap,
        useNamedAreas,
        autoFlow,
        autoRows,
        autoColumns,
        justifyItems,
        alignItems,
        justifyContent,
        alignContent,
        minHeight,
        maxHeight,
        minWidth,
        maxWidth,
        runtimeProps,
        normalizeValue
    ]);

    /**
     * Memoize active breakpoint values to avoid recalculation
     */
    const activeBreakpointValues = useMemo(() => {
        return getActiveBreakpointValues();
    }, [getActiveBreakpointValues]);

    /**
     * Build container styles
     * Applies the active configuration values directly as CSS properties
     */
    const containerStyles = useMemo<CSSProperties>(() => {
        // Use memoized active values
        const activeValues = activeBreakpointValues;

        // Apply the active values directly as CSS properties
        const styles: CSSProperties = {
            display: "grid",
            gridTemplateColumns: activeValues.columns,
            gridTemplateRows: activeValues.rows,
            gridAutoFlow: getSafeCSSValue("autoFlow", activeValues.autoFlow, "row"),
            gridAutoColumns: activeValues.autoColumns,
            gridAutoRows: activeValues.autoRows,
            justifyItems: activeValues.justifyItems,
            alignItems: activeValues.alignItems,
            justifyContent: getSafeCSSValue("justifyContent", activeValues.justifyContent, "start"),
            alignContent: getSafeCSSValue("alignContent", activeValues.alignContent, "stretch"),
            minHeight: activeValues.minHeight,
            maxHeight: activeValues.maxHeight,
            minWidth: activeValues.minWidth,
            maxWidth: activeValues.maxWidth,
            width: CSS_VALUES.FULL_WIDTH,
            boxSizing: "border-box",
            position: "relative",
            ...parseInlineStyles(customStyle)
        };

        // Handle gap properties
        if (activeValues.gap) {
            styles.gap = activeValues.gap;
        } else if (activeValues.rowGap || activeValues.columnGap) {
            styles.rowGap = activeValues.rowGap || "0";
            styles.columnGap = activeValues.columnGap || "0";
        }

        // Add named areas if enabled
        if (useNamedAreas && activeValues.areas) {
            styles.gridTemplateAreas = activeValues.areas;
        }

        // Center the grid if max-width is set
        if (styles.maxWidth) {
            styles.marginLeft = "auto";
            styles.marginRight = "auto";
        }

        return styles;
    }, [activeBreakpointValues, useNamedAreas, customStyle, parseInlineStyles]);

    /**
     * Update container width and active breakpoint
     * Tracks the container size to determine responsive behavior
     */
    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const updateContainerWidth = () => {
            if (containerRef.current) {
                // Use getBoundingClientRect for more precise measurement
                const rect = containerRef.current.getBoundingClientRect();
                const width = Math.round(rect.width); // Round to avoid sub-pixel issues

                // Use hysteresis to prevent rapid breakpoint switching
                const newBreakpoint = getActiveBreakpointWithHysteresis(width, activeBreakpointSize as BreakpointSize);

                setContainerWidth(width);
                setActiveBreakpointSize(newBreakpoint);
            }
        };

        // Debounced resize handler
        const handleResize = () => {
            // Clear any pending resize timeout
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }

            // Debounce resize events to prevent rapid updates
            resizeTimeoutRef.current = setTimeout(() => {
                updateContainerWidth();
            }, MEASUREMENT_DELAY);
        };

        // Use ResizeObserver to track container size changes
        const resizeObserver = new ResizeObserver(handleResize);

        resizeObserver.observe(containerRef.current);
        updateContainerWidth(); // Initial measurement

        return () => {
            resizeObserver.disconnect();
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
        };
    }, []);

    /**
     * Get active placement for responsive items in preview
     * Determines which placement configuration to use based on current breakpoint
     *
     * @param item - The grid item to get placement for
     * @returns Active placement configuration
     */
    const getActiveItemPlacementForPreview = useCallback(
        (item: RuntimeGridItemPreview): GridItemPlacement => {
            if (!item.enableResponsive || !enableBreakpoints) {
                return {
                    placementType: item.placementType,
                    gridArea: normalizeValue(item.gridArea),
                    columnStart: normalizeValue(item.columnStart),
                    columnEnd: normalizeValue(item.columnEnd),
                    rowStart: normalizeValue(item.rowStart),
                    rowEnd: normalizeValue(item.rowEnd)
                };
            }

            // Start with base placement
            const activePlacement: GridItemPlacement = {
                placementType: item.placementType,
                gridArea: normalizeValue(item.gridArea),
                columnStart: normalizeValue(item.columnStart),
                columnEnd: normalizeValue(item.columnEnd),
                rowStart: normalizeValue(item.rowStart),
                rowEnd: normalizeValue(item.rowEnd)
            };

            // Use shared helper to get breakpoints to process (exact mode: only 1 active breakpoint)
            const mode: ResponsiveMode = responsiveMode === "cascade" ? "cascade" : "exact";
            const breakpointsToProcess = getBreakpointsToProcess(mode, containerWidth, runtimeProps);

            // Apply the active breakpoint's overrides if item has it enabled
            breakpointsToProcess.forEach(activeBreakpointConfig => {
                const keys = getItemResponsivePropertyKeys(activeBreakpointConfig.size);
                const isEnabled = item[keys.enabled as keyof RuntimeGridItemPreview];

                if (isEnabled) {
                    const getBreakpointValue = (prop: string): string | undefined => {
                        const key = `${activeBreakpointConfig.size}${prop}` as keyof RuntimeGridItemPreview;
                        return normalizeValue(item[key] as string | undefined);
                    };

                    const placementType = item[keys.placementType as keyof RuntimeGridItemPreview] as string;

                    if (placementType) {
                        activePlacement.placementType = placementType;
                    }

                    const gridArea = getBreakpointValue("GridArea");
                    const colStart = getBreakpointValue("ColumnStart");
                    const colEnd = getBreakpointValue("ColumnEnd");
                    const rowStart = getBreakpointValue("RowStart");
                    const rowEnd = getBreakpointValue("RowEnd");

                    if (gridArea) {
                        activePlacement.gridArea = gridArea;
                    }
                    if (colStart) {
                        activePlacement.columnStart = colStart;
                    }
                    if (colEnd) {
                        activePlacement.columnEnd = colEnd;
                    }
                    if (rowStart) {
                        activePlacement.rowStart = rowStart;
                    }
                    if (rowEnd) {
                        activePlacement.rowEnd = rowEnd;
                    }
                }
            });

            return activePlacement;
        },
        [containerWidth, enableBreakpoints, normalizeValue, runtimeProps]
    );

    /**
     * Check if item is hidden at current breakpoint
     * Determines if the item should be shown as hidden in the preview
     *
     * @param item - The grid item to check
     * @returns True if item is hidden at current breakpoint
     */
    const isItemHiddenAtCurrentBreakpoint = useCallback(
        (item: RuntimeGridItemPreview): boolean => {
            if (!item.enableResponsive || !enableBreakpoints) {
                return false;
            }

            // Use shared helper to get breakpoints to process (exact mode: only 1 active breakpoint)
            const mode: ResponsiveMode = responsiveMode === "cascade" ? "cascade" : "exact";
            const breakpointsToProcess = getBreakpointsToProcess(mode, containerWidth, runtimeProps);

            // Check if item is hidden at the active breakpoint
            for (const activeBreakpointConfig of breakpointsToProcess) {
                const hiddenKey = `${activeBreakpointConfig.size}Hidden` as keyof RuntimeGridItemPreview;
                if (item[hiddenKey]) {
                    return true;
                }
            }

            return false;
        },
        [containerWidth, enableBreakpoints, runtimeProps]
    );

    /**
     * Get active alignment for responsive items in preview
     * Determines which alignment configuration to use based on current breakpoint
     *
     * @param item - The grid item to get alignment for
     * @returns Active alignment configuration
     */
    const getActiveItemAlignmentForPreview = useCallback(
        (item: RuntimeGridItemPreview): { justifySelf: JustifySelfEnum; alignSelf: AlignSelfEnum; zIndex: string } => {
            if (!item.enableResponsive || !enableBreakpoints) {
                return {
                    justifySelf: (item.justifySelf || "auto") as JustifySelfEnum,
                    alignSelf: (item.alignSelf || "auto") as AlignSelfEnum,
                    zIndex: item.zIndex || ""
                };
            }

            // Start with base alignment
            const activeAlignment = {
                justifySelf: (item.justifySelf || "auto") as JustifySelfEnum,
                alignSelf: (item.alignSelf || "auto") as AlignSelfEnum,
                zIndex: item.zIndex || ""
            };

            // Use shared helper to get breakpoints to process (exact mode: only 1 active breakpoint)
            const mode: ResponsiveMode = responsiveMode === "cascade" ? "cascade" : "exact";
            const breakpointsToProcess = getBreakpointsToProcess(mode, containerWidth, runtimeProps);

            // Apply the active breakpoint's overrides if item has it enabled
            breakpointsToProcess.forEach(activeBreakpointConfig => {
                const keys = getItemResponsivePropertyKeys(activeBreakpointConfig.size);
                const isEnabled = item[keys.enabled as keyof RuntimeGridItemPreview];

                if (isEnabled) {
                    const justifySelf = item[keys.justifySelf as keyof RuntimeGridItemPreview] as JustifySelfEnum;
                    const alignSelf = item[keys.alignSelf as keyof RuntimeGridItemPreview] as AlignSelfEnum;
                    const zIndex = item[keys.zIndex as keyof RuntimeGridItemPreview] as string;

                    if (justifySelf) {
                        activeAlignment.justifySelf = justifySelf;
                    }
                    if (alignSelf) {
                        activeAlignment.alignSelf = alignSelf;
                    }
                    if (zIndex) {
                        activeAlignment.zIndex = zIndex;
                    }
                }
            });

            return activeAlignment;
        },
        [containerWidth, enableBreakpoints, runtimeProps]
    );

    /**
     * Parse grid dimensions for the current configuration
     * Extracts information about columns, rows, and areas
     */
    const gridDimensions = useMemo(() => {
        // Use memoized active values
        const activeValues = activeBreakpointValues;

        const columns = parseGridTemplate(activeValues.columns);
        const rows = parseGridTemplate(activeValues.rows);
        const areas = activeValues.areas ? memoizedParseGridAreas(activeValues.areas) : null;
        const uniqueAreas = areas ? Array.from(new Set(areas.flat().filter(area => area !== "."))) : [];

        return {
            columnCount: columns.length,
            rowCount: rows.length,
            parsedAreas: areas,
            uniqueAreas,
            areaColorMap: generateAreaColors(uniqueAreas)
        };
    }, [activeBreakpointValues, memoizedParseGridAreas]);

    /**
     * Measure grid tracks and gaps after DOM updates
     * Calculates the actual positions and sizes of grid lines
     * Modified to avoid split() for Mendix Studio Pro compatibility
     */
    const measureGrid = useCallback(() => {
        if (!gridRef.current || !containerRef.current) {
            return;
        }

        // Cancel any pending RAF calls
        if (measurementRAFRef.current) {
            cancelAnimationFrame(measurementRAFRef.current);
            measurementRAFRef.current = null;
        }
        if (nestedRAFRef.current) {
            cancelAnimationFrame(nestedRAFRef.current);
            nestedRAFRef.current = null;
        }

        const gridEl = gridRef.current;
        void gridEl.offsetHeight; // Force reflow

        measurementRAFRef.current = requestAnimationFrame(() => {
            if (!gridRef.current || !containerRef.current) {
                return;
            }

            try {
                const computedStyle = window.getComputedStyle(gridEl);
                const containerBox = containerRef.current.getBoundingClientRect();
                const gridBox = gridEl.getBoundingClientRect();

                const computedColumnGap = parseFloat(computedStyle.columnGap) || 0;
                const computedRowGap = parseFloat(computedStyle.rowGap) || 0;

                // Parse grid template columns - the computed style returns sizes in pixels
                const columnsStr = computedStyle.gridTemplateColumns;
                const columnTracks: number[] = [];
                let currentNumber = "";
                let inUnit = false;

                for (let i = 0; i < columnsStr.length; i++) {
                    const char = columnsStr[i];
                    if (
                        (char >= String.fromCharCode(CHAR_CODES.DIGIT_0) &&
                            char <= String.fromCharCode(CHAR_CODES.DIGIT_9)) ||
                        char === "."
                    ) {
                        currentNumber += char;
                        inUnit = false;
                    } else if (char === "p" && i + 1 < columnsStr.length && columnsStr[i + 1] === "x") {
                        // Found 'px' unit
                        if (currentNumber) {
                            const num = parseFloat(currentNumber);
                            if (!isNaN(num)) {
                                columnTracks.push(num);
                            }
                            currentNumber = "";
                        }
                        i++; // Skip the 'x'
                        inUnit = true;
                    } else if (char === " " || char === "\t") {
                        // Space between values
                        if (currentNumber && !inUnit) {
                            const num = parseFloat(currentNumber);
                            if (!isNaN(num)) {
                                columnTracks.push(num);
                            }
                            currentNumber = "";
                        }
                        inUnit = false;
                    }
                }
                // Handle last number if any
                if (currentNumber && !inUnit) {
                    const num = parseFloat(currentNumber);
                    if (!isNaN(num)) {
                        columnTracks.push(num);
                    }
                }

                // Parse grid template rows
                const rowsStr = computedStyle.gridTemplateRows;
                const rowTracks: number[] = [];
                currentNumber = "";
                inUnit = false;

                for (let i = 0; i < rowsStr.length; i++) {
                    const char = rowsStr[i];
                    if (
                        (char >= String.fromCharCode(CHAR_CODES.DIGIT_0) &&
                            char <= String.fromCharCode(CHAR_CODES.DIGIT_9)) ||
                        char === "."
                    ) {
                        currentNumber += char;
                        inUnit = false;
                    } else if (char === "p" && i + 1 < rowsStr.length && rowsStr[i + 1] === "x") {
                        // Found 'px' unit
                        if (currentNumber) {
                            const num = parseFloat(currentNumber);
                            if (!isNaN(num)) {
                                rowTracks.push(num);
                            }
                            currentNumber = "";
                        }
                        i++; // Skip the 'x'
                        inUnit = true;
                    } else if (char === " " || char === "\t") {
                        // Space between values
                        if (currentNumber && !inUnit) {
                            const num = parseFloat(currentNumber);
                            if (!isNaN(num)) {
                                rowTracks.push(num);
                            }
                            currentNumber = "";
                        }
                        inUnit = false;
                    }
                }
                // Handle last number if any
                if (currentNumber && !inUnit) {
                    const num = parseFloat(currentNumber);
                    if (!isNaN(num)) {
                        rowTracks.push(num);
                    }
                }

                // Build positions from tracks
                const columnPositions = [0];
                let currentX = 0;
                for (let i = 0; i < columnTracks.length; i++) {
                    if (i > 0) {
                        currentX += computedColumnGap;
                    }
                    currentX += columnTracks[i];
                    columnPositions.push(currentX);
                }

                const rowPositions = [0];
                let currentY = 0;
                for (let i = 0; i < rowTracks.length; i++) {
                    if (i > 0) {
                        currentY += computedRowGap;
                    }
                    currentY += rowTracks[i];
                    rowPositions.push(currentY);
                }

                setGridMetrics({
                    tracks: {
                        columns: columnPositions,
                        rows: rowPositions
                    },
                    gaps: {
                        column: computedColumnGap,
                        row: computedRowGap
                    },
                    containerBox,
                    gridBox
                });
            } catch (error) {
                console.warn("[CSSGrid Preview] Error measuring grid:", error);
                // Set default metrics on error
                setGridMetrics(null);
            }

            // Clear RAF references after completion
            measurementRAFRef.current = null;
            nestedRAFRef.current = null;
        });
    }, []);

    // Setup ResizeObserver for grid measurements only
    useEffect(() => {
        if (!gridRef.current) {
            return;
        }

        // Debounced measurement handler for grid size changes only
        const handleGridMeasurement = () => {
            if (measurementTimeoutRef.current) {
                clearTimeout(measurementTimeoutRef.current);
            }

            measurementTimeoutRef.current = setTimeout(() => {
                measureGrid();
            }, MEASUREMENT_DELAY);
        };

        resizeObserverRef.current = new ResizeObserver(handleGridMeasurement);
        resizeObserverRef.current.observe(gridRef.current);

        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
                resizeObserverRef.current = null;
            }
            if (measurementTimeoutRef.current) {
                clearTimeout(measurementTimeoutRef.current);
            }

            // Cancel any pending RAF calls
            if (measurementRAFRef.current) {
                cancelAnimationFrame(measurementRAFRef.current);
                measurementRAFRef.current = null;
            }
            if (nestedRAFRef.current) {
                cancelAnimationFrame(nestedRAFRef.current);
                nestedRAFRef.current = null;
            }
        };
    }, []);

    // Re-measure when grid properties change (debounced)
    useEffect(() => {
        if (gridRef.current) {
            if (measurementTimeoutRef.current) {
                clearTimeout(measurementTimeoutRef.current);
            }

            measurementTimeoutRef.current = setTimeout(() => {
                measureGrid();
            }, RESIZE_DEBOUNCE_DELAY);
        }
    }, [containerStyles]);

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            // Cancel any pending RAF calls
            if (measurementRAFRef.current) {
                cancelAnimationFrame(measurementRAFRef.current);
                measurementRAFRef.current = null;
            }
            if (nestedRAFRef.current) {
                cancelAnimationFrame(nestedRAFRef.current);
                nestedRAFRef.current = null;
            }

            // Cleanup ResizeObserver
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
                resizeObserverRef.current = null;
            }

            // Clear state to prevent memory leaks
            setGridMetrics(null);
        };
    }, []);

    /**
     * Get active grid configuration for the current breakpoint
     * Used for area validation in preview
     */
    const getActiveGridConfig = useCallback(() => {
        // Use memoized active values
        const activeValues = activeBreakpointValues;

        return {
            areas: activeValues.areas
        };
    }, [activeBreakpointValues]);

    /**
     * Check if responsive is enabled
     * Determines if any breakpoints are configured
     */
    const hasResponsiveContainer = useMemo(() => {
        if (!enableBreakpoints) {
            return false;
        }
        return BREAKPOINT_CONFIGS.some(config => {
            const key = `${config.size}Enabled` as keyof RuntimeGridContainerPreview;
            return runtimeProps[key];
        });
    }, [enableBreakpoints, runtimeProps]);

    /**
     * Determine the semantic HTML element for an item
     */
    const getSemanticElement = useCallback((item: RuntimeGridItemPreview): string => {
        // renderAs is part of the base type but might be undefined due to MakeOptional
        const renderAs = item.renderAs;

        // Validate if it's a proper RenderAsEnum value
        if (renderAs && isRenderAsEnum(renderAs) && renderAs !== "auto" && renderAs !== "div") {
            return renderAs;
        }

        // Auto-detect based on area name or item name
        if (!renderAs || renderAs === "auto") {
            const areaName = (item.gridArea || item.itemName || "").toLowerCase().trim();

            // Map common area names to semantic elements
            const semanticMappings: Record<string, string> = {
                header: "header",
                nav: "nav",
                navigation: "nav",
                main: "main",
                content: "main",
                aside: "aside",
                sidebar: "aside",
                footer: "footer",
                article: "article",
                section: "section"
            };

            return semanticMappings[areaName] || "div";
        }

        return "div";
    }, []);

    /**
     * Render grid items
     * Renders each configured item with appropriate placement and styling
     */
    const renderGridItems = useCallback(() => {
        const allDefinedAreas = getAllDefinedAreas();
        const activeConfig = getActiveGridConfig();

        return items.map((item, index) => {
            const runtimeItem = validateRuntimeGridItemPreview(item);

            // Check if item is hidden at current breakpoint
            const isHidden = isItemHiddenAtCurrentBreakpoint(runtimeItem);

            // Get the active placement for this item at the current breakpoint
            const activePlacement = getActiveItemPlacementForPreview(runtimeItem);

            // Get the active alignment for this item at the current breakpoint
            const activeAlignment = getActiveItemAlignmentForPreview(runtimeItem);

            // Determine the effective placement type
            const effectivePlacementType =
                useNamedAreas && activePlacement.gridArea?.trim() ? "area" : activePlacement.placementType;

            // Validate area placement against current configuration
            let validatedPlacement = activePlacement;
            if (effectivePlacementType === "area" && activePlacement.gridArea) {
                const currentAreas = activeConfig.areas ? memoizedParseGridAreas(activeConfig.areas) : null;
                const currentAreaNames = currentAreas
                    ? new Set(currentAreas.flat().filter(a => a !== "."))
                    : new Set<string>();

                if (!currentAreaNames.has(activePlacement.gridArea) && !allDefinedAreas.has(activePlacement.gridArea)) {
                    // Area doesn't exist, fall back to auto
                    validatedPlacement = {
                        placementType: "auto",
                        gridArea: undefined,
                        columnStart: undefined,
                        columnEnd: undefined,
                        rowStart: undefined,
                        rowEnd: undefined
                    };
                }
            }

            const itemName =
                runtimeItem.itemName ||
                (effectivePlacementType === "area" && validatedPlacement.gridArea
                    ? validatedPlacement.gridArea
                    : `Item ${index + 1}`);

            const hasResponsive = runtimeItem.enableResponsive || false;
            const semanticElement = getSemanticElement(runtimeItem);

            // Use memoized active container values to check parent alignment when item is "auto"
            const activeValues = activeBreakpointValues;

            return (
                <GridItemRenderer
                    key={`grid_item_${index}`}
                    item={runtimeItem}
                    index={index}
                    useNamedAreas={useNamedAreas}
                    isHidden={isHidden}
                    activePlacement={validatedPlacement}
                    activeAlignment={activeAlignment}
                    effectivePlacementType={effectivePlacementType}
                    itemName={itemName}
                    hasResponsive={hasResponsive}
                    semanticElement={semanticElement}
                    activeJustifyItems={activeValues.justifyItems}
                    activeAlignItems={activeValues.alignItems}
                />
            );
        });
    }, [
        items,
        useNamedAreas,
        getAllDefinedAreas,
        getActiveGridConfig,
        getActiveItemPlacementForPreview,
        getActiveItemAlignmentForPreview,
        isItemHiddenAtCurrentBreakpoint,
        activeBreakpointValues,
        memoizedParseGridAreas,
        getSemanticElement
    ]);

    /**
     * Container class names
     * Builds the complete class list for the grid container
     */
    const containerClasses = useMemo(() => {
        const classes = ["css-grid-preview", "css-grid", `css-grid--${activeBreakpointSize}`, className];

        if (enableBreakpoints) {
            classes.push("css-grid--responsive");

            // Add enabled breakpoint classes using helper
            forEachEnabledBreakpoint(runtimeProps, config => {
                classes.push(`css-grid--has-${config.size}`);
            });
        }

        return classes.filter(Boolean).join(" ");
    }, [activeBreakpointSize, className, enableBreakpoints, runtimeProps]);

    return (
        <div
            ref={containerRef}
            className="css-grid-preview-wrapper"
            style={{
                position: "relative",
                width: CSS_VALUES.FULL_WIDTH
            }}
        >
            {/* Responsive indicator */}
            <ResponsiveIndicator
                hasResponsiveContainer={hasResponsiveContainer}
                showGridInfo={props.showGridInfo || false}
                enableBreakpoints={enableBreakpoints}
                containerWidth={containerWidth}
                containerHeight={containerRef.current?.offsetHeight || 0}
                runtimeProps={runtimeProps}
                items={items}
                isItemHiddenAtCurrentBreakpoint={isItemHiddenAtCurrentBreakpoint}
                responsiveMode={responsiveMode}
            />

            {/* Main grid container */}
            <div
                ref={gridRef}
                className={containerClasses}
                style={containerStyles}
                data-columns={gridDimensions.columnCount}
                data-rows={gridDimensions.rowCount}
                data-breakpoint={activeBreakpointSize}
            >
                {/* Grid areas overlay - rendered first so it's behind content */}
                <GridAreaOverlay
                    showGridAreas={showGridAreas}
                    useNamedAreas={useNamedAreas}
                    parsedAreas={gridDimensions.parsedAreas}
                    areaColorMap={gridDimensions.areaColorMap}
                />

                {/* Grid items */}
                {renderGridItems()}

                {/* Debug overlays - on top */}
                <DebugOverlay gridMetrics={gridMetrics} showGridLines={showGridLines} showGridGaps={showGridGaps} />
            </div>
        </div>
    );
};

/**
 * Get preview CSS styles
 * Provides all necessary styles for the editor preview
 */
export function getPreviewCss(): string {
    return `
        /* Base grid container styles for preview */
        .css-grid {
            box-sizing: border-box;
            width: ${CSS_VALUES.FULL_WIDTH};
            position: relative;
            contain: layout style;
        }
        
        /* Make grid preview container positioned for absolute children */
        .css-grid-preview {
            position: relative !important;
        }

        /* Grid item base styles */
        .css-grid__item {
            box-sizing: border-box;
            min-width: 0;
            min-height: 0;
            position: relative;
            contain: layout style;
        }

        /* Current breakpoint indicators */
        .css-grid--xs { --current-breakpoint: xs; }
        .css-grid--sm { --current-breakpoint: sm; }
        .css-grid--md { --current-breakpoint: md; }
        .css-grid--lg { --current-breakpoint: lg; }
        .css-grid--xl { --current-breakpoint: xl; }
        .css-grid--xxl { --current-breakpoint: xxl; }

        /* Focus styles */
        .css-grid:focus-visible {
            outline: 2px solid #0066cc;
            outline-offset: 2px;
            box-shadow: 0 0 0 4px rgba(0, 102, 204, 0.1);
        }

        /* Ensure proper sizing for Mendix widgets */
        .css-grid__item > .mx-widget,
        .css-grid__item > .mx-container,
        .css-grid__item > .mx-container-nested,
        .css-grid__item > .mx-layoutgrid,
        .css-grid__item > .mx-dataview,
        .css-grid__item > .mx-listview,
        .css-grid__item > .mx-scrollcontainer,
        .css-grid__item > .mx-groupbox {
            width: ${CSS_VALUES.FULL_WIDTH};
            height: ${CSS_VALUES.FULL_HEIGHT};
        }

        /* Text content handling */
        .css-grid__item > .mx-text,
        .css-grid__item > .mx-label {
            max-width: ${CSS_VALUES.FULL_WIDTH};
            overflow-wrap: break-word;
            word-wrap: break-word;
            hyphens: auto;
        }

        /* Remove all ::before and ::after pseudo elements */
        .css-grid-preview *::before,
        .css-grid-preview *::after {
            content: none !important;
            display: none !important;
        }

        /* Additional preview-specific styles */
        .css-grid-preview-wrapper {
            position: relative;
            width: ${CSS_VALUES.FULL_WIDTH};
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* Responsive indicator */
        .css-grid-preview-info {
            position: absolute;
            top: 4px;
            right: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: #666;
            background: rgba(255, 255, 255, ${CSS_VALUES.BACKGROUND_WHITE_OPACITY});
            padding: 2px 8px;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            z-index: ${Z_INDEX.RESPONSIVE_INDICATOR};
        }

        .css-grid-preview-info-icon {
            font-size: 12px;
        }

        .css-grid-preview-info-text {
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Debug SVG overlay */
        .css-grid-preview-debug-svg {
            pointer-events: none;
        }

        /* Grid area overlay */
        .css-grid-preview-area-overlay {
            transition: opacity 0.2s ease;
        }

        /* Area label container */
        .css-grid-preview-area-label-container {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: ${Z_INDEX.AREA_LABEL_MAX} !important;
            pointer-events: none !important;
        }

        /* Preview-specific grid item styles */
        .css-grid-preview-item {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .css-grid-preview-item:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        /* Content wrapper */
        .css-grid-preview-content {
            width: ${CSS_VALUES.FULL_WIDTH};
            height: ${CSS_VALUES.FULL_HEIGHT};
            position: relative;
            z-index: 2;
        }

        /* Empty item placeholder */
        .css-grid-preview-empty {
            width: ${CSS_VALUES.FULL_WIDTH};
            height: ${CSS_VALUES.FULL_HEIGHT};
            min-height: ${EMPTY_ITEM_MIN_HEIGHT}px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.02);
            border: 1px dashed rgba(0, 0, 0, 0.1);
            border-radius: 4px;
            transition: all 0.2s ease;
            position: relative;
            z-index: 2;
        }

        .css-grid-preview-empty-text {
            font-size: 11px;
            color: #999;
            font-weight: 500;
            user-select: none;
        }

        /* Hover state for empty items */
        .css-grid-preview-item:hover .css-grid-preview-empty {
            background: rgba(59, 130, 246, 0.05);
            border-color: rgba(59, 130, 246, 0.3);
        }

        .css-grid-preview-item:hover .css-grid-preview-empty-text {
            color: #3b82f6;
        }

        /* Auto-flow indicator */
        .css-grid-preview-item[data-placement-type="auto"] .css-grid-preview-empty {
            background: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(251, 191, 36, 0.02) 10px,
                rgba(251, 191, 36, 0.02) 20px
            );
        }

        /* Ensure Mendix Selectable doesn't interfere */
        .mx-selectable {
            display: contents !important;
        }

        /* Ensure Mendix widgets fill containers */
        .css-grid-preview-item .mx-widget,
        .css-grid-preview-item .mx-dataview,
        .css-grid-preview-item .mx-listview,
        .css-grid-preview-item .mx-container,
        .css-grid-preview-item .mx-container-nested,
        .css-grid-preview-item .mx-scrollcontainer,
        .css-grid-preview-item .mx-groupbox {
            width: ${CSS_VALUES.FULL_WIDTH};
            height: ${CSS_VALUES.FULL_HEIGHT};
        }

        /* Remove default margins */
        .css-grid-preview-item > * {
            margin: 0;
        }

        /* Text overflow handling */
        .css-grid-preview-item {
            word-wrap: break-word;
            overflow-wrap: break-word;
        }

        /* Z-index visual feedback */
        .css-grid-preview-item[style*="z-index"] {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        /* Structure mode compact view */
        .mx-name-CSSGrid.mx-compound-widget {
            min-height: 60px;
        }

        /* Smooth transitions */
        .css-grid-preview,
        .css-grid-preview-item,
        .css-grid-preview-area-overlay {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Responsive adjustments for small editor views */
        .css-grid-preview-wrapper {
            min-width: 320px;
        }
        
        /* Ensure info panel stays visible */
        @media (max-width: 480px) {
            .css-grid-preview-info {
                font-size: 10px;
                padding: 2px 6px;
            }
        }
    `;
}
