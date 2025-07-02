import { createElement, CSSProperties, Fragment } from "react";
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
    showLineNumbers?: boolean;
};
type PreviewProps = ResponsiveContainerPreview & {
    readOnly?: boolean;
    renderMode?: string;
    class?: string;
    style?: string;
};

/**
 * Generate vibrant colors for areas
 */
const generateAreaColors = (areaCount: number): Record<string, string> => {
    const baseColors = [
        'rgba(255, 182, 193, 0.5)', // Light Pink
        'rgba(255, 218, 185, 0.5)', // Peach Puff
        'rgba(221, 160, 221, 0.5)', // Plum
        'rgba(176, 224, 230, 0.5)', // Powder Blue
        'rgba(152, 251, 152, 0.5)', // Pale Green
        'rgba(255, 255, 224, 0.5)', // Light Yellow
        'rgba(230, 230, 250, 0.5)', // Lavender
        'rgba(255, 228, 225, 0.5)', // Misty Rose
        'rgba(240, 248, 255, 0.5)', // Alice Blue
        'rgba(245, 245, 220, 0.5)', // Beige
    ];
    
    return Array.from({ length: areaCount }, (_, i) => {
        const color = baseColors[i % baseColors.length];
        return { [`area-${i}`]: color };
    }).reduce((acc, curr) => ({ ...acc, ...curr }), {});
};

/**
 * CSS Grid Editor Preview Component
 * 
 * Provides an accurate visual representation of the CSS Grid configuration
 * in Mendix Studio Pro's design mode with proper Selectable item support.
 * Enhanced with non-intrusive debug visualization features.
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
        showLineNumbers = false,
        class: className = "",
        style: customStyle = ""
    } = props;

    // Parse custom style string into React CSSProperties
    const parseInlineStyles = (styleStr: string): CSSProperties => {
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
    };

    // Map Mendix enumeration values to CSS values
    const mapEnumToCSS = (value: string, type: 'flow' | 'align' | 'justify'): string => {
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
    };

    // Parse grid dimensions
    const columnCount = parseGridTemplate(gridTemplateColumns || "1fr 1fr").length;
    const rowCount = parseGridTemplate(gridTemplateRows || "auto").length;
    
    // Parse grid areas if using named areas
    const parsedAreas = useNamedAreas && gridTemplateAreas ? parseGridAreas(gridTemplateAreas) : null;
    const uniqueAreas = parsedAreas ? 
        Array.from(new Set(parsedAreas.flat().filter(area => area !== "."))) : [];
    const areaColors = generateAreaColors(uniqueAreas.length);
    const areaColorMap: Record<string, string> = {};
    uniqueAreas.forEach((area, index) => {
        areaColorMap[area] = areaColors[`area-${index}`];
    });

    // Calculate actual gap values with proper precedence
    // If 'gap' is set, it overrides both rowGap and columnGap
    const hasGap = gap && gap !== '0';
    const actualRowGap = hasGap ? gap : (rowGap || '0');
    const actualColumnGap = hasGap ? gap : (columnGap || '0');
    const hasAnyGap = actualRowGap !== '0' || actualColumnGap !== '0';

    // Build container styles that match actual CSS Grid behavior
    const containerStyles: CSSProperties = {
        display: "grid",
        gridTemplateColumns: gridTemplateColumns || "1fr 1fr",
        gridTemplateRows: gridTemplateRows || "auto",
        gridAutoFlow: mapEnumToCSS(autoFlow, 'flow'),
        gridAutoColumns: autoColumns,
        gridAutoRows: autoRows,
        justifyItems: justifyItems,
        alignItems: alignItems,
        justifyContent: mapEnumToCSS(justifyContent, 'justify'),
        alignContent: mapEnumToCSS(alignContent, 'align'),
        width: "100%",
        boxSizing: "border-box",
        position: "relative",
        ...parseInlineStyles(customStyle)
    };

    // Apply gap properties - prioritize general gap over specific gaps
    if (gap) {
        containerStyles.gap = gap;
    } else {
        if (rowGap) containerStyles.rowGap = rowGap;
        if (columnGap) containerStyles.columnGap = columnGap;
    }

    // Apply size constraints
    if (minWidth) containerStyles.minWidth = minWidth;
    if (maxWidth) {
        containerStyles.maxWidth = maxWidth;
        containerStyles.marginLeft = "auto";
        containerStyles.marginRight = "auto";
    }
    if (minHeight) containerStyles.minHeight = minHeight;
    if (maxHeight) containerStyles.maxHeight = maxHeight;

    // Apply grid template areas if enabled
    if (useNamedAreas && gridTemplateAreas) {
        containerStyles.gridTemplateAreas = gridTemplateAreas;
        
        // If no explicit columns/rows are set, try to infer from the areas
        if (!gridTemplateColumns) {
            // Parse the first line to count columns (simple approach)
            const firstLine = gridTemplateAreas.trim().split('\n')[0];
            // Remove quotes if present and count areas
            const cleanLine = firstLine.replace(/['"]/g, '').trim();
            const areaCount = cleanLine.split(/\s+/).length;
            containerStyles.gridTemplateColumns = `repeat(${areaCount}, 1fr)`;
        }
        if (!gridTemplateRows) {
            // Count lines
            const lineCount = gridTemplateAreas.trim().split('\n').filter(line => line.trim()).length;
            containerStyles.gridTemplateRows = `repeat(${lineCount}, auto)`;
        }
    }

    // Helper to get breakpoint info
    const getActiveBreakpoints = (): string[] => {
        if (!enableBreakpoints) return [];
        
        const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
        return breakpoints.filter(bp => {
            const key = `${bp}Enabled` as keyof ResponsiveContainerPreview;
            return props[key];
        });
    };

    // Helper to get item responsive status
    const getItemResponsiveBreakpoints = (item: ResponsiveItemPreview): string[] => {
        if (!item.enableResponsive) return [];
        
        const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
        return breakpoints.filter(bp => {
            const key = `${bp}Enabled` as keyof ResponsiveItemPreview;
            return item[key];
        });
    };

    // Add class for debug mode
    const debugClasses = [
        showGridLines && 'mx-css-grid-preview--show-lines',
        showGridAreas && 'mx-css-grid-preview--show-areas',
        showGridGaps && 'mx-css-grid-preview--show-gaps',
        showLineNumbers && 'mx-css-grid-preview--show-numbers'
    ].filter(Boolean).join(' ');

    // Create a wrapper for the entire grid to handle debug overlays
    return (
        <div className={`mx-css-grid-preview-wrapper ${className} ${showLineNumbers ? 'show-line-numbers' : ''}`}>
            {/* Show responsive indicator */}
            {enableBreakpoints && getActiveBreakpoints().length > 0 && (
                <div className="mx-css-grid-preview-info">
                    <span className="mx-css-grid-preview-info-icon">📱</span>
                    <span className="mx-css-grid-preview-info-text">
                        Responsive: {getActiveBreakpoints().join(', ')}
                    </span>
                </div>
            )}
            
            {/* Line numbers - positioned outside the grid */}
            {showLineNumbers && (
                <div className="mx-css-grid-preview-line-numbers-container">
                    {/* Column line numbers */}
                    {Array.from({ length: columnCount + 1 }, (_, index) => {
                        // Calculate position based on grid structure
                        let leftPosition: string;
                        if (index === 0) {
                            leftPosition = '40px'; // Align with grid start
                        } else if (index === columnCount) {
                            leftPosition = 'calc(100% - 10px)'; // Align with grid end
                        } else {
                            // Position based on column fraction
                            leftPosition = `calc(40px + ${(index / columnCount) * 100}% - 10px)`;
                        }
                        
                        return (
                            <div
                                key={`col-num-${index}`}
                                className="mx-css-grid-preview-line-number mx-css-grid-preview-line-number--column"
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: leftPosition
                                }}
                            >
                                {index + 1}
                            </div>
                        );
                    })}
                    
                    {/* Row line numbers */}
                    {Array.from({ length: rowCount + 1 }, (_, index) => {
                        // Calculate position based on grid structure
                        let topPosition: string;
                        if (index === 0) {
                            topPosition = '40px'; // Align with grid start
                        } else if (index === rowCount) {
                            topPosition = 'calc(100% - 10px)'; // Align with grid end
                        } else {
                            // Position based on row fraction
                            topPosition = `calc(40px + ${(index / rowCount) * 100}% - 10px)`;
                        }
                        
                        return (
                            <div
                                key={`row-num-${index}`}
                                className="mx-css-grid-preview-line-number mx-css-grid-preview-line-number--row"
                                style={{
                                    position: 'absolute',
                                    left: '10px',
                                    top: topPosition
                                }}
                            >
                                {index + 1}
                            </div>
                        );
                    })}
                </div>
            )}
            
            {/* Main grid container that determines the actual size */}
            <div 
                className={`mx-css-grid-preview ${debugClasses}`}
                style={containerStyles}
                data-columns={columnCount}
                data-rows={rowCount}
            >
                {/* Debug overlay using HTML table */}
                {(showGridLines || showGridAreas || showGridGaps) && (
                    <div 
                        className="mx-css-grid-preview-debug-table-container"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: showGridAreas ? 0 : 10 // Areas go below content, lines above
                        }}
                    >
                        <table 
                            className="mx-css-grid-preview-debug-table"
                            style={{
                                width: '100%',
                                height: '100%',
                                borderCollapse: 'separate',
                                borderSpacing: 0,
                                tableLayout: 'fixed'
                            }}
                        >
                            <tbody>
                                {/* Create rows */}
                                {Array.from({ length: rowCount }, (_, rowIndex) => {
                                    // Calculate if this row should show gaps
                                    const isLastRow = rowIndex === rowCount - 1;
                                    const hasRowGapAfter = !isLastRow && hasAnyGap && actualRowGap !== '0';
                                    
                                    return (
                                        <Fragment key={`row-${rowIndex}`}>
                                            {/* Main content row */}
                                            <tr className="mx-css-grid-preview-debug-row">
                                                {Array.from({ length: columnCount }, (_, colIndex) => {
                                                    const isLastCol = colIndex === columnCount - 1;
                                                    const hasColGapAfter = !isLastCol && hasAnyGap && actualColumnGap !== '0';
                                                    
                                                    // Determine area color for this cell
                                                    let cellBackgroundColor = 'transparent';
                                                    let areaName = '';
                                                    
                                                    if (showGridAreas) {
                                                        if (useNamedAreas && parsedAreas) {
                                                            // Find which area this cell belongs to
                                                            const cellArea = parsedAreas[rowIndex]?.[colIndex];
                                                            if (cellArea && cellArea !== '.') {
                                                                cellBackgroundColor = areaColorMap[cellArea] || 'transparent';
                                                                areaName = cellArea.toUpperCase();
                                                            }
                                                        } else {
                                                            // Use default coloring for non-named grids
                                                            const colorIndex = (rowIndex * columnCount + colIndex) % 10;
                                                            cellBackgroundColor = areaColors[`area-${colorIndex}`];
                                                            areaName = `${rowIndex + 1},${colIndex + 1}`;
                                                        }
                                                    }
                                                    
                                                    return (
                                                        <Fragment key={`cell-${rowIndex}-${colIndex}`}>
                                                            {/* Main cell */}
                                                            <td 
                                                                className="mx-css-grid-preview-debug-cell"
                                                                style={{
                                                                    border: showGridLines ? '2px solid #ff003d' : 'none',
                                                                    backgroundColor: cellBackgroundColor,
                                                                    position: 'relative',
                                                                    padding: 0,
                                                                    verticalAlign: 'middle',
                                                                    textAlign: 'center'
                                                                }}
                                                            >
                                                                {showGridAreas && areaName && (
                                                                    <span className="mx-css-grid-preview-area-label">
                                                                        {areaName}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            
                                                            {/* Column gap cell */}
                                                            {hasColGapAfter && (
                                                                <td 
                                                                    className="mx-css-grid-preview-debug-gap-col"
                                                                    style={{
                                                                        width: actualColumnGap,
                                                                        backgroundColor: showGridGaps ? 'rgba(255, 255, 0, 0.3)' : 'transparent',
                                                                        border: 'none',
                                                                        position: 'relative',
                                                                        padding: 0
                                                                    }}
                                                                >
                                                                    {showGridGaps && (
                                                                        <span className="mx-css-grid-preview-gap-label mx-css-grid-preview-gap-label--column-table">
                                                                            {actualColumnGap}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            )}
                                                        </Fragment>
                                                    );
                                                })}
                                            </tr>
                                            
                                            {/* Row gap row */}
                                            {hasRowGapAfter && (
                                                <tr className="mx-css-grid-preview-debug-gap-row">
                                                    {Array.from({ length: columnCount }, (_, colIndex) => {
                                                        const isLastCol = colIndex === columnCount - 1;
                                                        const hasColGapAfter = !isLastCol && hasAnyGap && actualColumnGap !== '0';
                                                        
                                                        return (
                                                            <Fragment key={`gap-row-${rowIndex}-${colIndex}`}>
                                                                <td 
                                                                    style={{
                                                                        height: actualRowGap,
                                                                        backgroundColor: showGridGaps ? 'rgba(255, 255, 0, 0.3)' : 'transparent',
                                                                        border: 'none',
                                                                        position: 'relative',
                                                                        padding: 0
                                                                    }}
                                                                >
                                                                    {showGridGaps && colIndex === Math.floor(columnCount / 2) && (
                                                                        <span className="mx-css-grid-preview-gap-label mx-css-grid-preview-gap-label--row-table">
                                                                            {actualRowGap}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                
                                                                {/* Gap intersection cell */}
                                                                {hasColGapAfter && (
                                                                    <td 
                                                                        style={{
                                                                            width: actualColumnGap,
                                                                            height: actualRowGap,
                                                                            backgroundColor: showGridGaps ? 'rgba(255, 165, 0, 0.3)' : 'transparent',
                                                                            border: 'none',
                                                                            padding: 0
                                                                        }}
                                                                    />
                                                                )}
                                                            </Fragment>
                                                        );
                                                    })}
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* Grid items - render as direct children of the grid */}
                {items.map((item, index) => {
                        const responsiveItem = item as ResponsiveItemPreview;
                        
                        // Check if item should use area placement
                        const effectivePlacementType = (useNamedAreas && responsiveItem.gridArea && responsiveItem.gridArea.trim()) 
                            ? "area" 
                            : responsiveItem.placementType;
                        
                        // Get placement styles for the item using the helper
                        const itemPlacement = getGridItemPlacement({
                            placementType: effectivePlacementType,
                            gridArea: responsiveItem.gridArea,
                            columnStart: responsiveItem.columnStart,
                            columnEnd: responsiveItem.columnEnd,
                            rowStart: responsiveItem.rowStart,
                            rowEnd: responsiveItem.rowEnd
                        }, useNamedAreas);

                        // Build item styles - ensure grid placement is applied correctly
                        const itemStyles: CSSProperties = {
                            position: "relative",
                            minHeight: "40px",
                            boxSizing: "border-box",
                            width: "100%",
                            height: "100%",
                            // Apply placement styles from helper function
                            ...itemPlacement,
                            // Then apply alignment and z-index
                            justifySelf: responsiveItem.justifySelf !== "auto" ? responsiveItem.justifySelf : undefined,
                            alignSelf: responsiveItem.alignSelf !== "auto" ? responsiveItem.alignSelf : undefined,
                            zIndex: responsiveItem.zIndex || undefined
                        };

                        // Item name for display and caption
                        const itemName = responsiveItem.itemName || 
                            (responsiveItem.placementType === "area" && responsiveItem.gridArea ? 
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
                                >
                                    {/* Area indicator for named areas */}
                                    {useNamedAreas && responsiveItem.placementType === "area" && responsiveItem.gridArea && (
                                        <div className="mx-css-grid-preview-area-badge">
                                            {responsiveItem.gridArea}
                                        </div>
                                    )}
                                    
                                    {/* Responsive indicator */}
                                    {hasResponsive && (
                                        <div 
                                            className="mx-css-grid-preview-responsive-badge"
                                            title={`Responsive: ${itemBreakpoints.join(', ')}`}
                                        >
                                            📱
                                        </div>
                                    )}
                                    
                                    {/* Render content or placeholder */}
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
 * Get preview CSS styles with enhanced debug visualization support
 */
export function getPreviewCss(): string {
    return `
        /* Wrapper for the entire grid preview */
        .mx-css-grid-preview-wrapper {
            position: relative;
            width: 100%;
            box-sizing: border-box;
        }

        /* When showing line numbers, add padding */
        .mx-css-grid-preview-wrapper:has(.mx-css-grid-preview-line-numbers-container) {
            padding-top: 40px;
            padding-left: 40px;
        }

        /* Fallback for browsers without :has() support */
        .mx-css-grid-preview-wrapper.show-line-numbers {
            padding-top: 40px;
            padding-left: 40px;
        }

        /* Line numbers container */
        .mx-css-grid-preview-line-numbers-container {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
        }

        /* Main grid container */
        .mx-css-grid-preview {
            box-sizing: border-box;
            width: 100%;
            position: relative;
            /* Grid properties are set via inline styles */
        }

        /* Debug overlay layer - positioned absolutely inside grid */
        .mx-css-grid-preview-debug-layer {
            pointer-events: none;
            /* Inherits grid properties from parent */
        }

        /* Info bar for responsive grids */
        .mx-css-grid-preview-info {
            position: absolute;
            top: -24px;
            right: 0;
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
        }

        /* Grid lines visualization using internal borders technique */
        .mx-css-grid-preview-lines-grid {
            pointer-events: none;
        }

        .mx-css-grid-preview-line-cell {
            position: relative;
            width: 100%;
            height: 100%;
        }

        /* Internal borders using pseudo-elements */
        .mx-css-grid-preview-line-cell::before,
        .mx-css-grid-preview-line-cell::after {
            content: '';
            position: absolute;
            background-color: #ff003d; /* Red color like in Vector.jpg */
            z-index: 2;
            pointer-events: none;
        }

        /* Vertical lines (right border) */
        .mx-css-grid-preview-line-cell::before {
            top: 0;
            right: 0;
            width: 2px;
            height: 100%;
        }

        /* Horizontal lines (bottom border) */
        .mx-css-grid-preview-line-cell::after {
            bottom: 0;
            left: 0;
            height: 2px;
            width: 100%;
        }

        /* For each row, hide the right border of the last column */
        .mx-css-grid-preview-lines-grid[data-columns="1"] .mx-css-grid-preview-line-cell::before,
        .mx-css-grid-preview-lines-grid[data-columns="2"] .mx-css-grid-preview-line-cell:nth-child(2n)::before,
        .mx-css-grid-preview-lines-grid[data-columns="3"] .mx-css-grid-preview-line-cell:nth-child(3n)::before,
        .mx-css-grid-preview-lines-grid[data-columns="4"] .mx-css-grid-preview-line-cell:nth-child(4n)::before,
        .mx-css-grid-preview-lines-grid[data-columns="5"] .mx-css-grid-preview-line-cell:nth-child(5n)::before,
        .mx-css-grid-preview-lines-grid[data-columns="6"] .mx-css-grid-preview-line-cell:nth-child(6n)::before,
        .mx-css-grid-preview-lines-grid[data-columns="7"] .mx-css-grid-preview-line-cell:nth-child(7n)::before,
        .mx-css-grid-preview-lines-grid[data-columns="8"] .mx-css-grid-preview-line-cell:nth-child(8n)::before,
        .mx-css-grid-preview-lines-grid[data-columns="9"] .mx-css-grid-preview-line-cell:nth-child(9n)::before,
        .mx-css-grid-preview-lines-grid[data-columns="10"] .mx-css-grid-preview-line-cell:nth-child(10n)::before,
        .mx-css-grid-preview-lines-grid[data-columns="11"] .mx-css-grid-preview-line-cell:nth-child(11n)::before,
        .mx-css-grid-preview-lines-grid[data-columns="12"] .mx-css-grid-preview-line-cell:nth-child(12n)::before {
            display: none;
        }

        /* Hide bottom border on last row items - use last N cells where N is column count */
        .mx-css-grid-preview-lines-grid[data-columns="1"] .mx-css-grid-preview-line-cell:last-child::after,
        .mx-css-grid-preview-lines-grid[data-columns="2"] .mx-css-grid-preview-line-cell:nth-last-child(-n+2)::after,
        .mx-css-grid-preview-lines-grid[data-columns="3"] .mx-css-grid-preview-line-cell:nth-last-child(-n+3)::after,
        .mx-css-grid-preview-lines-grid[data-columns="4"] .mx-css-grid-preview-line-cell:nth-last-child(-n+4)::after,
        .mx-css-grid-preview-lines-grid[data-columns="5"] .mx-css-grid-preview-line-cell:nth-last-child(-n+5)::after,
        .mx-css-grid-preview-lines-grid[data-columns="6"] .mx-css-grid-preview-line-cell:nth-last-child(-n+6)::after,
        .mx-css-grid-preview-lines-grid[data-columns="7"] .mx-css-grid-preview-line-cell:nth-last-child(-n+7)::after,
        .mx-css-grid-preview-lines-grid[data-columns="8"] .mx-css-grid-preview-line-cell:nth-last-child(-n+8)::after,
        .mx-css-grid-preview-lines-grid[data-columns="9"] .mx-css-grid-preview-line-cell:nth-last-child(-n+9)::after,
        .mx-css-grid-preview-lines-grid[data-columns="10"] .mx-css-grid-preview-line-cell:nth-last-child(-n+10)::after,
        .mx-css-grid-preview-lines-grid[data-columns="11"] .mx-css-grid-preview-line-cell:nth-last-child(-n+11)::after,
        .mx-css-grid-preview-lines-grid[data-columns="12"] .mx-css-grid-preview-line-cell:nth-last-child(-n+12)::after {
            display: none;
        }

        /* External border for the entire grid */
        .mx-css-grid-preview-lines-grid::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 2px solid #ff003d;
            pointer-events: none;
            z-index: 1;
        }

        /* Grid gap visualization */
        .mx-css-grid-preview-gaps-overlay {
            pointer-events: none;
        }

        .mx-css-grid-preview-gap-cell {
            position: relative;
            width: 100%;
            height: 100%;
        }

        /* Gap labels */
        .mx-css-grid-preview-gap-label {
            position: absolute;
            background-color: rgba(255, 255, 255, 0.95);
            color: #333;
            font-size: 10px;
            font-family: "SF Mono", Monaco, "Courier New", monospace;
            font-weight: 600;
            padding: 2px 4px;
            border-radius: 2px;
            white-space: nowrap;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            z-index: 5;
        }

        /* Column gap label positioning */
        .mx-css-grid-preview-gap-label--column {
            top: 50%;
            right: 0;
            transform: translate(50%, -50%);
        }

        /* Row gap label positioning */
        .mx-css-grid-preview-gap-label--row {
            bottom: 0;
            left: 50%;
            transform: translate(-50%, 50%);
        }

        /* Line numbers - positioned outside the grid */
        .mx-css-grid-preview-line-numbers {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }

        .mx-css-grid-preview-line-number {
            position: absolute;
            font-size: 10px;
            font-family: "SF Mono", Monaco, "Courier New", monospace;
            font-weight: 600;
            pointer-events: none;
            z-index: 1000;
            padding: 2px 4px;
            border-radius: 2px;
            line-height: 1;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .mx-css-grid-preview-line-number--column {
            background-color: rgba(255, 0, 61, 0.8);
            color: white;
        }

        .mx-css-grid-preview-line-number--row {
            background-color: rgba(183, 0, 255, 0.8);
            color: white;
        }

        /* Area blocks for visualization */
        .mx-css-grid-preview-area-block {
            width: 100%;
            height: 100%;
            min-height: 40px;
            box-sizing: border-box;
            opacity: 0.7;
            transition: opacity 0.2s ease;
        }

        .mx-css-grid-preview-area-block:hover {
            opacity: 0.9;
        }

        .mx-css-grid-preview-area-label {
            font-size: 10px;
            font-weight: 600;
            color: rgba(0, 0, 0, 0.7);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: rgba(255, 255, 255, 0.8);
            padding: 2px 6px;
            border-radius: 3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 90%;
        }

        /* Ensure the wrapper has proper positioning context */
        .mx-css-grid-preview-wrapper {
            position: relative;
            padding-top: 40px; /* Space for line numbers */
            padding-left: 40px; /* Space for line numbers */
        }

        /* Adjust the main grid positioning */
        .mx-css-grid-preview-wrapper .mx-css-grid-preview {
            position: relative;
        }

        /* Debug layer should not interfere with content */
        .mx-css-grid-preview-debug-layer {
            pointer-events: none;
            z-index: 1; /* Below content but above background */
        }

        /* Ensure content is above debug visualizations */
        .mx-css-grid-preview-item {
            position: relative;
            z-index: 10; /* Above debug layer */
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
            z-index: 1; /* Above area backgrounds */
            /* Grid placement properties are set via inline styles */
        }

        /* Area name badge */
        .mx-css-grid-preview-area-badge {
            position: absolute;
            top: 4px;
            left: 4px;
            font-size: 10px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace;
            font-weight: 600;
            padding: 2px 6px;
            background: rgba(59, 130, 246, 0.9);
            color: white;
            border-radius: 3px;
            pointer-events: none;
            z-index: 10;
            line-height: 1;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        /* Responsive badge */
        .mx-css-grid-preview-responsive-badge {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 3px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            z-index: 10;
            cursor: help;
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
            border-radius: 2px;
            transition: all 0.2s ease;
            position: relative;
            z-index: 2;
        }

        .mx-css-grid-preview-empty-text {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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

        /* Ensure Mendix Selectable component doesn't interfere */
        .mx-selectable {
            display: contents !important;
            /* This allows grid item to participate directly in grid layout */
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
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Grid preview in structure mode should be more compact */
        .mx-name-CSSGrid.mx-compound-widget {
            min-height: 60px;
        }

        /* Remove any default padding/margins that might interfere */
        .mx-css-grid-preview,
        .mx-css-grid-preview-item {
            padding: 0;
            margin: 0;
        }

        /* Ensure proper stacking context */
        .mx-css-grid {
            isolation: isolate;
        }

        /* Animation for configuration changes */
        .mx-css-grid-preview-item {
            transition: transform 0.2s ease, opacity 0.2s ease;
        }

        /* Special styling for auto-flow items */
        .mx-css-grid-preview-item[data-placement="auto"] .mx-css-grid-preview-empty {
            background: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(0, 0, 0, 0.01) 10px,
                rgba(0, 0, 0, 0.01) 20px
            );
        }

        /* Ensure area badges are visible above content */
        .mx-css-grid-preview-area-badge,
        .mx-css-grid-preview-responsive-badge {
            pointer-events: none;
        }

        /* Handle long area names */
        .mx-css-grid-preview-area-badge {
            max-width: calc(100% - 32px);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* CSS variables for dynamic grid lines */
        .mx-css-grid-preview[data-columns] {
            --columns: attr(data-columns number, 2);
        }
        
        .mx-css-grid-preview[data-rows] {
            --rows: attr(data-rows number, 2);
        }

        /* Debug mode specific adjustments */
        .mx-css-grid-preview-debug-layer + .mx-css-grid-preview {
            /* Ensure the actual grid is on top of debug layer for interaction */
            position: relative;
            z-index: 20;
        }
    `;
}