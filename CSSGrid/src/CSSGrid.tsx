import { 
    ReactElement, 
    createElement, 
    CSSProperties, 
    useMemo, 
    useRef, 
    useEffect, 
    useState, 
    useCallback,
    useLayoutEffect 
} from "react";
import { CSSGridContainerProps } from "../typings/CSSGridProps";
import { 
    RuntimeGridItem,
    RuntimeGridContainer,
    GridItemPlacement
} from "./types/ConditionalTypes";
import { 
    getGridItemPlacement, 
    generateContainerBreakpointStyles,
    generateItemBreakpointStyles,
    parseGridAreas,
    getUniqueAreaNames
} from "./utils/gridHelpers";
import { 
    BreakpointSize, 
    getActiveBreakpoint,
    BREAKPOINT_CONFIGS 
} from "./utils/CSSGridTypes";
import "./ui/CSSGrid.css";

/**
 * CSS Grid Widget for Mendix
 * 
 * Cleaned up implementation with minimal, purposeful classes
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
    const styleElementRef = useRef<HTMLStyleElement | null>(null);
    const itemStyleElementRef = useRef<HTMLStyleElement | null>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // State management
    const [visibleItems, setVisibleItems] = useState<Set<number>>(() => new Set());
    const [currentWidth, setCurrentWidth] = useState<number>(window.innerWidth);
    const [activeBreakpointSize, setActiveBreakpointSize] = useState<BreakpointSize>('lg');
    const [isInitialized, setIsInitialized] = useState(false);

    /**
     * Generate unique widget identifier
     */
    const widgetId = useMemo(() => {
        const baseId = props.name || `grid-${Date.now()}`;
        return `mx-css-grid-${baseId.replace(/[^a-zA-Z0-9-]/g, '-')}`;
    }, [props.name]);

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
     * Validate that items using area placement have valid area names
     */
    const validateItemAreaPlacement = useCallback((item: RuntimeGridItem, areas?: string): boolean => {
        if (item.placementType === "area" && item.gridArea && useNamedAreas && areas) {
            const definedAreas = getUniqueAreaNames(parseGridAreas(areas));
            if (!definedAreas.includes(item.gridArea)) {
                console.warn(`[CSS Grid Widget] Grid area "${item.gridArea}" is not defined in template areas. Available areas: ${definedAreas.join(", ")}`);
                return false;
            }
        }
        return true;
    }, [useNamedAreas]);

    /**
     * Get active grid configuration based on current breakpoint
     */
    const getActiveGridConfig = useCallback(() => {
        // Helper to convert empty strings to undefined
        const normalizeValue = (value: string | undefined): string | undefined => {
            if (!value || value.trim() === "") return undefined;
            return value;
        };
        
        // Start with base configuration
        const baseConfig = {
            columns: gridTemplateColumns || "1fr",
            rows: gridTemplateRows || "auto",
            areas: useNamedAreas ? gridTemplateAreas : undefined,
            gap: normalizeValue(gap),
            rowGap: normalizeValue(rowGap),
            columnGap: normalizeValue(columnGap),
            autoFlow: autoFlow || "row",
            autoRows: autoRows || "auto",
            autoColumns: autoColumns || "auto",
            justifyItems: justifyItems || "stretch",
            alignItems: alignItems || "stretch",
            justifyContent: justifyContent || "start",
            alignContent: alignContent || "stretch",
            minHeight: normalizeValue(minHeight),
            maxHeight: normalizeValue(maxHeight),
            minWidth: normalizeValue(minWidth),
            maxWidth: normalizeValue(maxWidth)
        };
        
        // If breakpoints are not enabled, return base configuration
        if (!enableBreakpoints) {
            return baseConfig;
        }

        // Check each breakpoint from largest to smallest
        const sortedConfigs = [...BREAKPOINT_CONFIGS].reverse();
        
        for (const config of sortedConfigs) {
            if (currentWidth >= config.minWidth) {
                const enabledKey = `${config.size}Enabled` as keyof RuntimeGridContainer;
                
                if (runtimeProps[enabledKey]) {
                    const getBreakpointValue = (prop: string): string | undefined => {
                        const key = `${config.size}${prop}` as keyof RuntimeGridContainer;
                        return runtimeProps[key] as string | undefined;
                    };
                    
                    const activeAreas = useNamedAreas ? (getBreakpointValue('Areas') || gridTemplateAreas) : undefined;
                    
                    // Validate areas at this breakpoint
                    if (activeAreas && items) {
                        items.forEach(item => {
                            validateItemAreaPlacement(item as RuntimeGridItem, activeAreas);
                        });
                    }
                    
                    // Build responsive configuration, using base values as fallbacks
                    return {
                        columns: getBreakpointValue('Columns') || baseConfig.columns,
                        rows: getBreakpointValue('Rows') || baseConfig.rows,
                        areas: activeAreas,
                        // For gaps: responsive value > base value > undefined
                        gap: normalizeValue(getBreakpointValue('Gap')) || baseConfig.gap,
                        rowGap: normalizeValue(getBreakpointValue('RowGap')) || baseConfig.rowGap,
                        columnGap: normalizeValue(getBreakpointValue('ColumnGap')) || baseConfig.columnGap,
                        autoFlow: getBreakpointValue('AutoFlow') || baseConfig.autoFlow,
                        autoRows: getBreakpointValue('AutoRows') || baseConfig.autoRows,
                        autoColumns: getBreakpointValue('AutoColumns') || baseConfig.autoColumns,
                        justifyItems: getBreakpointValue('JustifyItems') || baseConfig.justifyItems,
                        alignItems: getBreakpointValue('AlignItems') || baseConfig.alignItems,
                        justifyContent: getBreakpointValue('JustifyContent') || baseConfig.justifyContent,
                        alignContent: getBreakpointValue('AlignContent') || baseConfig.alignContent,
                        minHeight: normalizeValue(getBreakpointValue('MinHeight')) || baseConfig.minHeight,
                        maxHeight: normalizeValue(getBreakpointValue('MaxHeight')) || baseConfig.maxHeight,
                        minWidth: normalizeValue(getBreakpointValue('MinWidth')) || baseConfig.minWidth,
                        maxWidth: normalizeValue(getBreakpointValue('MaxWidth')) || baseConfig.maxWidth
                    };
                }
            }
        }

        // If no matching breakpoint found, return base configuration
        return baseConfig;
    }, [enableBreakpoints, currentWidth, gridTemplateColumns, gridTemplateRows, gridTemplateAreas, gap, rowGap, columnGap, useNamedAreas, autoFlow, autoRows, autoColumns, justifyItems, alignItems, justifyContent, alignContent, minHeight, maxHeight, minWidth, maxWidth, runtimeProps, items, validateItemAreaPlacement]);

    /**
     * Calculate base grid styles with active configuration
     */
    const baseGridStyles = useMemo<CSSProperties>(() => {
        const activeConfig = getActiveGridConfig();
        
        const styles: CSSProperties = {
            display: "grid",
            gridTemplateColumns: activeConfig.columns,
            gridTemplateRows: activeConfig.rows,
            gridAutoFlow: cssEnumMappings.autoFlow[activeConfig.autoFlow] || activeConfig.autoFlow,
            gridAutoColumns: activeConfig.autoColumns,
            gridAutoRows: activeConfig.autoRows,
            justifyItems: activeConfig.justifyItems,
            alignItems: activeConfig.alignItems,
            justifyContent: cssEnumMappings.justifyContent[activeConfig.justifyContent] || activeConfig.justifyContent,
            alignContent: cssEnumMappings.alignContent[activeConfig.alignContent] || activeConfig.alignContent,
            minHeight: activeConfig.minHeight,
            maxHeight: activeConfig.maxHeight,
            minWidth: activeConfig.minWidth,
            maxWidth: activeConfig.maxWidth,
            ...style
        };

        // Handle gap properties with proper priority
        if (activeConfig.gap !== undefined) {
            styles.gap = activeConfig.gap;
        } else if (activeConfig.rowGap !== undefined || activeConfig.columnGap !== undefined) {
            styles.rowGap = activeConfig.rowGap || "0";
            styles.columnGap = activeConfig.columnGap || "0";
        } else {
            styles.gap = "0";
        }

        // Add named areas if enabled
        if (useNamedAreas && activeConfig.areas) {
            styles.gridTemplateAreas = activeConfig.areas;
        }

        // Center the grid if max-width is set
        if (activeConfig.maxWidth) {
            styles.marginLeft = "auto";
            styles.marginRight = "auto";
        }

        return styles;
    }, [getActiveGridConfig, useNamedAreas, style, cssEnumMappings]);

    /**
     * Generate and inject responsive styles for container
     */
    const responsiveStyles = useMemo(() => {
        if (!enableBreakpoints) {
            return null;
        }

        return generateContainerBreakpointStyles(runtimeProps, `.${widgetId}`, useNamedAreas);
    }, [enableBreakpoints, runtimeProps, widgetId, useNamedAreas]);

    /**
     * Generate per-item responsive styles
     */
    const itemResponsiveStyles = useMemo(() => {
        const runtimeItems = items as RuntimeGridItem[];
        const itemsWithResponsive = runtimeItems.filter(item => item.enableResponsive);
        if (itemsWithResponsive.length === 0) {
            return null;
        }

        return generateItemBreakpointStyles(runtimeItems, widgetId);
    }, [items, widgetId]);

    // Inject responsive styles into document head with optimization
    useLayoutEffect(() => {
        // Container styles
        if (!responsiveStyles) {
            if (styleElementRef.current) {
                styleElementRef.current.remove();
                styleElementRef.current = null;
            }
        } else {
            if (!styleElementRef.current) {
                styleElementRef.current = document.createElement('style');
                styleElementRef.current.setAttribute('data-widget-styles', widgetId);
                document.head.appendChild(styleElementRef.current);
            }
            // Only update if content has changed
            if (styleElementRef.current.textContent !== responsiveStyles) {
                styleElementRef.current.textContent = responsiveStyles;
            }
        }

        return () => {
            if (styleElementRef.current) {
                styleElementRef.current.remove();
                styleElementRef.current = null;
            }
        };
    }, [responsiveStyles, widgetId]);

    // Inject item responsive styles with optimization
    useLayoutEffect(() => {
        if (!itemResponsiveStyles) {
            if (itemStyleElementRef.current) {
                itemStyleElementRef.current.remove();
                itemStyleElementRef.current = null;
            }
        } else {
            if (!itemStyleElementRef.current) {
                itemStyleElementRef.current = document.createElement('style');
                itemStyleElementRef.current.setAttribute('data-widget-item-styles', widgetId);
                document.head.appendChild(itemStyleElementRef.current);
            }
            // Only update if content has changed
            if (itemStyleElementRef.current.textContent !== itemResponsiveStyles) {
                itemStyleElementRef.current.textContent = itemResponsiveStyles;
            }
        }

        return () => {
            if (itemStyleElementRef.current) {
                itemStyleElementRef.current.remove();
                itemStyleElementRef.current = null;
            }
        };
    }, [itemResponsiveStyles, widgetId]);

    /**
     * Handle responsive breakpoint changes with debouncing
     */
    useEffect(() => {
        const updateBreakpoint = () => {
            const width = window.innerWidth;
            setCurrentWidth(width);
            
            // Update active breakpoint size
            const newBreakpointSize = getActiveBreakpoint(width);
            setActiveBreakpointSize(newBreakpointSize);
        };

        const debouncedUpdate = () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
            resizeTimeoutRef.current = setTimeout(updateBreakpoint, 150);
        };

        // Initial update
        updateBreakpoint();

        // Add resize listener with debouncing
        window.addEventListener("resize", debouncedUpdate);
        
        return () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
            window.removeEventListener("resize", debouncedUpdate);
        };
    }, []);

    /**
     * Get active placement for item based on current breakpoint
     */
    const getActiveItemPlacement = useCallback((item: RuntimeGridItem): GridItemPlacement => {
        if (!item.enableResponsive) {
            return {
                placementType: item.placementType,
                gridArea: item.gridArea,
                columnStart: item.columnStart,
                columnEnd: item.columnEnd,
                rowStart: item.rowStart,
                rowEnd: item.rowEnd
            };
        }

        // Check each breakpoint from largest to smallest using BREAKPOINT_CONFIGS
        const sortedConfigs = [...BREAKPOINT_CONFIGS].reverse();
        
        for (const config of sortedConfigs) {
            const enabledKey = `${config.size}Enabled` as keyof RuntimeGridItem;
            
            if (item[enabledKey] && currentWidth >= config.minWidth) {
                const prefix = config.size;
                
                // Type-safe property access
                const getBreakpointValue = (prop: string): string | undefined => {
                    const key = `${prefix}${prop}` as keyof RuntimeGridItem;
                    return item[key] as string | undefined;
                };
                
                return {
                    placementType: getBreakpointValue('PlacementType') || item.placementType,
                    gridArea: getBreakpointValue('GridArea') || item.gridArea,
                    columnStart: getBreakpointValue('ColumnStart') || item.columnStart,
                    columnEnd: getBreakpointValue('ColumnEnd') || item.columnEnd,
                    rowStart: getBreakpointValue('RowStart') || item.rowStart,
                    rowEnd: getBreakpointValue('RowEnd') || item.rowEnd
                };
            }
        }

        // Fallback to default placement
        return {
            placementType: item.placementType,
            gridArea: item.gridArea,
            columnStart: item.columnStart,
            columnEnd: item.columnEnd,
            rowStart: item.rowStart,
            rowEnd: item.rowEnd
        };
    }, [currentWidth]);

    /**
     * Virtualization setup with Intersection Observer
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
     * Render individual grid items with minimal classes
     */
    const renderGridItems = useCallback(() => {
        const shouldVirtualize = enableVirtualization && items.length >= (virtualizeThreshold || 100);

        return items.map((item, index) => {
            const isVisible = !shouldVirtualize || visibleItems.has(index) || !isInitialized;
            
            // Cast item to RuntimeGridItem for type safety
            const runtimeItem = item as RuntimeGridItem;
            
            // Get active placement based on current breakpoint
            const activePlacement = getActiveItemPlacement(runtimeItem);
            
            // Calculate item styles using the utility function
            const itemStyles: CSSProperties = {
                justifySelf: runtimeItem.justifySelf !== "auto" ? runtimeItem.justifySelf : undefined,
                alignSelf: runtimeItem.alignSelf !== "auto" ? runtimeItem.alignSelf : undefined,
                zIndex: runtimeItem.zIndex || undefined,
                ...getGridItemPlacement(activePlacement, useNamedAreas)
            };

            // Build minimal item classes
            const itemClasses = ['mx-grid-item'];
            
            // Only add responsive class if item has breakpoint overrides
            if (runtimeItem.enableResponsive) {
                itemClasses.push(`${widgetId}-item-${index}`);
            }
            
            // Add user's custom classes
            if (runtimeItem.className) {
                itemClasses.push(runtimeItem.className);
            }
            
            // Add dynamic classes from expressions
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

            // Determine ARIA attributes
            const itemAriaAttrs: Record<string, string | undefined> = {};
            if (activePlacement.placementType === "area" && activePlacement.gridArea && useNamedAreas) {
                itemAriaAttrs.role = "region";
                itemAriaAttrs["aria-label"] = `Grid area: ${activePlacement.gridArea}`;
            }

            return (
                <div
                    key={`grid-item-${index}`}
                    data-grid-index={index}
                    data-item-name={runtimeItem.itemName || undefined}
                    data-placement={activePlacement.placementType}
                    className={itemClasses.join(' ')}
                    style={itemStyles}
                    {...itemAriaAttrs}
                >
                    {runtimeItem.content}
                </div>
            );
        });
    }, [items, visibleItems, enableVirtualization, virtualizeThreshold, isInitialized, 
        getActiveItemPlacement, widgetId, useNamedAreas]);

    /**
     * Container class names - minimal approach
     */
    const containerClassName = useMemo(() => {
        const classes = [
            'mx-css-grid',
            widgetId,
            `mx-grid-${activeBreakpointSize}`, // Current breakpoint only
            className // User's custom class
        ].filter(Boolean);
        
        return classes.join(' ');
    }, [widgetId, activeBreakpointSize, className]);

    /**
     * Container data attributes for optional metadata
     */
    const containerDataAttributes = useMemo(() => {
        const attrs: Record<string, string | number | undefined> = {
            'data-breakpoint': activeBreakpointSize,
            'data-item-count': items.length
        };
        
        // Only add virtualization flag if actually virtualized
        if (enableVirtualization && items.length >= (virtualizeThreshold || 100)) {
            attrs['data-virtualized'] = 'true';
        }
        
        return attrs;
    }, [activeBreakpointSize, items.length, enableVirtualization, virtualizeThreshold]);

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
            style={baseGridStyles}
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

// Display name for debugging
CSSGrid.displayName = "CSSGrid";