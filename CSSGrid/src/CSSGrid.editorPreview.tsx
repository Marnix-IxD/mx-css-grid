import { createElement, CSSProperties, useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Selectable } from "mendix/preview/Selectable";
import { CSSGridPreviewProps, ItemsPreviewType } from "../typings/CSSGridProps";
import { getGridItemPlacement, parseGridTemplate, parseGridAreas } from "./utils/gridHelpers";

// Type definitions for responsive properties
type ResponsiveProperties = {
    enableResponsive?: boolean;
    xsEnabled?: boolean;
    xsPlacementType?: string;
    xsGridArea?: string;
    xsColumnStart?: string;
    xsColumnEnd?: string;
    xsRowStart?: string;
    xsRowEnd?: string;
    smEnabled?: boolean;
    smPlacementType?: string;
    smGridArea?: string;
    smColumnStart?: string;
    smColumnEnd?: string;
    smRowStart?: string;
    smRowEnd?: string;
    mdEnabled?: boolean;
    mdPlacementType?: string;
    mdGridArea?: string;
    mdColumnStart?: string;
    mdColumnEnd?: string;
    mdRowStart?: string;
    mdRowEnd?: string;
    lgEnabled?: boolean;
    lgPlacementType?: string;
    lgGridArea?: string;
    lgColumnStart?: string;
    lgColumnEnd?: string;
    lgRowStart?: string;
    lgRowEnd?: string;
    xlEnabled?: boolean;
    xlPlacementType?: string;
    xlGridArea?: string;
    xlColumnStart?: string;
    xlColumnEnd?: string;
    xlRowStart?: string;
    xlRowEnd?: string;
    xxlEnabled?: boolean;
    xxlPlacementType?: string;
    xxlGridArea?: string;
    xxlColumnStart?: string;
    xxlColumnEnd?: string;
    xxlRowStart?: string;
    xxlRowEnd?: string;
};

// Container responsive properties
type ResponsiveContainerProperties = {
    enableBreakpoints?: boolean;
    xsEnabled?: boolean;
    xsColumns?: string;
    xsRows?: string;
    xsAreas?: string;
    xsGap?: string;
    xsRowGap?: string;
    xsColumnGap?: string;
    smEnabled?: boolean;
    smColumns?: string;
    smRows?: string;
    smAreas?: string;
    smGap?: string;
    smRowGap?: string;
    smColumnGap?: string;
    mdEnabled?: boolean;
    mdColumns?: string;
    mdRows?: string;
    mdAreas?: string;
    mdGap?: string;
    mdRowGap?: string;
    mdColumnGap?: string;
    lgEnabled?: boolean;
    lgColumns?: string;
    lgRows?: string;
    lgAreas?: string;
    lgGap?: string;
    lgRowGap?: string;
    lgColumnGap?: string;
    xlEnabled?: boolean;
    xlColumns?: string;
    xlRows?: string;
    xlAreas?: string;
    xlGap?: string;
    xlRowGap?: string;
    xlColumnGap?: string;
    xxlEnabled?: boolean;
    xxlColumns?: string;
    xxlRows?: string;
    xxlAreas?: string;
    xxlGap?: string;
    xxlRowGap?: string;
    xxlColumnGap?: string;
};

// Extended types
type ResponsiveItemPreview = ItemsPreviewType & ResponsiveProperties;
type ResponsiveContainerPreview = CSSGridPreviewProps & ResponsiveContainerProperties & {
    showGridLines?: boolean;
    showGridAreas?: boolean;
    showGridGaps?: boolean;
};
type PreviewProps = ResponsiveContainerPreview & {
    readOnly?: boolean;
    renderMode?: string;
    class?: string;
    style?: string;
};

/**
 * Generate vibrant colors for areas with better visibility
 */
const generateAreaColors = (areas: string[]): Record<string, string> => {
    const baseColors = [
        'rgba(59, 130, 246, 0.2)',   // Blue
        'rgba(239, 68, 68, 0.2)',    // Red
        'rgba(16, 185, 129, 0.2)',   // Green
        'rgba(245, 158, 11, 0.2)',   // Yellow
        'rgba(139, 92, 246, 0.2)',   // Purple
        'rgba(236, 72, 153, 0.2)',   // Pink
        'rgba(14, 165, 233, 0.2)',   // Sky
        'rgba(168, 85, 247, 0.2)',   // Violet
        'rgba(251, 146, 60, 0.2)',   // Orange
        'rgba(6, 182, 212, 0.2)',    // Cyan
    ];
    
    const colorMap: Record<string, string> = {};
    areas.forEach((area, index) => {
        colorMap[area] = baseColors[index % baseColors.length];
    });
    
    return colorMap;
};

/**
 * CSS Grid Editor Preview Component
 * 
 * Simplified version with only content and dropzones
 */
export const preview: React.FC<PreviewProps> = (props) => {
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
    } = props;

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    // State for grid measurements
    const [gridMetrics, setGridMetrics] = useState<{
        tracks: { columns: number[]; rows: number[] };
        gaps: { column: number; row: number };
        containerBox: DOMRect | null;
        gridBox: DOMRect | null;
    } | null>(null);

    // Parse custom style string into React CSSProperties
    const parseInlineStyles = useCallback((styleStr: string): CSSProperties => {
        const styles: CSSProperties = {};
        if (!styleStr) return styles;

        styleStr.split(';').forEach(declaration => {
            const [property, value] = declaration.split(':').map(s => s.trim());
            if (property && value) {
                const camelCaseProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                (styles as any)[camelCaseProperty] = value;
            }
        });

        return styles;
    }, []);

    // Map Mendix enumeration values to CSS values
    const mapEnumToCSS = useCallback((value: string, type: 'flow' | 'align' | 'justify'): string => {
        if (type === 'flow') {
            const flowMap: Record<string, string> = {
                'row': 'row',
                'column': 'column',
                'dense': 'dense',
                'columnDense': 'column dense'
            };
            return flowMap[value] || value;
        }
        
        if (type === 'align' || type === 'justify') {
            const alignMap: Record<string, string> = {
                'spaceBetween': 'space-between',
                'spaceAround': 'space-around',
                'spaceEvenly': 'space-evenly'
            };
            return alignMap[value] || value;
        }
        
        return value;
    }, []);

    // Parse grid dimensions
    const gridDimensions = useMemo(() => {
        const columns = parseGridTemplate(gridTemplateColumns || "1fr");
        const rows = parseGridTemplate(gridTemplateRows || "auto");
        const areas = useNamedAreas && gridTemplateAreas ? parseGridAreas(gridTemplateAreas) : null;
        const uniqueAreas = areas ? Array.from(new Set(areas.flat().filter(area => area !== "."))) : [];
        
        return {
            columnCount: columns.length,
            rowCount: rows.length,
            parsedAreas: areas,
            uniqueAreas,
            areaColorMap: generateAreaColors(uniqueAreas)
        };
    }, [gridTemplateColumns, gridTemplateRows, gridTemplateAreas, useNamedAreas]);

    // Calculate actual gap values
    const actualGaps = useMemo(() => {
        // Priority: gap > individual gaps > 0
        const effectiveGap = gap || undefined;
        const effectiveRowGap = effectiveGap || rowGap || "0";
        const effectiveColumnGap = effectiveGap || columnGap || "0";
        
        return {
            gap: effectiveGap,
            rowGap: effectiveRowGap,
            columnGap: effectiveColumnGap
        };
    }, [gap, rowGap, columnGap]);

    // Build container styles
    const containerStyles = useMemo<CSSProperties>(() => {
        const styles: CSSProperties = {
            display: "grid",
            gridTemplateColumns: gridTemplateColumns || "1fr",
            gridTemplateRows: gridTemplateRows || "auto",
            gap: actualGaps.gap,
            rowGap: !actualGaps.gap ? actualGaps.rowGap : undefined,
            columnGap: !actualGaps.gap ? actualGaps.columnGap : undefined,
            gridAutoFlow: mapEnumToCSS(autoFlow, 'flow'),
            gridAutoColumns: autoColumns,
            gridAutoRows: autoRows,
            justifyItems: justifyItems,
            alignItems: alignItems,
            justifyContent: mapEnumToCSS(justifyContent, 'justify'),
            alignContent: mapEnumToCSS(alignContent, 'align'),
            minHeight: minHeight,
            maxHeight: maxHeight,
            minWidth: minWidth,
            maxWidth: maxWidth,
            width: "100%",
            boxSizing: "border-box",
            position: "relative",
            ...parseInlineStyles(customStyle)
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
    }, [gridTemplateColumns, gridTemplateRows, actualGaps, autoFlow, autoColumns,
        autoRows, justifyItems, alignItems, justifyContent, alignContent, minHeight, maxHeight,
        minWidth, maxWidth, useNamedAreas, gridTemplateAreas, customStyle, parseInlineStyles, mapEnumToCSS]);

    // Measure grid tracks and gaps
    const measureGrid = useCallback(() => {
        if (!gridRef.current || !containerRef.current) return;

        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
            if (!gridRef.current || !containerRef.current) return;

            const gridEl = gridRef.current;
            const computedStyle = window.getComputedStyle(gridEl);
            const containerBox = containerRef.current.getBoundingClientRect();
            const gridBox = gridEl.getBoundingClientRect();
            
            // Get the actual computed gap values
            const computedColumnGap = parseFloat(computedStyle.columnGap) || 0;
            const computedRowGap = parseFloat(computedStyle.rowGap) || 0;
            
            // Parse track sizes from computed style
            const columnTracks = computedStyle.gridTemplateColumns.split(' ').map(parseFloat).filter(n => !isNaN(n));
            const rowTracks = computedStyle.gridTemplateRows.split(' ').map(parseFloat).filter(n => !isNaN(n));
            
            // Calculate cumulative positions WITHOUT gaps
            // The positions represent the grid lines, not including gaps
            let columnPositions = [0];
            let currentX = 0;
            columnTracks.forEach((size) => {
                currentX += size;
                columnPositions.push(currentX);
            });
            
            let rowPositions = [0];
            let currentY = 0;
            rowTracks.forEach((size) => {
                currentY += size;
                rowPositions.push(currentY);
            });
            
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
        });
    }, []);

    // Setup ResizeObserver
    useEffect(() => {
        if (!gridRef.current) return;

        resizeObserverRef.current = new ResizeObserver(() => {
            measureGrid();
        });

        resizeObserverRef.current.observe(gridRef.current);
        
        // Also observe the container for dimension changes
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
        measureGrid();
    }, [gridTemplateColumns, gridTemplateRows, gap, rowGap, columnGap, measureGrid]);

    // Helper to get responsive breakpoints for items
    const getItemResponsiveBreakpoints = useCallback((item: ResponsiveItemPreview): string[] => {
        if (!item.enableResponsive) return [];
        
        const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
        return breakpoints.filter(bp => {
            const key = `${bp}Enabled` as keyof ResponsiveItemPreview;
            return item[key];
        });
    }, []);

    // Check if responsive is enabled for container
    const hasResponsiveContainer = useMemo(() => {
        if (!enableBreakpoints) return false;
        const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
        return breakpoints.some(bp => {
            const key = `${bp}Enabled` as keyof ResponsiveContainerPreview;
            return props[key];
        });
    }, [enableBreakpoints, props]);

    // Render debug overlays using SVG - FIXED GAP POSITIONING
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
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 100
                }}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
            >
                {/* Grid Gaps - FIXED TO APPEAR ON CORRECT SIDE */}
                {showGridGaps && gaps.column > 0 && tracks.columns.length > 1 && (
                    <g className="grid-gaps-column">
                        {tracks.columns.slice(1, -1).map((_, i) => {
                            // Gap should appear BEFORE the grid line (to the left)
                            // Position is the track position plus all previous gaps MINUS the gap width
                            const trackPos = tracks.columns[i + 1];
                            const xPos = trackPos + (gaps.column * i);
                            return (
                                <rect
                                    key={`gap-col-${i}`}
                                    x={xPos}
                                    y={0}
                                    width={gaps.column}
                                    height={height}
                                    fill="rgba(255, 0, 61, 0.15)"
                                />
                            );
                        })}
                    </g>
                )}

                {showGridGaps && gaps.row > 0 && tracks.rows.length > 1 && (
                    <g className="grid-gaps-row">
                        {tracks.rows.slice(1, -1).map((_, i) => {
                            // Gap should appear ABOVE the grid line
                            // Position is the track position plus all previous gaps MINUS the gap height
                            const trackPos = tracks.rows[i + 1];
                            const yPos = trackPos + (gaps.row * i);
                            return (
                                <rect
                                    key={`gap-row-${i}`}
                                    x={0}
                                    y={yPos}
                                    width={width}
                                    height={gaps.row}
                                    fill="rgba(255, 0, 61, 0.15)"
                                />
                            );
                        })}
                    </g>
                )}

                {/* Grid Lines - with 1px width */}
                {showGridLines && (
                    <g className="grid-lines">
                        {/* Vertical lines */}
                        {tracks.columns.map((x, i) => {
                            // For lines after the first, we need to account for gaps
                            const xPosBeforeGap = i > 0 ? x + (gaps.column * (i - 1)) : x;
                            const xPosAfterGap = x + (gaps.column * i);
                            
                            return (
                                <g key={`v-${i}`}>
                                    {/* Line before gap (or only line for first/last) */}
                                    {(i === 0 || i === tracks.columns.length - 1 || gaps.column > 0) && (
                                        <line
                                            x1={i === 0 ? x : xPosBeforeGap}
                                            y1={0}
                                            x2={i === 0 ? x : xPosBeforeGap}
                                            y2={height}
                                            stroke="#ff003d"
                                            strokeWidth="1"
                                            opacity="0.6"
                                        />
                                    )}
                                    {/* Line after gap (for middle lines when there's a gap) */}
                                    {i > 0 && i < tracks.columns.length - 1 && gaps.column > 0 && (
                                        <line
                                            x1={xPosAfterGap}
                                            y1={0}
                                            x2={xPosAfterGap}
                                            y2={height}
                                            stroke="#ff003d"
                                            strokeWidth="1"
                                            opacity="0.6"
                                        />
                                    )}
                                    {/* Last line */}
                                    {i === tracks.columns.length - 1 && i > 0 && (
                                        <line
                                            x1={xPosAfterGap}
                                            y1={0}
                                            x2={xPosAfterGap}
                                            y2={height}
                                            stroke="#ff003d"
                                            strokeWidth="1"
                                            opacity="0.6"
                                        />
                                    )}
                                </g>
                            );
                        })}
                        
                        {/* Horizontal lines */}
                        {tracks.rows.map((y, i) => {
                            // For lines after the first, we need to account for gaps
                            const yPosBeforeGap = i > 0 ? y + (gaps.row * (i - 1)) : y;
                            const yPosAfterGap = y + (gaps.row * i);
                            
                            return (
                                <g key={`h-${i}`}>
                                    {/* Line before gap (or only line for first/last) */}
                                    {(i === 0 || i === tracks.rows.length - 1 || gaps.row > 0) && (
                                        <line
                                            x1={0}
                                            y1={i === 0 ? y : yPosBeforeGap}
                                            x2={width}
                                            y2={i === 0 ? y : yPosBeforeGap}
                                            stroke="#ff003d"
                                            strokeWidth="1"
                                            opacity="0.6"
                                        />
                                    )}
                                    {/* Line after gap (for middle lines when there's a gap) */}
                                    {i > 0 && i < tracks.rows.length - 1 && gaps.row > 0 && (
                                        <line
                                            x1={0}
                                            y1={yPosAfterGap}
                                            x2={width}
                                            y2={yPosAfterGap}
                                            stroke="#ff003d"
                                            strokeWidth="1"
                                            opacity="0.6"
                                        />
                                    )}
                                    {/* Last line */}
                                    {i === tracks.rows.length - 1 && i > 0 && (
                                        <line
                                            x1={0}
                                            y1={yPosAfterGap}
                                            x2={width}
                                            y2={yPosAfterGap}
                                            stroke="#ff003d"
                                            strokeWidth="1"
                                            opacity="0.6"
                                        />
                                    )}
                                </g>
                            );
                        })}
                    </g>
                )}
            </svg>
        );
    };

    // Render grid areas overlay with absolute positioned labels
    const renderGridAreasOverlay = () => {
        if (!showGridAreas || !useNamedAreas || !gridDimensions.parsedAreas) return null;

        const { parsedAreas, areaColorMap } = gridDimensions;
        const processedAreas = new Set<string>();

        return parsedAreas.map((row, rowIndex) => 
            row.map((cell, colIndex) => {
                if (cell === '.' || processedAreas.has(cell)) return null;
                
                // Find the full extent of this area
                let minRow = rowIndex, maxRow = rowIndex;
                let minCol = colIndex, maxCol = colIndex;
                
                // Scan for area boundaries
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
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            pointerEvents: 'none',
                            position: 'relative',
                            zIndex: -1 // Place behind content
                        }}
                    >
                        {/* Absolutely positioned label */}
                        <div 
                            className="mx-css-grid-preview-area-label-container"
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 1000,
                                pointerEvents: 'none'
                            }}
                        >
                            <span 
                                className="mx-css-grid-preview-area-label"
                                style={{
                                    display: 'inline-block',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    background: 'rgba(59, 130, 246, 0.9)',
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
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

    return (
        <div 
            ref={containerRef}
            className="mx-css-grid-preview-wrapper"
            style={{
                position: 'relative',
                width: '100%'
            }}
        >
            {/* Responsive indicator */}
            {hasResponsiveContainer && (
                <div className="mx-css-grid-preview-info">
                    <span className="mx-css-grid-preview-info-icon">📱</span>
                    <span className="mx-css-grid-preview-info-text">
                        Responsive Grid
                    </span>
                </div>
            )}
            
            {/* Main grid container with actual content */}
            <div 
                ref={gridRef}
                className={`mx-css-grid-preview ${className}`}
                style={containerStyles}
                data-columns={gridDimensions.columnCount}
                data-rows={gridDimensions.rowCount}
            >
                {/* Grid areas overlay - render as grid children */}
                {renderGridAreasOverlay()}
                
                {/* Debug overlays */}
                {renderDebugOverlays()}
                
                {/* Grid items */}
                {items.map((item, index) => {
                    const responsiveItem = item as ResponsiveItemPreview;
                    
                    // Check if item should use area placement
                    const effectivePlacementType = (useNamedAreas && responsiveItem.gridArea?.trim()) 
                        ? "area" 
                        : responsiveItem.placementType;
                    
                    // Get placement styles for the item
                    const itemPlacement = getGridItemPlacement({
                        placementType: effectivePlacementType,
                        gridArea: responsiveItem.gridArea,
                        columnStart: responsiveItem.columnStart,
                        columnEnd: responsiveItem.columnEnd,
                        rowStart: responsiveItem.rowStart,
                        rowEnd: responsiveItem.rowEnd
                    }, useNamedAreas);

                    // Build item styles
                    const itemStyles: CSSProperties = {
                        position: "relative",
                        minHeight: "40px",
                        boxSizing: "border-box",
                        width: "100%",
                        height: "100%",
                        ...itemPlacement,
                        justifySelf: responsiveItem.justifySelf !== "auto" ? responsiveItem.justifySelf : undefined,
                        alignSelf: responsiveItem.alignSelf !== "auto" ? responsiveItem.alignSelf : undefined,
                        zIndex: responsiveItem.zIndex || undefined
                    };

                    // Item name for display
                    const itemName = responsiveItem.itemName || 
                        (effectivePlacementType === "area" && responsiveItem.gridArea ? 
                         responsiveItem.gridArea : 
                         `Item ${index + 1}`);

                    // Check if item has responsive settings
                    const itemBreakpoints = getItemResponsiveBreakpoints(responsiveItem);
                    const hasResponsive = itemBreakpoints.length > 0;
                    
                    // Build caption for Selectable
                    const itemCaption = `${itemName}${hasResponsive ? ' 📱' : ''}`;

                    // Get content renderer
                    const ContentRenderer = responsiveItem.content?.renderer;
                    
                    return (
                        <Selectable
                            key={`grid-item-${index}`}
                            object={responsiveItem}
                            caption={itemCaption}
                        >
                            <div
                                className={`mx-css-grid-preview-item ${responsiveItem.className || ""}`}
                                style={itemStyles}
                                data-item-index={index}
                                data-item-name={itemName}
                                data-placement-type={effectivePlacementType}
                            >
                                {/* Render content or placeholder - NO BADGES */}
                                {ContentRenderer ? (
                                    <div className="mx-css-grid-preview-content">
                                        <ContentRenderer>
                                            <div style={{ width: "100%", height: "100%" }} />
                                        </ContentRenderer>
                                    </div>
                                ) : (
                                    <div className="mx-css-grid-preview-empty">
                                        <span className="mx-css-grid-preview-empty-text">
                                            {itemName}
                                        </span>
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
 * Get preview CSS styles - Clean version without badges
 */
export function getPreviewCss(): string {
    return `
        /* Wrapper for the entire grid preview */
        .mx-css-grid-preview-wrapper {
            position: relative;
            width: 100%;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* Remove all ::before and ::after pseudo elements that might add content */
        .mx-css-grid-preview *::before,
        .mx-css-grid-preview *::after {
            content: none !important;
            display: none !important;
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

        /* Main grid container */
        .mx-css-grid-preview {
            box-sizing: border-box;
            width: 100%;
            position: relative;
            /* Grid properties are set via inline styles */
            transition: all 0.3s ease;
        }

        /* Debug SVG overlay */
        .mx-css-grid-preview-debug-svg {
            pointer-events: none;
        }

        /* Grid area overlay */
        .mx-css-grid-preview-area-overlay {
            transition: opacity 0.2s ease;
        }

        /* Area label container - absolutely positioned */
        .mx-css-grid-preview-area-label-container {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 1000 !important;
            pointer-events: none !important;
        }

        /* Grid items */
        .mx-css-grid-preview-item {
            box-sizing: border-box;
            position: relative;
            min-width: 0;
            min-height: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            z-index: 1;
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

        /* Special styling for auto-flow items */
        .mx-css-grid-preview-item[data-placement-type="auto"] .mx-css-grid-preview-empty {
            background: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(251, 191, 36, 0.02) 10px,
                rgba(251, 191, 36, 0.02) 20px
            );
        }

        /* Ensure Mendix Selectable component doesn't interfere */
        .mx-selectable {
            display: contents !important;
        }

        /* Ensure Mendix widgets fill their containers */
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

        /* Remove default margins from Mendix elements */
        .mx-css-grid-preview-item > * {
            margin: 0;
        }

        /* Ensure text doesn't overflow */
        .mx-css-grid-preview-item {
            word-wrap: break-word;
            overflow-wrap: break-word;
        }

        /* Visual feedback for overlapping items (high z-index) */
        .mx-css-grid-preview-item[style*="z-index"] {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        /* Grid preview in structure mode should be more compact */
        .mx-name-CSSGrid.mx-compound-widget {
            min-height: 60px;
        }

        /* Ensure proper stacking context */
        .mx-css-grid {
            isolation: isolate;
        }

        /* Smooth transitions */
        .mx-css-grid-preview,
        .mx-css-grid-preview-item,
        .mx-css-grid-preview-area-overlay {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Responsive adjustments */
        @media (max-width: 480px) {
            .mx-css-grid-preview-info {
                font-size: 10px;
                padding: 2px 6px;
            }
        }
    `;
}