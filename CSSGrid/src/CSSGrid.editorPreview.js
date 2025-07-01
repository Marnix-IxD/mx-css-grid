/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 474:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseGridTemplate = parseGridTemplate;
exports.parseGridAreas = parseGridAreas;
exports.generateBreakpointStyles = generateBreakpointStyles;
exports.getGridItemPlacement = getGridItemPlacement;
exports.validateGridLine = validateGridLine;
exports.calculateGridSize = calculateGridSize;
exports.getUniqueAreaNames = getUniqueAreaNames;
exports.isValidAreaName = isValidAreaName;
exports.parseCSSLength = parseCSSLength;
exports.getGridDebugInfo = getGridDebugInfo;
function parseGridTemplate(template) {
    if (!template || template.trim() === "") {
        return ["1fr"];
    }
    let expandedTemplate = template;
    while (expandedTemplate.includes("repeat(")) {
        const startIdx = expandedTemplate.indexOf("repeat(");
        if (startIdx === -1)
            break;
        const openParen = startIdx + 6;
        let closeParen = -1;
        let parenDepth = 1;
        for (let i = openParen + 1; i < expandedTemplate.length; i++) {
            if (expandedTemplate[i] === "(")
                parenDepth++;
            if (expandedTemplate[i] === ")")
                parenDepth--;
            if (parenDepth === 0) {
                closeParen = i;
                break;
            }
        }
        if (closeParen === -1)
            break;
        const repeatContent = expandedTemplate.substring(openParen + 1, closeParen);
        const commaIdx = repeatContent.indexOf(",");
        if (commaIdx === -1)
            break;
        const countStr = repeatContent.substring(0, commaIdx).trim();
        const valueStr = repeatContent.substring(commaIdx + 1).trim();
        const count = parseInt(countStr, 10);
        if (isNaN(count) || count < 1)
            break;
        const repeated = Array(count).fill(valueStr).join(" ");
        expandedTemplate =
            expandedTemplate.substring(0, startIdx) +
                repeated +
                expandedTemplate.substring(closeParen + 1);
    }
    const parts = [];
    let current = "";
    let depth = 0;
    for (let i = 0; i < expandedTemplate.length; i++) {
        const char = expandedTemplate[i];
        if (char === "(" || char === "[") {
            depth++;
        }
        else if (char === ")" || char === "]") {
            depth--;
        }
        if (char === " " && depth === 0) {
            if (current.trim()) {
                parts.push(current.trim());
            }
            current = "";
        }
        else {
            current += char;
        }
    }
    if (current.trim()) {
        parts.push(current.trim());
    }
    return parts.length > 0 ? parts : ["1fr"];
}
function parseGridAreas(areas) {
    if (!areas || areas.trim() === "") {
        return null;
    }
    let cleanedAreas = areas;
    cleanedAreas = cleanedAreas.split('"').join('');
    cleanedAreas = cleanedAreas.split("'").join('');
    cleanedAreas = cleanedAreas.trim();
    const lines = cleanedAreas.split('\n').filter(line => line.trim());
    const grid = [];
    for (const line of lines) {
        const trimmedLine = line.trim();
        const cells = [];
        let currentCell = "";
        for (let i = 0; i < trimmedLine.length; i++) {
            const char = trimmedLine[i];
            if (char === " " || char === "\t") {
                if (currentCell) {
                    cells.push(currentCell);
                    currentCell = "";
                }
            }
            else {
                currentCell += char;
            }
        }
        if (currentCell) {
            cells.push(currentCell);
        }
        if (cells.length > 0) {
            grid.push(cells);
        }
    }
    if (grid.length > 0) {
        const columnCount = grid[0].length;
        const isValid = grid.every(row => row.length === columnCount);
        if (!isValid) {
            console.warn("Invalid grid template areas: rows have different column counts");
            return null;
        }
    }
    return grid.length > 0 ? grid : null;
}
function generateBreakpointStyles(breakpoints, className) {
    if (!breakpoints || breakpoints.length === 0) {
        return "";
    }
    const sorted = [...breakpoints].sort((a, b) => a.minWidth - b.minWidth);
    const cssRules = [];
    for (const bp of sorted) {
        const rules = [];
        if (bp.columns) {
            rules.push(`grid-template-columns: ${bp.columns} !important;`);
        }
        if (bp.rows) {
            rules.push(`grid-template-rows: ${bp.rows} !important;`);
        }
        if (bp.gap) {
            rules.push(`gap: ${bp.gap} !important;`);
        }
        if (rules.length > 0) {
            const mediaQuery = `
                @media (min-width: ${bp.minWidth}px) {
                    ${className} {
                        ${rules.join("\n                        ")}
                    }
                }
            `;
            cssRules.push(mediaQuery);
        }
    }
    return cssRules.join("\n");
}
function getGridItemPlacement(item) {
    const placement = {};
    switch (item.placementType) {
        case "area":
            if (item.gridArea) {
                placement.gridArea = item.gridArea;
            }
            break;
        case "coordinates":
            if (item.columnStart && item.columnStart !== "auto") {
                placement.gridColumnStart = item.columnStart;
            }
            if (item.columnEnd && item.columnEnd !== "auto") {
                placement.gridColumnEnd = item.columnEnd;
            }
            if (item.rowStart && item.rowStart !== "auto") {
                placement.gridRowStart = item.rowStart;
            }
            if (item.rowEnd && item.rowEnd !== "auto") {
                placement.gridRowEnd = item.rowEnd;
            }
            break;
        case "span":
            if (item.columnStart && item.columnStart.includes("span")) {
                placement.gridColumn = item.columnStart;
            }
            else if (item.columnStart && item.columnEnd && item.columnStart !== "auto") {
                placement.gridColumn = `${item.columnStart} / ${item.columnEnd}`;
            }
            if (item.rowStart && item.rowStart.includes("span")) {
                placement.gridRow = item.rowStart;
            }
            else if (item.rowStart && item.rowEnd && item.rowStart !== "auto") {
                placement.gridRow = `${item.rowStart} / ${item.rowEnd}`;
            }
            break;
        case "auto":
        default:
            break;
    }
    return placement;
}
function validateGridLine(line) {
    if (!line || line === "auto") {
        return true;
    }
    if (line.startsWith("span")) {
        const parts = line.split(" ");
        if (parts.length === 2) {
            const num = parseInt(parts[1], 10);
            return !isNaN(num) && num > 0;
        }
        return false;
    }
    const lineNumber = parseInt(line, 10);
    if (!isNaN(lineNumber) && lineNumber !== 0) {
        return true;
    }
    if (line.length > 0) {
        const firstChar = line.charCodeAt(0);
        if ((firstChar >= 65 && firstChar <= 90) || (firstChar >= 97 && firstChar <= 122)) {
            for (let i = 1; i < line.length; i++) {
                const charCode = line.charCodeAt(i);
                const isLetter = (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122);
                const isNumber = charCode >= 48 && charCode <= 57;
                const isHyphen = charCode === 45;
                const isUnderscore = charCode === 95;
                if (!isLetter && !isNumber && !isHyphen && !isUnderscore) {
                    return false;
                }
            }
            return true;
        }
    }
    return false;
}
function calculateGridSize(template, areas) {
    const columns = parseGridTemplate(template).length;
    const rows = areas ? areas.length : 1;
    return { columns, rows };
}
function getUniqueAreaNames(areas) {
    if (!areas) {
        return [];
    }
    const uniqueNames = new Set();
    areas.forEach(row => {
        row.forEach(cell => {
            if (cell && cell !== ".") {
                uniqueNames.add(cell);
            }
        });
    });
    return Array.from(uniqueNames);
}
function isValidAreaName(name) {
    if (!name || name === ".") {
        return true;
    }
    const firstChar = name.charCodeAt(0);
    if (!((firstChar >= 65 && firstChar <= 90) || (firstChar >= 97 && firstChar <= 122))) {
        return false;
    }
    for (let i = 1; i < name.length; i++) {
        const charCode = name.charCodeAt(i);
        const isLetter = (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122);
        const isNumber = charCode >= 48 && charCode <= 57;
        const isHyphen = charCode === 45;
        const isUnderscore = charCode === 95;
        if (!isLetter && !isNumber && !isHyphen && !isUnderscore) {
            return false;
        }
    }
    return true;
}
function parseCSSLength(value) {
    if (!value)
        return null;
    let numStr = "";
    let unitStr = "";
    let foundUnit = false;
    for (let i = 0; i < value.length; i++) {
        const char = value[i];
        const charCode = char.charCodeAt(0);
        if ((charCode >= 48 && charCode <= 57) || char === ".") {
            if (!foundUnit) {
                numStr += char;
            }
        }
        else {
            foundUnit = true;
            unitStr += char;
        }
    }
    const num = parseFloat(numStr);
    if (isNaN(num))
        return null;
    const validUnits = ["px", "em", "rem", "%", "vw", "vh", "fr", "ch", "ex"];
    if (!validUnits.includes(unitStr))
        return null;
    return { value: num, unit: unitStr };
}
function getGridDebugInfo(template, areas) {
    const parsedTemplate = parseGridTemplate(template);
    const parsedAreas = areas ? parseGridAreas(areas) : null;
    return {
        columns: parsedTemplate.length,
        rows: parsedAreas ? parsedAreas.length : 1,
        areaNames: getUniqueAreaNames(parsedAreas),
        isValid: parsedAreas ? parsedAreas.every(row => row.length === parsedTemplate.length) : true
    };
}


/***/ }),

/***/ 575:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getItemDisplayName = getItemDisplayName;
exports.getItemCaption = getItemCaption;
exports.getPlacementDisplayText = getPlacementDisplayText;
exports.calculateItemPlacement = calculateItemPlacement;
exports.isItemInlineWithOthers = isItemInlineWithOthers;
exports.getAreaColor = getAreaColor;
function getItemDisplayName(item, index) {
    if (item.itemName && item.itemName.trim()) {
        return item.itemName;
    }
    if (item.placementType === "area" && item.gridArea) {
        return item.gridArea;
    }
    return `Item ${index + 1}`;
}
function getItemCaption(item, index) {
    var _a;
    const name = getItemDisplayName(item, index);
    const widgetCount = ((_a = item.content) === null || _a === void 0 ? void 0 : _a.widgetCount) || 0;
    const widgetText = `${widgetCount} widget${widgetCount !== 1 ? 's' : ''}`;
    if (item.itemName) {
        return `${name} - ${widgetText}`;
    }
    if (item.placementType === "area" && item.gridArea) {
        return `${name} (${widgetText})`;
    }
    return name;
}
function getPlacementDisplayText(item, placement) {
    if (item.placementType === "area" && item.gridArea) {
        return `Area: ${item.gridArea}`;
    }
    if (item.placementType === "coordinates") {
        return `${placement.colStart},${placement.rowStart} → ${placement.colEnd - 1},${placement.rowEnd - 1}`;
    }
    if (item.placementType === "span") {
        return "Span";
    }
    return "Auto";
}
function calculateItemPlacement(item, index, gridCells, columnCount, useNamedAreas) {
    const placement = {
        colStart: 1,
        colEnd: 2,
        rowStart: 1,
        rowEnd: 2
    };
    if (item.placementType === "area" && item.gridArea && useNamedAreas) {
        placement.gridArea = item.gridArea;
        let found = false;
        gridCells.forEach((row, rowIdx) => {
            row.forEach((cell, colIdx) => {
                if (cell === item.gridArea && !found) {
                    placement.rowStart = rowIdx + 1;
                    placement.colStart = colIdx + 1;
                    found = true;
                }
                if (cell === item.gridArea) {
                    placement.rowEnd = rowIdx + 2;
                    placement.colEnd = colIdx + 2;
                }
            });
        });
    }
    else if (item.placementType === "coordinates") {
        placement.colStart = parseInt(item.columnStart) || 1;
        placement.colEnd = parseInt(item.columnEnd) || placement.colStart + 1;
        placement.rowStart = parseInt(item.rowStart) || 1;
        placement.rowEnd = parseInt(item.rowEnd) || placement.rowStart + 1;
        placement.gridColumn = `${placement.colStart} / ${placement.colEnd}`;
        placement.gridRow = `${placement.rowStart} / ${placement.rowEnd}`;
    }
    else if (item.placementType === "span") {
        placement.gridColumn = item.columnStart || "auto";
        placement.gridRow = item.rowStart || "auto";
    }
    else {
        const col = (index % columnCount) + 1;
        const row = Math.floor(index / columnCount) + 1;
        placement.colStart = col;
        placement.colEnd = col + 1;
        placement.rowStart = row;
        placement.rowEnd = row + 1;
    }
    return placement;
}
function isItemInlineWithOthers(itemIndex, items, calculatePlacement) {
    const placement = calculatePlacement(items[itemIndex], itemIndex);
    return items.some((otherItem, otherIndex) => {
        if (otherIndex === itemIndex)
            return false;
        const otherPlacement = calculatePlacement(otherItem, otherIndex);
        return ((placement.rowStart === otherPlacement.rowStart &&
            placement.rowEnd === otherPlacement.rowEnd) ||
            (placement.rowStart < otherPlacement.rowEnd &&
                placement.rowEnd > otherPlacement.rowStart));
    });
}
function getAreaColor(area) {
    if (area === ".")
        return "#ffffff";
    const colors = [
        "#e3f2fd", "#f3e5f5", "#e8f5e9", "#fff3e0",
        "#fce4ec", "#e1f5fe", "#f1f8e9", "#fff8e1"
    ];
    const hash = area.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}


/***/ }),

/***/ 953:
/***/ ((module) => {

module.exports = require("react");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.editorPreview = editorPreview;
exports.getPreviewCss = getPreviewCss;
const react_1 = __webpack_require__(953);
const gridHelpers_1 = __webpack_require__(474);
const gridItemUtils_1 = __webpack_require__(575);
function editorPreview(props) {
    const { gridTemplateColumns, gridTemplateRows, gap, useNamedAreas, gridTemplateAreas, items, enableBreakpoints, breakpoints } = props;
    const [editMode, setEditMode] = (0, react_1.useState)(false);
    const [selectedArea, setSelectedArea] = (0, react_1.useState)(".");
    const [gridCells, setGridCells] = (0, react_1.useState)([]);
    const [hoveredCell, setHoveredCell] = (0, react_1.useState)(null);
    const [isDragging, setIsDragging] = (0, react_1.useState)(false);
    const columns = (0, react_1.useMemo)(() => (0, gridHelpers_1.parseGridTemplate)(gridTemplateColumns || "1fr 1fr"), [gridTemplateColumns]);
    const rows = (0, react_1.useMemo)(() => (0, gridHelpers_1.parseGridTemplate)(gridTemplateRows || "auto auto"), [gridTemplateRows]);
    const columnCount = columns.length;
    const rowCount = Math.max(rows.length, Math.ceil(items.length / columnCount), 3);
    const initializeGrid = (0, react_1.useCallback)(() => {
        if (useNamedAreas && gridTemplateAreas) {
            const parsed = (0, gridHelpers_1.parseGridAreas)(gridTemplateAreas);
            if (parsed) {
                setGridCells(parsed);
                return;
            }
        }
        const emptyGrid = Array(rowCount).fill(null).map(() => Array(columnCount).fill("."));
        setGridCells(emptyGrid);
    }, [useNamedAreas, gridTemplateAreas, columnCount, rowCount]);
    (0, react_1.useEffect)(() => {
        initializeGrid();
    }, [initializeGrid]);
    const calculateItemPlacement = (0, react_1.useCallback)((item, index) => {
        return (0, gridItemUtils_1.calculateItemPlacement)(item, index, gridCells, columnCount, useNamedAreas);
    }, [gridCells, columnCount, useNamedAreas]);
    const itemPlacements = (0, react_1.useMemo)(() => {
        const placements = items.map((item, index) => ({
            item,
            index,
            placement: calculateItemPlacement(item, index)
        }));
        return placements.map((current, idx) => (Object.assign(Object.assign({}, current), { isInline: placements.some((other, otherIdx) => otherIdx !== idx &&
                other.placement.rowStart === current.placement.rowStart &&
                other.placement.rowEnd === current.placement.rowEnd) })));
    }, [items, calculateItemPlacement]);
    const handleCellInteraction = (0, react_1.useCallback)((row, col, isClick) => {
        if (!editMode)
            return;
        const newGrid = gridCells.map(r => [...r]);
        while (newGrid.length <= row) {
            newGrid.push(Array(columnCount).fill("."));
        }
        if (isClick || isDragging) {
            newGrid[row][col] = selectedArea;
            setGridCells(newGrid);
        }
    }, [editMode, gridCells, columnCount, selectedArea, isDragging]);
    const gridStyles = (0, react_1.useMemo)(() => ({
        gridTemplateColumns: columns.join(" "),
        gridTemplateRows: rows.map(() => "minmax(80px, auto)").join(" "),
        gap: gap || "16px",
        gridTemplateAreas: useNamedAreas && gridCells.length > 0
            ? gridCells.map(row => `"${row.join(" ")}"`).join(" ")
            : undefined
    }), [columns, rows, gap, useNamedAreas, gridCells]);
    const availableAreas = (0, react_1.useMemo)(() => {
        const uniqueAreas = (0, gridHelpers_1.getUniqueAreaNames)(gridCells);
        const predefinedAreas = ["header", "sidebar", "content", "footer", "nav", "aside"];
        return [...new Set([...predefinedAreas, ...uniqueAreas])].filter(a => a !== ".");
    }, [gridCells]);
    const renderGridItems = () => {
        return itemPlacements.map(({ item, index, placement, isInline }) => {
            var _a;
            const itemStyles = {
                zIndex: item.zIndex || index + 1
            };
            if (item.placementType === "area" && item.gridArea && useNamedAreas) {
                itemStyles.gridArea = item.gridArea;
            }
            else if (item.placementType === "coordinates") {
                itemStyles.gridColumn = `${placement.colStart} / ${placement.colEnd}`;
                itemStyles.gridRow = `${placement.rowStart} / ${placement.rowEnd}`;
            }
            else if (item.placementType === "span") {
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
            const displayName = (0, gridItemUtils_1.getItemDisplayName)(item, index);
            const widgetCount = ((_a = item.content) === null || _a === void 0 ? void 0 : _a.widgetCount) || 0;
            return ((0, react_1.createElement)("div", { key: `item-${index}`, className: "mx-css-grid-editor-item", style: itemStyles },
                isInline && ((0, react_1.createElement)("div", { className: "mx-css-grid-editor-item__inline-indicator", title: "Displayed inline with other items" }, "\u2194")),
                item.zIndex && item.zIndex !== 0 && ((0, react_1.createElement)("div", { className: "mx-css-grid-editor-item__z-index" }, item.zIndex)),
                (0, react_1.createElement)("div", { className: "mx-css-grid-editor-item__name" }, displayName),
                (0, react_1.createElement)("div", { className: "mx-css-grid-editor-item__widgets" },
                    widgetCount,
                    " widget",
                    widgetCount !== 1 ? "s" : ""),
                item.placementType !== "auto" && ((0, react_1.createElement)("div", { className: "mx-css-grid-editor-item__placement" }, item.placementType === "area" && item.gridArea
                    ? `Area: ${item.gridArea}`
                    : item.placementType === "coordinates"
                        ? `${placement.colStart}-${placement.rowStart}`
                        : "Span"))));
        });
    };
    const renderAreaEditor = () => {
        if (!useNamedAreas)
            return null;
        return ((0, react_1.createElement)("div", { className: "mx-css-grid-editor-areas" },
            (0, react_1.createElement)("div", { className: "mx-css-grid-editor-areas__header" },
                (0, react_1.createElement)("h4", { className: "mx-css-grid-editor-areas__title" }, "Visual Grid Area Editor"),
                (0, react_1.createElement)("button", { onClick: () => {
                        setEditMode(!editMode);
                        if (!editMode)
                            initializeGrid();
                    }, className: `mx-css-grid-editor-areas__toggle ${editMode ? "mx-css-grid-editor-areas__toggle--active" : ""}` }, editMode ? "Exit Edit Mode" : "Edit Areas")),
            editMode && ((0, react_1.createElement)(react_1.Fragment, null,
                (0, react_1.createElement)("div", { className: "mx-css-grid-editor-areas__palette" },
                    (0, react_1.createElement)("label", { className: "mx-css-grid-editor-areas__label" }, "Select area to paint:"),
                    (0, react_1.createElement)("div", { className: "mx-css-grid-editor-areas__buttons" },
                        (0, react_1.createElement)("button", { onClick: () => setSelectedArea("."), className: `mx-css-grid-editor-areas__button ${selectedArea === "." ? "mx-css-grid-editor-areas__button--selected" : ""}` }, "Empty (.)"),
                        availableAreas.map(area => ((0, react_1.createElement)("button", { key: area, onClick: () => setSelectedArea(area), className: `mx-css-grid-editor-areas__button ${selectedArea === area ? "mx-css-grid-editor-areas__button--selected" : ""}`, style: {
                                backgroundColor: selectedArea === area ? undefined : (0, gridItemUtils_1.getAreaColor)(area)
                            } }, area)))),
                    (0, react_1.createElement)("div", { className: "mx-css-grid-editor-areas__custom" },
                        (0, react_1.createElement)("input", { type: "text", placeholder: "Custom area name", className: "mx-css-grid-editor-areas__input", onKeyPress: (e) => {
                                if (e.key === "Enter") {
                                    const value = e.target.value.trim();
                                    if (value && value !== "." && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value)) {
                                        setSelectedArea(value);
                                        e.target.value = "";
                                    }
                                }
                            } }),
                        (0, react_1.createElement)("span", { className: "mx-css-grid-editor-areas__hint" }, "Press Enter to add"))),
                (0, react_1.createElement)("div", { className: "mx-css-grid-editor-cells", style: {
                        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                        gridTemplateRows: `repeat(${rowCount}, 60px)`
                    }, onMouseLeave: () => {
                        setHoveredCell(null);
                        setIsDragging(false);
                    }, onMouseUp: () => setIsDragging(false) }, Array(rowCount).fill(null).map((_, row) => Array(columnCount).fill(null).map((_, col) => {
                    var _a;
                    const area = ((_a = gridCells[row]) === null || _a === void 0 ? void 0 : _a[col]) || ".";
                    const isHovered = (hoveredCell === null || hoveredCell === void 0 ? void 0 : hoveredCell.row) === row && (hoveredCell === null || hoveredCell === void 0 ? void 0 : hoveredCell.col) === col;
                    return ((0, react_1.createElement)("div", { key: `${row}-${col}`, className: `mx-css-grid-editor-cell ${area !== "." ? "mx-css-grid-editor-cell--filled" : ""} ${isHovered && editMode ? "mx-css-grid-editor-cell--hovered" : ""}`, style: {
                            backgroundColor: area === "." ? undefined : (0, gridItemUtils_1.getAreaColor)(area)
                        }, onMouseDown: () => {
                            setIsDragging(true);
                            handleCellInteraction(row, col, true);
                        }, onMouseEnter: () => {
                            setHoveredCell({ row, col });
                            if (isDragging) {
                                handleCellInteraction(row, col, false);
                            }
                        } }, area === "." ? "•" : area));
                }))),
                (0, react_1.createElement)("div", { className: "mx-css-grid-editor-template" },
                    (0, react_1.createElement)("strong", null, "Generated template:"),
                    (0, react_1.createElement)("pre", { className: "mx-css-grid-editor-template__code" }, gridCells.map(row => `"${row.join(" ")}"`).join("\n")),
                    (0, react_1.createElement)("button", { onClick: () => {
                            const template = gridCells.map(row => `"${row.join(" ")}"`).join("\n");
                            navigator.clipboard.writeText(template);
                        }, className: "mx-css-grid-editor-template__copy" }, "Copy to Clipboard"))))));
    };
    return ((0, react_1.createElement)("div", { className: "mx-css-grid-editor-preview" },
        (0, react_1.createElement)("div", { className: "mx-css-grid-editor-header" },
            (0, react_1.createElement)("h3", { className: "mx-css-grid-editor-header__title" }, "CSS Grid Layout Preview"),
            (0, react_1.createElement)("div", { className: "mx-css-grid-editor-header__info" },
                columnCount,
                " columns \u00D7 ",
                rowCount,
                " rows",
                gap && ` • Gap: ${gap}`,
                useNamedAreas && " • Using named areas",
                enableBreakpoints && breakpoints && breakpoints.length > 0 && ` • ${breakpoints.length} breakpoints`)),
        (0, react_1.createElement)("div", { className: "mx-css-grid-editor-container", style: gridStyles }, renderGridItems()),
        renderAreaEditor(),
        (0, react_1.createElement)("div", { className: "mx-css-grid-editor-help" },
            (0, react_1.createElement)("strong", null, "Tip:"),
            " Items are positioned according to their placement type. Items in the same row are displayed inline. Use the area editor to visually design named grid areas.")));
}
function getPreviewCss() {
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

})();

module.exports = __webpack_exports__;
/******/ })()
;