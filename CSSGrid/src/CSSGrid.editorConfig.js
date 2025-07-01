/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getCustomCaption = exports.check = void 0;
exports.getPreviewCss = getPreviewCss;
function validateGridTemplateSyntax(template) {
    if (!template || template.trim() === "") {
        return false;
    }
    const validKeywords = [
        "auto", "min-content", "max-content", "fr", "px", "%",
        "em", "rem", "vw", "vh", "minmax", "repeat"
    ];
    const parts = [];
    let current = "";
    let depth = 0;
    for (let i = 0; i < template.length; i++) {
        const char = template[i];
        if (char === "(")
            depth++;
        if (char === ")")
            depth--;
        if ((char === " " || char === "\t") && depth === 0) {
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
    for (const part of parts) {
        let isValid = false;
        if (hasValidNumericValue(part)) {
            isValid = true;
        }
        for (const keyword of validKeywords) {
            if (part === keyword || part.includes(keyword)) {
                isValid = true;
                break;
            }
        }
        if (part.startsWith("minmax(") && part.endsWith(")")) {
            isValid = true;
        }
        if (part.startsWith("repeat(") && part.endsWith(")")) {
            isValid = true;
        }
        if (!isValid) {
            return false;
        }
    }
    return true;
}
function hasValidNumericValue(value) {
    const units = ["fr", "px", "%", "em", "rem", "vw", "vh", "ch", "ex"];
    for (const unit of units) {
        if (value.endsWith(unit)) {
            const numPart = value.substring(0, value.length - unit.length);
            const num = parseFloat(numPart);
            if (!isNaN(num) && num >= 0) {
                return true;
            }
        }
    }
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0;
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
function isValidCoordinate(value) {
    if (!value || value === "auto") {
        return true;
    }
    if (value.startsWith("-")) {
        const num = parseInt(value.substring(1), 10);
        return !isNaN(num) && num > 0;
    }
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0;
}
function isValidSpanValue(value) {
    if (!value || value === "auto") {
        return true;
    }
    if (value.startsWith("span ")) {
        const numPart = value.substring(5).trim();
        const num = parseInt(numPart, 10);
        return !isNaN(num) && num > 0;
    }
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0;
}
const check = (values) => {
    var _a;
    const errors = [];
    if (!values.gridTemplateColumns || values.gridTemplateColumns.trim() === "") {
        errors.push({
            property: "gridTemplateColumns",
            severity: "error",
            message: "Grid template columns cannot be empty"
        });
    }
    else {
        if (!validateGridTemplateSyntax(values.gridTemplateColumns.trim())) {
            errors.push({
                property: "gridTemplateColumns",
                severity: "warning",
                message: "Grid template columns may have invalid syntax"
            });
        }
    }
    if (values.useNamedAreas) {
        if (!values.gridTemplateAreas || values.gridTemplateAreas.trim() === "") {
            errors.push({
                property: "gridTemplateAreas",
                severity: "error",
                message: "Grid template areas cannot be empty when named areas are enabled"
            });
        }
        else {
            const lines = values.gridTemplateAreas
                .trim()
                .split('\n')
                .filter(line => line.trim())
                .map(line => {
                let cleanLine = line;
                cleanLine = cleanLine.split('"').join('');
                cleanLine = cleanLine.split("'").join('');
                return cleanLine.trim();
            });
            if (lines.length > 0) {
                const rowCells = [];
                for (const line of lines) {
                    const cells = [];
                    let current = "";
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        if (char === " " || char === "\t") {
                            if (current) {
                                cells.push(current);
                                current = "";
                            }
                        }
                        else {
                            current += char;
                        }
                    }
                    if (current) {
                        cells.push(current);
                    }
                    rowCells.push(cells);
                }
                const columnCounts = rowCells.map(row => row.length);
                const firstCount = columnCounts[0];
                if (!columnCounts.every(count => count === firstCount)) {
                    errors.push({
                        property: "gridTemplateAreas",
                        severity: "error",
                        message: "All rows in grid template areas must have the same number of columns"
                    });
                }
                const invalidAreas = [];
                const allAreas = rowCells.flat();
                for (const area of allAreas) {
                    if (area !== "." && !isValidAreaName(area)) {
                        invalidAreas.push(area);
                    }
                }
                if (invalidAreas.length > 0) {
                    errors.push({
                        property: "gridTemplateAreas",
                        severity: "error",
                        message: `Invalid area names: ${invalidAreas.join(", ")}. Area names must start with a letter and contain only letters, numbers, hyphens, and underscores.`
                    });
                }
            }
        }
    }
    (_a = values.items) === null || _a === void 0 ? void 0 : _a.forEach((item, index) => {
        if (item.placementType === "area" && values.useNamedAreas) {
            if (!item.gridArea || item.gridArea.trim() === "") {
                errors.push({
                    property: `items[${index}].gridArea`,
                    severity: "error",
                    message: `Item ${index + 1}: Grid area name is required when placement type is 'Named Area'`
                });
            }
            else if (!isValidAreaName(item.gridArea.trim())) {
                errors.push({
                    property: `items[${index}].gridArea`,
                    severity: "error",
                    message: `Item ${index + 1}: Invalid grid area name "${item.gridArea}"`
                });
            }
        }
        if (item.placementType === "coordinates") {
            if (item.columnStart && !isValidCoordinate(item.columnStart.trim())) {
                errors.push({
                    property: `items[${index}].columnStart`,
                    severity: "error",
                    message: `Item ${index + 1}: columnStart must be 'auto', a positive number, or a negative number`
                });
            }
            if (item.columnEnd && !isValidCoordinate(item.columnEnd.trim())) {
                errors.push({
                    property: `items[${index}].columnEnd`,
                    severity: "error",
                    message: `Item ${index + 1}: columnEnd must be 'auto', a positive number, or a negative number`
                });
            }
            if (item.rowStart && !isValidCoordinate(item.rowStart.trim())) {
                errors.push({
                    property: `items[${index}].rowStart`,
                    severity: "error",
                    message: `Item ${index + 1}: rowStart must be 'auto', a positive number, or a negative number`
                });
            }
            if (item.rowEnd && !isValidCoordinate(item.rowEnd.trim())) {
                errors.push({
                    property: `items[${index}].rowEnd`,
                    severity: "error",
                    message: `Item ${index + 1}: rowEnd must be 'auto', a positive number, or a negative number`
                });
            }
        }
        if (item.placementType === "span") {
            if (item.columnStart && !isValidSpanValue(item.columnStart.trim())) {
                errors.push({
                    property: `items[${index}].columnStart`,
                    severity: "error",
                    message: `Item ${index + 1}: columnStart must be 'auto', a number, or 'span N' format`
                });
            }
            if (item.rowStart && !isValidSpanValue(item.rowStart.trim())) {
                errors.push({
                    property: `items[${index}].rowStart`,
                    severity: "error",
                    message: `Item ${index + 1}: rowStart must be 'auto', a number, or 'span N' format`
                });
            }
        }
        if (item.zIndex !== null && item.zIndex !== undefined) {
            if (item.zIndex < -999 || item.zIndex > 999) {
                errors.push({
                    property: `items[${index}].zIndex`,
                    severity: "warning",
                    message: `Item ${index + 1}: Z-index should be between -999 and 999 for best compatibility`
                });
            }
        }
    });
    if (values.enableBreakpoints && values.breakpoints) {
        const widths = values.breakpoints
            .map(bp => bp.minWidth)
            .filter((w) => w !== null);
        const uniqueWidths = new Set(widths);
        if (uniqueWidths.size !== widths.length) {
            errors.push({
                property: "breakpoints",
                severity: "error",
                message: "Breakpoint minimum widths must be unique"
            });
        }
        values.breakpoints.forEach((bp, index) => {
            if (!bp.columns || bp.columns.trim() === "") {
                errors.push({
                    property: `breakpoints[${index}].columns`,
                    severity: "error",
                    message: `Breakpoint ${index + 1}: Column template cannot be empty`
                });
            }
            if (bp.minWidth === null || bp.minWidth < 0) {
                errors.push({
                    property: `breakpoints[${index}].minWidth`,
                    severity: "error",
                    message: `Breakpoint ${index + 1}: Minimum width must be a positive number`
                });
            }
            else if (bp.minWidth > 9999) {
                errors.push({
                    property: `breakpoints[${index}].minWidth`,
                    severity: "warning",
                    message: `Breakpoint ${index + 1}: Very large minimum width (${bp.minWidth}px) may not work as expected`
                });
            }
        });
    }
    if (values.enableVirtualization && values.virtualizeThreshold !== null) {
        if (values.virtualizeThreshold < 10) {
            errors.push({
                property: "virtualizeThreshold",
                severity: "warning",
                message: "Virtualization threshold below 10 items may cause performance issues"
            });
        }
        else if (values.virtualizeThreshold > 1000) {
            errors.push({
                property: "virtualizeThreshold",
                severity: "warning",
                message: "Very high virtualization threshold may impact initial render performance"
            });
        }
    }
    return errors;
};
exports.check = check;
const getCustomCaption = (values) => {
    const columnsParts = [];
    const columnsStr = values.gridTemplateColumns || "1fr 1fr";
    let current = "";
    let depth = 0;
    for (let i = 0; i < columnsStr.length; i++) {
        const char = columnsStr[i];
        if (char === "(")
            depth++;
        if (char === ")")
            depth--;
        if ((char === " " || char === "\t") && depth === 0) {
            if (current.trim()) {
                columnsParts.push(current.trim());
            }
            current = "";
        }
        else {
            current += char;
        }
    }
    if (current.trim()) {
        columnsParts.push(current.trim());
    }
    const columns = columnsParts.length || 1;
    const rows = values.gridTemplateAreas && values.useNamedAreas
        ? values.gridTemplateAreas.split('\n').filter(line => line.trim()).length
        : (values.gridTemplateRows || "auto").split(/\s+/).filter(s => s.trim()).length;
    const parts = [`Grid (${columns}×${rows})`];
    if (values.useNamedAreas) {
        parts.push("with areas");
    }
    if (values.items.length > 0) {
        parts.push(`- ${values.items.length} items`);
    }
    if (values.enableBreakpoints && values.breakpoints && values.breakpoints.length > 0) {
        parts.push(`- ${values.breakpoints.length} breakpoints`);
    }
    return parts.join(" ");
};
exports.getCustomCaption = getCustomCaption;
function getPreviewCss() {
    return `
        /* Widget configuration preview styles */
        .widget-css-grid-preview {
            display: flex;
            flex-direction: column;
            padding: 12px;
            background: linear-gradient(to bottom, #f8f9fa, #ffffff);
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .widget-css-grid-preview-header {
            font-weight: 600;
            font-size: 13px;
            margin-bottom: 6px;
            color: #1f2937;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .widget-css-grid-preview-header::before {
            content: "";
            display: inline-block;
            width: 4px;
            height: 4px;
            background-color: #3b82f6;
            border-radius: 50%;
        }
        
        .widget-css-grid-preview-info {
            font-size: 11px;
            color: #6b7280;
            line-height: 1.4;
        }
        
        .widget-css-grid-preview-grid {
            margin-top: 10px;
            padding: 10px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .widget-css-grid-preview-grid-visual {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(2, 20px);
            gap: 4px;
            margin-bottom: 8px;
        }
        
        .widget-css-grid-preview-grid-cell {
            background-color: #eff6ff;
            border: 1px solid #3b82f6;
            border-radius: 2px;
        }
        
        .widget-css-grid-preview-stats {
            display: flex;
            gap: 12px;
            font-size: 10px;
            color: #6b7280;
        }
        
        .widget-css-grid-preview-stat {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .widget-css-grid-preview-stat strong {
            color: #374151;
            font-weight: 600;
        }
        
        /* Animation for configuration changes */
        @keyframes configUpdate {
            0% { opacity: 0.5; transform: scale(0.98); }
            100% { opacity: 1; transform: scale(1); }
        }
        
        .widget-css-grid-preview[data-updated="true"] {
            animation: configUpdate 0.3s ease-out;
        }
        
        /* Responsive preview adjustments */
        @media (max-width: 400px) {
            .widget-css-grid-preview {
                padding: 8px;
            }
            
            .widget-css-grid-preview-stats {
                flex-direction: column;
                gap: 4px;
            }
        }
        
        /* High contrast mode */
        @media (prefers-contrast: high) {
            .widget-css-grid-preview {
                border-width: 2px;
            }
            
            .widget-css-grid-preview-grid {
                border-width: 2px;
            }
        }
    `;
}

})();

module.exports = __webpack_exports__;
/******/ })()
;