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
 * CSS Grid Widget for Mendix - Production Grade Implementation
 * 
 * Key principles:
 * 1. Use CSS custom properties (CSS variables) for responsive values
 * 2. Keep styles with the component using inline styles
 * 3. Use data attributes for responsive behavior hooks
 * 4. No global style injection
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
     */
    const normalizeValue = useCallback((value: string | undefined): string | undefined => {
        if (!value || value.trim() === "") return undefined;
        return value;
    }, []);

    /**
     * Map enumeration values to CSS properties
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
     * Build CSS custom properties for responsive values
     * This allows us to use CSS media queries in the stylesheet while keeping values dynamic
     */
    const buildResponsiveCSSVariables = useCallback((): Record<string, string | undefined> => {
        const cssVars: Record<string, string | undefined> = {};

        // Helper to check if a value is a CSS default that can be omitted
        const isDefaultValue = (prop: string, value: any): boolean => {
            if (!value) return true;
            
            switch (prop) {
                case 'rows':
                case 'autoRows':
                case 'autoColumns':
                    return value === 'auto';
                case 'justifyItems':
                case 'alignItems':
                    return value === 'stretch';
                case 'justifyContent':
                case 'alignContent':
                    return value === 'start' || value === 'stretch';
                case 'autoFlow':
                    return value === 'row';
                case 'rowGap':
                case 'columnGap':
                    return value === '0';
                default:
                    return false;
            }
        };

        // Base configuration - only set non-default values
        const baseColumns = normalizeValue(gridTemplateColumns) || '1fr';
        if (baseColumns !== '1fr') {
            cssVars['--grid-columns'] = baseColumns;
        }
        
        const baseRows = normalizeValue(gridTemplateRows);
        if (baseRows && !isDefaultValue('rows', baseRows)) {
            cssVars['--grid-rows'] = baseRows;
        }
        
        // Handle gap with normalization
        const normalizedGap = normalizeValue(gap);
        const normalizedRowGap = normalizeValue(rowGap);
        const normalizedColumnGap = normalizeValue(columnGap);
        
        if (normalizedGap) {
            cssVars['--grid-gap'] = normalizedGap;
        } else {
            if (normalizedRowGap && !isDefaultValue('rowGap', normalizedRowGap)) {
                cssVars['--grid-row-gap'] = normalizedRowGap;
            }
            if (normalizedColumnGap && !isDefaultValue('columnGap', normalizedColumnGap)) {
                cssVars['--grid-column-gap'] = normalizedColumnGap;
            }
        }
        
        // Only set non-default values
        const mappedAutoFlow = cssEnumMappings.autoFlow[autoFlow || 'row'] || autoFlow;
        if (mappedAutoFlow && !isDefaultValue('autoFlow', autoFlow)) {
            cssVars['--grid-auto-flow'] = mappedAutoFlow;
        }
        
        const normalizedAutoRows = normalizeValue(autoRows);
        if (normalizedAutoRows && !isDefaultValue('autoRows', normalizedAutoRows)) {
            cssVars['--grid-auto-rows'] = normalizedAutoRows;
        }
        
        const normalizedAutoColumns = normalizeValue(autoColumns);
        if (normalizedAutoColumns && !isDefaultValue('autoColumns', normalizedAutoColumns)) {
            cssVars['--grid-auto-columns'] = normalizedAutoColumns;
        }
        
        if (justifyItems && !isDefaultValue('justifyItems', justifyItems)) {
            cssVars['--grid-justify-items'] = justifyItems;
        }
        
        if (alignItems && !isDefaultValue('alignItems', alignItems)) {
            cssVars['--grid-align-items'] = alignItems;
        }
        
        const mappedJustifyContent = cssEnumMappings.justifyContent[justifyContent || 'start'] || justifyContent;
        if (mappedJustifyContent && !isDefaultValue('justifyContent', justifyContent)) {
            cssVars['--grid-justify-content'] = mappedJustifyContent;
        }
        
        const mappedAlignContent = cssEnumMappings.alignContent[alignContent || 'stretch'] || alignContent;
        if (mappedAlignContent && !isDefaultValue('alignContent', alignContent)) {
            cssVars['--grid-align-content'] = mappedAlignContent;
        }
        
        // Size constraints are always set if defined
        cssVars['--grid-min-height'] = normalizeValue(minHeight);
        cssVars['--grid-max-height'] = normalizeValue(maxHeight);
        cssVars['--grid-min-width'] = normalizeValue(minWidth);
        cssVars['--grid-max-width'] = normalizeValue(maxWidth);
        
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
                    const bpRows = getBreakpointValue('Rows');
                    const bpGap = getBreakpointValue('Gap');
                    const bpRowGap = getBreakpointValue('RowGap');
                    const bpColumnGap = getBreakpointValue('ColumnGap');
                    const bpAutoFlow = runtimeProps[`${config.size}AutoFlow` as keyof RuntimeGridContainer] as AutoFlowEnum | undefined;
                    const bpAutoRows = getBreakpointValue('AutoRows');
                    const bpAutoColumns = getBreakpointValue('AutoColumns');
                    const bpJustifyItems = runtimeProps[`${config.size}JustifyItems` as keyof RuntimeGridContainer] as JustifyItemsEnum | undefined;
                    const bpAlignItems = runtimeProps[`${config.size}AlignItems` as keyof RuntimeGridContainer] as AlignItemsEnum | undefined;
                    const bpJustifyContent = runtimeProps[`${config.size}JustifyContent` as keyof RuntimeGridContainer] as JustifyContentEnum | undefined;
                    const bpAlignContent = runtimeProps[`${config.size}AlignContent` as keyof RuntimeGridContainer] as AlignContentEnum | undefined;
                    const bpMinHeight = getBreakpointValue('MinHeight');
                    const bpMaxHeight = getBreakpointValue('MaxHeight');
                    const bpMinWidth = getBreakpointValue('MinWidth');
                    const bpMaxWidth = getBreakpointValue('MaxWidth');
                    
                    // Always set columns if defined (common override)
                    if (bpColumns) cssVars[`--grid-${config.size}-columns`] = bpColumns;
                    
                    if (bpRows && !isDefaultValue('rows', bpRows)) {
                        cssVars[`--grid-${config.size}-rows`] = bpRows;
                    }
                    
                    if (bpGap) {
                        cssVars[`--grid-${config.size}-gap`] = bpGap;
                    } else {
                        if (bpRowGap && !isDefaultValue('rowGap', bpRowGap)) {
                            cssVars[`--grid-${config.size}-row-gap`] = bpRowGap;
                        }
                        if (bpColumnGap && !isDefaultValue('columnGap', bpColumnGap)) {
                            cssVars[`--grid-${config.size}-column-gap`] = bpColumnGap;
                        }
                    }
                    
                    if (bpAutoFlow) {
                        const mapped = cssEnumMappings.autoFlow[bpAutoFlow] || bpAutoFlow;
                        if (!isDefaultValue('autoFlow', bpAutoFlow)) {
                            cssVars[`--grid-${config.size}-auto-flow`] = mapped;
                        }
                    }
                    
                    if (bpAutoRows && !isDefaultValue('autoRows', bpAutoRows)) {
                        cssVars[`--grid-${config.size}-auto-rows`] = bpAutoRows;
                    }
                    
                    if (bpAutoColumns && !isDefaultValue('autoColumns', bpAutoColumns)) {
                        cssVars[`--grid-${config.size}-auto-columns`] = bpAutoColumns;
                    }
                    
                    if (bpJustifyItems && !isDefaultValue('justifyItems', bpJustifyItems)) {
                        cssVars[`--grid-${config.size}-justify-items`] = bpJustifyItems;
                    }
                    
                    if (bpAlignItems && !isDefaultValue('alignItems', bpAlignItems)) {
                        cssVars[`--grid-${config.size}-align-items`] = bpAlignItems;
                    }
                    
                    if (bpJustifyContent) {
                        const mapped = cssEnumMappings.justifyContent[bpJustifyContent] || bpJustifyContent;
                        if (!isDefaultValue('justifyContent', bpJustifyContent)) {
                            cssVars[`--grid-${config.size}-justify-content`] = mapped;
                        }
                    }
                    
                    if (bpAlignContent) {
                        const mapped = cssEnumMappings.alignContent[bpAlignContent] || bpAlignContent;
                        if (!isDefaultValue('alignContent', bpAlignContent)) {
                            cssVars[`--grid-${config.size}-align-content`] = mapped;
                        }
                    }
                    
                    // Size constraints always set if defined
                    if (bpMinHeight) cssVars[`--grid-${config.size}-min-height`] = bpMinHeight;
                    if (bpMaxHeight) cssVars[`--grid-${config.size}-max-height`] = bpMaxHeight;
                    if (bpMinWidth) cssVars[`--grid-${config.size}-min-width`] = bpMinWidth;
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
            resizeTimeoutRef.current = setTimeout(updateBreakpoint, 150);
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
     * Build CSS variables for responsive items
     */
    const buildItemCSSVariables = useCallback((item: RuntimeGridItem, index: number): Record<string, string> => {
        const cssVars: Record<string, string> = {};
        
        if (!item.enableResponsive || !enableBreakpoints) {
            return cssVars;
        }

        // Add base placement as CSS variables
        const basePlacement = {
            placementType: item.placementType,
            gridArea: normalizeValue(item.gridArea),
            columnStart: normalizeValue(item.columnStart),
            columnEnd: normalizeValue(item.columnEnd),
            rowStart: normalizeValue(item.rowStart),
            rowEnd: normalizeValue(item.rowEnd)
        };

        // Set base variables
        cssVars[`--item-${index}-placement`] = basePlacement.placementType;
        if (basePlacement.gridArea) cssVars[`--item-${index}-area`] = basePlacement.gridArea;
        if (basePlacement.columnStart) cssVars[`--item-${index}-col-start`] = basePlacement.columnStart;
        if (basePlacement.columnEnd) cssVars[`--item-${index}-col-end`] = basePlacement.columnEnd;
        if (basePlacement.rowStart) cssVars[`--item-${index}-row-start`] = basePlacement.rowStart;
        if (basePlacement.rowEnd) cssVars[`--item-${index}-row-end`] = basePlacement.rowEnd;

        // Add breakpoint-specific variables
        BREAKPOINT_CONFIGS.forEach(config => {
            const enabledKey = `${config.size}Enabled` as keyof RuntimeGridItem;
            
            if (item[enabledKey]) {
                const placementType = item[`${config.size}PlacementType` as keyof RuntimeGridItem] as string;
                const gridArea = normalizeValue(item[`${config.size}GridArea` as keyof RuntimeGridItem] as string);
                const colStart = normalizeValue(item[`${config.size}ColumnStart` as keyof RuntimeGridItem] as string);
                const colEnd = normalizeValue(item[`${config.size}ColumnEnd` as keyof RuntimeGridItem] as string);
                const rowStart = normalizeValue(item[`${config.size}RowStart` as keyof RuntimeGridItem] as string);
                const rowEnd = normalizeValue(item[`${config.size}RowEnd` as keyof RuntimeGridItem] as string);
                
                if (placementType) cssVars[`--item-${index}-${config.size}-placement`] = placementType;
                if (gridArea) cssVars[`--item-${index}-${config.size}-area`] = gridArea;
                if (colStart) cssVars[`--item-${index}-${config.size}-col-start`] = colStart;
                if (colEnd) cssVars[`--item-${index}-${config.size}-col-end`] = colEnd;
                if (rowStart) cssVars[`--item-${index}-${config.size}-row-start`] = rowStart;
                if (rowEnd) cssVars[`--item-${index}-${config.size}-row-end`] = rowEnd;
            }
        });

        return cssVars;
    }, [enableBreakpoints, normalizeValue]);

    /**
     * Virtualization setup
     */
    const setupVirtualization = useCallback(() => {
        const shouldVirtualize = enableVirtualization && 
                               items.length >= (virtualizeThreshold || 100) && 
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
                            const buffer = 5;
                            const sortedIndices = Array.from(newSet).sort((a, b) => a - b);
                            const minVisible = sortedIndices[0] || 0;
                            const maxVisible = sortedIndices[sortedIndices.length - 1] || 0;
                            
                            if (index < minVisible - buffer || index > maxVisible + buffer) {
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
                rootMargin: "100px",
                threshold: 0.01
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
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [setupVirtualization]);

    /**
     * Render grid items
     */
    const renderGridItems = useCallback(() => {
        const shouldVirtualize = enableVirtualization && items.length >= (virtualizeThreshold || 100);
        const allDefinedAreas = getAllDefinedAreas();
        const activeConfig = getActiveGridConfig();

        return items.map((item, index) => {
            const isVisible = !shouldVirtualize || visibleItems.has(index) || !isInitialized;
            const runtimeItem = item as RuntimeGridItem;
            
            // Build base styles
            let itemStyles: CSSProperties = {
                justifySelf: runtimeItem.justifySelf !== "auto" ? runtimeItem.justifySelf : undefined,
                alignSelf: runtimeItem.alignSelf !== "auto" ? runtimeItem.alignSelf : undefined,
                zIndex: runtimeItem.zIndex || undefined
            };
            
            // Handle placement based on responsive settings
            if (runtimeItem.enableResponsive && enableBreakpoints) {
                // Add CSS variables for responsive items
                const itemCssVars = buildItemCSSVariables(runtimeItem, index);
                itemStyles = {
                    ...itemStyles,
                    ...itemCssVars
                } as CSSProperties;
            } else {
                // Non-responsive items or responsive disabled
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
            
            // Add responsive class if item has responsive settings
            if (runtimeItem.enableResponsive && enableBreakpoints) {
                itemClasses.push('mx-grid-item--responsive');
                itemClasses.push(`mx-grid-item--${index}`);
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

            return (
                <div
                    key={`grid-item-${index}`}
                    data-grid-index={index}
                    data-item-name={runtimeItem.itemName || undefined}
                    data-placement={runtimeItem.placementType}
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
        getActiveItemPlacement, buildItemCSSVariables]);

    /**
     * Container class names
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
     */
    const containerDataAttributes = useMemo(() => {
        const attrs: Record<string, string | number | undefined> = {
            'data-breakpoint': activeBreakpointSize,
            'data-item-count': items.length
        };
        
        if (enableVirtualization && items.length >= (virtualizeThreshold || 100)) {
            attrs['data-virtualized'] = 'true';
        }
        
        if (enableBreakpoints) {
            attrs['data-responsive'] = 'true';
        }
        
        return attrs;
    }, [activeBreakpointSize, items.length, enableVirtualization, virtualizeThreshold, enableBreakpoints]);

    /**
     * Determine appropriate ARIA role
     */
    const containerRole = useMemo(() => {
        if (role) return role;
        return items.length > 10 || useNamedAreas ? "grid" : "group";
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