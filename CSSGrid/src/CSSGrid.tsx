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
    generateBreakpointStyles,
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
 * - Enhanced responsive system with 6 breakpoints
 * - Dynamic CSS classes based on active breakpoint
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
        breakpoints,
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
    const [currentBreakpoint, setCurrentBreakpoint] = useState<number | null>(null);
    const [currentWidth, setCurrentWidth] = useState<number>(window.innerWidth);
    const [activeBreakpointSize, setActiveBreakpointSize] = useState<BreakpointSize>('lg');
    const [isInitialized, setIsInitialized] = useState(false);
    const [debugMode, setDebugMode] = useState(false);

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
        },
        justifyContent: {
            'start': 'start',
            'end': 'end',
            'center': 'center',
            'stretch': 'stretch',
            'spaceBetween': 'space-between',
            'spaceAround': 'space-around',
            'spaceEvenly': 'space-evenly'
        },
        alignContent: {
            'start': 'start',
            'end': 'end',
            'center': 'center',
            'stretch': 'stretch',
            'spaceBetween': 'space-between',
            'spaceAround': 'space-around',
            'spaceEvenly': 'space-evenly'
        }
    }), []);

    /**
     * Calculate base grid styles with memoization
     */
    const baseGridStyles = useMemo<CSSProperties>(() => {
        const styles: CSSProperties = {
            display: "grid",
            gridTemplateColumns: gridTemplateColumns || "1fr",
            gridTemplateRows: gridTemplateRows || "auto",
            gap: gap || undefined,
            rowGap: rowGap || undefined,
            columnGap: columnGap || undefined,
            gridAutoFlow: cssEnumMappings.autoFlow[autoFlow] || "row",
            gridAutoColumns: autoColumns || "auto",
            gridAutoRows: autoRows || "auto",
            justifyItems: justifyItems || "stretch",
            alignItems: alignItems || "stretch",
            justifyContent: cssEnumMappings.justifyContent[justifyContent] || "start",
            alignContent: cssEnumMappings.alignContent[alignContent] || "start",
            minHeight: minHeight || undefined,
            maxHeight: maxHeight || undefined,
            minWidth: minWidth || undefined,
            maxWidth: maxWidth || undefined,
            ...style
        };

        // Add named areas if enabled
        if (useNamedAreas && gridTemplateAreas) {
            styles.gridTemplateAreas = gridTemplateAreas;
        }

        // Center the grid if max-width is set
        if (maxWidth) {
            styles.marginLeft = "auto";
            styles.marginRight = "auto";
        }

        return styles;
    }, [
        gridTemplateColumns,
        gridTemplateRows,
        gap,
        rowGap,
        columnGap,
        useNamedAreas,
        gridTemplateAreas,
        autoFlow,
        autoColumns,
        autoRows,
        justifyItems,
        alignItems,
        justifyContent,
        alignContent,
        minHeight,
        maxHeight,
        minWidth,
        maxWidth,
        style,
        cssEnumMappings
    ]);

    /**
     * Generate and inject responsive styles
     */
    const responsiveStyles = useMemo(() => {
        if (!enableBreakpoints || !breakpoints || breakpoints.length === 0) {
            return null;
        }

        return generateBreakpointStyles(breakpoints, `.${widgetId}`, useNamedAreas);
    }, [enableBreakpoints, breakpoints, widgetId, useNamedAreas]);

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
            
            if (!enableBreakpoints || !breakpoints || breakpoints.length === 0) return;
            
            const sortedBreakpoints = [...breakpoints].sort((a, b) => b.minWidth - a.minWidth);
            const activeBreakpoint = sortedBreakpoints.findIndex(bp => width >= bp.minWidth);
            setCurrentBreakpoint(activeBreakpoint >= 0 ? activeBreakpoint : null);
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
    }, [enableBreakpoints, breakpoints]);

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
        const sortedConfigs = [...BREAKPOINT_CONFIGS].reverse(); // Start from largest (xxl) to smallest (xs)
        
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
     * Toggle debug mode with keyboard shortcut (Ctrl+Shift+D)
     */
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                setDebugMode(prev => !prev);
            }
        };

        if (process.env.NODE_ENV === 'development') {
            window.addEventListener('keydown', handleKeyPress);
            return () => window.removeEventListener('keydown', handleKeyPress);
        }
    }, []);

    /**
     * Render individual grid items with optimization
     */
    const renderGridItems = useCallback(() => {
        const shouldVirtualize = enableVirtualization && items.length >= (virtualizeThreshold || 100);

        return items.map((item, index) => {
            const isVisible = !shouldVirtualize || visibleItems.has(index) || !isInitialized;
            
            // Cast item to ResponsiveItemType for type safety
            const responsiveItem = item as ResponsiveItemType;
            
            // Get active placement based on current breakpoint
            const activePlacement = getActiveItemPlacement(responsiveItem);
            
            // Calculate item styles using the utility function
            const itemStyles: CSSProperties = {
                justifySelf: responsiveItem.justifySelf !== "auto" ? responsiveItem.justifySelf : undefined,
                alignSelf: responsiveItem.alignSelf !== "auto" ? responsiveItem.alignSelf : undefined,
                zIndex: responsiveItem.zIndex || undefined,
                ...getGridItemPlacement(activePlacement)
            };

            const itemClassName = [
                "mx-css-grid-item", 
                responsiveItem.className,
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
            if (activePlacement.placementType === "area" && activePlacement.gridArea) {
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
    }, [items, visibleItems, enableVirtualization, virtualizeThreshold, isInitialized, getActiveItemPlacement, widgetId, activeBreakpointSize]);

    /**
     * Container class names with responsive identifier
     */
    const containerClassName = useMemo(() => {
        const classes = ["mx-css-grid", widgetId, className];
        
        // Add state classes
        if (enableVirtualization && items.length >= (virtualizeThreshold || 100)) {
            classes.push("mx-css-grid--virtualized");
        }
        if (currentBreakpoint !== null) {
            classes.push(`mx-css-grid--breakpoint-${currentBreakpoint}`);
        }
        if (useNamedAreas) {
            classes.push("mx-css-grid--named-areas");
        }
        if (debugMode) {
            classes.push("debug");
        }
        
        // Add dynamic breakpoint classes
        const breakpointClasses = getActiveBreakpointClasses(currentWidth);
        classes.push(...breakpointClasses);
        
        return classes.filter(Boolean).join(" ");
    }, [className, widgetId, enableVirtualization, items.length, virtualizeThreshold, currentBreakpoint, useNamedAreas, debugMode, currentWidth]);

    /**
     * Determine appropriate ARIA role
     */
    const containerRole = useMemo(() => {
        if (role) return role;
        return items.length > 10 || useNamedAreas ? "grid" : "group";
    }, [role, items.length, useNamedAreas]);

    // Performance tracking in development
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[CSSGrid ${widgetId}] Rendered`, {
                items: items.length,
                itemsWithResponsive: items.filter(i => i.enableResponsive).length,
                virtualized: enableVirtualization && items.length >= (virtualizeThreshold || 100),
                visibleItems: visibleItems.size,
                breakpoint: currentBreakpoint,
                currentWidth,
                activeBreakpointSize,
                breakpointClasses: getActiveBreakpointClasses(currentWidth),
                namedAreas: useNamedAreas,
                debugMode
            });
        }
    }, [widgetId, items, enableVirtualization, virtualizeThreshold, visibleItems.size, currentBreakpoint, currentWidth, activeBreakpointSize, useNamedAreas, debugMode]);

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
            data-breakpoint={currentBreakpoint !== null ? currentBreakpoint : undefined}
            data-breakpoint-size={activeBreakpointSize}
            data-item-count={items.length}
            data-show-areas={debugMode && useNamedAreas ? "true" : undefined}
        >
            {renderGridItems()}
        </div>
    );
}

// Display name for debugging
CSSGrid.displayName = "CSSGrid";