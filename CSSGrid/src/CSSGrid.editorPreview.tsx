import { createElement } from "react";
import { Selectable } from "mendix/preview/Selectable";
import { CSSGridPreviewProps, ItemsPreviewType } from "../typings/CSSGridProps";

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

// Type for container responsive properties
type ResponsiveContainerProperties = {
    enableBreakpoints?: boolean;
    
    // XS breakpoint
    xsEnabled?: boolean;
    xsColumns?: string;
    xsRows?: string;
    xsAreas?: string;
    xsGap?: string;
    
    // SM breakpoint
    smEnabled?: boolean;
    smColumns?: string;
    smRows?: string;
    smAreas?: string;
    smGap?: string;
    
    // MD breakpoint
    mdEnabled?: boolean;
    mdColumns?: string;
    mdRows?: string;
    mdAreas?: string;
    mdGap?: string;
    
    // LG breakpoint
    lgEnabled?: boolean;
    lgColumns?: string;
    lgRows?: string;
    lgAreas?: string;
    lgGap?: string;
    
    // XL breakpoint
    xlEnabled?: boolean;
    xlColumns?: string;
    xlRows?: string;
    xlAreas?: string;
    xlGap?: string;
    
    // XXL breakpoint
    xxlEnabled?: boolean;
    xxlColumns?: string;
    xxlRows?: string;
    xxlAreas?: string;
    xxlGap?: string;
};

// Use type intersection instead of interface extension
type ResponsiveItemPreview = ItemsPreviewType & ResponsiveProperties;
type ResponsiveContainerPreview = CSSGridPreviewProps & ResponsiveContainerProperties;

// Define the props type that includes Mendix preview properties
type PreviewProps = ResponsiveContainerPreview & {
    readOnly?: boolean;
    renderMode?: string;
    class?: string;
    style?: string;
};

/**
 * CSS Grid Preview Component for Mendix Studio Pro
 * 
 * Uses the official Mendix Selectable component for proper item selection
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
        enableBreakpoints,
        class: className,
        style: customStyle
    } = props;

    // Parse style string to React style object
    const parseStyleString = (styleStr?: string): React.CSSProperties => {
        if (!styleStr) return {};
        
        const styleObj: any = {};
        const declarations = styleStr.split(';').filter(s => s.trim());
        
        declarations.forEach(declaration => {
            const [property, value] = declaration.split(':').map(s => s.trim());
            if (property && value) {
                // Convert kebab-case to camelCase
                const camelCaseProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                styleObj[camelCaseProperty] = value;
            }
        });
        
        return styleObj as React.CSSProperties;
    };

    // Apply grid styles exactly as they would appear in the browser
    const containerStyle: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: gridTemplateColumns || "1fr 1fr",
        gridTemplateRows: gridTemplateRows || "auto",
        // Use the actual gap values from props
        gap: gap || undefined,
        rowGap: rowGap || undefined,
        columnGap: columnGap || undefined,
        width: "100%",
        gridTemplateAreas: useNamedAreas ? gridTemplateAreas : undefined,
        ...parseStyleString(customStyle)
    };

    // Get responsive status for caption
    const getResponsiveStatus = (): string => {
        if (enableBreakpoints) {
            const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
            const activeBreakpoints = breakpoints.filter(bp => {
                const key = `${bp}Enabled` as keyof ResponsiveContainerPreview;
                return props[key];
            });
            
            if (activeBreakpoints.length > 0) {
                return ` (${activeBreakpoints.length} breakpoints)`;
            }
        }
        return "";
    };

    return (
        <div 
            className={`mx-css-grid-preview ${className || ""}`}
            style={containerStyle}
        >
            {/* Show responsive indicator */}
            {enableBreakpoints && (
                <div className="mx-css-grid-preview-responsive-indicator">
                    Responsive Grid{getResponsiveStatus()}
                </div>
            )}
            
            {/* Render grid items with Selectable wrapper */}
            {items.map((item: ItemsPreviewType, index: number) => {
                const responsiveItem = item as ResponsiveItemPreview;
                const ContentRenderer = responsiveItem.content?.renderer;
                
                // Build item styles
                const itemStyles: React.CSSProperties = {
                    position: "relative",
                    minHeight: "40px",
                    width: "100%",
                    height: "100%"
                };

                // Apply grid placement
                if (responsiveItem.placementType === "area" && responsiveItem.gridArea && useNamedAreas) {
                    itemStyles.gridArea = responsiveItem.gridArea;
                } else if (responsiveItem.placementType === "coordinates") {
                    if (responsiveItem.columnStart && responsiveItem.columnStart !== "auto") {
                        itemStyles.gridColumnStart = responsiveItem.columnStart;
                    }
                    if (responsiveItem.columnEnd && responsiveItem.columnEnd !== "auto") {
                        itemStyles.gridColumnEnd = responsiveItem.columnEnd;
                    }
                    if (responsiveItem.rowStart && responsiveItem.rowStart !== "auto") {
                        itemStyles.gridRowStart = responsiveItem.rowStart;
                    }
                    if (responsiveItem.rowEnd && responsiveItem.rowEnd !== "auto") {
                        itemStyles.gridRowEnd = responsiveItem.rowEnd;
                    }
                } else if (responsiveItem.placementType === "span") {
                    if (responsiveItem.columnStart && responsiveItem.columnStart !== "auto") {
                        itemStyles.gridColumn = responsiveItem.columnStart;
                    }
                    if (responsiveItem.rowStart && responsiveItem.rowStart !== "auto") {
                        itemStyles.gridRow = responsiveItem.rowStart;
                    }
                }

                // Apply alignment if not auto
                if (responsiveItem.justifySelf && responsiveItem.justifySelf !== "auto") {
                    itemStyles.justifySelf = responsiveItem.justifySelf;
                }
                if (responsiveItem.alignSelf && responsiveItem.alignSelf !== "auto") {
                    itemStyles.alignSelf = responsiveItem.alignSelf;
                }

                // Apply z-index if specified
                if (responsiveItem.zIndex) {
                    itemStyles.zIndex = responsiveItem.zIndex;
                }
                
                const itemName = responsiveItem.itemName || 
                    (responsiveItem.placementType === "area" && responsiveItem.gridArea ? responsiveItem.gridArea : 
                     `Item ${index + 1}`);
                
                // Get responsive status for item
                const itemResponsiveIndicator = responsiveItem.enableResponsive ? " 📱" : "";
                
                return (
                    <Selectable
                        key={`grid-item-${index}`}
                        object={responsiveItem}
                        caption={`${itemName}${itemResponsiveIndicator}`}
                    >
                        <div
                            className={`mx-css-grid-preview-item ${responsiveItem.className || ""}`}
                            style={itemStyles}
                        >
                            {/* Show area name label only for named areas */}
                            {responsiveItem.placementType === "area" && responsiveItem.gridArea && useNamedAreas && (
                                <div className="mx-css-grid-preview-area-label">
                                    {responsiveItem.gridArea}
                                </div>
                            )}
                            
                            {/* Show responsive indicator */}
                            {responsiveItem.enableResponsive && (
                                <div className="mx-css-grid-preview-item-responsive">
                                    <span title="Responsive placement enabled">📱</span>
                                </div>
                            )}
                            
                            {/* Render actual widget content or placeholder */}
                            {ContentRenderer ? (
                                <div className="mx-css-grid-preview-item-content">
                                    <ContentRenderer>
                                        <div style={{ width: "100%", height: "100%" }} />
                                    </ContentRenderer>
                                </div>
                            ) : (
                                <div className="mx-css-grid-preview-placeholder">
                                    <span className="mx-css-grid-preview-placeholder-text">{itemName}</span>
                                </div>
                            )}
                        </div>
                    </Selectable>
                );
            })}
        </div>
    );
};

/**
 * Get preview CSS styles
 * Minimal styles that match the actual widget appearance
 * 
 * @returns CSS string for editor preview styling
 */
export function getPreviewCss(): string {
    return `
        /* Minimal grid preview styles - match actual widget */
        .mx-css-grid-preview {
            box-sizing: border-box;
            width: 100%;
            position: relative;
        }

        /* Responsive indicator for container */
        .mx-css-grid-preview-responsive-indicator {
            position: absolute;
            top: -20px;
            right: 0;
            font-size: 11px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #0066cc;
            background: rgba(255, 255, 255, 0.9);
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: 500;
            z-index: 10;
        }

        /* Grid items - applied to Selectable wrapper */
        .mx-css-grid-preview-item {
            box-sizing: border-box;
            position: relative;
            min-width: 0;
            min-height: 0;
            width: 100% !important;
            height: 100% !important;
        }

        /* Inner wrapper for grid item content */
        .mx-css-grid-preview-item-inner {
            position: relative;
            width: 100%;
            height: 100%;
            min-height: 40px;
            overflow: hidden;
            transition: background-color 0.15s ease, box-shadow 0.15s ease;
        }

        /* Content wrapper */
        .mx-css-grid-preview-item-content {
            width: 100%;
            height: 100%;
        }

        /* Area name labels - more subtle and better positioned */
        .mx-css-grid-preview-area-label {
            position: absolute;
            top: 2px;
            left: 2px;
            font-size: 10px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-weight: 500;
            padding: 1px 4px;
            background-color: rgba(0, 0, 0, 0.6);
            color: white;
            border-radius: 2px;
            pointer-events: none;
            z-index: 2;
            line-height: 1.2;
            opacity: 0.8;
            transition: opacity 0.15s ease;
        }

        /* Responsive indicator for items */
        .mx-css-grid-preview-item-responsive {
            position: absolute;
            top: 2px;
            right: 2px;
            font-size: 12px;
            z-index: 2;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 2px;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Hide label on hover for better content visibility */
        .mx-css-grid-preview-item:hover .mx-css-grid-preview-area-label {
            opacity: 0.3;
        }

        /* Placeholder for empty grid items - very light background */
        .mx-css-grid-preview-placeholder {
            width: 100%;
            height: 100%;
            min-height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #fafafa;
            border: 1px solid #f0f0f0;
            transition: all 0.15s ease;
        }

        .mx-css-grid-preview-placeholder-text {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 12px;
            color: #999;
            user-select: none;
        }

        /* Hover effect with pastel background */
        .mx-css-grid-preview-item:hover .mx-css-grid-preview-placeholder {
            background-color: #e3f2fd;
            border-color: #bbdefb;
        }

        .mx-css-grid-preview-item:hover .mx-css-grid-preview-placeholder-text {
            color: #1976d2;
        }

        /* Ensure widget content fills the container */
        .mx-css-grid-preview-item-inner > div {
            width: 100%;
            height: 100%;
        }

        /* Remove any default margins on nested elements */
        .mx-css-grid-preview-item-inner > * {
            margin: 0;
        }

        /* Handle nested Mendix widgets */
        .mx-css-grid-preview-item .mx-widget,
        .mx-css-grid-preview-item .mx-dataview,
        .mx-css-grid-preview-item .mx-listview,
        .mx-css-grid-preview-item .mx-container,
        .mx-css-grid-preview-item .mx-container-nested {
            width: 100%;
            height: 100%;
        }

        /* Override any default Mendix Selectable styles */
        .mx-selectable {
            display: contents !important;
            background: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
        }

        /* Different hover colors for different areas */
        .mx-css-grid-preview-item:nth-child(6n+1):hover .mx-css-grid-preview-placeholder {
            background-color: #ffebee;
            border-color: #ffcdd2;
        }

        .mx-css-grid-preview-item:nth-child(6n+2):hover .mx-css-grid-preview-placeholder {
            background-color: #e8f5e9;
            border-color: #c8e6c9;
        }

        .mx-css-grid-preview-item:nth-child(6n+3):hover .mx-css-grid-preview-placeholder {
            background-color: #f3e5f5;
            border-color: #e1bee7;
        }

        .mx-css-grid-preview-item:nth-child(6n+4):hover .mx-css-grid-preview-placeholder {
            background-color: #fff3e0;
            border-color: #ffe0b2;
        }

        .mx-css-grid-preview-item:nth-child(6n+5):hover .mx-css-grid-preview-placeholder {
            background-color: #fce4ec;
            border-color: #f8bbd0;
        }

        /* Ensure grid items with actual content have transparent background */
        .mx-css-grid-preview-item-content {
            background-color: transparent;
        }

        /* If there's content, don't show placeholder background */
        .mx-css-grid-preview-item-inner:has(.mx-css-grid-preview-item-content) {
            background-color: transparent;
        }
    `;
}