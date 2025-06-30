import React, { ReactElement, createElement, useMemo } from "react";
import { CSSGridPreviewProps } from "../typings/CSSGridProps";
import { parseGridTemplate, parseGridAreas, getUniqueAreaNames } from "./utils/gridHelpers";

/**
 * CSS Grid Preview Component
 * 
 * Renders a simplified preview of the grid layout in Mendix Studio Pro
 * Shows grid structure, areas, and item placement
 */
export function preview(props: CSSGridPreviewProps): ReactElement {
    const {
        gridTemplateColumns,
        gridTemplateRows,
        gap,
        useNamedAreas,
        gridTemplateAreas,
        items,
        autoFlow
    } = props;

    // Parse grid structure
    const columns = useMemo(() => parseGridTemplate(gridTemplateColumns || "1fr 1fr"), [gridTemplateColumns]);
    const rows = useMemo(() => parseGridTemplate(gridTemplateRows || "auto"), [gridTemplateRows]);
    const areas = useMemo(() => useNamedAreas ? parseGridAreas(gridTemplateAreas || "") : null, [useNamedAreas, gridTemplateAreas]);
    
    // Calculate grid dimensions
    const columnCount = columns.length;
    const rowCount = areas ? areas.length : Math.max(rows.length, Math.ceil(items.length / columnCount));
    
    // Create grid preview styles
    const gridStyles = useMemo<React.CSSProperties>(() => ({
        gridTemplateColumns: columns.join(" "),
        gridTemplateRows: Array(rowCount).fill("minmax(60px, auto)").join(" "),
        gap: gap || "16px",
        gridTemplateAreas: useNamedAreas && areas ? areas.map(row => `"${row.join(" ")}"`).join(" ") : undefined
    }), [columns, rowCount, gap, useNamedAreas, areas]);

    // Group items by placement type for summary
    const itemSummary = useMemo(() => {
        const summary = {
            auto: 0,
            area: 0,
            coordinates: 0,
            span: 0
        };
        
        items.forEach(item => {
            summary[item.placementType]++;
        });
        
        return summary;
    }, [items]);

    // Get unique area names for display
    const areaNames = useMemo(() => areas ? getUniqueAreaNames(areas) : [], [areas]);

    // Map auto flow enumeration to display value
    const autoFlowDisplay = useMemo(() => {
        const mappings: Record<string, string> = {
            'row': 'row',
            'column': 'column',
            'dense': 'row dense',
            'columnDense': 'column dense'
        };
        return mappings[autoFlow] || autoFlow;
    }, [autoFlow]);

    /**
     * Render preview items with placement indicators
     */
    const renderPreviewItems = () => {
        const renderedItems: ReactElement[] = [];
        const placedAreas = new Set<string>();

        // Render items with specific placement first
        items.forEach((item, index) => {
            if (item.placementType === "area" && item.gridArea && !placedAreas.has(item.gridArea)) {
                placedAreas.add(item.gridArea);
                renderedItems.push(
                    <div
                        key={`area-${item.gridArea}`}
                        className="mx-css-grid-preview-item mx-css-grid-preview-item--area"
                        style={{ gridArea: item.gridArea }}
                    >
                        <div className="mx-css-grid-preview-item__name">{item.gridArea}</div>
                        <div className="mx-css-grid-preview-item__info">
                            {items.filter(i => i.gridArea === item.gridArea).length} item(s)
                        </div>
                    </div>
                );
            } else if (item.placementType === "coordinates") {
                const colStart = parseInt(item.columnStart) || 1;
                const colEnd = parseInt(item.columnEnd) || colStart + 1;
                const rowStart = parseInt(item.rowStart) || 1;
                const rowEnd = parseInt(item.rowEnd) || rowStart + 1;
                
                renderedItems.push(
                    <div
                        key={`coord-${index}`}
                        className="mx-css-grid-preview-item mx-css-grid-preview-item--coordinates"
                        style={{
                            gridColumn: `${colStart} / ${colEnd}`,
                            gridRow: `${rowStart} / ${rowEnd}`
                        }}
                    >
                        <div className="mx-css-grid-preview-item__name">Item {index + 1}</div>
                        <div className="mx-css-grid-preview-item__info">
                            {colStart},{rowStart} → {colEnd - 1},{rowEnd - 1}
                        </div>
                    </div>
                );
            }
        });

        // Add summary for auto-placed and span items
        const autoCount = itemSummary.auto;
        const spanCount = itemSummary.span;
        
        if (autoCount > 0 || spanCount > 0) {
            renderedItems.push(
                <div
                    key="auto-summary"
                    className="mx-css-grid-preview-summary"
                    style={{ gridColumn: "1 / -1" }}
                >
                    {autoCount > 0 && (
                        <div className="mx-css-grid-preview-summary__item">
                            {autoCount} auto-placed item{autoCount > 1 ? "s" : ""} ({autoFlowDisplay})
                        </div>
                    )}
                    {spanCount > 0 && (
                        <div className="mx-css-grid-preview-summary__item">
                            {spanCount} span item{spanCount > 1 ? "s" : ""}
                        </div>
                    )}
                </div>
            );
        }

        return renderedItems;
    };

    /**
     * Render grid structure overlay
     */
    const renderGridOverlay = () => {
        if (!useNamedAreas || !areas) return null;

        return (
            <div className="mx-css-grid-preview-overlay">
                {areas.map((row, rowIdx) => (
                    row.map((cell, colIdx) => (
                        <div
                            key={`overlay-${rowIdx}-${colIdx}`}
                            className={`mx-css-grid-preview-cell ${
                                cell !== "." ? "mx-css-grid-preview-cell--named" : ""
                            }`}
                            style={{
                                gridRow: rowIdx + 1,
                                gridColumn: colIdx + 1
                            }}
                        >
                            {cell !== "." && (
                                <span className="mx-css-grid-preview-cell__label">
                                    {cell}
                                </span>
                            )}
                        </div>
                    ))
                ))}
            </div>
        );
    };

    return (
        <div className="mx-css-grid-preview">
            <div className="mx-css-grid-preview__header">
                <h4 className="mx-css-grid-preview__title">
                    CSS Grid Preview
                </h4>
                <div className="mx-css-grid-preview__info">
                    {columnCount}×{rowCount} grid
                    {useNamedAreas && areaNames.length > 0 && ` • ${areaNames.length} areas`}
                    {gap && ` • Gap: ${gap}`}
                </div>
            </div>
            
            <div 
                className="mx-css-grid-preview__grid"
                style={gridStyles}
            >
                {renderGridOverlay()}
                {renderPreviewItems()}
            </div>

            {items.length === 0 && (
                <div className="mx-css-grid-preview__empty">
                    No items configured. Add items to see the grid layout.
                </div>
            )}
        </div>
    );
}

/**
 * Get preview CSS styles
 * 
 * @returns CSS string for preview styling
 */
export function getPreviewCss(): string {
    return `
        .mx-css-grid-preview {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #ffffff;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .mx-css-grid-preview__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
        }

        .mx-css-grid-preview__title {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: #111827;
        }

        .mx-css-grid-preview__info {
            font-size: 12px;
            color: #6b7280;
        }

        .mx-css-grid-preview__grid {
            position: relative;
            display: grid;
            background-color: #f9fafb;
            border: 2px dashed #d1d5db;
            border-radius: 6px;
            padding: 16px;
            min-height: 200px;
        }

        .mx-css-grid-preview__empty {
            padding: 24px;
            text-align: center;
            color: #9ca3af;
            font-size: 13px;
            background-color: #f9fafb;
            border: 2px dashed #d1d5db;
            border-radius: 6px;
        }

        /* Grid overlay for named areas */
        .mx-css-grid-preview-overlay {
            position: absolute;
            inset: 0;
            display: grid;
            grid-template: inherit;
            gap: inherit;
            pointer-events: none;
            z-index: 0;
        }

        .mx-css-grid-preview-cell {
            position: relative;
            border: 1px solid transparent;
        }

        .mx-css-grid-preview-cell--named {
            background-color: rgba(59, 130, 246, 0.05);
            border-color: rgba(59, 130, 246, 0.2);
            border-radius: 4px;
        }

        .mx-css-grid-preview-cell__label {
            position: absolute;
            top: 2px;
            left: 4px;
            font-size: 10px;
            color: #3b82f6;
            font-weight: 500;
            line-height: 1;
        }

        /* Preview items */
        .mx-css-grid-preview-item {
            position: relative;
            background-color: #ffffff;
            border: 2px solid #3b82f6;
            border-radius: 6px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            z-index: 1;
            transition: all 0.2s ease;
        }

        .mx-css-grid-preview-item:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .mx-css-grid-preview-item--area {
            border-color: #10b981;
            background-color: #f0fdf4;
        }

        .mx-css-grid-preview-item--coordinates {
            border-color: #8b5cf6;
            background-color: #f5f3ff;
        }

        .mx-css-grid-preview-item__name {
            font-size: 13px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 4px;
            text-align: center;
        }

        .mx-css-grid-preview-item__info {
            font-size: 11px;
            color: #6b7280;
            text-align: center;
        }

        /* Summary section */
        .mx-css-grid-preview-summary {
            background-color: #eff6ff;
            border: 2px dashed #3b82f6;
            border-radius: 6px;
            padding: 12px;
            margin-top: 8px;
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .mx-css-grid-preview-summary__item {
            font-size: 12px;
            color: #1e40af;
            font-weight: 500;
        }

        /* Responsive adjustments */
        @media (max-width: 480px) {
            .mx-css-grid-preview__header {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }

            .mx-css-grid-preview__grid {
                padding: 12px;
            }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
            .mx-css-grid-preview__grid {
                border-width: 3px;
            }

            .mx-css-grid-preview-item {
                border-width: 3px;
            }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
            .mx-css-grid-preview-item {
                transition: none;
            }
        }
    `;
}