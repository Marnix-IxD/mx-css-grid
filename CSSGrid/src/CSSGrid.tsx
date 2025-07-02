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
    getGridItemPlacement, 
    generateContainerBreakpointStyles,
    generateItemBreakpointStyles
} from "./utils/gridHelpers";
import { 
    BreakpointSize, 
    getActiveBreakpoint, 
    getActiveBreakpointClasses,
    BREAKPOINT_CONFIGS 
} from "./utils/CSSGridTypes";
import "./ui/CSSGrid.css";

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
};

// Use type intersection to combine base item type with responsive properties
type ResponsiveItemType = {
    // Base properties (these should match what's in the auto-generated types)
    itemName?: string;
    content: any;
    className?: string;
    dynamicClass?: any; // This will be a DynamicValue<string> from Mendix
    placementType: string;
    gridArea?: string;
    columnStart: string;
    columnEnd: string;
    rowStart: string;
    rowEnd: string;
    justifySelf: string;
    alignSelf: string;
    zIndex?: number;
    enableResponsive: boolean;
} & ResponsiveProperties;

/**
 * CSS Grid Widget for Mendix
 * 
 * Production-grade implementation with:
 * - Container-level responsive breakpoints
 * - Per-item responsive placement
 * - Named grid areas with validation
 * - Auto-placement with configurable flow
 * - Virtualization for performance
 * - Full accessibility support
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
     * Get active grid configuration based on current breakpoint
     */
    const getActiveGridConfig = useCallback(() => {
        if (!enableBreakpoints) {
            return {
                columns: gridTemplateColumns || "1fr",
                rows: gridTemplateRows || "auto",
                areas: useNamedAreas ? gridTemplateAreas : undefined,
                gap: gap || undefined,
                rowGap: rowGap || undefined,
                columnGap: columnGap || undefined
            };
        }

        // Check each breakpoint from largest to smallest
        const sortedConfigs = [...BREAKPOINT_CONFIGS].reverse();
        
        for (const config of sortedConfigs) {
            if (currentWidth >= config.minWidth) {
                const enabledKey = `${config.size}Enabled` as keyof CSSGridContainerProps;
                
                if (props[enabledKey]) {
                    const getBreakpointValue = (prop: string): string | undefined => {
                        const key = `${config.size}${prop}` as keyof CSSGridContainerProps;
                        return props[key] as string | undefined;
                    };
                    
                    return {
                        columns: getBreakpointValue('Columns') || gridTemplateColumns || "1fr",
                        rows: getBreakpointValue('Rows') || gridTemplateRows || "auto",
                        areas: useNamedAreas ? (getBreakpointValue('Areas') || gridTemplateAreas) : undefined,
                        gap: getBreakpointValue('Gap') || gap || undefined,
                        rowGap: getBreakpointValue('RowGap') || rowGap || undefined,
                        columnGap: getBreakpointValue('ColumnGap') || columnGap || undefined,
                        autoFlow: getBreakpointValue('AutoFlow') || autoFlow,
                        autoRows: getBreakpointValue('AutoRows') || autoRows,
                        autoColumns: getBreakpointValue('AutoColumns') || autoColumns,
                        justifyItems: getBreakpointValue('JustifyItems') || justifyItems,
                        alignItems: getBreakpointValue('AlignItems') || alignItems,
                        justifyContent: getBreakpointValue('JustifyContent') || justifyContent,
                        alignContent: getBreakpointValue('AlignContent') || alignContent,
                        minHeight: getBreakpointValue('MinHeight') || minHeight,
                        maxHeight: getBreakpointValue('MaxHeight') || maxHeight,
                        minWidth: getBreakpointValue('MinWidth') || minWidth,
                        maxWidth: getBreakpointValue('MaxWidth') || maxWidth
                    };
                }
            }
        }

        // Fallback to default configuration
        return {
            columns: gridTemplateColumns || "1fr",
            rows: gridTemplateRows || "auto",
            areas: useNamedAreas ? gridTemplateAreas : undefined,
            gap: gap || undefined,
            rowGap: rowGap || undefined,
            columnGap: columnGap || undefined,
            autoFlow: autoFlow,
            autoRows: autoRows,
            autoColumns: autoColumns,
            justifyItems: justifyItems,
            alignItems: alignItems,
            justifyContent: justifyContent,
            alignContent: alignContent,
            minHeight: minHeight,
            maxHeight: maxHeight,
            minWidth: minWidth,
            maxWidth: maxWidth
        };
    }, [enableBreakpoints, currentWidth, gridTemplateColumns, gridTemplateRows, gridTemplateAreas, gap, rowGap, columnGap, useNamedAreas, autoFlow, autoRows, autoColumns, justifyItems, alignItems, justifyContent, alignContent, minHeight, maxHeight, minWidth, maxWidth, props]);

    /**
     * Calculate base grid styles with active configuration
     */
    const baseGridStyles = useMemo<CSSProperties>(() => {
        const activeConfig = getActiveGridConfig();
        
        const styles: CSSProperties = {
            display: "grid",
            gridTemplateColumns: activeConfig.columns,
            gridTemplateRows: activeConfig.rows,
            gap: activeConfig.gap,
            rowGap: activeConfig.rowGap,
            columnGap: activeConfig.columnGap,
            gridAutoFlow: activeConfig.autoFlow ? (cssEnumMappings.autoFlow[activeConfig.autoFlow] || activeConfig.autoFlow) : "row",
            gridAutoColumns: activeConfig.autoColumns || "auto",
            gridAutoRows: activeConfig.autoRows || "auto",
            justifyItems: activeConfig.justifyItems || "stretch",
            alignItems: activeConfig.alignItems || "stretch",
            justifyContent: activeConfig.justifyContent ? (cssEnumMappings.justifyContent[activeConfig.justifyContent] || activeConfig.justifyContent) : "start",
            alignContent: activeConfig.alignContent ? (cssEnumMappings.alignContent[activeConfig.alignContent] || activeConfig.alignContent) : "stretch",
            minHeight: activeConfig.minHeight || undefined,
            maxHeight: activeConfig.maxHeight || undefined,
            minWidth: activeConfig.minWidth || undefined,
            maxWidth: activeConfig.maxWidth || undefined,
            ...style
        };

        // Add named areas if enabled - NO AUTOMATIC QUOTE ADDITION
        // Users should enter the value exactly as it would appear in CSS
        if (useNamedAreas && activeConfig.areas) {
            styles.gridTemplateAreas = activeConfig.areas;
        }

        // Center the grid if max-width is set
        if (maxWidth) {
            styles.marginLeft = "auto";
            styles.marginRight = "auto";
        }

        return styles;
    }, [getActiveGridConfig, useNamedAreas, autoFlow, autoColumns, autoRows, justifyItems, alignItems, justifyContent, alignContent, minHeight, maxHeight, minWidth, maxWidth, style, cssEnumMappings]);

    /**
     * Generate and inject responsive styles for container
     */
    const responsiveStyles = useMemo(() => {
        if (!enableBreakpoints) {
            return null;
        }

        return generateContainerBreakpointStyles(props, `.${widgetId}`, useNamedAreas);
    }, [enableBreakpoints, props, widgetId, useNamedAreas]);

    /**
     * Generate per-item responsive styles
     */
    const itemResponsiveStyles = useMemo(() => {
        const itemsWithResponsive = items.filter(item => item.enableResponsive);
        if (itemsWithResponsive.length === 0) {
            return null;
        }

        return generateItemBreakpointStyles(items, widgetId);
    }, [items, widgetId]);

    // Inject responsive styles into document head
    useLayoutEffect(() => {
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
            styleElementRef.current.textContent = responsiveStyles;
        }

        return () => {
            if (styleElementRef.current) {
                styleElementRef.current.remove();
                styleElementRef.current = null;
            }
        };
    }, [responsiveStyles, widgetId]);

    // Inject item responsive styles
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
            itemStyleElementRef.current.textContent = itemResponsiveStyles;
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
    const getActiveItemPlacement = useCallback((item: ResponsiveItemType) => {
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
            const enabledKey = `${config.size}Enabled` as keyof ResponsiveItemType;
            
            if (item[enabledKey] && currentWidth >= config.minWidth) {
                const prefix = config.size;
                
                // Type-safe property access
                const getBreakpointValue = (prop: string): string | undefined => {
                    const key = `${prefix}${prop}` as keyof ResponsiveItemType;
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
     * Render individual grid items with optimization
     * Updated to pass useNamedAreas to placement function
     */
    const renderGridItems = useCallback(() => {
        const shouldVirtualize = enableVirtualization && items.length >= (virtualizeThreshold || 100);

        return items.map((item, index) => {
            const isVisible = !shouldVirtualize || visibleItems.has(index) || !isInitialized;
            
            // Cast item to ResponsiveItemType for type safety
            const responsiveItem = item as ResponsiveItemType;
            
            // Get active placement based on current breakpoint
            const activePlacement = getActiveItemPlacement(responsiveItem);
            
            // Calculate item styles using the utility function with useNamedAreas parameter
            const itemStyles: CSSProperties = {
                justifySelf: responsiveItem.justifySelf !== "auto" ? responsiveItem.justifySelf : undefined,
                alignSelf: responsiveItem.alignSelf !== "auto" ? responsiveItem.alignSelf : undefined,
                zIndex: responsiveItem.zIndex || undefined,
                ...getGridItemPlacement(activePlacement, useNamedAreas) // Pass useNamedAreas here
            };

            // Get dynamic class value if it exists
            const dynamicClassName = responsiveItem.dynamicClass?.value || "";
            
            const itemClassName = [
                "mx-css-grid-item", 
                responsiveItem.className,
                dynamicClassName,
                responsiveItem.enableResponsive ? `${widgetId}-item-${index}` : null,
                responsiveItem.enableResponsive ? `mx-css-grid-item--responsive` : null
            ].filter(Boolean).join(" ");
            
            // Render placeholder for non-visible virtualized items
            if (shouldVirtualize && !isVisible) {
                return (
                    <div
                        key={`grid-item-${index}`}
                        data-grid-index={index}
                        className={`${itemClassName} mx-css-grid-placeholder`}
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
                    data-item-name={responsiveItem.itemName || undefined}
                    data-breakpoint={activeBreakpointSize}
                    className={itemClassName}
                    style={itemStyles}
                    {...itemAriaAttrs}
                >
                    {responsiveItem.content}
                </div>
            );
        });
    }, [items, visibleItems, enableVirtualization, virtualizeThreshold, isInitialized, getActiveItemPlacement, widgetId, activeBreakpointSize, useNamedAreas]);

    /**
     * Container class names with responsive identifier
     */
    const containerClassName = useMemo(() => {
        const classes = ["mx-css-grid", widgetId, className];
        
        // Add state classes
        if (enableVirtualization && items.length >= (virtualizeThreshold || 100)) {
            classes.push("mx-css-grid--virtualized");
        }
        if (enableBreakpoints) {
            classes.push("mx-css-grid--responsive");
        }
        if (useNamedAreas) {
            classes.push("mx-css-grid--named-areas");
        }
        
        // Add dynamic breakpoint classes
        const breakpointClasses = getActiveBreakpointClasses(currentWidth);
        classes.push(...breakpointClasses);
        
        return classes.filter(Boolean).join(" ");
    }, [className, widgetId, enableVirtualization, items.length, virtualizeThreshold, enableBreakpoints, useNamedAreas, currentWidth]);

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
            data-breakpoint-size={activeBreakpointSize}
            data-item-count={items.length}
        >
            {renderGridItems()}
        </div>
    );
}

// Display name for debugging
CSSGrid.displayName = "CSSGrid";