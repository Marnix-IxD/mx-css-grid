/**
 * String Utility Functions
 *
 * Centralized string manipulation utilities for the CSS Grid widget.
 * Ensures consistent behavior across all components.
 */

/**
 * Normalizes empty strings to undefined
 * This prevents empty strings from creating invalid CSS
 *
 * @param value - String value to normalize
 * @returns Normalized value or undefined
 */
export function normalizeValue(value: string | undefined): string | undefined {
    if (!value || value.trim() === "") {
        return undefined;
    }
    return value;
}

/**
 * Checks if a string value is considered empty for CSS purposes
 *
 * @param value - Value to check
 * @returns True if the value is empty, null, undefined, or whitespace-only
 */
export function isEmpty(value: string | null | undefined): boolean {
    return !value || value.trim() === "";
}

/**
 * Safely trims a string value, handling null/undefined
 *
 * @param value - Value to trim
 * @returns Trimmed string or empty string if input was null/undefined
 */
export function safeTrim(value: string | null | undefined): string {
    return (value || "").trim();
}

/**
 * Generic delimiter-based parsing utility
 * Supports nested structures and respects parentheses/brackets
 *
 * @param input - String to parse
 * @param delimiter - Delimiter to split on (usually space or comma)
 * @param options - Parsing options
 * @returns Array of parsed parts
 */
export function parseByDelimiter(
    input: string,
    delimiter: string,
    options: {
        respectNesting?: boolean;
        trim?: boolean;
    } = {}
): string[] {
    const { respectNesting = true, trim = true } = options;

    if (isEmpty(input)) {
        return [];
    }

    const parts: string[] = [];
    let current = "";
    let depth = 0;

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (respectNesting) {
            if (char === "(" || char === "[" || char === "{") {
                depth++;
            } else if (char === ")" || char === "]" || char === "}") {
                depth--;
            }
        }

        if (char === delimiter && depth === 0) {
            if (current.length > 0) {
                parts.push(trim ? current.trim() : current);
            }
            current = "";
        } else {
            current += char;
        }
    }

    if (current.length > 0) {
        parts.push(trim ? current.trim() : current);
    }

    return parts;
}

/**
 * Parses a CSS style string into an object
 * Handles both inline styles and CSS custom properties
 *
 * @param styleStr - CSS style string (e.g., "width: 100%; height: auto;")
 * @returns Object with CSS properties
 */
export function parseStyleString(styleStr: string): Record<string, string> {
    if (isEmpty(styleStr)) {
        return {};
    }

    const styles: Record<string, string> = {};
    const declarations = parseByDelimiter(styleStr, ";", { respectNesting: false });

    declarations.forEach(declaration => {
        const colonIndex = declaration.indexOf(":");
        if (colonIndex > 0) {
            const property = declaration.substring(0, colonIndex).trim();
            const value = declaration.substring(colonIndex + 1).trim();
            if (property && value) {
                styles[property] = value;
            }
        }
    });

    return styles;
}
