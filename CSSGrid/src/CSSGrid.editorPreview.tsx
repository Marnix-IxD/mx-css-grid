import { ReactElement, createElement, useState, useCallback, Fragment, useEffect, useMemo } from "react";
import { CSSGridPreviewProps } from "../typings/CSSGridProps";
import { parseGridTemplate, parseGridAreas, getUniqueAreaNames } from "./utils/gridHelpers";
import { 
    getItemDisplayName, 
    calculateItemPlacement as calculatePlacement,
    getAreaColor 
} from "./utils/gridItemUtils";

/**
 * CSS Grid Editor Preview Component
 * 
 * Interactive preview for the Mendix Studio Pro page editor
 * Features grid visualization, item placement, and area editing
 */
export function editorPreview(props: CSSGridPreviewProps): ReactElement {
    const {
        gridTemplateColumns,
        gridTemplateRows,
        gap,
        useNamedAreas,
        gridTemplateAreas,
        items,
        enableBreakpoints,
        breakpoints
    } = props;

    // State management
    const [editMode, setEditMode] = useState(false);
    const [selectedArea, setSelectedArea] = useState<string>(".");
    const [gridCells, setGridCells] = useState<string[][]>([]);
    const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Parse grid dimensions
    const columns = useMemo(() => parseGridTemplate(gridTemplateColumns || "1fr 1fr"), [gridTemplateColumns]);
    const rows = useMemo(() => parseGridTemplate(gridTemplateRows || "auto auto"), [gridTemplateRows]);
    const columnCount = columns.length;
    const rowCount = Math.max(rows.length, Math.ceil(items.length / columnCount), 3);

    /**
     * Initialize grid cells for area editing
     */
    const initializeGrid = useCallback(() => {
        if (useNamedAreas && gridTemplateAreas) {
            const parsed = parseGridAreas(gridTemplateAreas);
            if (parsed) {
                setGridCells(parsed);
                return;
            }
        }
        
        const emptyGrid = Array(rowCount).fill(null).map(() => 
            Array(columnCount).fill(".")
        );
        setGridCells(emptyGrid);
    }, [useNamedAreas, gridTemplateAreas, columnCount, rowCount]);

    useEffect(() => {
        initializeGrid();
    }, [initializeGrid]);

    /**
     * Calculate item placement with memoization
     */
    const calculateItemPlacement = useCallback((item: any, index: number) => {
        return calculatePlacement(item, index, gridCells, columnCount, useNamedAreas);
    }, [gridCells, columnCount, useNamedAreas]);

    /**
     * Get all item placements with inline detection
     */
    const itemPlacements = useMemo(() => {
        const placements = items.map((item, index) => ({
            item,
            index,
            placement: calculateItemPlacement(item, index)
        }));

        // Add inline detection
        return placements.map((current, idx) => ({
            ...current,
            isInline: placements.some((other, otherIdx) => 
                otherIdx !== idx &&
                other.placement.rowStart === current.placement.rowStart &&
                other.placement.rowEnd === current.placement.rowEnd
            )
        }));
    }, [items, calculateItemPlacement]);

    /**
     * Handle cell interaction in edit mode
     */
    const handleCellInteraction = useCallback((row: number, col: number, isClick: boolean) => {
        if (!editMode) return;

        const newGrid = gridCells.map(r => [...r]);
        
        while (newGrid.length <= row) {
            newGrid.push(Array(columnCount).fill("."));
        }
        
        if (isClick || isDragging) {
            newGrid[row][col] = selectedArea;
            setGridCells(newGrid);
        }
    }, [editMode, gridCells, columnCount, selectedArea, isDragging]);

    /**
     * Generate grid styles based on configuration
     */
    const gridStyles = useMemo<React.CSSProperties>(() => ({
        gridTemplateColumns: columns.join(" "),
        gridTemplateRows: rows.map(() => "minmax(80px, auto)").join(" "),
        gap: gap || "16px",
        gridTemplateAreas: useNamedAreas && gridCells.length > 0 
            ? gridCells.map(row => `"${row.join(" ")}"`).join(" ")
            : undefined
    }), [columns, rows, gap, useNamedAreas, gridCells]);

    /**
     * Predefined and custom area names
     */
    const availableAreas = useMemo(() => {
        const uniqueAreas = getUniqueAreaNames(gridCells);
        const predefinedAreas = ["header", "sidebar", "content", "footer", "nav", "aside"];
        return [...new Set([...predefinedAreas, ...uniqueAreas])].filter(a => a !== ".");
    }, [gridCells]);

    /**
     * Render grid items
     */
    const renderGridItems = () => {
        return itemPlacements.map(({ item, index, placement, isInline }) => {
            const itemStyles: React.CSSProperties = {
                zIndex: item.zIndex || index + 1
            };

            // Apply grid placement styles
            if (item.placementType === "area" && item.gridArea && useNamedAreas) {
                itemStyles.gridArea = item.gridArea;
            } else if (item.placementType === "coordinates") {
                itemStyles.gridColumn = `${placement.colStart} / ${placement.colEnd}`;
                itemStyles.gridRow = `${placement.rowStart} / ${placement.rowEnd}`;
            } else if (item.placementType === "span") {
                if (item.columnStart && item.columnStart !== "auto") {
                    itemStyles.gridColumn = item.columnStart.includes("span") 
                        ? item.columnStart 
                        : `${item.columnStart} / ${item.columnEnd || "auto"}`;
                }
                if (item.rowStart && item.rowStart !== "auto") {
                    itemStyles.gridRow = item.rowStart.includes("span")
                        ? item.rowStart
                        : `${item.rowStart} / ${item.rowEnd || "auto"}`;
                }
            }

            const displayName = getItemDisplayName(item, index);
            const widgetCount = item.content?.widgetCount || 0;

            return (
                <div
                    key={`item-${index}`}
                    className="mx-css-grid-editor-item"
                    style={itemStyles}
                >
                    {isInline && (
                        <div className="mx-css-grid-editor-item__inline-indicator" title="Displayed inline with other items">
                            ↔
                        </div>
                    )}
                    
                    {item.zIndex && item.zIndex !== 0 && (
                        <div className="mx-css-grid-editor-item__z-index">
                            {item.zIndex}
                        </div>
                    )}
                    
                    <div className="mx-css-grid-editor-item__name">
                        {displayName}
                    </div>
                    
                    <div className="mx-css-grid-editor-item__widgets">
                        {widgetCount} widget{widgetCount !== 1 ? "s" : ""}
                    </div>
                    
                    {item.placementType !== "auto" && (
                        <div className="mx-css-grid-editor-item__placement">
                            {item.placementType === "area" && item.gridArea
                                ? `Area: ${item.gridArea}`
                                : item.placementType === "coordinates"
                                ? `${placement.colStart}-${placement.rowStart}`
                                : "Span"}
                        </div>
                    )}
                </div>
            );
        });
    };

    /**
     * Render area editor
     */
    const renderAreaEditor = () => {
        if (!useNamedAreas) return null;

        return (
            <div className="mx-css-grid-editor-areas">
                <div className="mx-css-grid-editor-areas__header">
                    <h4 className="mx-css-grid-editor-areas__title">
                        Visual Grid Area Editor
                    </h4>
                    <button
                        onClick={() => {
                            setEditMode(!editMode);
                            if (!editMode) initializeGrid();
                        }}
                        className={`mx-css-grid-editor-areas__toggle ${editMode ? "mx-css-grid-editor-areas__toggle--active" : ""}`}
                    >
                        {editMode ? "Exit Edit Mode" : "Edit Areas"}
                    </button>
                </div>

                {editMode && (
                    <Fragment>
                        <div className="mx-css-grid-editor-areas__palette">
                            <label className="mx-css-grid-editor-areas__label">
                                Select area to paint:
                            </label>
                            <div className="mx-css-grid-editor-areas__buttons">
                                <button
                                    onClick={() => setSelectedArea(".")}
                                    className={`mx-css-grid-editor-areas__button ${
                                        selectedArea === "." ? "mx-css-grid-editor-areas__button--selected" : ""
                                    }`}
                                >
                                    Empty (.)
                                </button>
                                {availableAreas.map(area => (
                                    <button
                                        key={area}
                                        onClick={() => setSelectedArea(area)}
                                        className={`mx-css-grid-editor-areas__button ${
                                            selectedArea === area ? "mx-css-grid-editor-areas__button--selected" : ""
                                        }`}
                                        style={{
                                            backgroundColor: selectedArea === area ? undefined : getAreaColor(area)
                                        }}
                                    >
                                        {area}
                                    </button>
                                ))}
                            </div>
                            <div className="mx-css-grid-editor-areas__custom">
                                <input
                                    type="text"
                                    placeholder="Custom area name"
                                    className="mx-css-grid-editor-areas__input"
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            const value = (e.target as HTMLInputElement).value.trim();
                                            if (value && value !== "." && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value)) {
                                                setSelectedArea(value);
                                                (e.target as HTMLInputElement).value = "";
                                            }
                                        }
                                    }}
                                />
                                <span className="mx-css-grid-editor-areas__hint">
                                    Press Enter to add
                                </span>
                            </div>
                        </div>

                        <div 
                            className="mx-css-grid-editor-cells"
                            style={{
                                gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                                gridTemplateRows: `repeat(${rowCount}, 60px)`
                            }}
                            onMouseLeave={() => {
                                setHoveredCell(null);
                                setIsDragging(false);
                            }}
                            onMouseUp={() => setIsDragging(false)}
                        >
                            {Array(rowCount).fill(null).map((_, row) => 
                                Array(columnCount).fill(null).map((_, col) => {
                                    const area = gridCells[row]?.[col] || ".";
                                    const isHovered = hoveredCell?.row === row && hoveredCell?.col === col;
                                    
                                    return (
                                        <div
                                            key={`${row}-${col}`}
                                            className={`mx-css-grid-editor-cell ${
                                                area !== "." ? "mx-css-grid-editor-cell--filled" : ""
                                            } ${isHovered && editMode ? "mx-css-grid-editor-cell--hovered" : ""}`}
                                            style={{
                                                backgroundColor: area === "." ? undefined : getAreaColor(area)
                                            }}
                                            onMouseDown={() => {
                                                setIsDragging(true);
                                                handleCellInteraction(row, col, true);
                                            }}
                                            onMouseEnter={() => {
                                                setHoveredCell({ row, col });
                                                if (isDragging) {
                                                    handleCellInteraction(row, col, false);
                                                }
                                            }}
                                        >
                                            {area === "." ? "•" : area}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="mx-css-grid-editor-template">
                            <strong>Generated template:</strong>
                            <pre className="mx-css-grid-editor-template__code">
                                {gridCells.map(row => `"${row.join(" ")}"`).join("\n")}
                            </pre>
                            <button
                                onClick={() => {
                                    const template = gridCells.map(row => `"${row.join(" ")}"`).join("\n");
                                    navigator.clipboard.writeText(template);
                                }}
                                className="mx-css-grid-editor-template__copy"
                            >
                                Copy to Clipboard
                            </button>
                        </div>
                    </Fragment>
                )}
            </div>
        );
    };

    return (
        <div className="mx-css-grid-editor-preview">
            <div className="mx-css-grid-editor-header">
                <h3 className="mx-css-grid-editor-header__title">
                    CSS Grid Layout Preview
                </h3>
                <div className="mx-css-grid-editor-header__info">
                    {columnCount} columns × {rowCount} rows
                    {gap && ` • Gap: ${gap}`}
                    {useNamedAreas && " • Using named areas"}
                    {enableBreakpoints && breakpoints && breakpoints.length > 0 && ` • ${breakpoints.length} breakpoints`}
                </div>
            </div>

            <div className="mx-css-grid-editor-container" style={gridStyles}>
                {renderGridItems()}
            </div>

            {renderAreaEditor()}

            <div className="mx-css-grid-editor-help">
                <strong>Tip:</strong> Items are positioned according to their placement type. 
                Items in the same row are displayed inline. Use the area editor to visually design named grid areas.
            </div>
        </div>
    );
}

/**
 * Get preview CSS styles
 * 
 * @returns CSS string for editor preview styling
 */
export function getPreviewCss(): string {
    return `
        /* Container and layout */
        .mx-css-grid-editor-preview {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            padding: 16px;
            background-color: #ffffff;
            border-radius: 8px;
        }

        .mx-css-grid-editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
        }

        .mx-css-grid-editor-header__title {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #111827;
        }

        .mx-css-grid-editor-header__info {
            font-size: 12px;
            color: #6b7280;
        }

        /* Grid container */
        .mx-css-grid-editor-container {
            display: grid;
            background-color: #f9fafb;
            border: 2px dashed #d1d5db;
            border-radius: 6px;
            padding: 16px;
            min-height: 400px;
            position: relative;
        }

        /* Grid items */
        .mx-css-grid-editor-item {
            background-color: #ffffff;
            border: 2px solid #3b82f6;
            border-radius: 6px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            min-height: 60px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
        }

        .mx-css-grid-editor-item:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            border-color: #2563eb;
        }

        .mx-css-grid-editor-item__inline-indicator {
            position: absolute;
            top: -8px;
            right: -8px;
            background-color: #10b981;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .mx-css-grid-editor-item__z-index {
            position: absolute;
            top: 4px;
            left: 4px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: #6b7280;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
        }

        .mx-css-grid-editor-item__name {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 4px;
            color: #111827;
            text-align: center;
            word-break: break-word;
        }

        .mx-css-grid-editor-item__widgets {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 4px;
        }

        .mx-css-grid-editor-item__placement {
            font-size: 10px;
            color: #3b82f6;
            padding: 2px 8px;
            background-color: #eff6ff;
            border-radius: 3px;
            margin-top: auto;
        }

        /* Area editor */
        .mx-css-grid-editor-areas {
            margin-top: 16px;
            padding: 16px;
            background-color: #f9fafb;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }

        .mx-css-grid-editor-areas__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .mx-css-grid-editor-areas__title {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: #111827;
        }

        .mx-css-grid-editor-areas__toggle {
            padding: 6px 16px;
            background-color: #3b82f6;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.2s;
        }

        .mx-css-grid-editor-areas__toggle:hover {
            background-color: #2563eb;
        }

        .mx-css-grid-editor-areas__toggle--active {
            background-color: #dc2626;
        }

        .mx-css-grid-editor-areas__toggle--active:hover {
            background-color: #b91c1c;
        }

        .mx-css-grid-editor-areas__palette {
            margin-bottom: 16px;
        }

        .mx-css-grid-editor-areas__label {
            font-size: 12px;
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #374151;
        }

        .mx-css-grid-editor-areas__buttons {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 8px;
        }

        .mx-css-grid-editor-areas__button {
            padding: 6px 12px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            font-weight: 400;
            transition: all 0.2s;
            background-color: #ffffff;
            color: #374151;
        }

        .mx-css-grid-editor-areas__button:hover {
            border-color: #9ca3af;
            transform: translateY(-1px);
        }

        .mx-css-grid-editor-areas__button--selected {
            background-color: #10b981;
            color: white;
            border-color: #10b981;
            font-weight: 500;
        }

        .mx-css-grid-editor-areas__custom {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .mx-css-grid-editor-areas__input {
            padding: 6px 12px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            font-size: 12px;
            width: 150px;
        }

        .mx-css-grid-editor-areas__input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .mx-css-grid-editor-areas__hint {
            font-size: 11px;
            color: #6b7280;
        }

        /* Grid cells editor */
        .mx-css-grid-editor-cells {
            display: grid;
            gap: 4px;
            margin-bottom: 16px;
            user-select: none;
        }

        .mx-css-grid-editor-cell {
            background-color: #ffffff;
            border: 2px solid #e5e7eb;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: crosshair;
            font-size: 12px;
            color: #6b7280;
            transition: all 0.15s ease;
            position: relative;
        }

        .mx-css-grid-editor-cell--filled {
            font-weight: bold;
            color: #1e40af;
            border-color: #3b82f6;
        }

        .mx-css-grid-editor-cell--hovered {
            transform: scale(0.95);
            opacity: 0.8;
        }

        /* Template output */
        .mx-css-grid-editor-template {
            padding: 12px;
            background-color: #f3f4f6;
            border-radius: 4px;
            font-size: 11px;
        }

        .mx-css-grid-editor-template__code {
            margin: 8px 0 0 0;
            white-space: pre-wrap;
            font-family: "Consolas", "Monaco", "Courier New", monospace;
            color: #1f2937;
        }

        .mx-css-grid-editor-template__copy {
            margin-top: 8px;
            padding: 4px 12px;
            background-color: #3b82f6;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .mx-css-grid-editor-template__copy:hover {
            background-color: #2563eb;
        }

        /* Help text */
        .mx-css-grid-editor-help {
            margin-top: 16px;
            padding: 12px;
            background-color: #eff6ff;
            border-radius: 4px;
            font-size: 12px;
            color: #1e40af;
            line-height: 1.5;
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
            .mx-css-grid-editor-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }

            .mx-css-grid-editor-areas__header {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }

            .mx-css-grid-editor-areas__buttons {
                justify-content: flex-start;
            }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
            .mx-css-grid-editor-container {
                border-width: 3px;
            }

            .mx-css-grid-editor-item {
                border-width: 3px;
            }

            .mx-css-grid-editor-cell {
                border-width: 3px;
            }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
            .mx-css-grid-editor-item,
            .mx-css-grid-editor-areas__toggle,
            .mx-css-grid-editor-areas__button,
            .mx-css-grid-editor-cell {
                transition: none;
            }
        }
    `;
}