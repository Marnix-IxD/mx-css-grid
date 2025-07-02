import { CSSGridPreviewProps, ItemsPreviewType } from "../typings/CSSGridProps";

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
    
    // XS breakpoint
    xsEnabled?: boolean;
    xsColumns?: string;
    xsRows?: string;
    xsAreas?: string;
    xsGap?: string;
    
    // SM breakpoint
    smEnabled?: boolean;
    smColumns?: string;
    smRows?: string;
    smAreas?: string;
    smGap?: string;
    
    // MD breakpoint
    mdEnabled?: boolean;
    mdColumns?: string;
    mdRows?: string;
    mdAreas?: string;
    mdGap?: string;
    
    // LG breakpoint
    lgEnabled?: boolean;
    lgColumns?: string;
    lgRows?: string;
    lgAreas?: string;
    lgGap?: string;
    
    // XL breakpoint
    xlEnabled?: boolean;
    xlColumns?: string;
    xlRows?: string;
    xlAreas?: string;
    xlGap?: string;
    
    // XXL breakpoint
    xxlEnabled?: boolean;
    xxlColumns?: string;
    xxlRows?: string;
    xxlAreas?: string;
    xxlGap?: string;
};

// Use type intersection instead of interface extension
type ResponsiveItemPreview = ItemsPreviewType & ResponsiveProperties;
type ResponsiveContainerPreview = CSSGridPreviewProps & ResponsiveContainerProperties;

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
    const containerValues = values as ResponsiveContainerPreview;
    
    // Validate grid template based on useNamedAreas
    if (values.useNamedAreas) {
        // Info message about using named areas
        if (values.gridTemplateColumns || values.gridTemplateRows) {
            errors.push({
                severity: "info",
                message: "When using named areas, Grid Template Columns and Rows are defined implicitly by the Grid Template Areas. These properties will be ignored."
            });
        }
        
        // Validate grid template areas
        if (!values.gridTemplateAreas || values.gridTemplateAreas.trim() === "") {
            errors.push({
                property: "gridTemplateAreas",
                severity: "error",
                message: "Grid Template Areas is required when 'Use Named Areas' is enabled. Define your grid areas or disable 'Use Named Areas' to use column/row templates."
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
                    const areaLines = areas.split('\n').filter(line => line.trim());
                    if (areaLines.length === 0) {
                        errors.push({
                            property: areasKey,
                            severity: "warning",
                            message: `${breakpointLabels[size]}: Template areas should not be empty when using named areas`
                        });
                    }
                } else if (!values.useNamedAreas && areas) {
                    errors.push({
                        severity: "info",
                        message: `${breakpointLabels[size]}: Template areas property is ignored when 'Use Named Areas' is disabled`
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