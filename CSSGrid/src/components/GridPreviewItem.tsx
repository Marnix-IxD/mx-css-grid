import { ReactElement, createElement } from "react";
import { Selectable } from "mendix/preview/Selectable";
import { getItemCaption, getPlacementDisplayText, getAreaColor } from "../utils/gridItemUtils";

interface GridPreviewItemProps {
    item: any;
    index: number;
    name: string;
    placement: {
        x: number;
        y: number;
        width: number;
        height: number;
        gridArea?: string;
        colStart: number;
        colEnd: number;
        rowStart: number;
        rowEnd: number;
    };
    isInlineWithOthers?: boolean;
    onHover?: (hovered: boolean) => void;
}

/**
 * Grid Preview Item Component
 * 
 * Renders a single selectable grid item in the preview
 * with proper positioning and interactive feedback
 */
export function GridPreviewItem({ 
    item, 
    index, 
    name, 
    placement,
    isInlineWithOthers = false,
    onHover 
}: GridPreviewItemProps): ReactElement {
    // Get the placement display text using shared utility
    const placementText = getPlacementDisplayText(item, placement);
    
    // Get caption using shared utility
    const caption = getItemCaption(item, index);

    return (
        <div
            style={{
                position: "absolute",
                left: placement.x,
                top: placement.y,
                width: placement.width,
                height: placement.height,
                zIndex: item.zIndex || index + 1
            }}
        >
            <Selectable
                object={item}
                caption={caption}
            >
                <div 
                    style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#ffffff",
                        border: "2px solid #007bff",
                        borderRadius: "4px",
                        padding: "12px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        minHeight: "60px"
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = "scale(1.02)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                        (e.currentTarget as HTMLElement).style.borderColor = "#0056b3";
                        onHover?.(true);
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                        (e.currentTarget as HTMLElement).style.borderColor = "#007bff";
                        onHover?.(false);
                    }}
                >
                    {/* Inline indicator */}
                    {isInlineWithOthers && (
                        <div 
                            style={{
                                position: "absolute",
                                top: "-8px",
                                right: "-8px",
                                backgroundColor: "#28a745",
                                color: "white",
                                borderRadius: "50%",
                                width: "20px",
                                height: "20px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "10px",
                                fontWeight: "bold",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                            }}
                            title="Displayed inline with other items"
                        >
                            ↔
                        </div>
                    )}
                    
                    {/* Item name */}
                    <div style={{ 
                        fontSize: "14px", 
                        fontWeight: 600, 
                        marginBottom: "4px", 
                        color: "#333",
                        textAlign: "center",
                        maxWidth: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                    }}>
                        {name}
                    </div>
                    
                    {/* Widget count */}
                    <div style={{ 
                        fontSize: "11px", 
                        color: "#6c757d",
                        marginBottom: item.placementType !== "auto" ? "4px" : 0
                    }}>
                        {item.content?.widgetCount || 0} widget{item.content?.widgetCount !== 1 ? "s" : ""}
                    </div>
                    
                    {/* Placement info */}
                    {item.placementType !== "auto" && (
                        <div style={{ 
                            fontSize: "10px", 
                            color: "#007bff", 
                            padding: "2px 8px",
                            backgroundColor: "#e7f3ff",
                            borderRadius: "3px",
                            marginTop: "auto"
                        }}>
                            {placementText}
                        </div>
                    )}
                    
                    {/* Visual indicator for z-index */}
                    {item.zIndex && item.zIndex !== 0 && (
                        <div style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            backgroundColor: "#6c757d",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: "bold"
                        }}>
                            {item.zIndex}
                        </div>
                    )}
                </div>
            </Selectable>
        </div>
    );
}

/**
 * Grid Area Background Component
 * 
 * Renders the background cells for named areas
 */
interface GridAreaBackgroundProps {
    row: number;
    col: number;
    cellWidth: number;
    cellHeight: number;
    gap: number;
    areaName: string;
    color: string;
}

export function GridAreaBackground({
    row,
    col,
    cellWidth,
    cellHeight,
    gap,
    areaName,
    color
}: GridAreaBackgroundProps): ReactElement {
    const x = col * (cellWidth + gap);
    const y = row * (cellHeight + gap);
    
    // Use the shared getAreaColor function if no color provided
    const backgroundColor = color || getAreaColor(areaName);
    
    return (
        <div
            style={{
                position: "absolute",
                left: x,
                top: y,
                width: cellWidth,
                height: cellHeight,
                backgroundColor: areaName === "." ? "#f0f0f0" : backgroundColor,
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                color: "#999",
                fontStyle: "italic",
                userSelect: "none"
            }}
        >
            {areaName !== "." && areaName}
        </div>
    );
}