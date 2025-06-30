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
import { getGridItemPlacement, generateBreakpointStyles } from "./utils/gridHelpers";
import "./ui/CSSGrid.css";

/**
 * CSS Grid Widget for Mendix
 * 
 * Production-grade implementation with:
 * - Responsive breakpoints with optimized media queries
 * - Named grid areas with validation
 * - Auto-placement with configurable flow
 * - Virtualization for performance
 * - Full accessibility support
 * - Memoized computations for optimal re-renders
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
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // State management
    const [visibleItems, setVisibleItems] = useState<Set<number>>(() => new Set());
    const [currentBreakpoint, setCurrentBreakpoint] = useState<number | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    /**
     * Generate unique widget identifier
     * Ensures style isolation and accessibility
     */
    const widgetId = useMemo(() => {
        const baseId = props.name || `grid-${Date.now()}`;
        return `mx-css-grid-${baseId.replace(/[^a-zA-Z0-9-]/g, '-')}`;
    }, [props.name]);

    /**
     * Map enumeration values to CSS properties
     * Handles Mendix enumeration restrictions
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

        return generateBreakpointStyles(breakpoints, `.${widgetId}`);
    }, [enableBreakpoints, breakpoints, widgetId]);

    // Inject responsive styles into document head
    useLayoutEffect(() => {
        if (!responsiveStyles) {
            if (styleElementRef.current) {
                styleElementRef.current.remove();
                styleElementRef.current = null;
            }
            return;
        }

        // Create or update style element
        if (!styleElementRef.current) {
            styleElementRef.current = document.createElement('style');
            styleElementRef.current.setAttribute('data-widget-styles', widgetId);
            document.head.appendChild(styleElementRef.current);
        }

        styleElementRef.current.textContent = responsiveStyles;

        // Cleanup on unmount
        return () => {
            if (styleElementRef.current) {
                styleElementRef.current.remove();
                styleElementRef.current = null;
            }
        };
    }, [responsiveStyles, widgetId]);

    /**
     * Handle responsive breakpoint changes with debouncing
     */
    useEffect(() => {
        if (!enableBreakpoints || !breakpoints || breakpoints.length === 0) return;

        const updateBreakpoint = () => {
            const width = window.innerWidth;
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
     * Virtualization setup with Intersection Observer
     */
    const setupVirtualization = useCallback(() => {
        const shouldVirtualize = enableVirtualization && 
                               items.length >= (virtualizeThreshold || 100) && 
                               containerRef.current;

        if (!shouldVirtualize) {
            // Show all items if virtualization is disabled
            setVisibleItems(new Set(Array.from({ length: items.length }, (_, i) => i)));
            return;
        }

        // Cleanup existing observer
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        // Create new observer with optimized settings
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
                            // Keep a buffer of items around viewport
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

        // Observe all grid items
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
        // Delay initialization to ensure DOM is ready
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
     */
    const renderGridItems = useCallback(() => {
        const shouldVirtualize = enableVirtualization && items.length >= (virtualizeThreshold || 100);

        return items.map((item, index) => {
            const isVisible = !shouldVirtualize || visibleItems.has(index) || !isInitialized;
            
            // Calculate item styles
            const itemStyles: CSSProperties = {
                justifySelf: item.justifySelf !== "auto" ? item.justifySelf : undefined,
                alignSelf: item.alignSelf !== "auto" ? item.alignSelf : undefined,
                zIndex: item.zIndex || undefined,
                ...getGridItemPlacement({
                    placementType: item.placementType,
                    gridArea: item.gridArea,
                    columnStart: item.columnStart || "auto",
                    columnEnd: item.columnEnd || "auto",
                    rowStart: item.rowStart || "auto",
                    rowEnd: item.rowEnd || "auto"
                })
            };

            const itemClassName = ["mx-css-grid-item", item.className]
                .filter(Boolean)
                .join(" ");
            
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
            if (item.placementType === "area" && item.gridArea) {
                itemAriaAttrs.role = "region";
                itemAriaAttrs["aria-label"] = `Grid area: ${item.gridArea}`;
            }

            return (
                <div
                    key={`grid-item-${index}`}
                    data-grid-index={index}
                    className={itemClassName}
                    style={itemStyles}
                    {...itemAriaAttrs}
                >
                    {item.content}
                </div>
            );
        });
    }, [items, visibleItems, enableVirtualization, virtualizeThreshold, isInitialized]);

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
        
        return classes.filter(Boolean).join(" ");
    }, [className, widgetId, enableVirtualization, items.length, virtualizeThreshold, currentBreakpoint, useNamedAreas]);

    /**
     * Determine appropriate ARIA role
     */
    const containerRole = useMemo(() => {
        if (role) return role;
        
        // Use 'grid' for data-like structures, 'group' for layout
        return items.length > 10 || useNamedAreas ? "grid" : "group";
    }, [role, items.length, useNamedAreas]);

    // Performance tracking in development
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[CSSGrid ${widgetId}] Rendered with ${items.length} items`, {
                virtualized: enableVirtualization && items.length >= (virtualizeThreshold || 100),
                visibleItems: visibleItems.size,
                breakpoint: currentBreakpoint,
                namedAreas: useNamedAreas
            });
        }
    }, [widgetId, items.length, enableVirtualization, virtualizeThreshold, visibleItems.size, currentBreakpoint, useNamedAreas]);

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
            data-item-count={items.length}
        >
            {renderGridItems()}
        </div>
    );
}

// Display name for debugging
CSSGrid.displayName = "CSSGrid";

// Default props for better developer experience
CSSGrid.defaultProps = {
    gridTemplateColumns: "1fr",
    gridTemplateRows: "auto",
    autoFlow: "row",
    justifyItems: "stretch",
    alignItems: "stretch",
    justifyContent: "start",
    alignContent: "start",
    role: "group"
};