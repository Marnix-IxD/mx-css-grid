/**
 * Grid Helper Utilities
 *
 * Collection of utility functions for CSS Grid widget
 * Handles grid template parsing, validation, and style generation
 *
 * IMPORTANT: These utilities avoid using regex with split() functions
 * to ensure compatibility with Mendix Studio Pro's Jint JavaScript
 * interpreter, which has incomplete regex support in split() operations.
 */

import { CSSProperties } from "react";
import { RuntimeGridContainer, RuntimeGridItem, GridItemPlacement } from "../types/ConditionalTypes";
import { CHAR_CODES } from "./constants";
import { normalizeValue } from "./stringHelpers";
import { forEachEnabledBreakpoint, forEachEnabledItemBreakpoint } from "./breakpointHelpers";
import { BREAKPOINT_CONFIGS } from "../types/BreakpointTypes";

// normalizeValue function is now imported from ./stringHelpers

/**
 * Parse CSS grid template string and expand repeat() functions
 * Implements manual parsing without regex to ensure compatibility
 * with Mendix Studio Pro's Jint environment
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
        if (startIdx === -1) {
            break;
        }

        const openParen = startIdx + 6; // "repeat".length
        let closeParen = -1;
        let parenDepth = 1;

        // Find matching closing parenthesis
        for (let i = openParen + 1; i < expandedTemplate.length; i++) {
            if (expandedTemplate[i] === "(") {
                parenDepth++;
            }
            if (expandedTemplate[i] === ")") {
                parenDepth--;
            }
            if (parenDepth === 0) {
                closeParen = i;
                break;
            }
        }

        if (closeParen === -1) {
            break;
        }

        // Extract repeat content
        const repeatContent = expandedTemplate.substring(openParen + 1, closeParen);
        const commaIdx = repeatContent.indexOf(",");
        if (commaIdx === -1) {
            break;
        }

        const countStr = repeatContent.substring(0, commaIdx).trim();
        const valueStr = repeatContent.substring(commaIdx + 1).trim();
        const count = parseInt(countStr, 10);

        if (isNaN(count) || count < 1) {
            break;
        }

        // Build repeated string without using Array.fill().join()
        let repeated = "";
        for (let i = 0; i < count; i++) {
            if (i > 0) {
                repeated += " ";
            }
            repeated += valueStr;
        }

        // Replace in template
        expandedTemplate =
            expandedTemplate.substring(0, startIdx) + repeated + expandedTemplate.substring(closeParen + 1);
    }

    // Parse by spaces not inside parentheses - using simple state machine
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
 * Implements manual parsing without split() to ensure Jint compatibility
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

        // Parse the quoted lines into grid without using split
        const grid: string[][] = [];
        for (const line of quotedLines) {
            const cells: string[] = [];
            let currentCell = "";

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
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

        return grid.length > 0 ? grid : null;
    } else {
        // Parse unquoted format (legacy support)
        // Parse by newlines without using split()
        const lines: string[] = [];
        let currentLine = "";

        for (let i = 0; i < areas.length; i++) {
            const char = areas[i];
            if (char === "\n") {
                if (currentLine.trim()) {
                    lines.push(currentLine.trim());
                }
                currentLine = "";
            } else if (char !== "\r") {
                currentLine += char;
            }
        }
        if (currentLine.trim()) {
            lines.push(currentLine.trim());
        }

        const grid: string[][] = [];
        for (const line of lines) {
            const cells: string[] = [];
            let currentCell = "";

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
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

        return grid.length > 0 ? grid : null;
    }
}

/**
 * Generate CSS for container responsive breakpoints
 * Uses mobile-first approach with proper normalization
 *
 * @param props - Container props with responsive settings
 * @param className - CSS class name for the grid container
 * @param useNamedAreas - Whether named areas are enabled
 * @returns CSS string with media queries
 */
export function generateContainerBreakpointStyles(
    props: RuntimeGridContainer,
    className: string,
    useNamedAreas = false
): string {
    if (!props.enableBreakpoints) {
        return "";
    }

    const cssRules: string[] = [];

    // Process each enabled breakpoint using helper
    forEachEnabledBreakpoint(props, (config, getProperty, getNormalizedProperty) => {
        const rules: string[] = [];

        // Get breakpoint-specific values with normalization using helper
        const columns = getNormalizedProperty("Columns");
        const rows = getNormalizedProperty("Rows");
        const areas = getNormalizedProperty("Areas");
        const gap = getNormalizedProperty("Gap");
        const rowGap = getNormalizedProperty("RowGap");
        const columnGap = getNormalizedProperty("ColumnGap");
        const autoFlow = getProperty("AutoFlow");
        const autoRows = getNormalizedProperty("AutoRows");
        const autoColumns = getNormalizedProperty("AutoColumns");
        const justifyItems = getProperty("JustifyItems");
        const alignItems = getProperty("AlignItems");
        const justifyContent = getProperty("JustifyContent");
        const alignContent = getProperty("AlignContent");
        const minHeight = getNormalizedProperty("MinHeight");
        const maxHeight = getNormalizedProperty("MaxHeight");
        const minWidth = getNormalizedProperty("MinWidth");
        const maxWidth = getNormalizedProperty("MaxWidth");

        if (columns) {
            rules.push(`grid-template-columns: ${columns};`);
        }
        if (rows) {
            rules.push(`grid-template-rows: ${rows};`);
        }
        if (gap) {
            rules.push(`gap: ${gap};`);
        } else {
            if (rowGap) {
                rules.push(`row-gap: ${rowGap};`);
            }
            if (columnGap) {
                rules.push(`column-gap: ${columnGap};`);
            }
        }
        if (areas && useNamedAreas) {
            rules.push(`grid-template-areas: ${areas};`);
        }
        if (autoFlow) {
            // Map enumeration values to CSS
            const flowMapping: Record<string, string> = {
                row: "row",
                column: "column",
                dense: "dense",
                columnDense: "column dense"
            };
            rules.push(`grid-auto-flow: ${flowMapping[autoFlow] || autoFlow};`);
        }
        if (autoRows) {
            rules.push(`grid-auto-rows: ${autoRows};`);
        }
        if (autoColumns) {
            rules.push(`grid-auto-columns: ${autoColumns};`);
        }
        if (justifyItems) {
            rules.push(`justify-items: ${justifyItems};`);
        }
        if (alignItems) {
            rules.push(`align-items: ${alignItems};`);
        }
        if (justifyContent) {
            const contentMapping: Record<string, string> = {
                spaceBetween: "space-between",
                spaceAround: "space-around",
                spaceEvenly: "space-evenly"
            };
            rules.push(`justify-content: ${contentMapping[justifyContent] || justifyContent};`);
        }
        if (alignContent) {
            const contentMapping: Record<string, string> = {
                spaceBetween: "space-between",
                spaceAround: "space-around",
                spaceEvenly: "space-evenly"
            };
            rules.push(`align-content: ${contentMapping[alignContent] || alignContent};`);
        }
        if (minHeight) {
            rules.push(`min-height: ${minHeight};`);
        }
        if (maxHeight) {
            rules.push(`max-height: ${maxHeight};`);
        }
        if (minWidth) {
            rules.push(`min-width: ${minWidth};`);
        }
        if (maxWidth) {
            rules.push(`max-width: ${maxWidth};`);
            rules.push(`margin-left: auto;`);
            rules.push(`margin-right: auto;`);
        }

        if (rules.length > 0) {
            // Get breakpoint configuration
            const bpConfig = BREAKPOINT_CONFIGS.find(bp => bp.size === config.size);
            if (!bpConfig) {
                return;
            }

            // For XS breakpoint, apply styles directly without media query
            // This ensures XS styles are the base and get overridden by larger breakpoints
            if (config.size === "xs") {
                cssRules.push(`
                    ${className} {
                        ${rules.join("\n                        ")}
                    }
                `);
            } else {
                // For other breakpoints, use min-width media query
                // This creates a proper cascade where larger breakpoints override smaller ones
                const mediaQuery = `
                    @media (min-width: ${bpConfig.minWidth}px) {
                        ${className} {
                            ${rules.join("\n                            ")}
                        }
                    }
                `;
                cssRules.push(mediaQuery);
            }
        }
    });

    return cssRules.join("\n");
}

/**
 * Generate CSS for per-item responsive breakpoints
 * Uses mobile-first approach with normalization
 *
 * @param items - Array of grid items with breakpoint configurations
 * @param widgetId - Unique widget identifier for CSS scoping
 * @returns CSS string with media queries for item breakpoints
 */
export function generateItemBreakpointStyles(items: RuntimeGridItem[], widgetId: string): string {
    const cssRules: string[] = [];

    items.forEach((item, index) => {
        if (!item.enableResponsive) {
            return;
        }

        const itemClassName = `.${widgetId}-item-${index}`;

        // Process each enabled breakpoint using helper
        forEachEnabledItemBreakpoint(item, (config, getProperty, getNormalizedProperty) => {
            const rules: string[] = [];

            // Get placement type for this breakpoint
            const placementType = (getProperty("PlacementType") as string) || "auto";

            // Apply placement based on type with normalization
            if (placementType === "area") {
                const areaValue = getNormalizedProperty("GridArea");
                if (areaValue) {
                    rules.push(`grid-area: ${areaValue};`);
                    // Clear coordinate-based placement
                    rules.push(`grid-column: auto;`);
                    rules.push(`grid-row: auto;`);
                }
            } else if (placementType === "coordinates") {
                const colStart = getNormalizedProperty("ColumnStart");
                const colEnd = getNormalizedProperty("ColumnEnd");
                const rowStart = getNormalizedProperty("RowStart");
                const rowEnd = getNormalizedProperty("RowEnd");

                if (colStart && colStart !== "auto") {
                    rules.push(`grid-column-start: ${colStart};`);
                }
                if (colEnd && colEnd !== "auto") {
                    rules.push(`grid-column-end: ${colEnd};`);
                }
                if (rowStart && rowStart !== "auto") {
                    rules.push(`grid-row-start: ${rowStart};`);
                }
                if (rowEnd && rowEnd !== "auto") {
                    rules.push(`grid-row-end: ${rowEnd};`);
                }
                // Clear area placement
                rules.push(`grid-area: auto;`);
            } else if (placementType === "span") {
                const colStart = getNormalizedProperty("ColumnStart");
                const rowStart = getNormalizedProperty("RowStart");

                if (colStart && colStart !== "auto") {
                    if (colStart.includes("span")) {
                        rules.push(`grid-column: ${colStart};`);
                    } else {
                        rules.push(`grid-column-start: ${colStart};`);
                    }
                }
                if (rowStart && rowStart !== "auto") {
                    if (rowStart.includes("span")) {
                        rules.push(`grid-row: ${rowStart};`);
                    } else {
                        rules.push(`grid-row-start: ${rowStart};`);
                    }
                }
                // Clear area placement
                rules.push(`grid-area: auto;`);
            } else if (placementType === "auto") {
                // Reset to auto placement
                rules.push(`grid-area: auto;`);
                rules.push(`grid-column: auto;`);
                rules.push(`grid-row: auto;`);
            }

            if (rules.length > 0) {
                // Get breakpoint configuration for media query
                const bpConfig = BREAKPOINT_CONFIGS.find(bp => bp.size === config.size);
                if (!bpConfig) {
                    return;
                }

                // For XS breakpoint, apply styles directly without media query
                if (config.size === "xs") {
                    cssRules.push(`
                        ${itemClassName} {
                            ${rules.join("\n                            ")}
                        }
                    `);
                } else {
                    // For other breakpoints, use min-width media query
                    const mediaQuery = `
                        @media (min-width: ${bpConfig.minWidth}px) {
                            ${itemClassName} {
                                ${rules.join("\n                                ")}
                            }
                        }
                    `;
                    cssRules.push(mediaQuery);
                }
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
export function getGridItemPlacement(item: GridItemPlacement, useNamedAreas = false): CSSProperties {
    const placement: CSSProperties = {};

    // Normalize values before processing
    const normalizedItem = {
        ...item,
        gridArea: normalizeValue(item.gridArea),
        columnStart: normalizeValue(item.columnStart),
        columnEnd: normalizeValue(item.columnEnd),
        rowStart: normalizeValue(item.rowStart),
        rowEnd: normalizeValue(item.rowEnd)
    };

    switch (normalizedItem.placementType) {
        case "area":
            if (normalizedItem.gridArea && useNamedAreas) {
                placement.gridArea = normalizedItem.gridArea;
                // Don't set other properties - let them be auto
            }
            break;

        case "coordinates":
            // Always apply coordinate placement regardless of useNamedAreas
            if (normalizedItem.columnStart && normalizedItem.columnStart !== "auto") {
                placement.gridColumnStart = normalizedItem.columnStart;
            }
            if (normalizedItem.columnEnd && normalizedItem.columnEnd !== "auto") {
                placement.gridColumnEnd = normalizedItem.columnEnd;
            }
            if (normalizedItem.rowStart && normalizedItem.rowStart !== "auto") {
                placement.gridRowStart = normalizedItem.rowStart;
            }
            if (normalizedItem.rowEnd && normalizedItem.rowEnd !== "auto") {
                placement.gridRowEnd = normalizedItem.rowEnd;
            }
            break;

        case "span":
            // Always apply span placement regardless of useNamedAreas
            // Handle span syntax in column
            if (normalizedItem.columnStart && normalizedItem.columnStart !== "auto") {
                if (normalizedItem.columnStart.includes("span")) {
                    placement.gridColumn = normalizedItem.columnStart;
                } else if (normalizedItem.columnEnd && normalizedItem.columnEnd !== "auto") {
                    placement.gridColumn = `${normalizedItem.columnStart} / ${normalizedItem.columnEnd}`;
                } else {
                    placement.gridColumnStart = normalizedItem.columnStart;
                }
            }

            // Handle span syntax in row
            if (normalizedItem.rowStart && normalizedItem.rowStart !== "auto") {
                if (normalizedItem.rowStart.includes("span")) {
                    placement.gridRow = normalizedItem.rowStart;
                } else if (normalizedItem.rowEnd && normalizedItem.rowEnd !== "auto") {
                    placement.gridRow = `${normalizedItem.rowStart} / ${normalizedItem.rowEnd}`;
                } else {
                    placement.gridRowStart = normalizedItem.rowStart;
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
    if (
        !(
            (firstChar >= CHAR_CODES.UPPERCASE_A && firstChar <= CHAR_CODES.UPPERCASE_Z) ||
            (firstChar >= CHAR_CODES.LOWERCASE_A && firstChar <= CHAR_CODES.LOWERCASE_Z)
        )
    ) {
        return false;
    }

    // Check remaining characters
    for (let i = 1; i < name.length; i++) {
        const charCode = name.charCodeAt(i);
        const isLetter =
            (charCode >= CHAR_CODES.UPPERCASE_A && charCode <= CHAR_CODES.UPPERCASE_Z) ||
            (charCode >= CHAR_CODES.LOWERCASE_A && charCode <= CHAR_CODES.LOWERCASE_Z);
        const isNumber = charCode >= CHAR_CODES.DIGIT_0 && charCode <= CHAR_CODES.DIGIT_9;
        const isHyphen = charCode === CHAR_CODES.HYPHEN;
        const isUnderscore = charCode === CHAR_CODES.UNDERSCORE;

        if (!isLetter && !isNumber && !isHyphen && !isUnderscore) {
            return false;
        }
    }

    return true;
}
