import { ReactElement, createElement, CSSProperties, useMemo, useRef, useEffect, useState, useCallback } from "react";
import { CSSGridContainerProps } from "../typings/CSSGridProps";
import { RuntimeGridItem, RuntimeGridContainer, GridItemPlacement } from "./types/ConditionalTypes";
import { getGridItemPlacement, parseGridAreas } from "./utils/gridHelpers";
import { BreakpointSize, getActiveBreakpoint, BREAKPOINT_CONFIGS } from "./types/BreakpointTypes";
import {
    validateRuntimeGridContainer,
    validateRuntimeGridItem,
    getSafeEnumValue,
    isAutoFlowEnum,
    isJustifyItemsEnum,
    isAlignItemsEnum,
    isJustifyContentEnum,
    isAlignContentEnum
} from "./utils/typeValidation";
import {
    DEFAULT_VIRTUALIZATION_THRESHOLD,
    VIRTUALIZATION_ROOT_MARGIN,
    VIRTUALIZATION_THRESHOLD_RATIO,
    VIRTUALIZATION_BUFFER_SIZE,
    RESIZE_DEBOUNCE_DELAY,
    INITIAL_RENDER_DELAY,
    LARGE_GRID_THRESHOLD,
    CHAR_CODES,
    LAYOUT
} from "./utils/constants";
import { normalizeValue } from "./utils/stringHelpers";
import { getSafeCSSValue } from "./utils/cssEnumMappings";
import {
    forEachEnabledBreakpoint,
    forEachEnabledItemBreakpoint,
    forEachBreakpoint,
    getBreakpointsToProcess,
    ResponsiveMode
} from "./utils/breakpointHelpers";
import "./ui/CSSGrid.css";

/**
 * CSS Grid Widget for Mendix - Semantic CSS Variable Implementation
 *
 * Key principles:
 * 1. Use semantic names for items (based on itemName or gridArea)
 * 2. Only create CSS variables for properties that differ from defaults
 * 3. Use simple overrides at breakpoints instead of complex fallbacks
 * 4. Keep all other functionality intact (virtualization, accessibility, etc.)
 *
 * @param props - Widget properties from Mendix
 * @returns React element representing the CSS Grid
 */
export function CSSGrid(props: CSSGridContainerProps): ReactElement {
    const {
        gridTemplateColumns,
        gridTemplateRows,
        gap,
        rowGap,
        columnGap,
        useNamedAreas,
        gridTemplateAreas,
        items,
        autoFlow,
        autoColumns,
        autoRows,
        justifyItems,
        alignItems,
        justifyContent,
        alignContent,
        enableBreakpoints,
        responsiveMode,
        minHeight,
        maxHeight,
        minWidth,
        maxWidth,
        enableVirtualization,
        virtualizeThreshold,
        class: className,
        style,
        ariaLabel,
        ariaLabelledBy,
        ariaDescribedBy,
        role
    } = props;

    // Validate and cast to runtime type to handle conditional properties
    const runtimeProps = validateRuntimeGridContainer(props);

    // Configuration constants are imported from utils/constants.ts

    // Refs for DOM access
    const containerRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const currentWidthRef = useRef<number>(window.innerWidth);

    // State management
    const [visibleItems, setVisibleItems] = useState<Set<number>>(() => new Set());
    const [currentWidth, setCurrentWidth] = useState<number>(window.innerWidth);
    const [activeBreakpointSize, setActiveBreakpointSize] = useState<BreakpointSize>("lg");
    const [isInitialized, setIsInitialized] = useState(false);

    // normalizeValue function is now imported from utils/stringHelpers

    // CSS enum mappings are now imported from utils/cssEnumMappings

    /**
     * Determine if virtualization should be enabled
     */
    const shouldVirtualize = useMemo(() => {
        return enableVirtualization && items.length >= (virtualizeThreshold || DEFAULT_VIRTUALIZATION_THRESHOLD);
    }, [enableVirtualization, items.length, virtualizeThreshold]);

    /**
     * Generate accessible label for grid items
     * Priority: itemName → gridArea → positional description
     */
    const getItemAccessibleLabel = useCallback(
        (item: RuntimeGridItem, index: number): string => {
            // Use itemName if provided (best semantic option)
            if (item.itemName && item.itemName.trim()) {
                return item.itemName.trim();
            }

            // Use gridArea for area-based placement
            if (item.placementType === "area" && item.gridArea && useNamedAreas) {
                return `Grid area: ${item.gridArea}`;
            }

            // Fallback to positional description
            const position = index + 1;
            const total = items.length;
            return `Grid item ${position} of ${total}`;
        },
        [items.length, useNamedAreas]
    );

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
            const parsed = parseGridAreas(gridTemplateAreas);
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
                    const parsed = parseGridAreas(areas);
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
    }, [useNamedAreas, gridTemplateAreas, enableBreakpoints, runtimeProps]);

    /**
     * Get placement information for debugging
     * Returns info about base and responsive placements
     */
    const getPlacementInfo = useCallback(
        (item: RuntimeGridItem): string => {
            const info: string[] = [item.placementType];

            if (item.enableResponsive && enableBreakpoints) {
                forEachEnabledItemBreakpoint(item, (config, getProperty) => {
                    const placementType = getProperty("PlacementType") as string;
                    if (placementType && placementType !== item.placementType) {
                        info.push(`${config.size}:${placementType}`);
                    }
                });
            }

            return info.join(",");
        },
        [enableBreakpoints]
    );

    /**
     * Validate CSS identifier to prevent injection attacks
     * Ensures the identifier only contains safe characters
     */
    const validateCSSIdentifier = useCallback((identifier: string): string => {
        if (!identifier) {
            return "";
        }

        // Remove any potentially dangerous characters
        // Only allow letters, numbers, hyphens, and underscores
        let sanitized = "";
        for (let i = 0; i < identifier.length; i++) {
            const char = identifier[i];
            const charCode = char.charCodeAt(0);
            const isLetter =
                (charCode >= CHAR_CODES.UPPERCASE_A && charCode <= CHAR_CODES.UPPERCASE_Z) ||
                (charCode >= CHAR_CODES.LOWERCASE_A && charCode <= CHAR_CODES.LOWERCASE_Z);
            const isNumber = charCode >= CHAR_CODES.DIGIT_0 && charCode <= CHAR_CODES.DIGIT_9;
            const isHyphen = charCode === CHAR_CODES.HYPHEN;
            const isUnderscore = charCode === CHAR_CODES.UNDERSCORE;

            if (isLetter || isNumber || isHyphen || isUnderscore) {
                sanitized += char;
            }
        }

        // Ensure it starts with a letter (CSS requirement)
        if (sanitized.length > 0) {
            const firstChar = sanitized.charCodeAt(0);
            const startsWithLetter =
                (firstChar >= CHAR_CODES.UPPERCASE_A && firstChar <= CHAR_CODES.UPPERCASE_Z) ||
                (firstChar >= CHAR_CODES.LOWERCASE_A && firstChar <= CHAR_CODES.LOWERCASE_Z);

            if (!startsWithLetter) {
                sanitized = "item-" + sanitized;
            }
        }

        return sanitized || "item";
    }, []);

    /**
     * Generate a semantic CSS variable name for an item
     * Prioritizes: itemName > gridArea > index with proper validation
     */
    const getItemVariableName = useCallback(
        (item: RuntimeGridItem, index: number): string => {
            if (item.itemName) {
                // Sanitize item name for CSS: lowercase, replace spaces with hyphens, validate
                const sanitizedName = validateCSSIdentifier(item.itemName.toLowerCase().replace(/\s+/g, "-"));
                return sanitizedName || `item-${index}`;
            }
            if (item.gridArea && useNamedAreas) {
                const sanitizedArea = validateCSSIdentifier(item.gridArea.toLowerCase());
                return sanitizedArea || `item-${index}`;
            }
            return `item-${index}`;
        },
        [useNamedAreas, validateCSSIdentifier]
    );

    /**
     * Build CSS custom properties for responsive values
     * Only includes variables that differ from defaults
     *
     * @returns Object containing CSS custom properties
     */
    /**
     * Performance-optimized CSS variable generation using cascade-ready architecture
     * Currently uses exact mode, ready for future cascade mode implementation
     */
    const buildResponsiveCSSVariables = useMemo((): Record<string, string | undefined> => {
        const cssVars: Record<string, string | undefined> = {};

        // Base configuration - only set non-default values
        const baseColumns = normalizeValue(gridTemplateColumns);
        if (baseColumns && baseColumns !== "1fr") {
            cssVars["--css-grid-columns"] = baseColumns;
        }

        const baseRows = normalizeValue(gridTemplateRows);
        if (baseRows && baseRows !== "auto") {
            cssVars["--css-grid-rows"] = baseRows;
        }

        // Handle gap with normalization
        const normalizedGap = normalizeValue(gap);
        const normalizedRowGap = normalizeValue(rowGap);
        const normalizedColumnGap = normalizeValue(columnGap);

        if (normalizedGap) {
            cssVars["--css-grid-gap"] = normalizedGap;
        } else {
            if (normalizedRowGap) {
                cssVars["--css-grid-row-gap"] = normalizedRowGap;
            }
            if (normalizedColumnGap) {
                cssVars["--css-grid-column-gap"] = normalizedColumnGap;
            }
        }

        // Only set non-default values
        const mappedAutoFlow = getSafeCSSValue("autoFlow", autoFlow, "row");
        if (mappedAutoFlow && mappedAutoFlow !== "row") {
            cssVars["--css-grid-auto-flow"] = mappedAutoFlow;
        }

        const normalizedAutoRows = normalizeValue(autoRows);
        if (normalizedAutoRows && normalizedAutoRows !== "auto") {
            cssVars["--css-grid-auto-rows"] = normalizedAutoRows;
        }

        const normalizedAutoColumns = normalizeValue(autoColumns);
        if (normalizedAutoColumns && normalizedAutoColumns !== "auto") {
            cssVars["--css-grid-auto-columns"] = normalizedAutoColumns;
        }

        if (justifyItems && justifyItems !== "stretch") {
            cssVars["--css-grid-justify-items"] = justifyItems;
        }

        if (alignItems && alignItems !== "stretch") {
            cssVars["--css-grid-align-items"] = alignItems;
        }

        const mappedJustifyContent = getSafeCSSValue("justifyContent", justifyContent, "start");
        if (mappedJustifyContent && mappedJustifyContent !== "start") {
            cssVars["--css-grid-justify-content"] = mappedJustifyContent;
        }

        const mappedAlignContent = getSafeCSSValue("alignContent", alignContent, "stretch");
        if (mappedAlignContent && mappedAlignContent !== "stretch") {
            cssVars["--css-grid-align-content"] = mappedAlignContent;
        }

        // Size constraints are always set if defined
        if (normalizeValue(minHeight)) {
            cssVars["--css-grid-min-height"] = normalizeValue(minHeight);
        }
        if (normalizeValue(maxHeight)) {
            cssVars["--css-grid-max-height"] = normalizeValue(maxHeight);
        }
        if (normalizeValue(minWidth)) {
            cssVars["--css-grid-min-width"] = normalizeValue(minWidth);
        }
        if (normalizeValue(maxWidth)) {
            cssVars["--css-grid-max-width"] = normalizeValue(maxWidth);
        }

        if (useNamedAreas) {
            const normalizedAreas = normalizeValue(gridTemplateAreas);
            if (normalizedAreas) {
                cssVars["--css-grid-areas"] = `${normalizedAreas}`;
            }
        }

        // Performance-optimized breakpoint processing
        // Process only relevant breakpoints (exact mode: 1 breakpoint, cascade mode: 2-3 breakpoints)
        if (enableBreakpoints) {
            const mode: ResponsiveMode = responsiveMode === "cascade" ? "cascade" : "exact";
            const breakpointsToProcess = getBreakpointsToProcess(mode, currentWidth, runtimeProps);

            // Process only the breakpoints that are relevant for current mode and width
            breakpointsToProcess.forEach(config => {
                // Helper to get normalized property value
                const getNormalizedProperty = (prop: string): string | undefined => {
                    const key = `${config.size}${prop}` as keyof RuntimeGridContainer;
                    return normalizeValue(runtimeProps[key] as string | undefined);
                };
                // Set CSS variables for each breakpoint - only non-defaults
                const bpColumns = getNormalizedProperty("Columns");
                if (bpColumns) {
                    cssVars[`--css-grid-${config.size}-columns`] = bpColumns;
                }

                const bpRows = getNormalizedProperty("Rows");
                if (bpRows) {
                    cssVars[`--css-grid-${config.size}-rows`] = bpRows;
                }

                const bpGap = getNormalizedProperty("Gap");
                if (bpGap) {
                    cssVars[`--css-grid-${config.size}-gap`] = bpGap;
                } else {
                    const bpRowGap = getNormalizedProperty("RowGap");
                    const bpColumnGap = getNormalizedProperty("ColumnGap");
                    if (bpRowGap) {
                        cssVars[`--css-grid-${config.size}-row-gap`] = bpRowGap;
                    }
                    if (bpColumnGap) {
                        cssVars[`--css-grid-${config.size}-column-gap`] = bpColumnGap;
                    }
                }

                const bpAutoFlow = getSafeEnumValue(
                    runtimeProps,
                    `${config.size}AutoFlow` as keyof RuntimeGridContainer,
                    isAutoFlowEnum,
                    undefined
                );
                if (bpAutoFlow) {
                    const mapped = getSafeCSSValue("autoFlow", bpAutoFlow, bpAutoFlow);
                    cssVars[`--css-grid-${config.size}-auto-flow`] = mapped;
                }

                const bpAutoRows = getNormalizedProperty("AutoRows");
                if (bpAutoRows) {
                    cssVars[`--css-grid-${config.size}-auto-rows`] = bpAutoRows;
                }

                const bpAutoColumns = getNormalizedProperty("AutoColumns");
                if (bpAutoColumns) {
                    cssVars[`--css-grid-${config.size}-auto-columns`] = bpAutoColumns;
                }

                const bpJustifyItems = getSafeEnumValue(
                    runtimeProps,
                    `${config.size}JustifyItems` as keyof RuntimeGridContainer,
                    isJustifyItemsEnum,
                    undefined
                );
                if (bpJustifyItems) {
                    cssVars[`--css-grid-${config.size}-justify-items`] = bpJustifyItems;
                }

                const bpAlignItems = getSafeEnumValue(
                    runtimeProps,
                    `${config.size}AlignItems` as keyof RuntimeGridContainer,
                    isAlignItemsEnum,
                    undefined
                );
                if (bpAlignItems) {
                    cssVars[`--css-grid-${config.size}-align-items`] = bpAlignItems;
                }

                const bpJustifyContent = getSafeEnumValue(
                    runtimeProps,
                    `${config.size}JustifyContent` as keyof RuntimeGridContainer,
                    isJustifyContentEnum,
                    undefined
                );
                if (bpJustifyContent) {
                    const mapped = getSafeCSSValue("justifyContent", bpJustifyContent, bpJustifyContent);
                    cssVars[`--css-grid-${config.size}-justify-content`] = mapped;
                }

                const bpAlignContent = getSafeEnumValue(
                    runtimeProps,
                    `${config.size}AlignContent` as keyof RuntimeGridContainer,
                    isAlignContentEnum,
                    undefined
                );
                if (bpAlignContent) {
                    const mapped = getSafeCSSValue("alignContent", bpAlignContent, bpAlignContent);
                    cssVars[`--css-grid-${config.size}-align-content`] = mapped;
                }

                const bpMinHeight = getNormalizedProperty("MinHeight");
                if (bpMinHeight) {
                    cssVars[`--css-grid-${config.size}-min-height`] = bpMinHeight;
                }

                const bpMaxHeight = getNormalizedProperty("MaxHeight");
                if (bpMaxHeight) {
                    cssVars[`--css-grid-${config.size}-max-height`] = bpMaxHeight;
                }

                const bpMinWidth = getNormalizedProperty("MinWidth");
                if (bpMinWidth) {
                    cssVars[`--css-grid-${config.size}-min-width`] = bpMinWidth;
                }

                const bpMaxWidth = getNormalizedProperty("MaxWidth");
                if (bpMaxWidth) {
                    cssVars[`--css-grid-${config.size}-max-width`] = bpMaxWidth;
                }

                if (useNamedAreas) {
                    const bpAreas = getNormalizedProperty("Areas");
                    if (bpAreas) {
                        cssVars[`--css-grid-${config.size}-areas`] = `${bpAreas}`;
                    }
                }
            });
        }

        // Remove undefined values
        return Object.fromEntries(Object.entries(cssVars).filter(([_, value]) => value !== undefined)) as Record<
            string,
            string
        >;
    }, [
        enableBreakpoints,
        currentWidth, // Optimized: only track width changes for breakpoint switching
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
        runtimeProps, // Still needed for breakpoint property access
        normalizeValue
    ]);

    /**
     * Build CSS variables for an individual item
     * Only includes variables needed for the placement type
     */
    const buildItemCSSVariables = useCallback(
        (item: RuntimeGridItem): Record<string, string> => {
            const cssVars: Record<string, string> = {};

            // Base alignment variables
            if (item.justifySelf && item.justifySelf !== "auto") {
                cssVars[`--css-grid__item-justify-self`] = item.justifySelf;
            }
            if (item.alignSelf && item.alignSelf !== "auto") {
                cssVars[`--css-grid__item-align-self`] = item.alignSelf;
            }
            if (item.zIndex) {
                cssVars[`--css-grid__item-z-index`] = String(item.zIndex);
            }

            // Base placement variables based on type
            if (item.placementType === "area" && item.gridArea) {
                cssVars[`--area`] = item.gridArea;
            } else if (item.placementType === "coordinates") {
                if (item.columnStart && item.columnStart !== "auto") {
                    cssVars[`--col-start`] = item.columnStart;
                }
                if (item.columnEnd && item.columnEnd !== "auto") {
                    cssVars[`--col-end`] = item.columnEnd;
                }
                if (item.rowStart && item.rowStart !== "auto") {
                    cssVars[`--row-start`] = item.rowStart;
                }
                if (item.rowEnd && item.rowEnd !== "auto") {
                    cssVars[`--row-end`] = item.rowEnd;
                }
            } else if (item.placementType === "span") {
                if (item.columnStart && item.columnStart !== "auto") {
                    cssVars[`--col-span`] = item.columnStart;
                }
                if (item.rowStart && item.rowStart !== "auto") {
                    cssVars[`--row-span`] = item.rowStart;
                }
            }

            // Responsive overrides (only variables that change)
            if (item.enableResponsive && enableBreakpoints) {
                // Set breakpoint-specific CSS variables for items
                forEachEnabledItemBreakpoint(item, (config, getProperty, _getNormalizedProperty) => {
                    const placementType = getProperty("PlacementType") as string;

                    if (placementType === "area") {
                        const area = getProperty("GridArea") as string;
                        if (area && area !== item.gridArea) {
                            cssVars[`--${config.size}-area`] = area;
                        }
                    } else if (placementType === "coordinates") {
                        const colStart = getProperty("ColumnStart") as string;
                        const colEnd = getProperty("ColumnEnd") as string;
                        const rowStart = getProperty("RowStart") as string;
                        const rowEnd = getProperty("RowEnd") as string;

                        if (colStart && colStart !== "auto") {
                            cssVars[`--${config.size}-col-start`] = colStart;
                        }
                        if (colEnd && colEnd !== "auto") {
                            cssVars[`--${config.size}-col-end`] = colEnd;
                        }
                        if (rowStart && rowStart !== "auto") {
                            cssVars[`--${config.size}-row-start`] = rowStart;
                        }
                        if (rowEnd && rowEnd !== "auto") {
                            cssVars[`--${config.size}-row-end`] = rowEnd;
                        }
                    } else if (placementType === "span") {
                        const colStart = getProperty("ColumnStart") as string;
                        const rowStart = getProperty("RowStart") as string;

                        if (colStart && colStart !== "auto") {
                            cssVars[`--${config.size}-col-span`] = colStart;
                        }
                        if (rowStart && rowStart !== "auto") {
                            cssVars[`--${config.size}-row-span`] = rowStart;
                        }
                    }

                    // Responsive alignment variables
                    const justifySelf = getProperty("JustifySelf") as string;
                    const alignSelf = getProperty("AlignSelf") as string;
                    const zIndex = getProperty("ZIndex") as number | null;

                    if (justifySelf && justifySelf !== "auto") {
                        cssVars[`--css-grid__item-${config.size}-justify-self`] = justifySelf;
                    }
                    if (alignSelf && alignSelf !== "auto") {
                        cssVars[`--css-grid__item-${config.size}-align-self`] = alignSelf;
                    }
                    if (zIndex !== null && zIndex !== undefined) {
                        cssVars[`--css-grid__item-${config.size}-z-index`] = String(zIndex);
                    }
                });
            }

            return cssVars;
        },
        [enableBreakpoints, runtimeProps]
    );

    /**
     * Build container styles
     * When responsive is enabled, we use CSS custom properties
     * When responsive is disabled, we use direct CSS properties
     */
    const containerStyles = useMemo<CSSProperties>(() => {
        if (enableBreakpoints) {
            // Use CSS custom properties for responsive behavior
            const cssVars = buildResponsiveCSSVariables;

            return {
                ...cssVars,
                display: "grid",
                ...style
            } as CSSProperties;
        }

        // Non-responsive: apply styles directly
        const normalizedGap = normalizeValue(gap);
        const normalizedRowGap = normalizeValue(rowGap);
        const normalizedColumnGap = normalizeValue(columnGap);

        const styles: CSSProperties = {
            display: "grid",
            gridTemplateColumns: normalizeValue(gridTemplateColumns) || "1fr",
            gridTemplateRows: normalizeValue(gridTemplateRows) || "auto",
            gridAutoFlow: getSafeCSSValue("autoFlow", autoFlow, "row"),
            gridAutoColumns: normalizeValue(autoColumns) || "auto",
            gridAutoRows: normalizeValue(autoRows) || "auto",
            justifyItems: justifyItems || "stretch",
            alignItems: alignItems || "stretch",
            justifyContent: getSafeCSSValue("justifyContent", justifyContent, "start"),
            alignContent: getSafeCSSValue("alignContent", alignContent, "stretch"),
            minHeight: normalizeValue(minHeight),
            maxHeight: normalizeValue(maxHeight),
            minWidth: normalizeValue(minWidth),
            maxWidth: normalizeValue(maxWidth),
            ...style
        };

        // Handle gap properties
        if (normalizedGap) {
            styles.gap = normalizedGap;
        } else if (normalizedRowGap || normalizedColumnGap) {
            styles.rowGap = normalizedRowGap || "0";
            styles.columnGap = normalizedColumnGap || "0";
        }

        // Add named areas if enabled
        const normalizedAreas = normalizeValue(gridTemplateAreas);
        if (useNamedAreas && normalizedAreas) {
            styles.gridTemplateAreas = normalizedAreas;
        }

        // Center the grid if max-width is set
        if (styles.maxWidth) {
            styles.marginLeft = "auto";
            styles.marginRight = "auto";
        }

        return styles;
    }, [
        enableBreakpoints,
        buildResponsiveCSSVariables,
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
        style,
        normalizeValue
    ]);

    /**
     * Handle responsive breakpoint changes
     * Debounced to prevent excessive updates during resize
     */
    useEffect(() => {
        const updateBreakpoint = () => {
            const width = window.innerWidth;
            const newBreakpointSize = getActiveBreakpoint(width);

            // Update ref immediately to prevent race conditions
            currentWidthRef.current = width;

            // Use React's batching to update both states together
            setCurrentWidth(width);
            setActiveBreakpointSize(newBreakpointSize);
        };

        const debouncedUpdate = () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
            resizeTimeoutRef.current = setTimeout(updateBreakpoint, RESIZE_DEBOUNCE_DELAY);
        };

        // Initial setup
        updateBreakpoint();

        // For instant viewport changes (like Studio Pro button), also handle resize immediately
        const handleResize = () => {
            const newWidth = window.innerWidth;
            const oldWidth = currentWidthRef.current;
            const widthDiff = Math.abs(newWidth - oldWidth);

            // If viewport changed by more than threshold, update immediately
            // This catches instant viewport switches like Studio Pro responsive buttons
            if (widthDiff > LAYOUT.VIEWPORT_CHANGE_THRESHOLD) {
                updateBreakpoint();
            } else {
                // For gradual resizing, use debounced update
                debouncedUpdate();
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    /**
     * Get active grid configuration for the current breakpoint
     * Used for area validation in non-responsive items
     */
    const getActiveGridConfig = useCallback(() => {
        // Start with base configuration
        const baseConfig = {
            areas: useNamedAreas ? normalizeValue(gridTemplateAreas) : undefined,
            columns: normalizeValue(gridTemplateColumns) || "1fr",
            rows: normalizeValue(gridTemplateRows) || "auto"
        };

        if (!enableBreakpoints) {
            return baseConfig;
        }

        // Apply configurations in mobile-first order
        let activeConfig = { ...baseConfig };

        // Use ref value for immediate access to prevent race conditions
        const width = currentWidthRef.current || currentWidth;

        forEachEnabledBreakpoint(runtimeProps, (config, _getProperty, getNormalizedProperty) => {
            if (width >= BREAKPOINT_CONFIGS.find(bp => bp.size === config.size)!.minWidth) {
                const areas = getNormalizedProperty("Areas");
                const columns = getNormalizedProperty("Columns");
                const rows = getNormalizedProperty("Rows");

                activeConfig = {
                    areas: useNamedAreas ? areas || activeConfig.areas : undefined,
                    columns: columns || activeConfig.columns,
                    rows: rows || activeConfig.rows
                };
            }
        });

        return activeConfig;
    }, [
        enableBreakpoints,
        currentWidth,
        gridTemplateAreas,
        gridTemplateColumns,
        gridTemplateRows,
        useNamedAreas,
        runtimeProps,
        normalizeValue
    ]);

    /**
     * Calculate grid dimensions for ARIA attributes
     * Provides row/column count for screen readers
     */
    const gridDimensions = useMemo(() => {
        const activeConfig = getActiveGridConfig();

        // Try to determine grid dimensions from template columns/rows
        const getTrackCount = (template: string): number => {
            if (!template || template === "none" || template === "auto") {
                return 1;
            }

            // Handle repeat() syntax: repeat(3, 1fr) -> 3 columns
            const repeatMatch = template.match(/repeat\(\s*(\d+)\s*,/);
            if (repeatMatch) {
                return parseInt(repeatMatch[1], 10);
            }

            // Count space-separated values as tracks: "1fr 1fr 200px" -> 3 columns
            const tracks = template
                .trim()
                .split(/\s+/)
                .filter(track => track && track !== "none");
            return Math.max(1, tracks.length);
        };

        const columnCount = getTrackCount(activeConfig.columns);

        // For rows, if we have explicit template, count those
        // Otherwise estimate based on items and columns
        let rowCount = 1;
        if (activeConfig.rows && activeConfig.rows !== "auto") {
            rowCount = getTrackCount(activeConfig.rows);
        } else if (columnCount > 0) {
            rowCount = Math.ceil(items.length / columnCount);
        }

        return { columnCount, rowCount };
    }, [items.length, getActiveGridConfig]);

    /**
     * Get active placement for responsive items
     * Determines which placement configuration to use based on current breakpoint
     */
    const getActiveItemPlacement = useCallback(
        (item: RuntimeGridItem): GridItemPlacement => {
            if (!item.enableResponsive) {
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
            let activePlacement: GridItemPlacement = {
                placementType: item.placementType,
                gridArea: normalizeValue(item.gridArea),
                columnStart: normalizeValue(item.columnStart),
                columnEnd: normalizeValue(item.columnEnd),
                rowStart: normalizeValue(item.rowStart),
                rowEnd: normalizeValue(item.rowEnd)
            };

            // Apply configurations in mobile-first order
            // Use ref value for immediate access
            const width = currentWidthRef.current || currentWidth;

            forEachEnabledItemBreakpoint(item, (config, getProperty, getNormalizedProperty) => {
                const bpConfig = BREAKPOINT_CONFIGS.find(bp => bp.size === config.size);
                if (bpConfig && width >= bpConfig.minWidth) {
                    activePlacement = {
                        placementType: (getProperty("PlacementType") as string) || activePlacement.placementType,
                        gridArea: getNormalizedProperty("GridArea") || activePlacement.gridArea,
                        columnStart: getNormalizedProperty("ColumnStart") || activePlacement.columnStart,
                        columnEnd: getNormalizedProperty("ColumnEnd") || activePlacement.columnEnd,
                        rowStart: getNormalizedProperty("RowStart") || activePlacement.rowStart,
                        rowEnd: getNormalizedProperty("RowEnd") || activePlacement.rowEnd
                    };
                }
            });

            return activePlacement;
        },
        [currentWidth, normalizeValue]
    );

    /**
     * Virtualization setup
     * Optimizes performance for grids with many items by only rendering visible ones
     */
    const setupVirtualization = useCallback(() => {
        if (!shouldVirtualize || !containerRef.current) {
            setVisibleItems(new Set(Array.from({ length: items.length }, (_, i) => i)));
            return;
        }

        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            entries => {
                const updates = new Map<number, boolean>();

                entries.forEach(entry => {
                    const index = parseInt(entry.target.getAttribute("data-grid-index") || "0");
                    updates.set(index, entry.isIntersecting);
                });

                setVisibleItems(prev => {
                    const newSet = new Set(prev);
                    let changed = false;

                    updates.forEach((isVisible, index) => {
                        if (isVisible && !newSet.has(index)) {
                            newSet.add(index);
                            changed = true;
                        } else if (!isVisible) {
                            const sortedIndices = Array.from(newSet).sort((a, b) => a - b);
                            const minVisible = sortedIndices[0] || 0;
                            const maxVisible = sortedIndices[sortedIndices.length - 1] || 0;

                            if (
                                index < minVisible - VIRTUALIZATION_BUFFER_SIZE ||
                                index > maxVisible + VIRTUALIZATION_BUFFER_SIZE
                            ) {
                                newSet.delete(index);
                                changed = true;
                            }
                        }
                    });

                    return changed ? newSet : prev;
                });
            },
            {
                root: containerRef.current,
                rootMargin: VIRTUALIZATION_ROOT_MARGIN,
                threshold: VIRTUALIZATION_THRESHOLD_RATIO
            }
        );

        const gridItems = containerRef.current.querySelectorAll("[data-grid-index]");
        gridItems.forEach(item => observerRef.current!.observe(item));

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
        };
    }, [shouldVirtualize, items.length]);

    // Initialize virtualization
    useEffect(() => {
        let cleanupVirtualization: (() => void) | undefined;

        const timeoutId = setTimeout(() => {
            setIsInitialized(true);
            cleanupVirtualization = setupVirtualization();
        }, INITIAL_RENDER_DELAY);

        return () => {
            clearTimeout(timeoutId);
            if (cleanupVirtualization) {
                cleanupVirtualization();
            }
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
        };
    }, [setupVirtualization]);

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            // Ensure all resources are cleaned up
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
                resizeTimeoutRef.current = null;
            }
        };
    }, []);

    /**
     * Container role
     * Uses semantic roles for better accessibility
     */
    const containerRole = useMemo(() => {
        if (role) {
            return role;
        }
        return items.length > LARGE_GRID_THRESHOLD || useNamedAreas ? "grid" : "group";
    }, [role, items.length, useNamedAreas]);

    /**
     * Render grid items
     * Creates grid items with proper placement, styling, and responsive behavior
     */
    const renderGridItems = useCallback(() => {
        const allDefinedAreas = getAllDefinedAreas();
        const activeConfig = getActiveGridConfig();

        return items.map((item, index) => {
            const isVisible = !shouldVirtualize || visibleItems.has(index) || !isInitialized;
            const runtimeItem = validateRuntimeGridItem(item);
            const itemName = getItemVariableName(runtimeItem, index);

            // Build base styles
            let itemStyles: CSSProperties = {};

            // Handle placement based on responsive settings
            if (runtimeItem.enableResponsive && enableBreakpoints) {
                // Responsive items use CSS variables
                const itemCssVars = buildItemCSSVariables(runtimeItem);
                itemStyles = {
                    ...itemCssVars
                } as CSSProperties;
            } else {
                // Non-responsive items get direct CSS properties
                itemStyles = {
                    justifySelf: runtimeItem.justifySelf !== "auto" ? runtimeItem.justifySelf : undefined,
                    alignSelf: runtimeItem.alignSelf !== "auto" ? runtimeItem.alignSelf : undefined,
                    zIndex: runtimeItem.zIndex || undefined
                };
                // Non-responsive items get direct CSS properties
                let placement = getActiveItemPlacement(runtimeItem);

                // Validate area placement
                if (placement.placementType === "area" && placement.gridArea) {
                    // Check if area exists in current configuration
                    const currentAreas = activeConfig.areas ? parseGridAreas(activeConfig.areas) : null;
                    const currentAreaNames = currentAreas
                        ? new Set(currentAreas.flat().filter(a => a !== "."))
                        : new Set<string>();

                    if (!currentAreaNames.has(placement.gridArea) && !allDefinedAreas.has(placement.gridArea)) {
                        // Area doesn't exist, fall back to auto
                        placement = {
                            placementType: "auto",
                            gridArea: undefined,
                            columnStart: undefined,
                            columnEnd: undefined,
                            rowStart: undefined,
                            rowEnd: undefined
                        };
                        console.warn(
                            `Item ${index + 1}: Grid area "${
                                runtimeItem.gridArea
                            }" is not defined in current configuration`
                        );
                    }
                }

                itemStyles = {
                    ...itemStyles,
                    ...getGridItemPlacement(placement, useNamedAreas)
                };
            }

            // Build item classes
            const itemClasses = ["css-grid__item"];

            // Add base placement class when responsive
            if (runtimeItem.enableResponsive && enableBreakpoints) {
                // Base placement class
                itemClasses.push(`css-grid__item--placement-${runtimeItem.placementType}`);

                // Add responsive placement classes for each enabled breakpoint
                forEachEnabledItemBreakpoint(runtimeItem, (config, getProperty, _getNormalizedProperty) => {
                    const placementType = (getProperty("PlacementType") as string) || runtimeItem.placementType;
                    itemClasses.push(`css-grid__item--${config.size}-placement-${placementType}`);
                });

                // Check for alignment overrides (including disabled breakpoints for styling purposes)
                forEachEnabledItemBreakpoint(
                    runtimeItem,
                    (config, getProperty, _getNormalizedProperty) => {
                        const justifySelf = getProperty("JustifySelf") as string;
                        const alignSelf = getProperty("AlignSelf") as string;
                        const zIndex = getProperty("ZIndex") as number | null;

                        if (justifySelf !== "auto" || alignSelf !== "auto" || zIndex !== null) {
                            itemClasses.push(`css-grid__item--has-${config.size}-alignment`);
                        }
                    },
                    { includeDisabled: true }
                );
            }

            // Add hidden classes for breakpoints
            if (runtimeItem.enableResponsive && enableBreakpoints) {
                forEachBreakpoint(runtimeItem, (config, getProperty) => {
                    const isHidden = getProperty("Hidden");
                    if (isHidden) {
                        itemClasses.push(`css-grid__item--hidden-${config.size}`);
                    }
                });
            }

            if (runtimeItem.className) {
                itemClasses.push(runtimeItem.className);
            }

            const dynamicClass = runtimeItem.dynamicClass?.value;
            if (dynamicClass) {
                itemClasses.push(...dynamicClass.split(" ").filter(Boolean));
            }

            // Render placeholder for non-visible virtualized items
            if (shouldVirtualize && !isVisible) {
                return (
                    <div
                        key={`grid-item-${index}`}
                        data-grid-index={index}
                        className={`${itemClasses.join(" ")} css-grid__item--placeholder`}
                        style={itemStyles}
                        aria-hidden="true"
                    />
                );
            }

            // ARIA attributes
            const itemAriaAttrs: Record<string, string | number | undefined> = {};

            // Always provide an accessible label
            const accessibleLabel = getItemAccessibleLabel(runtimeItem, index);
            itemAriaAttrs["aria-label"] = accessibleLabel;

            // Determine the semantic element first to check implicit roles
            const semanticElement = (() => {
                if (runtimeItem.renderAs && runtimeItem.renderAs !== "auto" && runtimeItem.renderAs !== "div") {
                    return runtimeItem.renderAs;
                }
                if (runtimeItem.renderAs === "auto") {
                    const rawAreaName = runtimeItem.gridArea || runtimeItem.itemName || "";
                    const areaName = validateCSSIdentifier(rawAreaName.toLowerCase().trim());
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
                return runtimeItem.renderAs || "div";
            })();

            // Elements with implicit ARIA roles that we shouldn't override
            const elementsWithImplicitRoles = ["main", "nav", "header", "footer", "article", "aside"];

            // Only set role if the semantic element doesn't have an implicit role
            if (!elementsWithImplicitRoles.includes(semanticElement)) {
                if (runtimeItem.placementType === "area" && runtimeItem.gridArea && useNamedAreas) {
                    itemAriaAttrs.role = "region";
                } else if (containerRole === "grid") {
                    itemAriaAttrs.role = "gridcell";
                }
            }

            // For virtualized grids, add position information
            if (enableVirtualization && shouldVirtualize && containerRole === "grid") {
                itemAriaAttrs["aria-setsize"] = items.length;
                itemAriaAttrs["aria-posinset"] = index + 1;
            }

            const hasResponsive = runtimeItem.enableResponsive || false;

            return createElement(
                semanticElement,
                {
                    key: `grid-item-${index}`,
                    "data-grid-index": index,
                    "data-grid-item": itemName,
                    "data-placement": getPlacementInfo(runtimeItem),
                    "data-responsive": hasResponsive,
                    className: itemClasses.join(" "),
                    style: itemStyles,
                    ...itemAriaAttrs
                },
                runtimeItem.content
            );
        });
    }, [
        items,
        visibleItems,
        shouldVirtualize,
        isInitialized,
        enableBreakpoints,
        useNamedAreas,
        getAllDefinedAreas,
        getActiveGridConfig,
        getActiveItemPlacement,
        getItemVariableName,
        buildItemCSSVariables,
        getPlacementInfo,
        getItemAccessibleLabel,
        enableVirtualization,
        containerRole
    ]);

    /**
     * Container class names
     * Builds the complete class list for the grid container
     */
    const containerClassName = useMemo(() => {
        const classes = ["css-grid", `css-grid--${activeBreakpointSize}`, className];

        // Add responsive modifier if enabled
        if (enableBreakpoints) {
            classes.push("css-grid--responsive");

            // Add enabled breakpoint classes using helper
            forEachEnabledBreakpoint(runtimeProps, config => {
                classes.push(`css-grid--has-${config.size}`);
            });
        }

        return classes.filter(Boolean).join(" ");
    }, [activeBreakpointSize, className, enableBreakpoints, runtimeProps]);

    /**
     * Helper to ensure a grid item is visible
     */
    const ensureItemVisible = useCallback(
        (itemIndex: number) => {
            setVisibleItems(prev => {
                const newSet = new Set(prev);

                // Add the target item and surrounding buffer
                for (
                    let i = Math.max(0, itemIndex - VIRTUALIZATION_BUFFER_SIZE);
                    i <= Math.min(items.length - 1, itemIndex + VIRTUALIZATION_BUFFER_SIZE);
                    i++
                ) {
                    newSet.add(i);
                }

                return newSet;
            });
        },
        [items.length]
    );

    /**
     * Handle keyboard navigation for virtualized grids
     * Ensures items are loaded when navigating with keyboard
     */
    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (!enableVirtualization || !shouldVirtualize) {
                return;
            }

            const focusedElement = document.activeElement as HTMLElement;

            // Check if focus is within our grid
            if (!containerRef.current?.contains(focusedElement)) {
                return;
            }

            // Handle Tab key navigation
            if (event.key === "Tab") {
                // Find the next focusable element
                const focusableElements = containerRef.current.querySelectorAll(
                    'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
                );

                const currentIndex = Array.from(focusableElements).indexOf(focusedElement);
                const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;

                if (nextIndex >= 0 && nextIndex < focusableElements.length) {
                    const nextElement = focusableElements[nextIndex] as HTMLElement;
                    const gridItem = nextElement.closest("[data-grid-index]");

                    if (gridItem) {
                        const itemIndex = parseInt(gridItem.getAttribute("data-grid-index") || "0");
                        ensureItemVisible(itemIndex);
                    }
                }
            }

            // Handle arrow key navigation for ARIA grid role
            // Focus moves to interactive content within grid items, not the items themselves
            if (containerRole === "grid" && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
                const currentGridItem = focusedElement.closest("[data-grid-index]");
                if (currentGridItem) {
                    const currentIndex = parseInt(currentGridItem.getAttribute("data-grid-index") || "0");
                    let targetIndex = currentIndex;

                    // Calculate target based on grid layout
                    const { columnCount } = gridDimensions;
                    switch (event.key) {
                        case "ArrowUp":
                            targetIndex = Math.max(0, currentIndex - columnCount);
                            break;
                        case "ArrowDown":
                            targetIndex = Math.min(items.length - 1, currentIndex + columnCount);
                            break;
                        case "ArrowLeft":
                            targetIndex = Math.max(0, currentIndex - 1);
                            break;
                        case "ArrowRight":
                            targetIndex = Math.min(items.length - 1, currentIndex + 1);
                            break;
                    }

                    if (targetIndex !== currentIndex) {
                        ensureItemVisible(targetIndex);

                        // Focus the first interactive element within the target grid item
                        setTimeout(() => {
                            const targetItem = containerRef.current?.querySelector(
                                `[data-grid-index="${targetIndex}"]`
                            );
                            if (targetItem) {
                                const firstFocusable = targetItem.querySelector(
                                    'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
                                ) as HTMLElement;
                                if (firstFocusable) {
                                    firstFocusable.focus();
                                }
                            }
                        }, LAYOUT.KEYBOARD_FOCUS_DELAY);

                        event.preventDefault();
                    }
                }
            }
        },
        [enableVirtualization, shouldVirtualize, items.length, containerRole, ensureItemVisible, gridDimensions]
    );

    /**
     * Container data attributes and ARIA attributes
     * Provides metadata about the grid state for screen readers
     */
    const containerDataAttributes = useMemo(() => {
        const attrs: Record<string, string | number | undefined> = {
            "data-breakpoint": activeBreakpointSize,
            "data-item-count": items.length
        };

        // Add ARIA grid dimensions for screen readers
        if (containerRole === "grid") {
            attrs["aria-rowcount"] = gridDimensions.rowCount;
            attrs["aria-colcount"] = gridDimensions.columnCount;
        }

        if (enableVirtualization && items.length >= (virtualizeThreshold || DEFAULT_VIRTUALIZATION_THRESHOLD)) {
            attrs["data-virtualized"] = "true";
        }

        if (enableBreakpoints) {
            attrs["data-responsive"] = "true";
        }

        return attrs;
    }, [
        activeBreakpointSize,
        items.length,
        enableVirtualization,
        virtualizeThreshold,
        enableBreakpoints,
        containerRole,
        gridDimensions
    ]);

    /**
     * Enhanced container ARIA label
     * Provides context about grid structure and content
     */
    const enhancedAriaLabel = useMemo(() => {
        if (ariaLabel) {
            return ariaLabel;
        }

        // Auto-generate descriptive label for grids with named areas
        if (useNamedAreas && containerRole === "grid") {
            const activeConfig = getActiveGridConfig();
            if (activeConfig.areas) {
                const parsedAreas = parseGridAreas(activeConfig.areas);
                if (parsedAreas) {
                    const uniqueAreas = new Set(parsedAreas.flat().filter(area => area !== "."));
                    if (uniqueAreas.size > 0) {
                        return `Grid layout with ${uniqueAreas.size} named areas: ${Array.from(uniqueAreas).join(
                            ", "
                        )}`;
                    }
                }
            }
        }

        // Fallback for regular grids
        if (containerRole === "grid") {
            const { columnCount, rowCount } = gridDimensions;
            return `Grid with ${items.length} items in ${rowCount} rows and ${columnCount} columns`;
        }

        return undefined;
    }, [ariaLabel, useNamedAreas, containerRole, getActiveGridConfig, gridDimensions, items.length]);

    return (
        <div
            ref={containerRef}
            className={containerClassName}
            style={containerStyles}
            role={containerRole}
            aria-label={enhancedAriaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
            onKeyDown={handleKeyDown}
            {...containerDataAttributes}
        >
            {renderGridItems()}
        </div>
    );
}

CSSGrid.displayName = "CSSGrid";
