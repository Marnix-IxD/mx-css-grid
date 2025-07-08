import { CSSGridPreviewProps, ItemsPreviewType } from "../typings/CSSGridProps";
import { Properties, hidePropertiesIn, hidePropertyIn, hideNestedPropertiesIn, transformGroupsIntoTabs } from "@mendix/pluggable-widgets-tools";

/**
 * CSS Grid Editor Configuration
 * 
 * Provides validation, custom captions, and preview styling
 * for the Mendix Studio Pro property editor
 * 
 * Enhanced with container-level responsive validation
 */

// Type definitions for validation errors
interface ValidationError {
    property?: string;
    message: string;
    severity?: "error" | "warning" | "info";
}

// Type for the check function
type CheckFunction = (values: CSSGridPreviewProps) => ValidationError[];

// Type for the caption function
type CaptionFunction = (values: CSSGridPreviewProps) => string;

// Type for responsive properties that might exist on items
type ResponsiveProperties = {
    // XS breakpoint
    xsEnabled?: boolean;
    xsPlacementType?: string;
    xsGridArea?: string;
    xsColumnStart?: string;
    xsColumnEnd?: string;
    xsRowStart?: string;
    xsRowEnd?: string;
    
    // SM breakpoint
    smEnabled?: boolean;
    smPlacementType?: string;
    smGridArea?: string;
    smColumnStart?: string;
    smColumnEnd?: string;
    smRowStart?: string;
    smRowEnd?: string;
    
    // MD breakpoint
    mdEnabled?: boolean;
    mdPlacementType?: string;
    mdGridArea?: string;
    mdColumnStart?: string;
    mdColumnEnd?: string;
    mdRowStart?: string;
    mdRowEnd?: string;
    
    // LG breakpoint
    lgEnabled?: boolean;
    lgPlacementType?: string;
    lgGridArea?: string;
    lgColumnStart?: string;
    lgColumnEnd?: string;
    lgRowStart?: string;
    lgRowEnd?: string;
    
    // XL breakpoint
    xlEnabled?: boolean;
    xlPlacementType?: string;
    xlGridArea?: string;
    xlColumnStart?: string;
    xlColumnEnd?: string;
    xlRowStart?: string;
    xlRowEnd?: string;
    
    // XXL breakpoint
    xxlEnabled?: boolean;
    xxlPlacementType?: string;
    xxlGridArea?: string;
    xxlColumnStart?: string;
    xxlColumnEnd?: string;
    xxlRowStart?: string;
    xxlRowEnd?: string;
};

// Type for container responsive properties
type ResponsiveContainerProperties = {
    enableBreakpoints?: boolean;
    
    // Debug properties
    showGridLines?: boolean;
    showGridAreas?: boolean;
    showGridGaps?: boolean;
    
    // XS breakpoint
    xsEnabled?: boolean;
    xsColumns?: string;
    xsRows?: string;
    xsAreas?: string;
    xsGap?: string;
    xsRowGap?: string;
    xsColumnGap?: string;
    xsAutoFlow?: string;
    xsAutoRows?: string;
    xsAutoColumns?: string;
    xsJustifyItems?: string;
    xsAlignItems?: string;
    xsJustifyContent?: string;
    xsAlignContent?: string;
    xsMinHeight?: string;
    xsMaxHeight?: string;
    xsMinWidth?: string;
    xsMaxWidth?: string;
    
    // SM breakpoint
    smEnabled?: boolean;
    smColumns?: string;
    smRows?: string;
    smAreas?: string;
    smGap?: string;
    smRowGap?: string;
    smColumnGap?: string;
    smAutoFlow?: string;
    smAutoRows?: string;
    smAutoColumns?: string;
    smJustifyItems?: string;
    smAlignItems?: string;
    smJustifyContent?: string;
    smAlignContent?: string;
    smMinHeight?: string;
    smMaxHeight?: string;
    smMinWidth?: string;
    smMaxWidth?: string;
    
    // MD breakpoint
    mdEnabled?: boolean;
    mdColumns?: string;
    mdRows?: string;
    mdAreas?: string;
    mdGap?: string;
    mdRowGap?: string;
    mdColumnGap?: string;
    mdAutoFlow?: string;
    mdAutoRows?: string;
    mdAutoColumns?: string;
    mdJustifyItems?: string;
    mdAlignItems?: string;
    mdJustifyContent?: string;
    mdAlignContent?: string;
    mdMinHeight?: string;
    mdMaxHeight?: string;
    mdMinWidth?: string;
    mdMaxWidth?: string;
    
    // LG breakpoint
    lgEnabled?: boolean;
    lgColumns?: string;
    lgRows?: string;
    lgAreas?: string;
    lgGap?: string;
    lgRowGap?: string;
    lgColumnGap?: string;
    lgAutoFlow?: string;
    lgAutoRows?: string;
    lgAutoColumns?: string;
    lgJustifyItems?: string;
    lgAlignItems?: string;
    lgJustifyContent?: string;
    lgAlignContent?: string;
    lgMinHeight?: string;
    lgMaxHeight?: string;
    lgMinWidth?: string;
    lgMaxWidth?: string;
    
    // XL breakpoint
    xlEnabled?: boolean;
    xlColumns?: string;
    xlRows?: string;
    xlAreas?: string;
    xlGap?: string;
    xlRowGap?: string;
    xlColumnGap?: string;
    xlAutoFlow?: string;
    xlAutoRows?: string;
    xlAutoColumns?: string;
    xlJustifyItems?: string;
    xlAlignItems?: string;
    xlJustifyContent?: string;
    xlAlignContent?: string;
    xlMinHeight?: string;
    xlMaxHeight?: string;
    xlMinWidth?: string;
    xlMaxWidth?: string;
    
    // XXL breakpoint
    xxlEnabled?: boolean;
    xxlColumns?: string;
    xxlRows?: string;
    xxlAreas?: string;
    xxlGap?: string;
    xxlRowGap?: string;
    xxlColumnGap?: string;
    xxlAutoFlow?: string;
    xxlAutoRows?: string;
    xxlAutoColumns?: string;
    xxlJustifyItems?: string;
    xxlAlignItems?: string;
    xxlJustifyContent?: string;
    xxlAlignContent?: string;
    xxlMinHeight?: string;
    xxlMaxHeight?: string;
    xxlMinWidth?: string;
    xxlMaxWidth?: string;
};

// Use type intersection instead of interface extension
type ResponsiveItemPreview = ItemsPreviewType & ResponsiveProperties;
type ResponsiveContainerPreview = CSSGridPreviewProps & ResponsiveContainerProperties;

/**
 * Dynamically configure which properties are visible based on other property values
 * This significantly reduces UI clutter by showing only relevant options
 */
export function getProperties(
    values: CSSGridPreviewProps,
    defaultProperties: Properties
): Properties {
    // Start with default properties
    let properties = defaultProperties;

    // 1. Grid Layout conditional properties
    // REMOVED the hiding of gridTemplateColumns and gridTemplateRows when useNamedAreas is true
    // These are still needed to define the grid structure
    if (!values.useNamedAreas) {
        // When not using named areas, hide the areas property
        hidePropertyIn(properties, values, "gridTemplateAreas");
    }

    // 2. Grid spacing optimization - hide individual gaps if general gap is set
    if (values.gap && values.gap.trim() !== "") {
        hidePropertiesIn(properties, values, ["rowGap", "columnGap"] as Array<keyof CSSGridPreviewProps>);
    }

    // 3. Container breakpoint properties
    if (!values.enableBreakpoints) {
        // Hide all breakpoint-related properties
        const breakpointProps: Array<keyof CSSGridPreviewProps> = [
            "xsEnabled", "xsColumns", "xsRows", "xsAreas", "xsGap", "xsRowGap", "xsColumnGap",
            "xsAutoFlow", "xsAutoRows", "xsAutoColumns", "xsJustifyItems", "xsAlignItems",
            "xsJustifyContent", "xsAlignContent", "xsMinHeight", "xsMaxHeight", "xsMinWidth", "xsMaxWidth",
            
            "smEnabled", "smColumns", "smRows", "smAreas", "smGap", "smRowGap", "smColumnGap",
            "smAutoFlow", "smAutoRows", "smAutoColumns", "smJustifyItems", "smAlignItems",
            "smJustifyContent", "smAlignContent", "smMinHeight", "smMaxHeight", "smMinWidth", "smMaxWidth",
            
            "mdEnabled", "mdColumns", "mdRows", "mdAreas", "mdGap", "mdRowGap", "mdColumnGap",
            "mdAutoFlow", "mdAutoRows", "mdAutoColumns", "mdJustifyItems", "mdAlignItems",
            "mdJustifyContent", "mdAlignContent", "mdMinHeight", "mdMaxHeight", "mdMinWidth", "mdMaxWidth",
            
            "lgEnabled", "lgColumns", "lgRows", "lgAreas", "lgGap", "lgRowGap", "lgColumnGap",
            "lgAutoFlow", "lgAutoRows", "lgAutoColumns", "lgJustifyItems", "lgAlignItems",
            "lgJustifyContent", "lgAlignContent", "lgMinHeight", "lgMaxHeight", "lgMinWidth", "lgMaxWidth",
            
            "xlEnabled", "xlColumns", "xlRows", "xlAreas", "xlGap", "xlRowGap", "xlColumnGap",
            "xlAutoFlow", "xlAutoRows", "xlAutoColumns", "xlJustifyItems", "xlAlignItems",
            "xlJustifyContent", "xlAlignContent", "xlMinHeight", "xlMaxHeight", "xlMinWidth", "xlMaxWidth",
            
            "xxlEnabled", "xxlColumns", "xxlRows", "xxlAreas", "xxlGap", "xxlRowGap", "xxlColumnGap",
            "xxlAutoFlow", "xxlAutoRows", "xxlAutoColumns", "xxlJustifyItems", "xxlAlignItems",
            "xxlJustifyContent", "xxlAlignContent", "xxlMinHeight", "xxlMaxHeight", "xxlMinWidth", "xxlMaxWidth"
        ];
        
        hidePropertiesIn(properties, values, breakpointProps);
    } else {
        // Hide detailed breakpoint properties if the breakpoint is not enabled
        const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;
        
        breakpoints.forEach(bp => {
            const enabledKey = `${bp}Enabled` as keyof CSSGridPreviewProps;
            if (!values[enabledKey]) {
                const propsToHide: Array<keyof CSSGridPreviewProps> = [
                    `${bp}Columns`, `${bp}Rows`, `${bp}Areas`, `${bp}Gap`, `${bp}RowGap`, `${bp}ColumnGap`,
                    `${bp}AutoFlow`, `${bp}AutoRows`, `${bp}AutoColumns`, `${bp}JustifyItems`, `${bp}AlignItems`,
                    `${bp}JustifyContent`, `${bp}AlignContent`, `${bp}MinHeight`, `${bp}MaxHeight`, 
                    `${bp}MinWidth`, `${bp}MaxWidth`
                ] as Array<keyof CSSGridPreviewProps>;
                hidePropertiesIn(properties, values, propsToHide);
            } else {
                // If gap is set for this breakpoint, hide individual gaps
                const gapKey = `${bp}Gap` as keyof CSSGridPreviewProps;
                if (values[gapKey]) {
                    hidePropertiesIn(properties, values, [
                        `${bp}RowGap`, 
                        `${bp}ColumnGap`
                    ] as Array<keyof CSSGridPreviewProps>);
                }
                
                // Hide areas if not using named areas
                if (!values.useNamedAreas) {
                    hidePropertyIn(properties, values, `${bp}Areas` as keyof CSSGridPreviewProps);
                }
                // NOTE: We do NOT hide columns/rows when useNamedAreas is true
                // Both are needed to properly define the grid structure
            }
        });
    }

    // 4. Item-level conditional properties
    if (values.items && values.items.length > 0) {
        values.items.forEach((item, index) => {
            // Hide placement-specific properties based on placement type
            switch (item.placementType) {
                case "auto":
                    // Hide all placement properties for auto
                    hideNestedPropertiesIn(properties, values, "items", index, [
                        "gridArea", "columnStart", "columnEnd", "rowStart", "rowEnd"
                    ] as Array<keyof ItemsPreviewType>);
                    break;
                    
                case "area":
                    // Hide coordinate properties for area placement
                    hideNestedPropertiesIn(properties, values, "items", index, [
                        "columnStart", "columnEnd", "rowStart", "rowEnd"
                    ] as Array<keyof ItemsPreviewType>);
                    
                    // Hide grid area if not using named areas at container level
                    if (!values.useNamedAreas) {
                        hideNestedPropertiesIn(properties, values, "items", index, ["gridArea"] as Array<keyof ItemsPreviewType>);
                    }
                    break;
                    
                case "coordinates":
                    // Hide area property for coordinate placement
                    hideNestedPropertiesIn(properties, values, "items", index, ["gridArea"] as Array<keyof ItemsPreviewType>);
                    break;
                    
                case "span":
                    // Hide area and end properties for span placement
                    hideNestedPropertiesIn(properties, values, "items", index, [
                        "gridArea", "columnEnd", "rowEnd"
                    ] as Array<keyof ItemsPreviewType>);
                    break;
            }
            
            // Hide all responsive properties if not enabled for this item
            if (!item.enableResponsive) {
                const responsiveProps: Array<keyof ItemsPreviewType> = [
                    "xsEnabled", "xsPlacementType", "xsGridArea", "xsColumnStart", "xsColumnEnd", "xsRowStart", "xsRowEnd",
                    "smEnabled", "smPlacementType", "smGridArea", "smColumnStart", "smColumnEnd", "smRowStart", "smRowEnd",
                    "mdEnabled", "mdPlacementType", "mdGridArea", "mdColumnStart", "mdColumnEnd", "mdRowStart", "mdRowEnd",
                    "lgEnabled", "lgPlacementType", "lgGridArea", "lgColumnStart", "lgColumnEnd", "lgRowStart", "lgRowEnd",
                    "xlEnabled", "xlPlacementType", "xlGridArea", "xlColumnStart", "xlColumnEnd", "xlRowStart", "xlRowEnd",
                    "xxlEnabled", "xxlPlacementType", "xxlGridArea", "xxlColumnStart", "xxlColumnEnd", "xxlRowStart", "xxlRowEnd"
                ] as Array<keyof ItemsPreviewType>;
                
                hideNestedPropertiesIn(properties, values, "items", index, responsiveProps);
            } else {
                // Hide detailed responsive properties based on enabled breakpoints and placement types
                const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;
                
                breakpoints.forEach(bp => {
                    const enabledKey = `${bp}Enabled` as keyof ItemsPreviewType;
                    const placementTypeKey = `${bp}PlacementType` as keyof ItemsPreviewType;
                    
                    if (!item[enabledKey]) {
                        // Hide all properties for this breakpoint
                        const propsToHide: Array<keyof ItemsPreviewType> = [
                            `${bp}PlacementType`, `${bp}GridArea`, 
                            `${bp}ColumnStart`, `${bp}ColumnEnd`, 
                            `${bp}RowStart`, `${bp}RowEnd`
                        ] as Array<keyof ItemsPreviewType>;
                        hideNestedPropertiesIn(properties, values, "items", index, propsToHide);
                    } else {
                        // Hide properties based on placement type for this breakpoint
                        const placementType = item[placementTypeKey];
                        
                        switch (placementType) {
                            case "auto":
                                hideNestedPropertiesIn(properties, values, "items", index, [
                                    `${bp}GridArea`, `${bp}ColumnStart`, `${bp}ColumnEnd`, 
                                    `${bp}RowStart`, `${bp}RowEnd`
                                ] as Array<keyof ItemsPreviewType>);
                                break;
                                
                            case "area":
                                hideNestedPropertiesIn(properties, values, "items", index, [
                                    `${bp}ColumnStart`, `${bp}ColumnEnd`, 
                                    `${bp}RowStart`, `${bp}RowEnd`
                                ] as Array<keyof ItemsPreviewType>);
                                
                                // Hide area if container doesn't use named areas
                                if (!values.useNamedAreas) {
                                    hideNestedPropertiesIn(properties, values, "items", index, [
                                        `${bp}GridArea`
                                    ] as Array<keyof ItemsPreviewType>);
                                }
                                break;
                                
                            case "coordinates":
                                hideNestedPropertiesIn(properties, values, "items", index, [
                                    `${bp}GridArea`
                                ] as Array<keyof ItemsPreviewType>);
                                break;
                                
                            case "span":
                                hideNestedPropertiesIn(properties, values, "items", index, [
                                    `${bp}GridArea`, `${bp}ColumnEnd`, `${bp}RowEnd`
                                ] as Array<keyof ItemsPreviewType>);
                                break;
                        }
                    }
                });
            }
        });
    }

    // 5. Performance properties
    if (!values.enableVirtualization) {
        hidePropertyIn(properties, values, "virtualizeThreshold");
    }

    // 6. Debug properties - only show relevant ones
    const debugValues = values as ResponsiveContainerPreview;
    if (!debugValues.useNamedAreas) {
        hidePropertyIn(properties, debugValues, "showGridAreas" as keyof ResponsiveContainerPreview);
    }

    // 7. Transform property groups into tabs for better organization
    // This makes the property panel much more manageable
    transformGroupsIntoTabs(properties);

    return properties;
}

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
 * Validate CSS grid template areas format
 * Now expects standard CSS format with quotes
 * 
 * @param areas - Grid template areas string
 * @returns true if valid, false otherwise
 */
function validateGridTemplateAreas(areas: string): { valid: boolean; lines?: string[][]; error?: string } {
    if (!areas || areas.trim() === "") {
        return { valid: false, error: "Grid Template Areas cannot be empty" };
    }

    // Check if the areas string contains quotes (standard CSS format)
    const hasQuotes = areas.includes('"') || areas.includes("'");
    
    if (!hasQuotes) {
        return { 
            valid: false, 
            error: "Grid Template Areas must be in CSS format with quotes. Example:\n\"header header header\"\n\"sidebar main aside\"\n\"footer footer footer\"" 
        };
    }

    // Parse quoted format
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
    
    if (quotedLines.length === 0) {
        return { valid: false, error: "No valid grid area lines found. Each line must be wrapped in quotes." };
    }

    // Parse each line into cells
    const rowCells: string[][] = [];
    for (const line of quotedLines) {
        const cells = line.trim().split(/\s+/);
        if (cells.length > 0) {
            rowCells.push(cells);
        }
    }
    
    // Check column counts
    const columnCounts = rowCells.map(row => row.length);
    const firstCount = columnCounts[0];
    
    if (!columnCounts.every(count => count === firstCount)) {
        return { valid: false, error: "All rows must have the same number of columns" };
    }
    
    return { valid: true, lines: rowCells };
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
    const containerValues = values as ResponsiveContainerPreview;
    
    // Validate grid template based on useNamedAreas
    if (values.useNamedAreas) {
        // Validate grid template areas
        if (!values.gridTemplateAreas || values.gridTemplateAreas.trim() === "") {
            errors.push({
                property: "gridTemplateAreas",
                severity: "error",
                message: "Grid Template Areas is required when 'Use Named Areas' is enabled. Enter your grid areas in CSS format with quotes."
            });
        } else {
            // Validate grid template areas format
            const validation = validateGridTemplateAreas(values.gridTemplateAreas);
            
            if (!validation.valid) {
                errors.push({
                    property: "gridTemplateAreas",
                    severity: "error",
                    message: validation.error || "Invalid grid template areas format"
                });
            } else if (validation.lines) {
                // Validate area names
                const invalidAreas: string[] = [];
                const allAreas = validation.lines.flat();
                const uniqueAreas = new Set<string>();
                
                for (const area of allAreas) {
                    if (area !== ".") {
                        uniqueAreas.add(area);
                        if (!isValidAreaName(area)) {
                            invalidAreas.push(area);
                        }
                    }
                }
                
                if (invalidAreas.length > 0) {
                    errors.push({
                        property: "gridTemplateAreas",
                        severity: "error",
                        message: `Invalid area names: ${invalidAreas.join(", ")}. Area names must start with a letter and contain only letters, numbers, hyphens, and underscores.`
                    });
                }
                
                // Check items using areas
                const definedAreas = Array.from(uniqueAreas);
                values.items?.forEach((item, index) => {
                    if (item.placementType === "area" && item.gridArea && !definedAreas.includes(item.gridArea)) {
                        errors.push({
                            property: `items[${index}].gridArea`,
                            severity: "warning",
                            message: `Item ${index + 1}: Grid area "${item.gridArea}" is not defined in Grid Template Areas. Available areas: ${definedAreas.join(", ")}`
                        });
                    }
                });
            }
        }
        
        // Still validate columns and rows when using named areas
        if (!values.gridTemplateColumns || values.gridTemplateColumns.trim() === "") {
            errors.push({
                property: "gridTemplateColumns",
                severity: "warning",
                message: "Grid Template Columns is recommended even when using named areas to define the column structure"
            });
        }
        
        if (!values.gridTemplateRows || values.gridTemplateRows.trim() === "") {
            errors.push({
                property: "gridTemplateRows",
                severity: "info",
                message: "Grid Template Rows can be used with named areas to define row heights"
            });
        }
    } else {
        // Info message about ignoring grid template areas
        if (values.gridTemplateAreas) {
            errors.push({
                severity: "info",
                message: "Grid Template Areas is only used when 'Use Named Areas' is enabled. Enable it to use area-based placement."
            });
        }
        
        // Validate grid template columns
        if (!values.gridTemplateColumns || values.gridTemplateColumns.trim() === "") {
            errors.push({
                property: "gridTemplateColumns",
                severity: "error",
                message: "Grid Template Columns is required when not using named areas"
            });
        } else {
            // Validate grid template syntax
            if (!validateGridTemplateSyntax(values.gridTemplateColumns.trim())) {
                errors.push({
                    property: "gridTemplateColumns",
                    severity: "warning",
                    message: "Grid Template Columns may have invalid syntax. Example: '1fr 2fr 1fr' or 'repeat(3, 1fr)'"
                });
            }
        }
    }
    
    // Validate container responsive settings
    if (containerValues.enableBreakpoints) {
        const breakpointSizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;
        const breakpointLabels = {
            xs: 'Extra Small (<640px)',
            sm: 'Small (640-768px)',
            md: 'Medium (768-1024px)',
            lg: 'Large (1024-1440px)',
            xl: 'Extra Large (1440-1920px)',
            xxl: '2X Large (>1920px)'
        };
        
        let hasAnyBreakpoint = false;
        
        breakpointSizes.forEach(size => {
            const enabledKey = `${size}Enabled` as keyof ResponsiveContainerPreview;
            if (containerValues[enabledKey]) {
                hasAnyBreakpoint = true;
                
                const columnsKey = `${size}Columns` as keyof ResponsiveContainerPreview;
                const areasKey = `${size}Areas` as keyof ResponsiveContainerPreview;
                
                const columns = containerValues[columnsKey] as string | undefined;
                const areas = containerValues[areasKey] as string | undefined;
                
                // Validate columns syntax
                if (columns && !validateGridTemplateSyntax(columns)) {
                    errors.push({
                        property: columnsKey,
                        severity: "warning",
                        message: `${breakpointLabels[size]}: Grid columns may have invalid syntax`
                    });
                }
                
                // Validate areas if using named areas
                if (values.useNamedAreas && areas) {
                    const validation = validateGridTemplateAreas(areas);
                    if (!validation.valid) {
                        errors.push({
                            property: areasKey,
                            severity: "error",
                            message: `${breakpointLabels[size]}: ${validation.error}`
                        });
                    }
                } else if (!values.useNamedAreas && areas) {
                    errors.push({
                        severity: "info",
                        message: `${breakpointLabels[size]}: Template areas property is ignored when 'Use Named Areas' is disabled`
                    });
                }
                
                // When using named areas, columns and rows are still recommended
                if (values.useNamedAreas && !columns) {
                    errors.push({
                        property: columnsKey,
                        severity: "info",
                        message: `${breakpointLabels[size]}: Consider defining grid columns even when using named areas to control column sizes`
                    });
                }
            }
        });
        
        if (!hasAnyBreakpoint) {
            errors.push({
                severity: "info",
                message: "Responsive grid is enabled but no breakpoints are configured. Enable at least one breakpoint size."
            });
        }
    }
    
    // Validate items
    values.items?.forEach((item, index) => {
        const responsiveItem = item as ResponsiveItemPreview;
        
        // Validate area placement
        if (responsiveItem.placementType === "area") {
            if (!values.useNamedAreas) {
                errors.push({
                    property: `items[${index}].placementType`,
                    severity: "error",
                    message: `Item ${index + 1}: Cannot use 'Named Area' placement when 'Use Named Areas' is disabled. Enable 'Use Named Areas' or choose a different placement type.`
                });
            } else if (!responsiveItem.gridArea || responsiveItem.gridArea.trim() === "") {
                errors.push({
                    property: `items[${index}].gridArea`,
                    severity: "error",
                    message: `Item ${index + 1}: Grid Area is required when placement type is 'Named Area'`
                });
            } else if (!isValidAreaName(responsiveItem.gridArea.trim())) {
                errors.push({
                    property: `items[${index}].gridArea`,
                    severity: "error",
                    message: `Item ${index + 1}: Invalid grid area name "${responsiveItem.gridArea}"`
                });
            }
            
            // Info about unused properties
            if (responsiveItem.columnStart !== "auto" || responsiveItem.columnEnd !== "auto" || responsiveItem.rowStart !== "auto" || responsiveItem.rowEnd !== "auto") {
                errors.push({
                    severity: "info",
                    message: `Item ${index + 1}: Column/Row Start/End properties are ignored when using 'Named Area' placement`
                });
            }
        }
        
        // Validate coordinate placement
        if (responsiveItem.placementType === "coordinates") {
            if (responsiveItem.columnStart && !isValidCoordinate(responsiveItem.columnStart.trim())) {
                errors.push({
                    property: `items[${index}].columnStart`,
                    severity: "error",
                    message: `Item ${index + 1}: Column Start must be 'auto', a positive number, or a negative number (e.g., 1, -1)`
                });
            }
            if (responsiveItem.columnEnd && !isValidCoordinate(responsiveItem.columnEnd.trim())) {
                errors.push({
                    property: `items[${index}].columnEnd`,
                    severity: "error",
                    message: `Item ${index + 1}: Column End must be 'auto', a positive number, or a negative number`
                });
            }
            if (responsiveItem.rowStart && !isValidCoordinate(responsiveItem.rowStart.trim())) {
                errors.push({
                    property: `items[${index}].rowStart`,
                    severity: "error",
                    message: `Item ${index + 1}: Row Start must be 'auto', a positive number, or a negative number`
                });
            }
            if (responsiveItem.rowEnd && !isValidCoordinate(responsiveItem.rowEnd.trim())) {
                errors.push({
                    property: `items[${index}].rowEnd`,
                    severity: "error",
                    message: `Item ${index + 1}: Row End must be 'auto', a positive number, or a negative number`
                });
            }
            
            // Info about unused properties
            if (responsiveItem.gridArea) {
                errors.push({
                    severity: "info",
                    message: `Item ${index + 1}: Grid Area property is ignored when using 'Coordinates' placement`
                });
            }
        }
        
        // Validate span placement
        if (responsiveItem.placementType === "span") {
            if (responsiveItem.columnStart && !isValidSpanValue(responsiveItem.columnStart.trim())) {
                errors.push({
                    property: `items[${index}].columnStart`,
                    severity: "error",
                    message: `Item ${index + 1}: Column Start must be 'auto', a number, or 'span N' format (e.g., 'span 2')`
                });
            }
            if (responsiveItem.rowStart && !isValidSpanValue(responsiveItem.rowStart.trim())) {
                errors.push({
                    property: `items[${index}].rowStart`,
                    severity: "error",
                    message: `Item ${index + 1}: Row Start must be 'auto', a number, or 'span N' format`
                });
            }
            
            // Info about unused properties
            if (responsiveItem.columnEnd !== "auto" || responsiveItem.rowEnd !== "auto") {
                errors.push({
                    severity: "info",
                    message: `Item ${index + 1}: Column/Row End properties are ignored when using 'Span' placement`
                });
            }
            if (responsiveItem.gridArea) {
                errors.push({
                    severity: "info",
                    message: `Item ${index + 1}: Grid Area property is ignored when using 'Span' placement`
                });
            }
        }
        
        // Validate auto placement
        if (responsiveItem.placementType === "auto") {
            // Info about unused properties
            if (responsiveItem.gridArea || responsiveItem.columnStart !== "auto" || responsiveItem.columnEnd !== "auto" || 
                responsiveItem.rowStart !== "auto" || responsiveItem.rowEnd !== "auto") {
                errors.push({
                    severity: "info",
                    message: `Item ${index + 1}: All placement properties are ignored when using 'Auto' placement. Items will be placed according to the grid's Auto Flow setting.`
                });
            }
        }
        
        // Validate z-index
        if (responsiveItem.zIndex !== null && responsiveItem.zIndex !== undefined) {
            if (responsiveItem.zIndex < -999 || responsiveItem.zIndex > 999) {
                errors.push({
                    property: `items[${index}].zIndex`,
                    severity: "warning",
                    message: `Item ${index + 1}: Z-index should be between -999 and 999 for best compatibility`
                });
            }
        }

        // Validate responsive settings for items
        const breakpointSizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;
        const breakpointLabels = {
            xs: 'Extra Small (<640px)',
            sm: 'Small (640-768px)',
            md: 'Medium (768-1024px)',
            lg: 'Large (1024-1440px)',
            xl: 'Extra Large (1440-1920px)',
            xxl: '2X Large (>1920px)'
        };
        
        if (responsiveItem.enableResponsive) {
            let hasAnyBreakpoint = false;
            
            breakpointSizes.forEach(size => {
                const enabledKey = `${size}Enabled` as keyof ResponsiveItemPreview;
                if (responsiveItem[enabledKey]) {
                    hasAnyBreakpoint = true;
                    
                    const placementTypeKey = `${size}PlacementType` as keyof ResponsiveItemPreview;
                    const placementType = responsiveItem[placementTypeKey] as string;
                    
                    // Validate placement for this breakpoint
                    if (placementType === "area") {
                        const areaKey = `${size}GridArea` as keyof ResponsiveItemPreview;
                        if (!values.useNamedAreas) {
                            errors.push({
                                property: `items[${index}].${placementTypeKey}`,
                                severity: "error",
                                message: `Item ${index + 1} ${breakpointLabels[size]}: Cannot use 'Named Area' placement when 'Use Named Areas' is disabled`
                            });
                        } else if (!responsiveItem[areaKey] || (responsiveItem[areaKey] as string).trim() === "") {
                            errors.push({
                                property: `items[${index}].${areaKey}`,
                                severity: "error",
                                message: `Item ${index + 1} ${breakpointLabels[size]}: Grid area is required when using area placement`
                            });
                        }
                    } else if (placementType === "coordinates") {
                        const colStartKey = `${size}ColumnStart` as keyof ResponsiveItemPreview;
                        const colEndKey = `${size}ColumnEnd` as keyof ResponsiveItemPreview;
                        const rowStartKey = `${size}RowStart` as keyof ResponsiveItemPreview;
                        const rowEndKey = `${size}RowEnd` as keyof ResponsiveItemPreview;
                        
                        const colStart = responsiveItem[colStartKey] as string | undefined;
                        const colEnd = responsiveItem[colEndKey] as string | undefined;
                        const rowStart = responsiveItem[rowStartKey] as string | undefined;
                        const rowEnd = responsiveItem[rowEndKey] as string | undefined;
                        
                        if (colStart && !isValidCoordinate(colStart.trim())) {
                            errors.push({
                                property: `items[${index}].${colStartKey}`,
                                severity: "error",
                                message: `Item ${index + 1} ${breakpointLabels[size]}: Invalid column start value`
                            });
                        }
                        if (colEnd && !isValidCoordinate(colEnd.trim())) {
                            errors.push({
                                property: `items[${index}].${colEndKey}`,
                                severity: "error",
                                message: `Item ${index + 1} ${breakpointLabels[size]}: Invalid column end value`
                            });
                        }
                        if (rowStart && !isValidCoordinate(rowStart.trim())) {
                            errors.push({
                                property: `items[${index}].${rowStartKey}`,
                                severity: "error",
                                message: `Item ${index + 1} ${breakpointLabels[size]}: Invalid row start value`
                            });
                        }
                        if (rowEnd && !isValidCoordinate(rowEnd.trim())) {
                            errors.push({
                                property: `items[${index}].${rowEndKey}`,
                                severity: "error",
                                message: `Item ${index + 1} ${breakpointLabels[size]}: Invalid row end value`
                            });
                        }
                    } else if (placementType === "span") {
                        const colStartKey = `${size}ColumnStart` as keyof ResponsiveItemPreview;
                        const rowStartKey = `${size}RowStart` as keyof ResponsiveItemPreview;
                        
                        const colStart = responsiveItem[colStartKey] as string | undefined;
                        const rowStart = responsiveItem[rowStartKey] as string | undefined;
                        
                        if (colStart && !isValidSpanValue(colStart.trim())) {
                            errors.push({
                                property: `items[${index}].${colStartKey}`,
                                severity: "error",
                                message: `Item ${index + 1} ${breakpointLabels[size]}: Invalid column span value`
                            });
                        }
                        if (rowStart && !isValidSpanValue(rowStart.trim())) {
                            errors.push({
                                property: `items[${index}].${rowStartKey}`,
                                severity: "error",
                                message: `Item ${index + 1} ${breakpointLabels[size]}: Invalid row span value`
                            });
                        }
                    }
                }
            });
            
            if (!hasAnyBreakpoint) {
                errors.push({
                    severity: "info",
                    message: `Item ${index + 1}: Responsive placement is enabled but no breakpoints are configured. Enable at least one breakpoint size.`
                });
            }
        }
    });
    
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
    } else if (!values.enableVirtualization && values.virtualizeThreshold && values.virtualizeThreshold !== 100) {
        errors.push({
            severity: "info",
            message: "Virtualization threshold is configured but virtualization is not enabled. Enable 'Enable Virtualization' to use it."
        });
    }
    
    // General tips based on configuration
    if (values.items.length === 0) {
        errors.push({
            severity: "info",
            message: "No grid items configured. Add items to the grid to see your layout."
        });
    }
    
    if (values.items.length > 50 && !values.enableVirtualization) {
        errors.push({
            severity: "info",
            message: `You have ${values.items.length} items. Consider enabling virtualization for better performance.`
        });
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
    const containerValues = values as ResponsiveContainerPreview;
    
    // Build caption parts
    const parts: string[] = [];
    
    if (values.useNamedAreas) {
        const areaCount = values.gridTemplateAreas ? 
            values.gridTemplateAreas.split('\n').filter(line => line.trim()).length : 0;
        parts.push(`Grid (${areaCount} areas)`);
    } else {
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
        const rows = (values.gridTemplateRows || "auto").split(/\s+/).filter(s => s.trim()).length;
        
        parts.push(`Grid (${columns}×${rows})`);
    }
    
    if (values.items.length > 0) {
        const responsiveItems = values.items.filter(item => item.enableResponsive).length;
        if (responsiveItems > 0) {
            parts.push(`${values.items.length} items (${responsiveItems} responsive)`);
        } else {
            parts.push(`${values.items.length} items`);
        }
    }
    
    if (containerValues.enableBreakpoints) {
        const breakpointCount = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'].filter(size => {
            const key = `${size}Enabled` as keyof ResponsiveContainerPreview;
            return containerValues[key];
        }).length;
        
        if (breakpointCount > 0) {
            parts.push(`${breakpointCount} breakpoints`);
        }
    }
    
    return parts.join(" - ");
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