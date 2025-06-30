/**
 * Grid Helper Utilities
 * 
 * Collection of utility functions for CSS Grid widget
 * Handles grid template parsing, validation, and style generation
 * 
 * Modified for Mendix Studio Pro compatibility
 */

import { CSSProperties } from "react";

/**
 * Parse CSS grid template string and expand repeat() functions
 * Modified to avoid complex regex patterns for Mendix compatibility
 * 
 * @param template - Grid template string (e.g., "1fr 2fr 1fr" or "repeat(3, 1fr)")
 * @returns Array of grid track values
 */
export function parseGridTemplate(template: string): string[] {
    if (!template || template.trim() === "") {
        return ["1fr"];
    }

    let expandedTemplate = template;
    
    // Handle repeat() syntax without regex
    while (expandedTemplate.includes("repeat(")) {
        const startIdx = expandedTemplate.indexOf("repeat(");
        if (startIdx === -1) break;
        
        const openParen = startIdx + 6; // "repeat".length
        let closeParen = -1;
        let parenDepth = 1;
        
        // Find matching closing parenthesis
        for (let i = openParen + 1; i < expandedTemplate.length; i++) {
            if (expandedTemplate[i] === "(") parenDepth++;
            if (expandedTemplate[i] === ")") parenDepth--;
            if (parenDepth === 0) {
                closeParen = i;
                break;
            }
        }
        
        if (closeParen === -1) break;
        
        // Extract repeat content
        const repeatContent = expandedTemplate.substring(openParen + 1, closeParen);
        const commaIdx = repeatContent.indexOf(",");
        if (commaIdx === -1) break;
        
        const countStr = repeatContent.substring(0, commaIdx).trim();
        const valueStr = repeatContent.substring(commaIdx + 1).trim();
        const count = parseInt(countStr, 10);
        
        if (isNaN(count) || count < 1) break;
        
        // Build repeated string
        const repeated = Array(count).fill(valueStr).join(" ");
        
        // Replace in template
        expandedTemplate = 
            expandedTemplate.substring(0, startIdx) + 
            repeated + 
            expandedTemplate.substring(closeParen + 1);
    }

    // Split by spaces not inside parentheses - using simple state machine
    const parts: string[] = [];
    let current = "";
    let depth = 0;
    
    for (let i = 0; i < expandedTemplate.length; i++) {
        const char = expandedTemplate[i];
        
        if (char === "(" || char === "[") {
            depth++;
        } else if (char === ")" || char === "]") {
            depth--;
        }
        
        if (char === " " && depth === 0) {
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
    
    return parts.length > 0 ? parts : ["1fr"];
}

/**
 * Parse grid template areas string into a 2D array
 * Modified to use simpler string operations
 * 
 * @param areas - Grid template areas string
 * @returns 2D array of area names or null if invalid
 */
export function parseGridAreas(areas: string): string[][] | null {
    if (!areas || areas.trim() === "") {
        return null;
    }

    // Remove quotes using simple replace
    let cleanedAreas = areas;
    cleanedAreas = cleanedAreas.split('"').join('');
    cleanedAreas = cleanedAreas.split("'").join('');
    cleanedAreas = cleanedAreas.trim();
    
    // Split by newlines
    const lines = cleanedAreas.split('\n').filter(line => line.trim());

    const grid: string[][] = [];
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        const cells: string[] = [];
        let currentCell = "";
        
        // Split by spaces
        for (let i = 0; i < trimmedLine.length; i++) {
            const char = trimmedLine[i];
            if (char === " " || char === "\t") {
                if (currentCell) {
                    cells.push(currentCell);
                    currentCell = "";
                }
            } else {
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

    // Validate that all rows have the same number of columns
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

/**
 * Breakpoint configuration for responsive grids
 */
interface Breakpoint {
    minWidth: number;
    columns?: string;
    rows?: string;
    gap?: string;
}

/**
 * Generate CSS for responsive breakpoints
 * 
 * @param breakpoints - Array of breakpoint configurations
 * @param className - CSS class name for the grid container
 * @returns CSS string with media queries
 */
export function generateBreakpointStyles(
    breakpoints: Breakpoint[],
    className: string
): string {
    if (!breakpoints || breakpoints.length === 0) {
        return "";
    }

    // Sort breakpoints by minWidth to ensure proper cascade
    const sorted = [...breakpoints].sort((a, b) => a.minWidth - b.minWidth);

    const cssRules: string[] = [];

    for (const bp of sorted) {
        const rules: string[] = [];
        
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

/**
 * Grid item placement configuration
 */
interface GridItemPlacement {
    placementType: string;
    gridArea?: string;
    columnStart: string;
    columnEnd: string;
    rowStart: string;
    rowEnd: string;
}

/**
 * Merge grid placement properties into CSS grid properties
 * 
 * @param item - Grid item placement configuration
 * @returns CSS properties for grid item placement
 */
export function getGridItemPlacement(item: GridItemPlacement): CSSProperties {
    const placement: CSSProperties = {};

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
            // Handle span syntax in column
            if (item.columnStart && item.columnStart.includes("span")) {
                placement.gridColumn = item.columnStart;
            } else if (item.columnStart && item.columnEnd && item.columnStart !== "auto") {
                placement.gridColumn = `${item.columnStart} / ${item.columnEnd}`;
            }

            // Handle span syntax in row
            if (item.rowStart && item.rowStart.includes("span")) {
                placement.gridRow = item.rowStart;
            } else if (item.rowStart && item.rowEnd && item.rowStart !== "auto") {
                placement.gridRow = `${item.rowStart} / ${item.rowEnd}`;
            }
            break;

        case "auto":
        default:
            // Item will be auto-placed according to grid-auto-flow
            break;
    }

    return placement;
}

/**
 * Validate grid line references
 * Using simple string checks instead of regex
 * 
 * @param line - Grid line reference (e.g., "1", "-1", "span 2", "header-start")
 * @returns true if valid, false otherwise
 */
export function validateGridLine(line: string): boolean {
    if (!line || line === "auto") {
        return true;
    }

    // Check for span syntax
    if (line.startsWith("span")) {
        const parts = line.split(" ");
        if (parts.length === 2) {
            const num = parseInt(parts[1], 10);
            return !isNaN(num) && num > 0;
        }
        return false;
    }

    // Check for line number (positive or negative)
    const lineNumber = parseInt(line, 10);
    if (!isNaN(lineNumber) && lineNumber !== 0) {
        return true;
    }

    // Check for named line - basic validation
    // Must start with letter and contain only letters, numbers, hyphens, underscores
    if (line.length > 0) {
        const firstChar = line.charCodeAt(0);
        // Check if first character is a letter (a-z or A-Z)
        if ((firstChar >= 65 && firstChar <= 90) || (firstChar >= 97 && firstChar <= 122)) {
            // Check remaining characters
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

/**
 * Calculate the number of cells in a grid
 * 
 * @param template - Grid template columns string
 * @param areas - Parsed grid areas array
 * @returns Object with columns and rows count
 */
export function calculateGridSize(
    template: string,
    areas?: string[][] | null
): { columns: number; rows: number } {
    const columns = parseGridTemplate(template).length;
    const rows = areas ? areas.length : 1;
    
    return { columns, rows };
}

/**
 * Get unique area names from grid template areas
 * 
 * @param areas - Parsed grid areas array
 * @returns Array of unique area names (excluding dots)
 */
export function getUniqueAreaNames(areas: string[][] | null): string[] {
    if (!areas) {
        return [];
    }

    const uniqueNames = new Set<string>();
    
    areas.forEach(row => {
        row.forEach(cell => {
            if (cell && cell !== ".") {
                uniqueNames.add(cell);
            }
        });
    });

    return Array.from(uniqueNames);
}

/**
 * Check if a grid area name is valid
 * Using simple character checks instead of regex
 * 
 * @param name - Grid area name to validate
 * @returns true if valid, false otherwise
 */
export function isValidAreaName(name: string): boolean {
    if (!name || name === ".") {
        return true; // Empty cells are valid
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
 * Parse CSS length value and unit
 * Using simple string operations
 * 
 * @param value - CSS length value (e.g., "100px", "2rem", "50%")
 * @returns Object with numeric value and unit, or null if invalid
 */
export function parseCSSLength(value: string): { value: number; unit: string } | null {
    if (!value) return null;
    
    let numStr = "";
    let unitStr = "";
    let foundUnit = false;
    
    // Extract number and unit
    for (let i = 0; i < value.length; i++) {
        const char = value[i];
        const charCode = char.charCodeAt(0);
        
        // Check if character is digit or decimal point
        if ((charCode >= 48 && charCode <= 57) || char === ".") {
            if (!foundUnit) {
                numStr += char;
            }
        } else {
            foundUnit = true;
            unitStr += char;
        }
    }
    
    const num = parseFloat(numStr);
    if (isNaN(num)) return null;
    
    // Validate unit
    const validUnits = ["px", "em", "rem", "%", "vw", "vh", "fr", "ch", "ex"];
    if (!validUnits.includes(unitStr)) return null;
    
    return { value: num, unit: unitStr };
}

/**
 * Generate debug information for grid
 * 
 * @param template - Grid template string
 * @param areas - Grid areas string
 * @returns Debug information object
 */
export function getGridDebugInfo(template: string, areas?: string): {
    columns: number;
    rows: number;
    areaNames: string[];
    isValid: boolean;
} {
    const parsedTemplate = parseGridTemplate(template);
    const parsedAreas = areas ? parseGridAreas(areas) : null;
    
    return {
        columns: parsedTemplate.length,
        rows: parsedAreas ? parsedAreas.length : 1,
        areaNames: getUniqueAreaNames(parsedAreas),
        isValid: parsedAreas ? parsedAreas.every(row => row.length === parsedTemplate.length) : true
    };
}