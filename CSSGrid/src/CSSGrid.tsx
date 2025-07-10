import { 
    ReactElement, 
    createElement, 
    CSSProperties, 
    useMemo, 
    useRef, 
    useEffect, 
    useState, 
    useCallback
} from "react";
import { 
    CSSGridContainerProps,
    AutoFlowEnum,
    JustifyItemsEnum,
    AlignItemsEnum,
    JustifyContentEnum,
    AlignContentEnum
} from "../typings/CSSGridProps";
import { 
    RuntimeGridItem,
    RuntimeGridContainer,
    GridItemPlacement
} from "./types/ConditionalTypes";
import { 
    getGridItemPlacement, 
    parseGridAreas
} from "./utils/gridHelpers";
import { 
    BreakpointSize, 
    getActiveBreakpoint,
    BREAKPOINT_CONFIGS 
} from "./utils/CSSGridTypes";
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
        minHeight,
        maxHeight,
        minWidth,
        maxWidth,
        enableVirtualization,
        virtualizeThreshold,
        class: className,
        style,
        tabIndex,
        ariaLabel,
        ariaLabelledBy,
        ariaDescribedBy,
        role
    } = props;

    // Cast to runtime type to handle conditional properties
    const runtimeProps = props as RuntimeGridContainer;

    // Constants for configuration
    const DEFAULT_VIRTUALIZATION_THRESHOLD = 100;
    const RESIZE_DEBOUNCE_DELAY = 150;
    const VIRTUALIZATION_ROOT_MARGIN = "100px";
    const VIRTUALIZATION_THRESHOLD_RATIO = 0.01;
    const VIRTUALIZATION_BUFFER_SIZE = 5;
    const INITIAL_RENDER_DELAY = 0;
    const LARGE_GRID_THRESHOLD = 10;

    // Refs for DOM access
    const containerRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // State management
    const [visibleItems, setVisibleItems] = useState<Set<number>>(() => new Set());
    const [currentWidth, setCurrentWidth] = useState<number>(window.innerWidth);
    const [activeBreakpointSize, setActiveBreakpointSize] = useState<BreakpointSize>('lg');
    const [isInitialized, setIsInitialized] = useState(false);

    /**
     * Helper to normalize empty strings to undefined
     * This prevents empty strings from creating invalid CSS
     * 
     * @param value - String value to normalize
     * @returns Normalized value or undefined
     */
    const normalizeValue = useCallback((value: string | undefined): string | undefined => {
        if (!value || value.trim() === "") return undefined;
        return value;
    }, []);

    /**
     * Map enumeration values to CSS properties
     * Converts Mendix enumeration values to valid CSS values
     */
    const cssEnumMappings = useMemo(() => ({
        autoFlow: {
            'row': 'row',
            'column': 'column',
            'dense': 'dense',
            'columnDense': 'column dense'
        } as Record<string, string>,
        justifyContent: {
            'start': 'start',
            'end': 'end',
            'center': 'center',
            'stretch': 'stretch',
            'spaceBetween': 'space-between',
            'spaceAround': 'space-around',
            'spaceEvenly': 'space-evenly'
        } as Record<string, string>,
        alignContent: {
            'start': 'start',
            'end': 'end',
            'center': 'center',
            'stretch': 'stretch',
            'spaceBetween': 'space-between',
            'spaceAround': 'space-around',
            'spaceEvenly': 'space-evenly'
        } as Record<string, string>
    }), []);

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
            BREAKPOINT_CONFIGS.forEach(config => {
                const enabledKey = `${config.size}Enabled` as keyof RuntimeGridContainer;
                const areasKey = `${config.size}Areas` as keyof RuntimeGridContainer;
                
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
     * Get placement information for debugging
     * Returns info about base and responsive placements
     */
    const getPlacementInfo = useCallback((item: RuntimeGridItem): string => {
        const info: string[] = [item.placementType];
        
        if (item.enableResponsive && enableBreakpoints) {
            BREAKPOINT_CONFIGS.forEach(config => {
                const enabledKey = `${config.size}Enabled` as keyof RuntimeGridItem;
                const placementTypeKey = `${config.size}PlacementType` as keyof RuntimeGridItem;
                
                if (item[enabledKey]) {
                    const placementType = item[placementTypeKey] as string;
                    if (placementType && placementType !== item.placementType) {
                        info.push(`${config.size}:${placementType}`);
                    }
                }
            });
        }
        
        return info.join(',');
    }, [enableBreakpoints]);

    /**
     * Generate a semantic CSS variable name for an item
     * Prioritizes: itemName > gridArea > index
     */
    const getItemVariableName = useCallback((item: RuntimeGridItem, index: number): string => {
        if (item.itemName) {
            // Sanitize item name for CSS: lowercase, replace spaces with hyphens
            return item.itemName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }
        if (item.gridArea && useNamedAreas) {
            return item.gridArea.toLowerCase();
        }
        return `item-${index}`;
    }, [useNamedAreas]);

    /**
     * Build CSS custom properties for responsive values
     * Only includes variables that differ from defaults
     * 
     * @returns Object containing CSS custom properties
     */
    const buildResponsiveCSSVariables = useCallback((): Record<string, string | undefined> => {
        const cssVars: Record<string, string | undefined> = {};

        // Base configuration - only set non-default values
        const baseColumns = normalizeValue(gridTemplateColumns);
        if (baseColumns && baseColumns !== '1fr') {
            cssVars['--grid-columns'] = baseColumns;
        }
        
        const baseRows = normalizeValue(gridTemplateRows);
        if (baseRows && baseRows !== 'auto') {
            cssVars['--grid-rows'] = baseRows;
        }
        
        // Handle gap with normalization
        const normalizedGap = normalizeValue(gap);
        const normalizedRowGap = normalizeValue(rowGap);
        const normalizedColumnGap = normalizeValue(columnGap);
        
        if (normalizedGap) {
            cssVars['--grid-gap'] = normalizedGap;
        } else {
            if (normalizedRowGap) {
                cssVars['--grid-row-gap'] = normalizedRowGap;
            }
            if (normalizedColumnGap) {
                cssVars['--grid-column-gap'] = normalizedColumnGap;
            }
        }
        
        // Only set non-default values
        const mappedAutoFlow = cssEnumMappings.autoFlow[autoFlow || 'row'] || autoFlow;
        if (mappedAutoFlow && mappedAutoFlow !== 'row') {
            cssVars['--grid-auto-flow'] = mappedAutoFlow;
        }
        
        const normalizedAutoRows = normalizeValue(autoRows);
        if (normalizedAutoRows && normalizedAutoRows !== 'auto') {
            cssVars['--grid-auto-rows'] = normalizedAutoRows;
        }
        
        const normalizedAutoColumns = normalizeValue(autoColumns);
        if (normalizedAutoColumns && normalizedAutoColumns !== 'auto') {
            cssVars['--grid-auto-columns'] = normalizedAutoColumns;
        }
        
        if (justifyItems && justifyItems !== 'stretch') {
            cssVars['--grid-justify-items'] = justifyItems;
        }
        
        if (alignItems && alignItems !== 'stretch') {
            cssVars['--grid-align-items'] = alignItems;
        }
        
        const mappedJustifyContent = cssEnumMappings.justifyContent[justifyContent || 'start'] || justifyContent;
        if (mappedJustifyContent && mappedJustifyContent !== 'start') {
            cssVars['--grid-justify-content'] = mappedJustifyContent;
        }
        
        const mappedAlignContent = cssEnumMappings.alignContent[alignContent || 'stretch'] || alignContent;
        if (mappedAlignContent && mappedAlignContent !== 'stretch') {
            cssVars['--grid-align-content'] = mappedAlignContent;
        }
        
        // Size constraints are always set if defined
        if (normalizeValue(minHeight)) cssVars['--grid-min-height'] = normalizeValue(minHeight);
        if (normalizeValue(maxHeight)) cssVars['--grid-max-height'] = normalizeValue(maxHeight);
        if (normalizeValue(minWidth)) cssVars['--grid-min-width'] = normalizeValue(minWidth);
        if (normalizeValue(maxWidth)) cssVars['--grid-max-width'] = normalizeValue(maxWidth);
        
        if (useNamedAreas) {
            const normalizedAreas = normalizeValue(gridTemplateAreas);
            if (normalizedAreas) {
                cssVars['--grid-areas'] = `${normalizedAreas}`;
            }
        }

        // Add breakpoint-specific variables if responsive is enabled
        if (enableBreakpoints) {
            BREAKPOINT_CONFIGS.forEach(config => {
                const enabledKey = `${config.size}Enabled` as keyof RuntimeGridContainer;
                
                if (runtimeProps[enabledKey]) {
                    const getBreakpointValue = (prop: string): string | undefined => {
                        const key = `${config.size}${prop}` as keyof RuntimeGridContainer;
                        return normalizeValue(runtimeProps[key] as string | undefined);
                    };
                    
                    // Set CSS variables for each breakpoint - only non-defaults
                    const bpColumns = getBreakpointValue('Columns');
                    if (bpColumns) cssVars[`--grid-${config.size}-columns`] = bpColumns;
                    
                    const bpRows = getBreakpointValue('Rows');
                    if (bpRows) cssVars[`--grid-${config.size}-rows`] = bpRows;
                    
                    const bpGap = getBreakpointValue('Gap');
                    if (bpGap) {
                        cssVars[`--grid-${config.size}-gap`] = bpGap;
                    } else {
                        const bpRowGap = getBreakpointValue('RowGap');
                        const bpColumnGap = getBreakpointValue('ColumnGap');
                        if (bpRowGap) cssVars[`--grid-${config.size}-row-gap`] = bpRowGap;
                        if (bpColumnGap) cssVars[`--grid-${config.size}-column-gap`] = bpColumnGap;
                    }
                    
                    const bpAutoFlow = runtimeProps[`${config.size}AutoFlow` as keyof RuntimeGridContainer] as AutoFlowEnum | undefined;
                    if (bpAutoFlow) {
                        const mapped = cssEnumMappings.autoFlow[bpAutoFlow] || bpAutoFlow;
                        cssVars[`--grid-${config.size}-auto-flow`] = mapped;
                    }
                    
                    const bpAutoRows = getBreakpointValue('AutoRows');
                    if (bpAutoRows) cssVars[`--grid-${config.size}-auto-rows`] = bpAutoRows;
                    
                    const bpAutoColumns = getBreakpointValue('AutoColumns');
                    if (bpAutoColumns) cssVars[`--grid-${config.size}-auto-columns`] = bpAutoColumns;
                    
                    const bpJustifyItems = runtimeProps[`${config.size}JustifyItems` as keyof RuntimeGridContainer] as JustifyItemsEnum | undefined;
                    if (bpJustifyItems) cssVars[`--grid-${config.size}-justify-items`] = bpJustifyItems;
                    
                    const bpAlignItems = runtimeProps[`${config.size}AlignItems` as keyof RuntimeGridContainer] as AlignItemsEnum | undefined;
                    if (bpAlignItems) cssVars[`--grid-${config.size}-align-items`] = bpAlignItems;
                    
                    const bpJustifyContent = runtimeProps[`${config.size}JustifyContent` as keyof RuntimeGridContainer] as JustifyContentEnum | undefined;
                    if (bpJustifyContent) {
                        const mapped = cssEnumMappings.justifyContent[bpJustifyContent] || bpJustifyContent;
                        cssVars[`--grid-${config.size}-justify-content`] = mapped;
                    }
                    
                    const bpAlignContent = runtimeProps[`${config.size}AlignContent` as keyof RuntimeGridContainer] as AlignContentEnum | undefined;
                    if (bpAlignContent) {
                        const mapped = cssEnumMappings.alignContent[bpAlignContent] || bpAlignContent;
                        cssVars[`--grid-${config.size}-align-content`] = mapped;
                    }
                    
                    const bpMinHeight = getBreakpointValue('MinHeight');
                    if (bpMinHeight) cssVars[`--grid-${config.size}-min-height`] = bpMinHeight;
                    
                    const bpMaxHeight = getBreakpointValue('MaxHeight');
                    if (bpMaxHeight) cssVars[`--grid-${config.size}-max-height`] = bpMaxHeight;
                    
                    const bpMinWidth = getBreakpointValue('MinWidth');
                    if (bpMinWidth) cssVars[`--grid-${config.size}-min-width`] = bpMinWidth;
                    
                    const bpMaxWidth = getBreakpointValue('MaxWidth');
                    if (bpMaxWidth) cssVars[`--grid-${config.size}-max-width`] = bpMaxWidth;
                    
                    if (useNamedAreas) {
                        const bpAreas = getBreakpointValue('Areas');
                        if (bpAreas) cssVars[`--grid-${config.size}-areas`] = `${bpAreas}`;
                    }
                }
            });
        }

        // Remove undefined values
        return Object.fromEntries(
            Object.entries(cssVars).filter(([_, value]) => value !== undefined)
        ) as Record<string, string>;
    }, [enableBreakpoints, gridTemplateColumns, gridTemplateRows, gridTemplateAreas,
        gap, rowGap, columnGap, useNamedAreas, autoFlow, autoRows, autoColumns,
        justifyItems, alignItems, justifyContent, alignContent, minHeight, maxHeight,
        minWidth, maxWidth, runtimeProps, cssEnumMappings, normalizeValue]);

    /**
     * Build CSS variables for an individual item
     * Only includes variables needed for the placement type
     */
    const buildItemCSSVariables = useCallback((item: RuntimeGridItem): Record<string, string> => {
        const cssVars: Record<string, string> = {};
        
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
            BREAKPOINT_CONFIGS.forEach(config => {
                const enabledKey = `${config.size}Enabled` as keyof RuntimeGridItem;
                if (!item[enabledKey]) return;

                const placementTypeKey = `${config.size}PlacementType` as keyof RuntimeGridItem;
                const placementType = item[placementTypeKey] as string;

                if (placementType === "area") {
                    const areaKey = `${config.size}GridArea` as keyof RuntimeGridItem;
                    const area = item[areaKey] as string;
                    if (area && area !== item.gridArea) {
                        cssVars[`--${config.size}-area`] = area;
                    }
                } else if (placementType === "coordinates") {
                    const colStartKey = `${config.size}ColumnStart` as keyof RuntimeGridItem;
                    const colEndKey = `${config.size}ColumnEnd` as keyof RuntimeGridItem;
                    const rowStartKey = `${config.size}RowStart` as keyof RuntimeGridItem;
                    const rowEndKey = `${config.size}RowEnd` as keyof RuntimeGridItem;
                    
                    const colStart = item[colStartKey] as string;
                    const colEnd = item[colEndKey] as string;
                    const rowStart = item[rowStartKey] as string;
                    const rowEnd = item[rowEndKey] as string;

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
                    const colStartKey = `${config.size}ColumnStart` as keyof RuntimeGridItem;
                    const rowStartKey = `${config.size}RowStart` as keyof RuntimeGridItem;
                    
                    const colStart = item[colStartKey] as string;
                    const rowStart = item[rowStartKey] as string;

                    if (colStart && colStart !== "auto") {
                        cssVars[`--${config.size}-col-span`] = colStart;
                    }
                    if (rowStart && rowStart !== "auto") {
                        cssVars[`--${config.size}-row-span`] = rowStart;
                    }
                }
            });
        }

        return cssVars;
    }, [enableBreakpoints]);

    /**
     * Build container styles
     * When responsive is enabled, we use CSS custom properties
     * When responsive is disabled, we use direct CSS properties
     */
    const containerStyles = useMemo<CSSProperties>(() => {
        if (enableBreakpoints) {
            // Use CSS custom properties for responsive behavior
            const cssVars = buildResponsiveCSSVariables();
            
            return {
                ...cssVars,
                display: 'grid',
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
            gridAutoFlow: cssEnumMappings.autoFlow[autoFlow || "row"] || autoFlow,
            gridAutoColumns: normalizeValue(autoColumns) || "auto",
            gridAutoRows: normalizeValue(autoRows) || "auto",
            justifyItems: justifyItems || "stretch",
            alignItems: alignItems || "stretch",
            justifyContent: cssEnumMappings.justifyContent[justifyContent || "start"] || justifyContent,
            alignContent: cssEnumMappings.alignContent[alignContent || "stretch"] || alignContent,
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
    }, [enableBreakpoints, buildResponsiveCSSVariables, gridTemplateColumns, gridTemplateRows,
        gridTemplateAreas, gap, rowGap, columnGap, useNamedAreas, autoFlow, autoRows,
        autoColumns, justifyItems, alignItems, justifyContent, alignContent, minHeight,
        maxHeight, minWidth, maxWidth, style, cssEnumMappings, normalizeValue]);

    /**
     * Handle responsive breakpoint changes
     * Debounced to prevent excessive updates during resize
     */
    useEffect(() => {
        const updateBreakpoint = () => {
            const width = window.innerWidth;
            setCurrentWidth(width);
            
            const newBreakpointSize = getActiveBreakpoint(width);
            setActiveBreakpointSize(newBreakpointSize);
        };

        const debouncedUpdate = () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
            resizeTimeoutRef.current = setTimeout(updateBreakpoint, RESIZE_DEBOUNCE_DELAY);
        };

        updateBreakpoint();
        window.addEventListener("resize", debouncedUpdate);
        
        return () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
            window.removeEventListener("resize", debouncedUpdate);
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
        };
        
        if (!enableBreakpoints) {
            return baseConfig;
        }

        // Apply configurations in mobile-first order
        let activeConfig = { ...baseConfig };
        
        BREAKPOINT_CONFIGS.forEach(config => {
            if (currentWidth >= config.minWidth) {
                const enabledKey = `${config.size}Enabled` as keyof RuntimeGridContainer;
                
                if (runtimeProps[enabledKey]) {
                    const areasKey = `${config.size}Areas` as keyof RuntimeGridContainer;
                    const areas = normalizeValue(runtimeProps[areasKey] as string | undefined);
                    
                    activeConfig = {
                        areas: useNamedAreas ? (areas || activeConfig.areas) : undefined,
                    };
                }
            }
        });

        return activeConfig;
    }, [enableBreakpoints, currentWidth, gridTemplateAreas, useNamedAreas, runtimeProps, normalizeValue]);

    /**
     * Get active placement for responsive items
     * Determines which placement configuration to use based on current breakpoint
     */
    const getActiveItemPlacement = useCallback((item: RuntimeGridItem): GridItemPlacement => {
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
        BREAKPOINT_CONFIGS.forEach(config => {
            const enabledKey = `${config.size}Enabled` as keyof RuntimeGridItem;
            
            if (item[enabledKey] && currentWidth >= config.minWidth) {
                const getBreakpointValue = (prop: string): string | undefined => {
                    const key = `${config.size}${prop}` as keyof RuntimeGridItem;
                    return normalizeValue(item[key] as string | undefined);
                };
                
                activePlacement = {
                    placementType: item[`${config.size}PlacementType` as keyof RuntimeGridItem] as string || activePlacement.placementType,
                    gridArea: getBreakpointValue('GridArea') || activePlacement.gridArea,
                    columnStart: getBreakpointValue('ColumnStart') || activePlacement.columnStart,
                    columnEnd: getBreakpointValue('ColumnEnd') || activePlacement.columnEnd,
                    rowStart: getBreakpointValue('RowStart') || activePlacement.rowStart,
                    rowEnd: getBreakpointValue('RowEnd') || activePlacement.rowEnd
                };
            }
        });

        return activePlacement;
    }, [currentWidth, normalizeValue]);

    /**
     * Virtualization setup
     * Optimizes performance for grids with many items by only rendering visible ones
     */
    const setupVirtualization = useCallback(() => {
        const shouldVirtualize = enableVirtualization && 
                               items.length >= (virtualizeThreshold || DEFAULT_VIRTUALIZATION_THRESHOLD) && 
                               containerRef.current;

        if (!shouldVirtualize) {
            setVisibleItems(new Set(Array.from({ length: items.length }, (_, i) => i)));
            return;
        }

        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
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
                            
                            if (index < minVisible - VIRTUALIZATION_BUFFER_SIZE || index > maxVisible + VIRTUALIZATION_BUFFER_SIZE) {
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
    }, [enableVirtualization, items.length, virtualizeThreshold]);

    // Initialize virtualization
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setIsInitialized(true);
            setupVirtualization();
        }, INITIAL_RENDER_DELAY);

        return () => {
            clearTimeout(timeoutId);
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [setupVirtualization]);

    /**
     * Render grid items
     * Creates grid items with proper placement, styling, and responsive behavior
     */
    const renderGridItems = useCallback(() => {
        const shouldVirtualize = enableVirtualization && items.length >= (virtualizeThreshold || DEFAULT_VIRTUALIZATION_THRESHOLD);
        const allDefinedAreas = getAllDefinedAreas();
        const activeConfig = getActiveGridConfig();

        return items.map((item, index) => {
            const isVisible = !shouldVirtualize || visibleItems.has(index) || !isInitialized;
            const runtimeItem = item as RuntimeGridItem;
            const itemName = getItemVariableName(runtimeItem, index);
            
            // Build base styles
            let itemStyles: CSSProperties = {
                justifySelf: runtimeItem.justifySelf !== "auto" ? runtimeItem.justifySelf : undefined,
                alignSelf: runtimeItem.alignSelf !== "auto" ? runtimeItem.alignSelf : undefined,
                zIndex: runtimeItem.zIndex || undefined
            };
            
            // Handle placement based on responsive settings
            if (runtimeItem.enableResponsive && enableBreakpoints) {
                // Responsive items use CSS variables
                const itemCssVars = buildItemCSSVariables(runtimeItem);
                itemStyles = {
                    ...itemStyles,
                    ...itemCssVars
                } as CSSProperties;
            } else {
                // Non-responsive items get direct CSS properties
                let placement = getActiveItemPlacement(runtimeItem);
                
                // Validate area placement
                if (placement.placementType === "area" && placement.gridArea) {
                    // Check if area exists in current configuration
                    const currentAreas = activeConfig.areas ? parseGridAreas(activeConfig.areas) : null;
                    const currentAreaNames = currentAreas ? 
                        new Set(currentAreas.flat().filter(a => a !== ".")) : 
                        new Set<string>();
                    
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
                        console.warn(`Item ${index + 1}: Grid area "${runtimeItem.gridArea}" is not defined in current configuration`);
                    }
                }
                
                itemStyles = {
                    ...itemStyles,
                    ...getGridItemPlacement(placement, useNamedAreas)
                };
            }

            // Build item classes
            const itemClasses = ['mx-grid-item'];
            
            // Add base placement class when responsive
            if (runtimeItem.enableResponsive && enableBreakpoints) {
                // Base placement class
                itemClasses.push(`mx-grid-item--placement-${runtimeItem.placementType}`);
                
                // Add responsive placement classes for each enabled breakpoint
                BREAKPOINT_CONFIGS.forEach(config => {
                    const enabledKey = `${config.size}Enabled` as keyof RuntimeGridItem;
                    const placementTypeKey = `${config.size}PlacementType` as keyof RuntimeGridItem;
                    
                    if (runtimeItem[enabledKey]) {
                        const placementType = runtimeItem[placementTypeKey] as string || runtimeItem.placementType;
                        itemClasses.push(`mx-grid-item--${config.size}-placement-${placementType}`);
                    }
                });
            }
            
            if (runtimeItem.className) {
                itemClasses.push(runtimeItem.className);
            }
            
            const dynamicClass = runtimeItem.dynamicClass?.value;
            if (dynamicClass) {
                itemClasses.push(...dynamicClass.split(' ').filter(Boolean));
            }
            
            // Render placeholder for non-visible virtualized items
            if (shouldVirtualize && !isVisible) {
                return (
                    <div
                        key={`grid-item-${index}`}
                        data-grid-index={index}
                        className={`${itemClasses.join(' ')} mx-grid-item--placeholder`}
                        style={itemStyles}
                        aria-hidden="true"
                    />
                );
            }

            // ARIA attributes
            const itemAriaAttrs: Record<string, string | undefined> = {};
            if (runtimeItem.placementType === "area" && runtimeItem.gridArea && useNamedAreas) {
                itemAriaAttrs.role = "region";
                itemAriaAttrs["aria-label"] = `Grid area: ${runtimeItem.gridArea}`;
            }
            
            const hasResponsive = runtimeItem.enableResponsive || false;

            return (
                <div
                    key={`grid-item-${index}`}
                    data-grid-index={index}
                    data-grid-item={itemName}
                    data-placement={getPlacementInfo(runtimeItem)}
                    data-responsive={hasResponsive}
                    className={itemClasses.join(' ')}
                    style={itemStyles}
                    {...itemAriaAttrs}
                >
                    {runtimeItem.content}
                </div>
            );
        });
    }, [items, visibleItems, enableVirtualization, virtualizeThreshold, isInitialized, 
        enableBreakpoints, useNamedAreas, getAllDefinedAreas, getActiveGridConfig,
        getActiveItemPlacement, getItemVariableName, buildItemCSSVariables, getPlacementInfo]);

    /**
     * Container class names
     * Builds the complete class list for the grid container
     */
    const containerClassName = useMemo(() => {
        const classes = [
            'mx-css-grid',
            `mx-grid-${activeBreakpointSize}`,
            className
        ];
        
        // Add responsive modifier if enabled
        if (enableBreakpoints) {
            classes.push('mx-css-grid--responsive');
            
            // Add enabled breakpoint classes
            BREAKPOINT_CONFIGS.forEach(config => {
                const enabledKey = `${config.size}Enabled` as keyof RuntimeGridContainer;
                if (runtimeProps[enabledKey]) {
                    classes.push(`mx-grid-has-${config.size}`);
                }
            });
        }
        
        return classes.filter(Boolean).join(' ');
    }, [activeBreakpointSize, className, enableBreakpoints, runtimeProps]);

    /**
     * Container data attributes
     * Provides metadata about the grid state
     */
    const containerDataAttributes = useMemo(() => {
        const attrs: Record<string, string | number | undefined> = {
            'data-breakpoint': activeBreakpointSize,
            'data-item-count': items.length
        };
        
        if (enableVirtualization && items.length >= (virtualizeThreshold || DEFAULT_VIRTUALIZATION_THRESHOLD)) {
            attrs['data-virtualized'] = 'true';
        }
        
        if (enableBreakpoints) {
            attrs['data-responsive'] = 'true';
        }
        
        return attrs;
    }, [activeBreakpointSize, items.length, enableVirtualization, virtualizeThreshold, enableBreakpoints]);

    /**
     * Determine appropriate ARIA role
     * Uses semantic roles for better accessibility
     */
    const containerRole = useMemo(() => {
        if (role) return role;
        return items.length > LARGE_GRID_THRESHOLD || useNamedAreas ? "grid" : "group";
    }, [role, items.length, useNamedAreas]);

    return (
        <div 
            ref={containerRef}
            className={containerClassName}
            style={containerStyles}
            tabIndex={tabIndex}
            role={containerRole}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
            {...containerDataAttributes}
        >
            {renderGridItems()}
        </div>
    );
}

CSSGrid.displayName = "CSSGrid";