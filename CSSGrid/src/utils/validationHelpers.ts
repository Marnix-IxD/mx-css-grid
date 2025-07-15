/**
 * Reusable validation helpers for CSS Grid properties
 * Designed to work in both standard and Jint environments
 *
 * Key principle: Responsive properties are optional overrides.
 * Empty values are valid and inherit from base properties.
 */

import { CSS_UNITS, CSS_KEYWORDS, CHAR_CODES } from "./constants";

// Types for validation results
export interface ValidationResult {
    isValid: boolean;
    error?: string;
    warning?: string;
    info?: string;
    severity?: "error" | "warning";
}

export interface NumericValidationResult extends ValidationResult {
    numericValue?: number;
    isKeyword?: boolean;
}

/**
 * Check if a value is effectively empty (null, undefined, or empty string)
 */
export function isEmpty(value: any): boolean {
    return value === null || value === undefined || value === "" || (typeof value === "string" && value.trim() === "");
}

/**
 * Validate CSS dimension value (width, height, gap, etc.)
 * Empty values are valid for responsive properties
 */
export function validateCssDimension(
    value: string | null | undefined,
    propertyName: string,
    isRequired = false
): ValidationResult {
    if (isEmpty(value)) {
        if (isRequired) {
            return {
                isValid: false,
                error: `${propertyName} is required`,
                severity: "error"
            };
        }
        return { isValid: true };
    }

    const trimmed = value!.trim();

    // Check keywords
    if (CSS_KEYWORDS.dimensions.includes(trimmed.toLowerCase())) {
        return { isValid: true };
    }

    // Check zero
    if (trimmed === "0") {
        return { isValid: true };
    }

    // Check for CSS math functions
    const mathFunctions = ["calc", "clamp", "min", "max"];
    for (const func of mathFunctions) {
        if (trimmed.startsWith(`${func}(`) && trimmed.endsWith(")")) {
            // Basic validation - just check it's properly closed
            // More advanced validation would parse the parameters
            return { isValid: true };
        }
    }

    // Check for CSS comparison functions (for completeness)
    if (trimmed === "min-content" || trimmed === "max-content" || trimmed === "fit-content") {
        return { isValid: true };
    }

    // Check for fit-content() with parameter
    if (trimmed.startsWith("fit-content(") && trimmed.endsWith(")")) {
        return { isValid: true };
    }

    // Check for CSS custom properties (CSS variables)
    if (trimmed.startsWith("var(") && trimmed.endsWith(")")) {
        return { isValid: true };
    }

    // Check for environment variables (e.g., env(safe-area-inset-top))
    if (trimmed.startsWith("env(") && trimmed.endsWith(")")) {
        return { isValid: true };
    }

    // Check for numeric value with unit
    for (const unit of CSS_UNITS) {
        if (trimmed.endsWith(unit)) {
            const numPart = trimmed.substring(0, trimmed.length - unit.length);
            const num = parseFloat(numPart);
            if (!isNaN(num) && num >= 0) {
                return { isValid: true };
            }
        }
    }

    // Check for plain number (valid for some properties like line-height)
    const num = parseFloat(trimmed);
    if (!isNaN(num) && num >= 0) {
        return {
            isValid: true,
            warning: `${propertyName}: Plain number '${trimmed}' may need a unit (px, %, rem, etc.)`,
            severity: "warning"
        };
    }

    return {
        isValid: false,
        error: `${propertyName} must be a valid CSS dimension (e.g., 100px, 50%, 2rem, auto)`,
        severity: "error"
    };
}

/**
 * Validate gap value
 */
export function validateGap(value: string | null | undefined, isRequired = false): ValidationResult {
    if (isEmpty(value)) {
        if (isRequired) {
            return {
                isValid: false,
                error: "Gap is required",
                severity: "error"
            };
        }
        return { isValid: true };
    }

    const trimmed = value!.trim();

    // Check gap-specific keywords
    if (CSS_KEYWORDS.gap.includes(trimmed.toLowerCase())) {
        return { isValid: true };
    }

    // Use dimension validation
    return validateCssDimension(value, "Gap", false);
}

/**
 * Validate grid template (columns/rows)
 */
export function validateGridTemplate(
    template: string | null | undefined,
    propertyName: string,
    isRequired = false
): ValidationResult {
    if (isEmpty(template)) {
        if (isRequired) {
            return {
                isValid: false,
                error: `${propertyName} is required`,
                severity: "error"
            };
        }
        return { isValid: true };
    }

    const trimmed = template!.trim();
    const validKeywords = [
        "auto",
        "min-content",
        "max-content",
        "fr",
        "px",
        "%",
        "em",
        "rem",
        "vw",
        "vh",
        "minmax",
        "repeat",
        "fit-content",
        "calc",
        "clamp",
        "min",
        "max",
        "var",
        "env"
    ];

    // Basic validation - check if it contains valid keywords/units
    const hasValidContent = validKeywords.some(keyword => trimmed.includes(keyword));

    if (!hasValidContent && !/\d/.test(trimmed)) {
        return {
            isValid: false,
            error: `${propertyName} appears to have invalid syntax. Example: '1fr 2fr 1fr' or 'repeat(3, 1fr)'`,
            severity: "error"
        };
    }

    // Check for common mistakes
    if (trimmed.includes("repeat") && !trimmed.includes("(")) {
        return {
            isValid: false,
            error: `${propertyName}: repeat must be used as a function. Example: repeat(3, 1fr)`,
            severity: "error"
        };
    }

    return { isValid: true };
}

/**
 * Validate z-index value
 * Accepts CSS keywords or numeric values
 */
export function validateZIndex(value: string | null | undefined): NumericValidationResult {
    if (isEmpty(value)) {
        return { isValid: true };
    }

    const trimmed = value!.trim();
    const trimmedLower = trimmed.toLowerCase();

    // Check if it's a keyword
    if (CSS_KEYWORDS.zIndex.includes(trimmedLower)) {
        return { isValid: true, isKeyword: true };
    }

    // Try to parse as number
    const numValue = parseInt(trimmed, 10);
    if (isNaN(numValue)) {
        return {
            isValid: false,
            error: `Z-index must be a number or one of: ${CSS_KEYWORDS.zIndex.join(", ")}`,
            severity: "error"
        };
    }

    return {
        isValid: true,
        isKeyword: false,
        numericValue: numValue
    };
}

/**
 * Validate coordinate value for grid placement
 * Internal helper function
 */
function isValidCoordinate(value: string | null | undefined): boolean {
    if (isEmpty(value) || value === "auto") {
        return true;
    }

    const trimmed = value!.trim();

    // Check for negative numbers
    if (trimmed.startsWith("-")) {
        const num = parseInt(trimmed.substring(1), 10);
        return !isNaN(num) && num > 0;
    }

    // Check for positive numbers
    const num = parseInt(trimmed, 10);
    return !isNaN(num) && num > 0;
}

/**
 * Validate span value for grid placement
 * Internal helper function
 */
function isValidSpanValue(value: string | null | undefined): boolean {
    if (isEmpty(value) || value === "auto") {
        return true;
    }

    const trimmed = value!.trim();

    // Check for "span N" format
    if (trimmed.startsWith("span ")) {
        const numPart = trimmed.substring(5).trim();
        const num = parseInt(numPart, 10);
        return !isNaN(num) && num > 0;
    }

    // Check for plain number
    const num = parseInt(trimmed, 10);
    return !isNaN(num) && num > 0;
}

/**
 * Validate area name
 * Internal helper function
 */
function isValidAreaName(name: string | null | undefined): boolean {
    if (isEmpty(name) || name === ".") {
        return true;
    }

    const trimmed = name!.trim();

    // Must start with a letter
    const firstChar = trimmed.charCodeAt(0);
    if (
        !(
            (firstChar >= CHAR_CODES.UPPERCASE_A && firstChar <= CHAR_CODES.UPPERCASE_Z) ||
            (firstChar >= CHAR_CODES.LOWERCASE_A && firstChar <= CHAR_CODES.LOWERCASE_Z)
        )
    ) {
        return false;
    }

    // Check remaining characters
    for (let i = 1; i < trimmed.length; i++) {
        const charCode = trimmed.charCodeAt(i);
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

/**
 * Validate grid template areas format
 */
export function validateGridTemplateAreas(
    areas: string | null | undefined,
    isRequired = false
): { valid: boolean; lines?: string[][]; error?: string } {
    if (isEmpty(areas)) {
        if (isRequired) {
            return {
                valid: false,
                error: "Grid Template Areas is required when 'Use Named Areas' is enabled"
            };
        }
        return { valid: true };
    }

    const trimmed = areas!.trim();

    // Check if the areas string contains quotes
    const hasQuotes = trimmed.includes('"') || trimmed.includes("'");

    if (!hasQuotes) {
        return {
            valid: false,
            error: 'Grid Template Areas must be in CSS format with quotes. Example:\n"header header header"\n"sidebar main aside"\n"footer footer footer"'
        };
    }

    // Parse quoted format
    const quotedLines: string[] = [];
    const quoteChar = trimmed.includes('"') ? '"' : "'";
    let inQuote = false;
    let currentLine = "";

    for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];
        if (char === quoteChar) {
            if (inQuote) {
                if (currentLine.trim()) {
                    quotedLines.push(currentLine.trim());
                }
                currentLine = "";
                inQuote = false;
            } else {
                inQuote = true;
            }
        } else if (inQuote) {
            currentLine += char;
        }
    }

    if (quotedLines.length === 0) {
        return {
            valid: false,
            error: "No valid grid area lines found. Each line must be wrapped in quotes."
        };
    }

    // Parse each line into cells
    const rowCells: string[][] = [];
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
            rowCells.push(cells);
        }
    }

    // Check column counts
    const columnCounts = rowCells.map(row => row.length);
    const firstCount = columnCounts[0];

    if (!columnCounts.every(count => count === firstCount)) {
        return {
            valid: false,
            error: "All rows must have the same number of columns"
        };
    }

    // Validate area names
    for (const row of rowCells) {
        for (const cell of row) {
            if (cell !== "." && !isValidAreaName(cell)) {
                return {
                    valid: false,
                    error: `Invalid area name "${cell}". Must start with a letter and contain only letters, numbers, hyphens, and underscores.`
                };
            }
        }
    }

    return { valid: true, lines: rowCells };
}

/**
 * Validate item placement properties
 * Returns array of validation results
 */
export function validateItemPlacement(
    placementType: string | undefined,
    gridArea: string | undefined,
    columnStart: string | undefined,
    columnEnd: string | undefined,
    rowStart: string | undefined,
    rowEnd: string | undefined,
    useNamedAreas: boolean,
    definedAreas: Set<string>,
    context = ""
): ValidationResult[] {
    const results: ValidationResult[] = [];

    // If no placement type specified, assume auto (no validation needed)
    if (!placementType || placementType === "auto") {
        // Check for unused properties
        if (
            !isEmpty(gridArea) ||
            !isEmpty(columnStart) ||
            !isEmpty(columnEnd) ||
            !isEmpty(rowStart) ||
            !isEmpty(rowEnd)
        ) {
            results.push({
                isValid: true,
                info: `${context}All placement properties are ignored with 'Auto' placement`,
                severity: "warning"
            });
        }
        return results;
    }

    switch (placementType) {
        case "area":
            if (!useNamedAreas) {
                results.push({
                    isValid: false,
                    error: `${context}Cannot use 'Named Area' placement when 'Use Named Areas' is disabled`,
                    severity: "error"
                });
            } else if (isEmpty(gridArea)) {
                results.push({
                    isValid: false,
                    error: `${context}Grid Area is required for area placement`,
                    severity: "error"
                });
            } else if (!isValidAreaName(gridArea)) {
                results.push({
                    isValid: false,
                    error: `${context}Invalid area name "${gridArea}"`,
                    severity: "error"
                });
            } else if (!definedAreas.has(gridArea!.trim())) {
                results.push({
                    isValid: true,
                    info: `${context}Area "${gridArea}" not defined. Available: ${Array.from(definedAreas).join(", ")}`,
                    severity: "warning"
                });
            }

            // Check for unused properties
            if (!isEmpty(columnStart) || !isEmpty(columnEnd) || !isEmpty(rowStart) || !isEmpty(rowEnd)) {
                results.push({
                    isValid: true,
                    info: `${context}Column/Row properties are ignored with area placement`,
                    severity: "warning"
                });
            }
            break;

        case "coordinates":
            if (!isEmpty(columnStart) && !isValidCoordinate(columnStart)) {
                results.push({
                    isValid: false,
                    error: `${context}Invalid column start: must be auto, positive/negative number`,
                    severity: "error"
                });
            }
            if (!isEmpty(columnEnd) && !isValidCoordinate(columnEnd)) {
                results.push({
                    isValid: false,
                    error: `${context}Invalid column end: must be auto, positive/negative number`,
                    severity: "error"
                });
            }
            if (!isEmpty(rowStart) && !isValidCoordinate(rowStart)) {
                results.push({
                    isValid: false,
                    error: `${context}Invalid row start: must be auto, positive/negative number`,
                    severity: "error"
                });
            }
            if (!isEmpty(rowEnd) && !isValidCoordinate(rowEnd)) {
                results.push({
                    isValid: false,
                    error: `${context}Invalid row end: must be auto, positive/negative number`,
                    severity: "error"
                });
            }

            if (!isEmpty(gridArea)) {
                results.push({
                    isValid: true,
                    info: `${context}Grid Area is ignored with coordinate placement`,
                    severity: "warning"
                });
            }
            break;

        case "span":
            if (!isEmpty(columnStart) && !isValidSpanValue(columnStart)) {
                results.push({
                    isValid: false,
                    error: `${context}Invalid column span: must be auto, number, or 'span N'`,
                    severity: "error"
                });
            }
            if (!isEmpty(rowStart) && !isValidSpanValue(rowStart)) {
                results.push({
                    isValid: false,
                    error: `${context}Invalid row span: must be auto, number, or 'span N'`,
                    severity: "error"
                });
            }

            if (!isEmpty(columnEnd) || !isEmpty(rowEnd) || !isEmpty(gridArea)) {
                results.push({
                    isValid: true,
                    info: `${context}End properties and Grid Area are ignored with span placement`,
                    severity: "warning"
                });
            }
            break;
    }

    return results;
}
