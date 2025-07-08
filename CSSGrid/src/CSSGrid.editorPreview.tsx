import { createElement, Fragment, CSSProperties, useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Selectable } from "mendix/preview/Selectable";
import {
    CSSGridPreviewProps,
    AutoFlowEnum,
    JustifyItemsEnum,
    AlignItemsEnum,
    JustifyContentEnum,
    AlignContentEnum
} from "../typings/CSSGridProps";
import {
    RuntimeGridItemPreview,
    RuntimeGridContainerPreview,
    GridItemPlacement,
    GridMetrics
} from "./types/ConditionalTypes";
import { getGridItemPlacement, parseGridTemplate, parseGridAreas } from "./utils/gridHelpers";
import { BREAKPOINT_CONFIGS, getActiveBreakpoint } from "./utils/CSSGridTypes";

/**
 * Generate vibrant colors for areas with better visibility
 */
const generateAreaColors = (areas: string[]): Record<string, string> => {
    const baseColors = [
        "rgba(59, 130, 246, 0.2)", // Blue
        "rgba(239, 68, 68, 0.2)", // Red
        "rgba(16, 185, 129, 0.2)", // Green
        "rgba(245, 158, 11, 0.2)", // Yellow
        "rgba(139, 92, 246, 0.2)", // Purple
        "rgba(236, 72, 153, 0.2)", // Pink
        "rgba(14, 165, 233, 0.2)", // Sky
        "rgba(168, 85, 247, 0.2)", // Violet
        "rgba(251, 146, 60, 0.2)", // Orange
        "rgba(6, 182, 212, 0.2)" // Cyan
    ];

    const colorMap: Record<string, string> = {};
    areas.forEach((area, index) => {
        colorMap[area] = baseColors[index % baseColors.length];
    });

    return colorMap;
};

/**
 * CSS Grid Editor Preview Component - Production Grade with Responsiveness
 *
 * Responds to container width changes to show accurate preview
 * Uses direct style application instead of CSS variables for editor compatibility
 */
export const preview: React.FC<CSSGridPreviewProps> = props => {
    // Cast to runtime type to handle conditional properties
    const runtimeProps = props as RuntimeGridContainerPreview;

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

    // State for grid measurements and responsive behavior
    const [gridMetrics, setGridMetrics] = useState<GridMetrics | null>(null);
    const [containerWidth, setContainerWidth] = useState<number>(1024); // Default to desktop
    const [activeBreakpointSize, setActiveBreakpointSize] = useState<string>("lg");

    /**
     * Helper to normalize empty strings to undefined
     */
    const normalizeValue = useCallback((value: string | undefined): string | undefined => {
        if (!value || value.trim() === "") return undefined;
        return value;
    }, []);

    /**
     * Parse custom style string into React CSSProperties
     * Modified to avoid regex for Mendix Studio Pro compatibility
     */
    const parseInlineStyles = useCallback((styleStr: string): CSSProperties => {
        const styles: CSSProperties = {};
        if (!styleStr) return styles;

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

                    (styles as any)[camelCaseProperty] = value;
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
    }, []);

    /**
     * Map enumeration values to CSS properties
     */
    const cssEnumMappings = useMemo(
        () => ({
            autoFlow: {
                row: "row",
                column: "column",
                dense: "dense",
                columnDense: "column dense"
            } as Record<string, string>,
            justifyContent: {
                start: "start",
                end: "end",
                center: "center",
                stretch: "stretch",
                spaceBetween: "space-between",
                spaceAround: "space-around",
                spaceEvenly: "space-evenly"
            } as Record<string, string>,
            alignContent: {
                start: "start",
                end: "end",
                center: "center",
                stretch: "stretch",
                spaceBetween: "space-between",
                spaceAround: "space-around",
                spaceEvenly: "space-evenly"
            } as Record<string, string>
        }),
        []
    );

    /**
     * Get all defined areas across all configurations
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
            BREAKPOINT_CONFIGS.forEach(config => {
                const enabledKey = `${config.size}Enabled` as keyof RuntimeGridContainerPreview;
                const areasKey = `${config.size}Areas` as keyof RuntimeGridContainerPreview;

                if (runtimeProps[enabledKey] && runtimeProps[areasKey]) {
                    const areas = runtimeProps[areasKey] as string;
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
     * Get active values for the current breakpoint
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
        let activeValues: ActiveBreakpointValues = {
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

        // Find the currently active breakpoint (not cumulative)
        let activeBreakpointConfig = null;
        // Iterate from largest to smallest to find the active breakpoint
        for (let i = BREAKPOINT_CONFIGS.length - 1; i >= 0; i--) {
            const config = BREAKPOINT_CONFIGS[i];
            const inRange = config.maxWidth
                ? containerWidth >= config.minWidth && containerWidth <= config.maxWidth
                : containerWidth >= config.minWidth;

            if (inRange) {
                activeBreakpointConfig = config;
                break;
            }
        }

        // Debug logging
        console.log("[CSSGrid Preview] Container width:", containerWidth);
        console.log("[CSSGrid Preview] Active breakpoint:", activeBreakpointConfig?.size || "none");
        console.log("[CSSGrid Preview] Breakpoints enabled:", {
            xs: runtimeProps.xsEnabled,
            sm: runtimeProps.smEnabled,
            md: runtimeProps.mdEnabled,
            lg: runtimeProps.lgEnabled,
            xl: runtimeProps.xlEnabled,
            xxl: runtimeProps.xxlEnabled
        });

        // Apply only the active breakpoint's overrides if it's enabled
        if (activeBreakpointConfig) {
            const enabledKey = `${activeBreakpointConfig.size}Enabled` as keyof RuntimeGridContainerPreview;

            if (runtimeProps[enabledKey]) {
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
                const bpAutoFlow = runtimeProps[
                    `${activeBreakpointConfig.size}AutoFlow` as keyof RuntimeGridContainerPreview
                ] as AutoFlowEnum | undefined;
                const bpAutoRows = getBreakpointValue("AutoRows");
                const bpAutoColumns = getBreakpointValue("AutoColumns");
                const bpJustifyItems = runtimeProps[
                    `${activeBreakpointConfig.size}JustifyItems` as keyof RuntimeGridContainerPreview
                ] as JustifyItemsEnum | undefined;
                const bpAlignItems = runtimeProps[
                    `${activeBreakpointConfig.size}AlignItems` as keyof RuntimeGridContainerPreview
                ] as AlignItemsEnum | undefined;
                const bpJustifyContent = runtimeProps[
                    `${activeBreakpointConfig.size}JustifyContent` as keyof RuntimeGridContainerPreview
                ] as JustifyContentEnum | undefined;
                const bpAlignContent = runtimeProps[
                    `${activeBreakpointConfig.size}AlignContent` as keyof RuntimeGridContainerPreview
                ] as AlignContentEnum | undefined;
                const bpMinHeight = getBreakpointValue("MinHeight");
                const bpMaxHeight = getBreakpointValue("MaxHeight");
                const bpMinWidth = getBreakpointValue("MinWidth");
                const bpMaxWidth = getBreakpointValue("MaxWidth");

                if (bpColumns) activeValues.columns = bpColumns;
                if (bpRows) activeValues.rows = bpRows;
                if (bpGap) {
                    activeValues.gap = bpGap;
                    activeValues.rowGap = undefined;
                    activeValues.columnGap = undefined;
                } else {
                    if (bpRowGap) activeValues.rowGap = bpRowGap;
                    if (bpColumnGap) activeValues.columnGap = bpColumnGap;
                }
                if (bpAutoFlow) activeValues.autoFlow = bpAutoFlow;
                if (bpAutoRows) activeValues.autoRows = bpAutoRows;
                if (bpAutoColumns) activeValues.autoColumns = bpAutoColumns;
                if (bpJustifyItems) activeValues.justifyItems = bpJustifyItems;
                if (bpAlignItems) activeValues.alignItems = bpAlignItems;
                if (bpJustifyContent) activeValues.justifyContent = bpJustifyContent;
                if (bpAlignContent) activeValues.alignContent = bpAlignContent;
                if (bpMinHeight) activeValues.minHeight = bpMinHeight;
                if (bpMaxHeight) activeValues.maxHeight = bpMaxHeight;
                if (bpMinWidth) activeValues.minWidth = bpMinWidth;
                if (bpMaxWidth) activeValues.maxWidth = bpMaxWidth;

                if (useNamedAreas) {
                    const bpAreas = getBreakpointValue("Areas");
                    if (bpAreas) activeValues.areas = bpAreas;
                }
            }
        }

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
     * Build container styles
     */
    const containerStyles = useMemo<CSSProperties>(() => {
        // Always get active values based on container width for the preview
        // This ensures responsive behavior works in the editor
        const activeValues = getActiveBreakpointValues();

        // Apply the active values directly as CSS properties
        const styles: CSSProperties = {
            display: "grid",
            gridTemplateColumns: activeValues.columns,
            gridTemplateRows: activeValues.rows,
            gridAutoFlow: cssEnumMappings.autoFlow[activeValues.autoFlow] || activeValues.autoFlow,
            gridAutoColumns: activeValues.autoColumns,
            gridAutoRows: activeValues.autoRows,
            justifyItems: activeValues.justifyItems,
            alignItems: activeValues.alignItems,
            justifyContent: cssEnumMappings.justifyContent[activeValues.justifyContent] || activeValues.justifyContent,
            alignContent: cssEnumMappings.alignContent[activeValues.alignContent] || activeValues.alignContent,
            minHeight: activeValues.minHeight,
            maxHeight: activeValues.maxHeight,
            minWidth: activeValues.minWidth,
            maxWidth: activeValues.maxWidth,
            width: "100%",
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
    }, [getActiveBreakpointValues, useNamedAreas, customStyle, parseInlineStyles, cssEnumMappings]);

    /**
     * Update container width and active breakpoint
     */
    useEffect(() => {
        if (!containerRef.current) return;

        const updateContainerWidth = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                setContainerWidth(width);
                setActiveBreakpointSize(getActiveBreakpoint(width));
            }
        };

        // Use ResizeObserver to track container size changes
        const resizeObserver = new ResizeObserver(() => {
            updateContainerWidth();
        });

        resizeObserver.observe(containerRef.current);
        updateContainerWidth(); // Initial measurement

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    /**
     * Get active placement for responsive items in preview
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
            let activePlacement: GridItemPlacement = {
                placementType: item.placementType,
                gridArea: normalizeValue(item.gridArea),
                columnStart: normalizeValue(item.columnStart),
                columnEnd: normalizeValue(item.columnEnd),
                rowStart: normalizeValue(item.rowStart),
                rowEnd: normalizeValue(item.rowEnd)
            };

            // Find the currently active breakpoint (not cumulative)
            let activeBreakpointConfig = null;
            // Iterate from largest to smallest to find the active breakpoint
            for (let i = BREAKPOINT_CONFIGS.length - 1; i >= 0; i--) {
                const config = BREAKPOINT_CONFIGS[i];
                const inRange = config.maxWidth
                    ? containerWidth >= config.minWidth && containerWidth <= config.maxWidth
                    : containerWidth >= config.minWidth;

                if (inRange) {
                    activeBreakpointConfig = config;
                    break;
                }
            }

            // Apply only the active breakpoint's overrides if it's enabled
            if (activeBreakpointConfig) {
                const enabledKey = `${activeBreakpointConfig.size}Enabled` as keyof RuntimeGridItemPreview;

                if (item[enabledKey]) {
                    const getBreakpointValue = (prop: string): string | undefined => {
                        const key = `${activeBreakpointConfig.size}${prop}` as keyof RuntimeGridItemPreview;
                        return normalizeValue(item[key] as string | undefined);
                    };

                    const placementTypeKey =
                        `${activeBreakpointConfig.size}PlacementType` as keyof RuntimeGridItemPreview;
                    const placementType = item[placementTypeKey] as string;

                    if (placementType) {
                        activePlacement.placementType = placementType;
                    }

                    const gridArea = getBreakpointValue("GridArea");
                    const colStart = getBreakpointValue("ColumnStart");
                    const colEnd = getBreakpointValue("ColumnEnd");
                    const rowStart = getBreakpointValue("RowStart");
                    const rowEnd = getBreakpointValue("RowEnd");

                    if (gridArea) activePlacement.gridArea = gridArea;
                    if (colStart) activePlacement.columnStart = colStart;
                    if (colEnd) activePlacement.columnEnd = colEnd;
                    if (rowStart) activePlacement.rowStart = rowStart;
                    if (rowEnd) activePlacement.rowEnd = rowEnd;
                }
            }

            return activePlacement;
        },
        [containerWidth, enableBreakpoints, normalizeValue]
    );

    /**
     * Parse grid dimensions for the current configuration
     */
    const gridDimensions = useMemo(() => {
        // Get active configuration based on current breakpoint
        const activeValues = getActiveBreakpointValues();

        const columns = parseGridTemplate(activeValues.columns);
        const rows = parseGridTemplate(activeValues.rows);
        const areas = activeValues.areas ? parseGridAreas(activeValues.areas) : null;
        const uniqueAreas = areas ? Array.from(new Set(areas.flat().filter(area => area !== "."))) : [];

        return {
            columnCount: columns.length,
            rowCount: rows.length,
            parsedAreas: areas,
            uniqueAreas,
            areaColorMap: generateAreaColors(uniqueAreas)
        };
    }, [getActiveBreakpointValues]);

    /**
     * Measure grid tracks and gaps after DOM updates
     * Modified to avoid split() for Mendix Studio Pro compatibility
     */
    const measureGrid = useCallback(() => {
        if (!gridRef.current || !containerRef.current) return;

        const gridEl = gridRef.current;
        void gridEl.offsetHeight; // Force reflow

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (!gridRef.current || !containerRef.current) return;

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
                        if ((char >= "0" && char <= "9") || char === ".") {
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
                        if ((char >= "0" && char <= "9") || char === ".") {
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
            });
        });
    }, []);

    // Setup ResizeObserver for grid measurements
    useEffect(() => {
        if (!gridRef.current) return;

        resizeObserverRef.current = new ResizeObserver(() => {
            measureGrid();
        });

        resizeObserverRef.current.observe(gridRef.current);
        if (containerRef.current) {
            resizeObserverRef.current.observe(containerRef.current);
        }

        measureGrid(); // Initial measurement

        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
            }
        };
    }, [measureGrid]);

    // Re-measure when grid properties change
    useEffect(() => {
        if (gridRef.current) {
            void gridRef.current.offsetHeight;

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    measureGrid();
                });
            });
        }
    }, [containerStyles, measureGrid]);

    /**
     * Get active grid configuration for the current breakpoint
     */
    const getActiveGridConfig = useCallback(() => {
        // Get the active values which already handles breakpoints
        const activeValues = getActiveBreakpointValues();

        return {
            areas: activeValues.areas
        };
    }, [getActiveBreakpointValues]);

    /**
     * Check if responsive is enabled
     */
    const hasResponsiveContainer = useMemo(() => {
        if (!enableBreakpoints) return false;
        return BREAKPOINT_CONFIGS.some(config => {
            const key = `${config.size}Enabled` as keyof RuntimeGridContainerPreview;
            return runtimeProps[key];
        });
    }, [enableBreakpoints, runtimeProps]);

    /**
     * Render responsive indicator
     */
    const renderResponsiveIndicator = () => {
        if (!hasResponsiveContainer) return null;

        const enabledBreakpoints: string[] = [];
        BREAKPOINT_CONFIGS.forEach(config => {
            const enabledKey = `${config.size}Enabled` as keyof RuntimeGridContainerPreview;
            if (runtimeProps[enabledKey]) {
                enabledBreakpoints.push(config.size.toUpperCase());
            }
        });

        return (
            <div className="mx-css-grid-preview-info">
                <span className="mx-css-grid-preview-info-icon">📱</span>
                <span className="mx-css-grid-preview-info-text">
                    Responsive: {enabledBreakpoints.join(", ")} | Current: {activeBreakpointSize.toUpperCase()} (
                    {containerWidth}px)
                </span>
            </div>
        );
    };

    /**
     * Render debug overlays
     */
    const renderDebugOverlays = () => {
        if (!gridMetrics || (!showGridLines && !showGridGaps)) return null;

        const { tracks, gaps, gridBox } = gridMetrics;
        if (!gridBox) return null;

        const width = gridBox.width;
        const height = gridBox.height;

        return (
            <svg
                className="mx-css-grid-preview-debug-svg"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 100
                }}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
            >
                {/* Define stripe pattern for gaps */}
                <defs>
                    <pattern
                        id="gap-stripes"
                        x="0"
                        y="0"
                        width="20"
                        height="20"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(45)"
                    >
                        <rect x="0" y="0" width="20" height="20" fill="rgba(255, 0, 61, 0.15)" />
                        <rect x="0" y="0" width="10" height="20" fill="rgba(255, 0, 61, 0.25)" />
                    </pattern>
                </defs>

                {/* Gap visualization with measurements */}
                {showGridGaps && gaps.column > 0 && tracks.columns.length > 2 && (
                    <g className="grid-gaps-column">
                        {tracks.columns.slice(0, -1).map((_, i) => {
                            if (i === tracks.columns.length - 2) return null; // Skip the last gap
                            const currentPos = tracks.columns[i];
                            const nextPos = tracks.columns[i + 1];
                            const gapX = currentPos + (nextPos - currentPos - gaps.column) / 2;
                            console.log(
                                `Rendering column gap at index ${i}: currentPos=${currentPos}, nextPos=${nextPos}, gapX=${gapX}`
                            );
                            return (
                                <g key={`gap-col-${i}`}>
                                    <rect
                                        x={nextPos}
                                        y={0}
                                        width={gaps.column}
                                        height={height}
                                        fill="url(#gap-stripes)"
                                    />
                                    {/* Gap measurement text */}
                                    <text
                                        x={nextPos + gaps.column / 2}
                                        y={height / 2}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize="10"
                                        fill="rgba(255, 0, 61, 0.8)"
                                        fontWeight="bold"
                                        transform={`rotate(-90 ${nextPos + gaps.column / 2} ${height / 2})`}
                                        style={{
                                            filter: "drop-shadow(0 0 2px white) drop-shadow(0 0 2px white)"
                                        }}
                                    >
                                        {Math.round(gaps.column)}px
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                )}

                {showGridGaps && gaps.row > 0 && tracks.rows.length > 2 && (
                    <g className="grid-gaps-row">
                        {tracks.rows.slice(0, -1).map((_, i) => {
                            if (i === tracks.rows.length - 2) return null; // Skip the last gap
                            const currentPos = tracks.rows[i];
                            const nextPos = tracks.rows[i + 1];
                            const gapY = currentPos + (nextPos - currentPos - gaps.row) / 2;
                            console.log(
                                `Rendering row gap at index ${i}: currentPos=${currentPos}, nextPos=${nextPos}, gapY=${gapY}`
                            );
                            return (
                                <g key={`gap-row-${i}`}>
                                    <rect x={0} y={nextPos} width={width} height={gaps.row} fill="url(#gap-stripes)" />
                                    {/* Gap measurement text */}
                                    <text
                                        x={width / 2}
                                        y={nextPos + gaps.row / 2}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize="10"
                                        fill="rgba(255, 0, 61, 0.8)"
                                        fontWeight="bold"
                                        style={{
                                            filter: "drop-shadow(0 0 2px white) drop-shadow(0 0 2px white)"
                                        }}
                                    >
                                        {Math.round(gaps.row)}px
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                )}

                {/* Grid lines with numbers */}
                {showGridLines && (
                    <g className="grid-lines">
                        {/* Vertical lines with column numbers */}
                        {tracks.columns.map((x, i) => {
                            const lineNumber = i + 1;
                            const isFirst = i === 0;
                            const isLast = i === tracks.columns.length - 1;
                            const hasGapBefore = i > 0 && gaps.column > 0;

                            return (
                                <g key={`v-${i}`}>
                                    {/* For first and last lines, just draw one line */}
                                    {(isFirst || isLast) && (
                                        <line
                                            x1={x}
                                            y1={0}
                                            x2={x}
                                            y2={height}
                                            stroke="#ff003d"
                                            strokeWidth="1"
                                            opacity="0.6"
                                        />
                                    )}

                                    {/* For middle lines with gaps, draw lines on both sides of gap */}
                                    {!isFirst && !isLast && (
                                        <Fragment>
                                            {hasGapBefore && (
                                                <line
                                                    x1={x}
                                                    y1={0}
                                                    x2={x}
                                                    y2={height}
                                                    stroke="#ff003d"
                                                    strokeWidth="1"
                                                    opacity="0.6"
                                                />
                                            )}
                                            <line
                                                x1={x + gaps.column}
                                                y1={0}
                                                x2={x + gaps.column}
                                                y2={height}
                                                stroke="#ff003d"
                                                strokeWidth="1"
                                                opacity="0.6"
                                            />
                                        </Fragment>
                                    )}

                                    {/* Column line numbers positioned inside grid */}
                                    {/* Top labels */}
                                    <rect
                                        x={isFirst ? x + 4 : isLast ? x - 24 : x - 10}
                                        y={4}
                                        width="20"
                                        height="16"
                                        fill="white"
                                        stroke="#ff003d"
                                        strokeWidth="1"
                                        opacity="0.9"
                                        rx="2"
                                    />
                                    <text
                                        x={isFirst ? x + 14 : isLast ? x - 14 : x}
                                        y={12}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize="11"
                                        fill="#ff003d"
                                        fontWeight="bold"
                                    >
                                        {lineNumber}
                                    </text>
                                    {/* Bottom labels */}
                                    <rect
                                        x={isFirst ? x + 4 : isLast ? x - 24 : x - 10}
                                        y={height - 20}
                                        width="20"
                                        height="16"
                                        fill="white"
                                        stroke="#ff003d"
                                        strokeWidth="1"
                                        opacity="0.9"
                                        rx="2"
                                    />
                                    <text
                                        x={isFirst ? x + 14 : isLast ? x - 14 : x}
                                        y={height - 12}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize="11"
                                        fill="#ff003d"
                                        fontWeight="bold"
                                    >
                                        {lineNumber}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Horizontal lines with row numbers */}
                        {tracks.rows.map((y, i) => {
                            const lineNumber = i + 1;
                            const isFirst = i === 0;
                            const isLast = i === tracks.rows.length - 1;
                            const hasGapBefore = i > 0 && gaps.row > 0;

                            return (
                                <g key={`h-${i}`}>
                                    {/* For first and last lines, just draw one line */}
                                    {(isFirst || isLast) && (
                                        <line
                                            x1={0}
                                            y1={y}
                                            x2={width}
                                            y2={y}
                                            stroke="#ff003d"
                                            strokeWidth="1"
                                            opacity="0.6"
                                        />
                                    )}

                                    {/* For middle lines with gaps, draw lines on both sides of gap */}
                                    {!isFirst && !isLast && (
                                        <Fragment>
                                            {hasGapBefore && (
                                                <line
                                                    x1={0}
                                                    y1={y}
                                                    x2={width}
                                                    y2={y}
                                                    stroke="#ff003d"
                                                    strokeWidth="1"
                                                    opacity="0.6"
                                                />
                                            )}
                                            <line
                                                x1={0}
                                                y1={y + gaps.row}
                                                x2={width}
                                                y2={y + gaps.row}
                                                stroke="#ff003d"
                                                strokeWidth="1"
                                                opacity="0.6"
                                            />
                                        </Fragment>
                                    )}

                                    {/* Row line numbers positioned inside grid */}
                                    {/* Left labels */}
                                    <rect
                                        x={4}
                                        y={isFirst ? y + 4 : isLast ? y - 20 : y - 8}
                                        width="20"
                                        height="16"
                                        fill="white"
                                        stroke="#ff003d"
                                        strokeWidth="1"
                                        opacity="0.9"
                                        rx="2"
                                    />
                                    <text
                                        x={14}
                                        y={isFirst ? y + 12 : isLast ? y - 12 : y}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize="11"
                                        fill="#ff003d"
                                        fontWeight="bold"
                                    >
                                        {lineNumber}
                                    </text>
                                    {/* Right labels */}
                                    <rect
                                        x={width - 24}
                                        y={isFirst ? y + 4 : isLast ? y - 20 : y - 8}
                                        width="20"
                                        height="16"
                                        fill="white"
                                        stroke="#ff003d"
                                        strokeWidth="1"
                                        opacity="0.9"
                                        rx="2"
                                    />
                                    <text
                                        x={width - 14}
                                        y={isFirst ? y + 12 : isLast ? y - 12 : y}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize="11"
                                        fill="#ff003d"
                                        fontWeight="bold"
                                    >
                                        {lineNumber}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                )}
            </svg>
        );
    };

    /**
     * Render grid areas overlay
     */
    const renderGridAreasOverlay = () => {
        if (!showGridAreas || !useNamedAreas || !gridDimensions.parsedAreas) return null;

        const { parsedAreas, areaColorMap } = gridDimensions;
        const processedAreas = new Set<string>();

        return parsedAreas.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
                if (cell === "." || processedAreas.has(cell)) return null;

                // Find the full extent of this area
                let minRow = rowIndex,
                    maxRow = rowIndex;
                let minCol = colIndex,
                    maxCol = colIndex;

                for (let r = 0; r < parsedAreas.length; r++) {
                    for (let c = 0; c < parsedAreas[r].length; c++) {
                        if (parsedAreas[r][c] === cell) {
                            minRow = Math.min(minRow, r);
                            maxRow = Math.max(maxRow, r);
                            minCol = Math.min(minCol, c);
                            maxCol = Math.max(maxCol, c);
                        }
                    }
                }

                processedAreas.add(cell);

                return (
                    <div
                        key={`area-${cell}`}
                        className="mx-css-grid-preview-area-overlay"
                        style={{
                            gridRow: `${minRow + 1} / ${maxRow + 2}`,
                            gridColumn: `${minCol + 1} / ${maxCol + 2}`,
                            backgroundColor: areaColorMap[cell],
                            border: "1px solid rgba(0, 0, 0, 0.1)",
                            pointerEvents: "none",
                            position: "relative",
                            zIndex: -1
                        }}
                    >
                        <div
                            className="mx-css-grid-preview-area-label-container"
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                zIndex: 1000,
                                pointerEvents: "none"
                            }}
                        >
                            <span
                                className="mx-css-grid-preview-area-label"
                                style={{
                                    display: "inline-block",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: "white",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    background: "rgba(59, 130, 246, 0.9)",
                                    padding: "2px 6px",
                                    borderRadius: "3px",
                                    whiteSpace: "nowrap",
                                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)"
                                }}
                            >
                                {cell.toUpperCase()}
                            </span>
                        </div>
                    </div>
                );
            })
        );
    };

    /**
     * Container classes
     */
    const containerClasses = useMemo(() => {
        const classes = ["mx-css-grid-preview", "mx-css-grid", `mx-grid-${activeBreakpointSize}`, className];

        if (enableBreakpoints) {
            classes.push("mx-css-grid--responsive");

            // Add enabled breakpoint classes
            BREAKPOINT_CONFIGS.forEach(config => {
                const enabledKey = `${config.size}Enabled` as keyof RuntimeGridContainerPreview;
                if (runtimeProps[enabledKey]) {
                    classes.push(`mx-grid-has-${config.size}`);
                }
            });
        }

        return classes.filter(Boolean).join(" ");
    }, [activeBreakpointSize, className, enableBreakpoints, runtimeProps]);

    return (
        <div
            ref={containerRef}
            className="mx-css-grid-preview-wrapper"
            style={{
                position: "relative",
                width: "100%"
            }}
        >
            {/* Responsive indicator */}
            {renderResponsiveIndicator()}

            {/* Main grid container */}
            <div
                ref={gridRef}
                className={containerClasses}
                style={containerStyles}
                data-columns={gridDimensions.columnCount}
                data-rows={gridDimensions.rowCount}
                data-breakpoint={activeBreakpointSize}
            >
                {/* Grid areas overlay */}
                {renderGridAreasOverlay()}

                {/* Debug overlays */}
                {renderDebugOverlays()}

                {/* Grid items */}
                {items.map((item, index) => {
                    const runtimeItem = item as RuntimeGridItemPreview;

                    // Get the active placement for this item at the current breakpoint
                    const activePlacement = getActiveItemPlacementForPreview(runtimeItem);

                    // Determine the effective placement type
                    const effectivePlacementType =
                        useNamedAreas && activePlacement.gridArea?.trim() ? "area" : activePlacement.placementType;

                    // Validate area placement against current configuration
                    let validatedPlacement = activePlacement;
                    if (effectivePlacementType === "area" && activePlacement.gridArea) {
                        const activeConfig = getActiveGridConfig();
                        const currentAreas = activeConfig.areas ? parseGridAreas(activeConfig.areas) : null;
                        const currentAreaNames = currentAreas
                            ? new Set(currentAreas.flat().filter(a => a !== "."))
                            : new Set<string>();

                        const allDefinedAreas = getAllDefinedAreas();

                        if (
                            !currentAreaNames.has(activePlacement.gridArea) &&
                            !allDefinedAreas.has(activePlacement.gridArea)
                        ) {
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

                    const placementStyles = getGridItemPlacement(
                        {
                            ...validatedPlacement,
                            placementType: effectivePlacementType
                        },
                        useNamedAreas
                    );

                    const itemStyles: CSSProperties = {
                        position: "relative",
                        minHeight: "40px",
                        boxSizing: "border-box",
                        width: "100%",
                        height: "100%",
                        ...placementStyles,
                        justifySelf: runtimeItem.justifySelf !== "auto" ? runtimeItem.justifySelf : undefined,
                        alignSelf: runtimeItem.alignSelf !== "auto" ? runtimeItem.alignSelf : undefined,
                        zIndex: runtimeItem.zIndex || undefined
                    };

                    const itemName =
                        runtimeItem.itemName ||
                        (effectivePlacementType === "area" && activePlacement.gridArea
                            ? activePlacement.gridArea
                            : `Item ${index + 1}`);

                    const hasResponsive = runtimeItem.enableResponsive || false;
                    const itemCaption = `${itemName}${hasResponsive ? " 📱" : ""}`;

                    const ContentRenderer = runtimeItem.content?.renderer;

                    const itemClasses = ["mx-css-grid-preview-item", "mx-grid-item", runtimeItem.className]
                        .filter(Boolean)
                        .join(" ");

                    return (
                        <Selectable key={`grid-item-${index}`} object={runtimeItem} caption={itemCaption}>
                            <div
                                className={itemClasses}
                                style={itemStyles}
                                data-item-index={index}
                                data-item-name={itemName}
                                data-placement-type={effectivePlacementType}
                                data-responsive={hasResponsive}
                            >
                                {ContentRenderer ? (
                                    <div className="mx-css-grid-preview-content">
                                        <ContentRenderer>
                                            <div style={{ width: "100%", height: "100%" }} />
                                        </ContentRenderer>
                                    </div>
                                ) : (
                                    <div className="mx-css-grid-preview-empty">
                                        <span className="mx-css-grid-preview-empty-text">{itemName}</span>
                                    </div>
                                )}
                            </div>
                        </Selectable>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * Get preview CSS styles
 */
export function getPreviewCss(): string {
    return `
        /* Base grid container styles for preview */
        .mx-css-grid {
            box-sizing: border-box;
            width: 100%;
            position: relative;
            contain: layout style;
        }

        /* Grid item base styles */
        .mx-grid-item {
            box-sizing: border-box;
            min-width: 0;
            min-height: 0;
            position: relative;
            contain: layout style;
        }

        /* Current breakpoint indicators */
        .mx-grid-xs { --current-breakpoint: xs; }
        .mx-grid-sm { --current-breakpoint: sm; }
        .mx-grid-md { --current-breakpoint: md; }
        .mx-grid-lg { --current-breakpoint: lg; }
        .mx-grid-xl { --current-breakpoint: xl; }
        .mx-grid-xxl { --current-breakpoint: xxl; }

        /* Focus styles */
        .mx-css-grid:focus-visible {
            outline: 2px solid #0066cc;
            outline-offset: 2px;
            box-shadow: 0 0 0 4px rgba(0, 102, 204, 0.1);
        }

        /* Ensure proper sizing for Mendix widgets */
        .mx-grid-item > .mx-widget,
        .mx-grid-item > .mx-container,
        .mx-grid-item > .mx-container-nested,
        .mx-grid-item > .mx-layoutgrid,
        .mx-grid-item > .mx-dataview,
        .mx-grid-item > .mx-listview,
        .mx-grid-item > .mx-scrollcontainer,
        .mx-grid-item > .mx-groupbox {
            width: 100%;
            height: 100%;
        }

        /* Text content handling */
        .mx-grid-item > .mx-text,
        .mx-grid-item > .mx-label {
            max-width: 100%;
            overflow-wrap: break-word;
            word-wrap: break-word;
            hyphens: auto;
        }

        /* Remove all ::before and ::after pseudo elements */
        .mx-css-grid-preview *::before,
        .mx-css-grid-preview *::after {
            content: none !important;
            display: none !important;
        }

        /* Additional preview-specific styles */
        .mx-css-grid-preview-wrapper {
            position: relative;
            width: 100%;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* Responsive indicator */
        .mx-css-grid-preview-info {
            position: absolute;
            top: 4px;
            right: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: #666;
            background: rgba(255, 255, 255, 0.95);
            padding: 2px 8px;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            z-index: 100;
        }

        .mx-css-grid-preview-info-icon {
            font-size: 12px;
        }

        .mx-css-grid-preview-info-text {
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Debug SVG overlay */
        .mx-css-grid-preview-debug-svg {
            pointer-events: none;
        }

        /* Grid area overlay */
        .mx-css-grid-preview-area-overlay {
            transition: opacity 0.2s ease;
        }

        /* Area label container */
        .mx-css-grid-preview-area-label-container {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 1000 !important;
            pointer-events: none !important;
        }

        /* Preview-specific grid item styles */
        .mx-css-grid-preview-item {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .mx-css-grid-preview-item:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        /* Content wrapper */
        .mx-css-grid-preview-content {
            width: 100%;
            height: 100%;
            position: relative;
            z-index: 2;
        }

        /* Empty item placeholder */
        .mx-css-grid-preview-empty {
            width: 100%;
            height: 100%;
            min-height: 40px;
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

        .mx-css-grid-preview-empty-text {
            font-size: 11px;
            color: #999;
            font-weight: 500;
            user-select: none;
        }

        /* Hover state for empty items */
        .mx-css-grid-preview-item:hover .mx-css-grid-preview-empty {
            background: rgba(59, 130, 246, 0.05);
            border-color: rgba(59, 130, 246, 0.3);
        }

        .mx-css-grid-preview-item:hover .mx-css-grid-preview-empty-text {
            color: #3b82f6;
        }

        /* Auto-flow indicator */
        .mx-css-grid-preview-item[data-placement-type="auto"] .mx-css-grid-preview-empty {
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
        .mx-css-grid-preview-item .mx-widget,
        .mx-css-grid-preview-item .mx-dataview,
        .mx-css-grid-preview-item .mx-listview,
        .mx-css-grid-preview-item .mx-container,
        .mx-css-grid-preview-item .mx-container-nested,
        .mx-css-grid-preview-item .mx-scrollcontainer,
        .mx-css-grid-preview-item .mx-groupbox {
            width: 100%;
            height: 100%;
        }

        /* Remove default margins */
        .mx-css-grid-preview-item > * {
            margin: 0;
        }

        /* Text overflow handling */
        .mx-css-grid-preview-item {
            word-wrap: break-word;
            overflow-wrap: break-word;
        }

        /* Z-index visual feedback */
        .mx-css-grid-preview-item[style*="z-index"] {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        /* Structure mode compact view */
        .mx-name-CSSGrid.mx-compound-widget {
            min-height: 60px;
        }

        /* Smooth transitions */
        .mx-css-grid-preview,
        .mx-css-grid-preview-item,
        .mx-css-grid-preview-area-overlay {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Responsive adjustments for small editor views */
        .mx-css-grid-preview-wrapper {
            min-width: 320px;
        }
        
        /* Ensure info panel stays visible */
        @media (max-width: 480px) {
            .mx-css-grid-preview-info {
                font-size: 10px;
                padding: 2px 6px;
            }
        }
    `;
}
