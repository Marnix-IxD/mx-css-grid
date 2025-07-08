/**
 * Grid Helper Utilities
 * 
 * Collection of utility functions for CSS Grid widget
 * Handles grid template parsing, validation, and style generation
 * 
 * Modified for Mendix Studio Pro compatibility
 */

import { CSSProperties } from "react";
import { 
    RuntimeGridContainer, 
    RuntimeGridItem,
    GridItemPlacement 
} from "../types/ConditionalTypes";

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
 * NO AUTOMATIC QUOTE ADDITION - uses the value exactly as provided
 * 
 * @param areas - Grid template areas string
 * @returns 2D array of area names or null if invalid
 */
export function parseGridAreas(areas: string): string[][] | null {
    if (!areas || areas.trim() === "") {
        return null;
    }

    // Check if the areas string contains quotes
    const hasQuotes = areas.includes('"') || areas.includes("'");
    
    if (hasQuotes) {
        // Parse quoted format (standard CSS format)
        // Extract content between quotes
        const quotedLines: string[] = [];
        const quoteChar = areas.includes('"') ? '"' : "'";
        let inQuote = false;
        let currentLine = "";
        
        for (let i = 0; i < areas.length; i++) {
            const char = areas[i];
            if (char === quoteChar) {
                if (inQuote) {
                    // End of quoted line
                    if (currentLine.trim()) {
                        quotedLines.push(currentLine.trim());
                    }
                    currentLine = "";
                    inQuote = false;
                } else {
                    // Start of quoted line
                    inQuote = true;
                }
            } else if (inQuote) {
                currentLine += char;
            }
        }
        
        // Parse the quoted lines into grid
        const grid: string[][] = [];
        for (const line of quotedLines) {
            const cells = line.trim().split(/\s+/);
            if (cells.length > 0) {
                grid.push(cells);
            }
        }
        
        return grid.length > 0 ? grid : null;
    } else {
        // Parse unquoted format (legacy support)
        // Split by newlines
        const lines = areas.split('\n').filter(line => line.trim());
        
        const grid: string[][] = [];
        for (const line of lines) {
            const cells = line.trim().split(/\s+/);
            if (cells.length > 0) {
                grid.push(cells);
            }
        }
        
        return grid.length > 0 ? grid : null;
    }
}

/**
 * Generate CSS for container responsive breakpoints
 * 
 * @param props - Container props with responsive settings
 * @param className - CSS class name for the grid container
 * @param useNamedAreas - Whether named areas are enabled
 * @returns CSS string with media queries
 */
export function generateContainerBreakpointStyles(
    props: RuntimeGridContainer,
    className: string,
    useNamedAreas: boolean = false
): string {
    if (!props.enableBreakpoints) {
        return "";
    }

    const cssRules: string[] = [];
    
    // Define breakpoint configurations
    const breakpoints = [
        { key: 'xs', minWidth: 0, maxWidth: 639 },
        { key: 'sm', minWidth: 640, maxWidth: 767 },
        { key: 'md', minWidth: 768, maxWidth: 1023 },
        { key: 'lg', minWidth: 1024, maxWidth: 1439 },
        { key: 'xl', minWidth: 1440, maxWidth: 1919 },
        { key: 'xxl', minWidth: 1920, maxWidth: undefined }
    ] as const;
    
    breakpoints.forEach(bp => {
        const enabledKey = `${bp.key}Enabled` as keyof RuntimeGridContainer;
        if (!props[enabledKey]) {
            return;
        }
        
        const rules: string[] = [];
        
        // Get breakpoint-specific values
        const columnsKey = `${bp.key}Columns` as keyof RuntimeGridContainer;
        const rowsKey = `${bp.key}Rows` as keyof RuntimeGridContainer;
        const areasKey = `${bp.key}Areas` as keyof RuntimeGridContainer;
        const gapKey = `${bp.key}Gap` as keyof RuntimeGridContainer;
        const rowGapKey = `${bp.key}RowGap` as keyof RuntimeGridContainer;
        const columnGapKey = `${bp.key}ColumnGap` as keyof RuntimeGridContainer;
        const autoFlowKey = `${bp.key}AutoFlow` as keyof RuntimeGridContainer;
        const autoRowsKey = `${bp.key}AutoRows` as keyof RuntimeGridContainer;
        const autoColumnsKey = `${bp.key}AutoColumns` as keyof RuntimeGridContainer;
        const justifyItemsKey = `${bp.key}JustifyItems` as keyof RuntimeGridContainer;
        const alignItemsKey = `${bp.key}AlignItems` as keyof RuntimeGridContainer;
        const justifyContentKey = `${bp.key}JustifyContent` as keyof RuntimeGridContainer;
        const alignContentKey = `${bp.key}AlignContent` as keyof RuntimeGridContainer;
        const minHeightKey = `${bp.key}MinHeight` as keyof RuntimeGridContainer;
        const maxHeightKey = `${bp.key}MaxHeight` as keyof RuntimeGridContainer;
        const minWidthKey = `${bp.key}MinWidth` as keyof RuntimeGridContainer;
        const maxWidthKey = `${bp.key}MaxWidth` as keyof RuntimeGridContainer;
        
        const columns = props[columnsKey] as string | undefined;
        const rows = props[rowsKey] as string | undefined;
        const areas = props[areasKey] as string | undefined;
        const gap = props[gapKey] as string | undefined;
        const rowGap = props[rowGapKey] as string | undefined;
        const columnGap = props[columnGapKey] as string | undefined;
        const autoFlow = props[autoFlowKey] as string | undefined;
        const autoRows = props[autoRowsKey] as string | undefined;
        const autoColumns = props[autoColumnsKey] as string | undefined;
        const justifyItems = props[justifyItemsKey] as string | undefined;
        const alignItems = props[alignItemsKey] as string | undefined;
        const justifyContent = props[justifyContentKey] as string | undefined;
        const alignContent = props[alignContentKey] as string | undefined;
        const minHeight = props[minHeightKey] as string | undefined;
        const maxHeight = props[maxHeightKey] as string | undefined;
        const minWidth = props[minWidthKey] as string | undefined;
        const maxWidth = props[maxWidthKey] as string | undefined;
        
        if (columns) {
            rules.push(`grid-template-columns: ${columns} !important;`);
        }
        if (rows) {
            rules.push(`grid-template-rows: ${rows} !important;`);
        }
        if (gap) {
            rules.push(`gap: ${gap} !important;`);
        }
        if (rowGap && !gap) {
            rules.push(`row-gap: ${rowGap} !important;`);
        }
        if (columnGap && !gap) {
            rules.push(`column-gap: ${columnGap} !important;`);
        }
        if (areas && useNamedAreas) {
            rules.push(`grid-template-areas: ${areas} !important;`);
        }
        if (autoFlow) {
            // Map enumeration values to CSS
            const flowMapping: Record<string, string> = {
                'row': 'row',
                'column': 'column',
                'dense': 'dense',
                'columnDense': 'column dense'
            };
            rules.push(`grid-auto-flow: ${flowMapping[autoFlow] || autoFlow} !important;`);
        }
        if (autoRows) {
            rules.push(`grid-auto-rows: ${autoRows} !important;`);
        }
        if (autoColumns) {
            rules.push(`grid-auto-columns: ${autoColumns} !important;`);
        }
        if (justifyItems) {
            rules.push(`justify-items: ${justifyItems} !important;`);
        }
        if (alignItems) {
            rules.push(`align-items: ${alignItems} !important;`);
        }
        if (justifyContent) {
            const contentMapping: Record<string, string> = {
                'spaceBetween': 'space-between',
                'spaceAround': 'space-around',
                'spaceEvenly': 'space-evenly'
            };
            rules.push(`justify-content: ${contentMapping[justifyContent] || justifyContent} !important;`);
        }
        if (alignContent) {
            const contentMapping: Record<string, string> = {
                'spaceBetween': 'space-between',
                'spaceAround': 'space-around',
                'spaceEvenly': 'space-evenly'
            };
            rules.push(`align-content: ${contentMapping[alignContent] || alignContent} !important;`);
        }
        if (minHeight) {
            rules.push(`min-height: ${minHeight} !important;`);
        }
        if (maxHeight) {
            rules.push(`max-height: ${maxHeight} !important;`);
        }
        if (minWidth) {
            rules.push(`min-width: ${minWidth} !important;`);
        }
        if (maxWidth) {
            rules.push(`max-width: ${maxWidth} !important;`);
            rules.push(`margin-left: auto !important;`);
            rules.push(`margin-right: auto !important;`);
        }
        
        if (rules.length > 0) {
            let mediaQuery: string;
            if (bp.maxWidth !== undefined) {
                mediaQuery = `
                    @media (min-width: ${bp.minWidth}px) and (max-width: ${bp.maxWidth}px) {
                        ${className} {
                            ${rules.join("\n                            ")}
                        }
                    }
                `;
            } else {
                // For xxl, only min-width
                mediaQuery = `
                    @media (min-width: ${bp.minWidth}px) {
                        ${className} {
                            ${rules.join("\n                            ")}
                        }
                    }
                `;
            }
            cssRules.push(mediaQuery);
        }
    });
    
    return cssRules.join("\n");
}

/**
 * Generate CSS for per-item responsive breakpoints with new system
 * 
 * @param items - Array of grid items with breakpoint configurations
 * @param widgetId - Unique widget identifier for CSS scoping
 * @returns CSS string with media queries for item breakpoints
 */
export function generateItemBreakpointStyles(
    items: RuntimeGridItem[],
    widgetId: string
): string {
    const cssRules: string[] = [];
    
    // Define breakpoint configurations
    const breakpoints = [
        { key: 'xs', minWidth: 0, maxWidth: 639 },
        { key: 'sm', minWidth: 640, maxWidth: 767 },
        { key: 'md', minWidth: 768, maxWidth: 1023 },
        { key: 'lg', minWidth: 1024, maxWidth: 1439 },
        { key: 'xl', minWidth: 1440, maxWidth: 1919 },
        { key: 'xxl', minWidth: 1920, maxWidth: undefined }
    ] as const;
    
    items.forEach((item, index) => {
        if (!item.enableResponsive) {
            return;
        }
        
        const itemClassName = `.${widgetId}-item-${index}`;
        
        // Process each breakpoint
        breakpoints.forEach(bp => {
            // Type-safe property access
            const enabledKey = `${bp.key}Enabled` as keyof RuntimeGridItem;
            if (!item[enabledKey]) {
                return;
            }
            
            const rules: string[] = [];
            
            // Get placement type for this breakpoint
            const placementTypeKey = `${bp.key}PlacementType` as keyof RuntimeGridItem;
            const placementType = item[placementTypeKey] as string || 'auto';
            
            // Apply placement based on type
            if (placementType === "area") {
                const areaKey = `${bp.key}GridArea` as keyof RuntimeGridItem;
                const areaValue = item[areaKey] as string | undefined;
                if (areaValue) {
                    rules.push(`grid-area: ${areaValue} !important;`);
                    // Clear coordinate-based placement
                    rules.push(`grid-column: auto !important;`);
                    rules.push(`grid-row: auto !important;`);
                }
            } else if (placementType === "coordinates") {
                const colStartKey = `${bp.key}ColumnStart` as keyof RuntimeGridItem;
                const colEndKey = `${bp.key}ColumnEnd` as keyof RuntimeGridItem;
                const rowStartKey = `${bp.key}RowStart` as keyof RuntimeGridItem;
                const rowEndKey = `${bp.key}RowEnd` as keyof RuntimeGridItem;
                
                const colStart = item[colStartKey] as string | undefined;
                const colEnd = item[colEndKey] as string | undefined;
                const rowStart = item[rowStartKey] as string | undefined;
                const rowEnd = item[rowEndKey] as string | undefined;
                
                if (colStart && colStart !== "auto") {
                    rules.push(`grid-column-start: ${colStart} !important;`);
                }
                if (colEnd && colEnd !== "auto") {
                    rules.push(`grid-column-end: ${colEnd} !important;`);
                }
                if (rowStart && rowStart !== "auto") {
                    rules.push(`grid-row-start: ${rowStart} !important;`);
                }
                if (rowEnd && rowEnd !== "auto") {
                    rules.push(`grid-row-end: ${rowEnd} !important;`);
                }
                // Clear area placement
                rules.push(`grid-area: auto !important;`);
            } else if (placementType === "span") {
                const colStartKey = `${bp.key}ColumnStart` as keyof RuntimeGridItem;
                const rowStartKey = `${bp.key}RowStart` as keyof RuntimeGridItem;
                
                const colStart = item[colStartKey] as string | undefined;
                const rowStart = item[rowStartKey] as string | undefined;
                
                if (colStart && colStart !== "auto") {
                    if (colStart.includes("span")) {
                        rules.push(`grid-column: ${colStart} !important;`);
                    } else {
                        rules.push(`grid-column-start: ${colStart} !important;`);
                    }
                }
                if (rowStart && rowStart !== "auto") {
                    if (rowStart.includes("span")) {
                        rules.push(`grid-row: ${rowStart} !important;`);
                    } else {
                        rules.push(`grid-row-start: ${rowStart} !important;`);
                    }
                }
                // Clear area placement
                rules.push(`grid-area: auto !important;`);
            } else if (placementType === "auto") {
                // Reset to auto placement
                rules.push(`grid-area: auto !important;`);
                rules.push(`grid-column: auto !important;`);
                rules.push(`grid-row: auto !important;`);
            }
            
            if (rules.length > 0) {
                // Create media query with min and max width for precise control
                let mediaQuery: string;
                if (bp.maxWidth !== undefined) {
                    mediaQuery = `
                        @media (min-width: ${bp.minWidth}px) and (max-width: ${bp.maxWidth}px) {
                            ${itemClassName} {
                                ${rules.join("\n                                ")}
                            }
                        }
                    `;
                } else {
                    // For xxl, only min-width
                    mediaQuery = `
                        @media (min-width: ${bp.minWidth}px) {
                            ${itemClassName} {
                                ${rules.join("\n                                ")}
                            }
                        }
                    `;
                }
                cssRules.push(mediaQuery);
            }
        });
    });
    
    return cssRules.join("\n");
}

/**
 * Merge grid placement properties into CSS grid properties
 * Fixed to properly handle mixed placement types when using named areas
 * 
 * @param item - Grid item placement configuration
 * @param useNamedAreas - Whether the grid is using named areas
 * @returns CSS properties for grid item placement
 */
export function getGridItemPlacement(item: GridItemPlacement, useNamedAreas: boolean = false): CSSProperties {
    const placement: CSSProperties = {};

    switch (item.placementType) {
        case "area":
            if (item.gridArea && useNamedAreas) {
                placement.gridArea = item.gridArea;
                // Don't set other properties - let them be auto
            }
            break;

        case "coordinates":
            // Always apply coordinate placement regardless of useNamedAreas
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
            // Always apply span placement regardless of useNamedAreas
            // Handle span syntax in column
            if (item.columnStart && item.columnStart !== "auto") {
                if (item.columnStart.includes("span")) {
                    placement.gridColumn = item.columnStart;
                } else if (item.columnEnd && item.columnEnd !== "auto") {
                    placement.gridColumn = `${item.columnStart} / ${item.columnEnd}`;
                } else {
                    placement.gridColumnStart = item.columnStart;
                }
            }

            // Handle span syntax in row
            if (item.rowStart && item.rowStart !== "auto") {
                if (item.rowStart.includes("span")) {
                    placement.gridRow = item.rowStart;
                } else if (item.rowEnd && item.rowEnd !== "auto") {
                    placement.gridRow = `${item.rowStart} / ${item.rowEnd}`;
                } else {
                    placement.gridRowStart = item.rowStart;
                }
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