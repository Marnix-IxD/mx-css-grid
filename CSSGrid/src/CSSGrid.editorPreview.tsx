import { createElement, useState, useCallback, Fragment, useEffect, useMemo } from "react";
import { CSSGridPreviewProps } from "../typings/CSSGridProps";
import { parseGridTemplate, parseGridAreas, getUniqueAreaNames } from "./utils/gridHelpers";
import { getAreaColor } from "./utils/gridItemUtils";
import { Selectable } from "mendix/preview/Selectable";

// Define the props type that includes Mendix preview properties
type PreviewProps = CSSGridPreviewProps & {
    readOnly?: boolean;
    renderMode?: string;
    class?: string;
    style?: string;
};

/**
 * CSS Grid Preview Component for Mendix Studio Pro
 * 
 * This is the main preview export that Mendix expects
 */
export const preview: React.FC<PreviewProps> = (props) => {
    const {
        gridTemplateColumns,
        gridTemplateRows,
        gap,
        useNamedAreas,
        gridTemplateAreas,
        items,
        class: className,
        style: customStyle,
        readOnly,
        renderMode
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
     * Handle cell interaction in edit mode
     */
    const handleCellInteraction = useCallback((row: number, col: number, isClick: boolean) => {
        if (!editMode || readOnly) return;

        const newGrid = gridCells.map(r => [...r]);
        
        while (newGrid.length <= row) {
            newGrid.push(Array(columnCount).fill("."));
        }
        
        if (isClick || isDragging) {
            newGrid[row][col] = selectedArea;
            setGridCells(newGrid);
        }
    }, [editMode, gridCells, columnCount, selectedArea, isDragging, readOnly]);

    /**
     * Predefined and custom area names
     */
    const availableAreas = useMemo(() => {
        const uniqueAreas = getUniqueAreaNames(gridCells);
        const predefinedAreas = ["header", "sidebar", "content", "footer", "nav", "aside"];
        return [...new Set([...predefinedAreas, ...uniqueAreas])].filter(a => a !== ".");
    }, [gridCells]);

    /**
     * Render grid container with positioned items
     */
    const renderGridContainer = () => {
        // Apply size constraints from props
        const containerStyle: React.CSSProperties = {
            display: "grid",
            gridTemplateColumns: gridTemplateColumns || "1fr 1fr",
            gridTemplateRows: gridTemplateRows || "auto",
            gap: gap || "16px",
            width: props.maxWidth || "100%",
            height: props.maxHeight || undefined,
            minWidth: props.minWidth || undefined,
            minHeight: props.minHeight || undefined,
            maxWidth: props.maxWidth || undefined,
            maxHeight: props.maxHeight || undefined,
            gridTemplateAreas: useNamedAreas && gridTemplateAreas ? gridTemplateAreas : undefined,
            opacity: renderMode === "xray" ? 0.6 : 1
        };

        return (
            <div 
                className="mx-css-grid-editor-container"
                style={containerStyle}
            >
                {/* Render grid items */}
                {items.map((item, index) => {
                    const ContentRenderer = item.content?.renderer;
                    
                    // Build item styles
                    const itemStyles: React.CSSProperties = {
                        position: "relative",
                        overflow: "auto",
                        minHeight: "50px"
                    };

                    // Apply grid placement
                    if (item.placementType === "area" && item.gridArea && useNamedAreas) {
                        itemStyles.gridArea = item.gridArea;
                    } else if (item.placementType === "coordinates") {
                        if (item.columnStart && item.columnStart !== "auto") {
                            itemStyles.gridColumnStart = item.columnStart;
                        }
                        if (item.columnEnd && item.columnEnd !== "auto") {
                            itemStyles.gridColumnEnd = item.columnEnd;
                        }
                        if (item.rowStart && item.rowStart !== "auto") {
                            itemStyles.gridRowStart = item.rowStart;
                        }
                        if (item.rowEnd && item.rowEnd !== "auto") {
                            itemStyles.gridRowEnd = item.rowEnd;
                        }
                    } else if (item.placementType === "span") {
                        if (item.columnStart && item.columnStart !== "auto") {
                            itemStyles.gridColumn = item.columnStart;
                        }
                        if (item.rowStart && item.rowStart !== "auto") {
                            itemStyles.gridRow = item.rowStart;
                        }
                    }

                    // Apply alignment if not auto
                    if (item.justifySelf && item.justifySelf !== "auto") {
                        itemStyles.justifySelf = item.justifySelf;
                    }
                    if (item.alignSelf && item.alignSelf !== "auto") {
                        itemStyles.alignSelf = item.alignSelf;
                    }

                    // Apply z-index if specified
                    if (item.zIndex) {
                        itemStyles.zIndex = item.zIndex;
                    }
                    
                    // Generate caption for Selectable
                    const itemCaption = item.itemName || 
                        (item.placementType === "area" && item.gridArea ? `Area: ${item.gridArea}` : 
                         item.placementType === "coordinates" ? `Grid item at ${item.columnStart},${item.rowStart}` :
                         `Grid item ${index + 1}`);
                    
                    return (
                        <Selectable
                            key={`item-${index}`}
                            object={item}
                            caption={itemCaption}
                        >
                            <div
                                className={`mx-css-grid-editor-item ${item.className || ""}`}
                                style={itemStyles}
                            >
                                {/* Render actual widget content */}
                                {ContentRenderer ? (
                                    <ContentRenderer>
                                        <div style={{ width: "100%", height: "100%" }} />
                                    </ContentRenderer>
                                ) : (
                                    <div style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#9ca3af",
                                        fontSize: "11px",
                                        padding: "20px"
                                    }}>
                                        Drop widget here
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
     * Render area editor
     */
    const renderAreaEditor = () => {
        if (!useNamedAreas || readOnly) return null;

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

    // Combine className from props with widget base class
    const containerClasses = ["mx-css-grid-editor-preview", className].filter(Boolean).join(" ");

    // Parse style string to React style object
    const parseStyleString = (styleStr?: string): React.CSSProperties => {
        if (!styleStr) return {};
        
        const styleObj: any = {}; // Use 'any' to bypass strict typing
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

    const containerStyles = parseStyleString(customStyle);

    // Apply size constraints to the main container as well
    const mainContainerStyles: React.CSSProperties = {
        ...containerStyles,
        width: props.maxWidth || "100%",
        minWidth: props.minWidth || undefined,
        minHeight: props.minHeight || undefined,
        maxWidth: props.maxWidth || undefined,
        maxHeight: props.maxHeight || undefined,
        boxSizing: "border-box"
    };

    return (
        <div className={containerClasses} style={mainContainerStyles}>
            {renderGridContainer()}
            {renderAreaEditor()}
        </div>
    );
};

/**
 * Get preview CSS styles
 * This is exported separately as required by Mendix
 * 
 * @returns CSS string for editor preview styling
 */
export function getPreviewCss(): string {
    return `
        /* Container and layout */
        .mx-css-grid-editor-preview {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            padding: 8px;
            background-color: #ffffff;
            border-radius: 4px;
            position: relative;
            box-sizing: border-box;
        }

        /* Read-only badge */
        .mx-css-grid-editor-readonly-badge {
            position: absolute;
            top: 4px;
            right: 4px;
            background-color: #6b7280;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            z-index: 10;
        }

        .mx-css-grid-editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
        }

        .mx-css-grid-editor-header__title {
            margin: 0;
            font-size: 13px;
            font-weight: 600;
            color: #111827;
        }

        .mx-css-grid-editor-header__info {
            font-size: 10px;
            color: #6b7280;
        }

        /* Grid container */
        .mx-css-grid-editor-container {
            margin-bottom: 8px;
            box-sizing: border-box;
        }

        /* Area editor */
        .mx-css-grid-editor-areas {
            margin-top: 8px;
            padding: 8px;
            background-color: #f9fafb;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
        }

        .mx-css-grid-editor-areas__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .mx-css-grid-editor-areas__title {
            margin: 0;
            font-size: 12px;
            font-weight: 600;
            color: #111827;
        }

        .mx-css-grid-editor-areas__toggle {
            padding: 4px 12px;
            background-color: #3b82f6;
            color: white;
            border: none;
            border-radius: 3px;
            font-size: 11px;
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
            margin-bottom: 8px;
        }

        .mx-css-grid-editor-areas__label {
            font-size: 11px;
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: #374151;
        }

        .mx-css-grid-editor-areas__buttons {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-bottom: 6px;
        }

        .mx-css-grid-editor-areas__button {
            padding: 4px 8px;
            border: 1px solid #d1d5db;
            border-radius: 3px;
            font-size: 10px;
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
            gap: 6px;
            align-items: center;
        }

        .mx-css-grid-editor-areas__input {
            padding: 4px 8px;
            border: 1px solid #d1d5db;
            border-radius: 3px;
            font-size: 11px;
            width: 120px;
        }

        .mx-css-grid-editor-areas__input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .mx-css-grid-editor-areas__hint {
            font-size: 10px;
            color: #6b7280;
        }

        /* Grid cells editor */
        .mx-css-grid-editor-cells {
            display: grid;
            gap: 3px;
            margin-bottom: 8px;
            user-select: none;
        }

        .mx-css-grid-editor-cell {
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: crosshair;
            font-size: 10px;
            color: #6b7280;
            transition: all 0.15s ease;
            position: relative;
            min-height: 40px;
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
            padding: 8px;
            background-color: #f3f4f6;
            border-radius: 3px;
            font-size: 10px;
        }

        .mx-css-grid-editor-template__code {
            margin: 6px 0 0 0;
            white-space: pre-wrap;
            font-family: "Consolas", "Monaco", "Courier New", monospace;
            color: #1f2937;
            font-size: 9px;
            line-height: 1.4;
        }

        .mx-css-grid-editor-template__copy {
            margin-top: 6px;
            padding: 3px 8px;
            background-color: #3b82f6;
            color: white;
            border: none;
            border-radius: 3px;
            font-size: 10px;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .mx-css-grid-editor-template__copy:hover {
            background-color: #2563eb;
        }

        /* Help text */
        .mx-css-grid-editor-help {
            margin-top: 8px;
            padding: 8px;
            background-color: #eff6ff;
            border-radius: 3px;
            font-size: 11px;
            color: #1e40af;
            line-height: 1.4;
        }

        /* Grid items with content */
        .mx-css-grid-editor-item {
            box-sizing: border-box;
            transition: all 0.2s ease;
        }

        .mx-css-grid-editor-item:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            z-index: 10;
        }

        /* Ensure widget content fills the container */
        .mx-css-grid-editor-item > div {
            width: 100%;
            height: 100%;
        }

        /* Make grid preview items more compact */
        .mx-css-grid-editor-container .mx-css-grid-item {
            padding: 8px;
            min-height: 50px;
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
            .mx-css-grid-editor-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 4px;
            }

            .mx-css-grid-editor-areas__header {
                flex-direction: column;
                align-items: flex-start;
                gap: 4px;
            }

            .mx-css-grid-editor-areas__buttons {
                justify-content: flex-start;
            }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
            .mx-css-grid-editor-container {
                border-width: 2px;
            }

            .mx-css-grid-editor-cell {
                border-width: 2px;
            }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
            .mx-css-grid-editor-areas__toggle,
            .mx-css-grid-editor-areas__button,
            .mx-css-grid-editor-cell {
                transition: none;
            }
        }
    `;
}