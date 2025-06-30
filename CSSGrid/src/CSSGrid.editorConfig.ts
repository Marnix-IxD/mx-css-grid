import { CSSGridPreviewProps } from "../typings/CSSGridProps";

/**
 * CSS Grid Editor Configuration
 * 
 * Provides validation, custom captions, and preview styling
 * for the Mendix Studio Pro property editor
 * 
 * Modified for Mendix Studio Pro compatibility - no regex usage
 */

// Type definitions for validation errors
interface ValidationError {
    property?: string;
    message: string;
    severity?: "error" | "warning";
}

// Type for the check function
type CheckFunction = (values: CSSGridPreviewProps) => ValidationError[];

// Type for the caption function
type CaptionFunction = (values: CSSGridPreviewProps) => string;

/**
 * Validate CSS grid template syntax without regex
 * 
 * @param template - Grid template string to validate
 * @returns true if valid, false otherwise
 */
function validateGridTemplateSyntax(template: string): boolean {
    if (!template || template.trim() === "") {
        return false;
    }

    const validKeywords = [
        "auto", "min-content", "max-content", "fr", "px", "%",
        "em", "rem", "vw", "vh", "minmax", "repeat"
    ];

    // Split template into parts
    const parts: string[] = [];
    let current = "";
    let depth = 0;

    for (let i = 0; i < template.length; i++) {
        const char = template[i];
        
        if (char === "(") depth++;
        if (char === ")") depth--;
        
        if ((char === " " || char === "\t") && depth === 0) {
            if (current.trim()) {
                parts.push(current.trim());
            }
            current = "";
        } else {
            current += char;
        }
    }
    
    if (current.trim()) {
        parts.push(current.trim());
    }

    // Validate each part
    for (const part of parts) {
        let isValid = false;

        // Check for numeric values with units
        if (hasValidNumericValue(part)) {
            isValid = true;
        }

        // Check for keywords
        for (const keyword of validKeywords) {
            if (part === keyword || part.includes(keyword)) {
                isValid = true;
                break;
            }
        }

        // Check for minmax() function
        if (part.startsWith("minmax(") && part.endsWith(")")) {
            isValid = true;
        }

        // Check for repeat() function
        if (part.startsWith("repeat(") && part.endsWith(")")) {
            isValid = true;
        }

        if (!isValid) {
            return false;
        }
    }

    return true;
}

/**
 * Check if a string contains a valid numeric value with unit
 * 
 * @param value - Value to check
 * @returns true if valid numeric value with unit
 */
function hasValidNumericValue(value: string): boolean {
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

    // Check for plain numbers (grid line numbers)
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0;
}

/**
 * Validate area name without regex
 * 
 * @param name - Area name to validate
 * @returns true if valid, false otherwise
 */
function isValidAreaName(name: string): boolean {
    if (!name || name === ".") {
        return true;
    }

    // Must start with a letter
    const firstChar = name.charCodeAt(0);
    if (!((firstChar >= 65 && firstChar <= 90) || (firstChar >= 97 && firstChar <= 122))) {
        return false;
    }

    // Check remaining characters
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

/**
 * Validate coordinate value without regex
 * 
 * @param value - Coordinate value to validate
 * @returns true if valid, false otherwise
 */
function isValidCoordinate(value: string): boolean {
    if (!value || value === "auto") {
        return true;
    }

    // Check for negative numbers
    if (value.startsWith("-")) {
        const num = parseInt(value.substring(1), 10);
        return !isNaN(num) && num > 0;
    }

    // Check for positive numbers
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0;
}

/**
 * Validate span value without regex
 * 
 * @param value - Span value to validate
 * @returns true if valid, false otherwise
 */
function isValidSpanValue(value: string): boolean {
    if (!value || value === "auto") {
        return true;
    }

    // Check for "span N" format
    if (value.startsWith("span ")) {
        const numPart = value.substring(5).trim();
        const num = parseInt(numPart, 10);
        return !isNaN(num) && num > 0;
    }

    // Check for plain number
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0;
}

/**
 * Validates the CSS Grid configuration
 * 
 * @param values - Widget property values
 * @returns Array of validation errors and warnings
 */
export const check: CheckFunction = (values) => {
    const errors: ValidationError[] = [];
    
    // Validate grid template columns
    if (!values.gridTemplateColumns || values.gridTemplateColumns.trim() === "") {
        errors.push({
            property: "gridTemplateColumns",
            severity: "error",
            message: "Grid template columns cannot be empty"
        });
    } else {
        // Validate grid template syntax
        if (!validateGridTemplateSyntax(values.gridTemplateColumns.trim())) {
            errors.push({
                property: "gridTemplateColumns",
                severity: "warning",
                message: "Grid template columns may have invalid syntax"
            });
        }
    }
    
    // Validate grid template areas if enabled
    if (values.useNamedAreas) {
        if (!values.gridTemplateAreas || values.gridTemplateAreas.trim() === "") {
            errors.push({
                property: "gridTemplateAreas",
                severity: "error",
                message: "Grid template areas cannot be empty when named areas are enabled"
            });
        } else {
            // Validate grid template areas format
            const lines = values.gridTemplateAreas
                .trim()
                .split('\n')
                .filter(line => line.trim())
                .map(line => {
                    // Remove quotes manually
                    let cleanLine = line;
                    cleanLine = cleanLine.split('"').join('');
                    cleanLine = cleanLine.split("'").join('');
                    return cleanLine.trim();
                });
            
            if (lines.length > 0) {
                // Parse each line into cells
                const rowCells: string[][] = [];
                for (const line of lines) {
                    const cells: string[] = [];
                    let current = "";
                    
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        if (char === " " || char === "\t") {
                            if (current) {
                                cells.push(current);
                                current = "";
                            }
                        } else {
                            current += char;
                        }
                    }
                    
                    if (current) {
                        cells.push(current);
                    }
                    
                    rowCells.push(cells);
                }
                
                // Check column counts
                const columnCounts = rowCells.map(row => row.length);
                const firstCount = columnCounts[0];
                
                if (!columnCounts.every(count => count === firstCount)) {
                    errors.push({
                        property: "gridTemplateAreas",
                        severity: "error",
                        message: "All rows in grid template areas must have the same number of columns"
                    });
                }
                
                // Validate area names
                const invalidAreas: string[] = [];
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
    
    // Validate items
    values.items?.forEach((item, index) => {
        // Validate area placement
        if (item.placementType === "area" && values.useNamedAreas) {
            if (!item.gridArea || item.gridArea.trim() === "") {
                errors.push({
                    property: `items[${index}].gridArea`,
                    severity: "error",
                    message: `Item ${index + 1}: Grid area name is required when placement type is 'Named Area'`
                });
            } else if (!isValidAreaName(item.gridArea.trim())) {
                errors.push({
                    property: `items[${index}].gridArea`,
                    severity: "error",
                    message: `Item ${index + 1}: Invalid grid area name "${item.gridArea}"`
                });
            }
        }
        
        // Validate coordinate placement
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
        
        // Validate span placement
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
        
        // Validate z-index
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
    
    // Validate breakpoints
    if (values.enableBreakpoints && values.breakpoints) {
        const widths = values.breakpoints
            .map(bp => bp.minWidth)
            .filter((w): w is number => w !== null);
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
            } else if (bp.minWidth > 9999) {
                errors.push({
                    property: `breakpoints[${index}].minWidth`,
                    severity: "warning",
                    message: `Breakpoint ${index + 1}: Very large minimum width (${bp.minWidth}px) may not work as expected`
                });
            }
        });
    }
    
    // Validate virtualization threshold
    if (values.enableVirtualization && values.virtualizeThreshold !== null) {
        if (values.virtualizeThreshold < 10) {
            errors.push({
                property: "virtualizeThreshold",
                severity: "warning",
                message: "Virtualization threshold below 10 items may cause performance issues"
            });
        } else if (values.virtualizeThreshold > 1000) {
            errors.push({
                property: "virtualizeThreshold",
                severity: "warning",
                message: "Very high virtualization threshold may impact initial render performance"
            });
        }
    }
    
    return errors;
};

/**
 * Generates a custom caption for the widget in the page editor
 * 
 * @param values - Widget property values
 * @returns Custom caption string
 */
export const getCustomCaption: CaptionFunction = (values) => {
    // Parse grid dimensions without regex
    const columnsParts: string[] = [];
    const columnsStr = values.gridTemplateColumns || "1fr 1fr";
    let current = "";
    let depth = 0;
    
    for (let i = 0; i < columnsStr.length; i++) {
        const char = columnsStr[i];
        
        if (char === "(") depth++;
        if (char === ")") depth--;
        
        if ((char === " " || char === "\t") && depth === 0) {
            if (current.trim()) {
                columnsParts.push(current.trim());
            }
            current = "";
        } else {
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
    
    // Build caption parts
    const parts: string[] = [`Grid (${columns}×${rows})`];
    
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

/**
 * Preview CSS for the widget configuration panel
 * 
 * @returns CSS string for configuration preview
 */
export function getPreviewCss(): string {
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