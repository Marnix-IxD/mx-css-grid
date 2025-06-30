/**
 * Grid Item Utility Functions
 * 
 * Shared utilities for working with grid items across different components
 */

/**
 * Get a user-friendly display name for a grid item
 * 
 * @param item - The grid item object
 * @param index - The item's index in the items array
 * @returns A display name for the item
 */
export function getItemDisplayName(item: any, index: number): string {
    // Use custom name if provided
    if (item.itemName && item.itemName.trim()) {
        return item.itemName;
    }
    // Fall back to area name if using areas
    if (item.placementType === "area" && item.gridArea) {
        return item.gridArea;
    }
    // Default to numbered item
    return `Item ${index + 1}`;
}

/**
 * Get a caption for a grid item (used in Selectable component)
 * 
 * @param item - The grid item object
 * @param index - The item's index
 * @returns A descriptive caption for the item
 */
export function getItemCaption(item: any, index: number): string {
    const name = getItemDisplayName(item, index);
    const widgetCount = item.content?.widgetCount || 0;
    const widgetText = `${widgetCount} widget${widgetCount !== 1 ? 's' : ''}`;
    
    if (item.itemName) {
        return `${name} - ${widgetText}`;
    }
    
    if (item.placementType === "area" && item.gridArea) {
        return `${name} (${widgetText})`;
    }
    
    return name;
}

/**
 * Get placement display text for a grid item
 * 
 * @param item - The grid item object
 * @param placement - The calculated placement information
 * @returns A string describing the item's placement
 */
export function getPlacementDisplayText(
    item: any, 
    placement: { colStart: number; colEnd: number; rowStart: number; rowEnd: number }
): string {
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

/**
 * Calculate grid item placement based on its configuration
 * 
 * @param item - The grid item object
 * @param index - The item's index
 * @param gridCells - The parsed grid areas (if using named areas)
 * @param columnCount - Number of columns in the grid
 * @returns Placement information including grid positioning
 */
export function calculateItemPlacement(
    item: any, 
    index: number,
    gridCells: string[][],
    columnCount: number,
    useNamedAreas: boolean
): {
    gridArea?: string;
    gridColumn?: string;
    gridRow?: string;
    colStart: number;
    colEnd: number;
    rowStart: number;
    rowEnd: number;
} {
    const placement: {
        gridArea?: string;
        gridColumn?: string;
        gridRow?: string;
        colStart: number;
        colEnd: number;
        rowStart: number;
        rowEnd: number;
    } = {
        colStart: 1,
        colEnd: 2,
        rowStart: 1,
        rowEnd: 2
    };

    if (item.placementType === "area" && item.gridArea && useNamedAreas) {
        placement.gridArea = item.gridArea;
        
        // Find the area bounds in the grid
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
    } else if (item.placementType === "coordinates") {
        placement.colStart = parseInt(item.columnStart) || 1;
        placement.colEnd = parseInt(item.columnEnd) || placement.colStart + 1;
        placement.rowStart = parseInt(item.rowStart) || 1;
        placement.rowEnd = parseInt(item.rowEnd) || placement.rowStart + 1;
        placement.gridColumn = `${placement.colStart} / ${placement.colEnd}`;
        placement.gridRow = `${placement.rowStart} / ${placement.rowEnd}`;
    } else if (item.placementType === "span") {
        placement.gridColumn = item.columnStart || "auto";
        placement.gridRow = item.rowStart || "auto";
    } else {
        // Auto placement - calculate based on index
        const col = (index % columnCount) + 1;
        const row = Math.floor(index / columnCount) + 1;
        placement.colStart = col;
        placement.colEnd = col + 1;
        placement.rowStart = row;
        placement.rowEnd = row + 1;
    }

    return placement;
}

/**
 * Check if a grid item shares a row with any other items
 * 
 * @param itemIndex - Index of the item to check
 * @param items - All grid items
 * @param calculatePlacement - Function to calculate item placement
 * @returns True if the item shares a row with others
 */
export function isItemInlineWithOthers(
    itemIndex: number,
    items: any[],
    calculatePlacement: (item: any, index: number) => { rowStart: number; rowEnd: number }
): boolean {
    const placement = calculatePlacement(items[itemIndex], itemIndex);
    
    return items.some((otherItem, otherIndex) => {
        if (otherIndex === itemIndex) return false;
        const otherPlacement = calculatePlacement(otherItem, otherIndex);
        return (
            (placement.rowStart === otherPlacement.rowStart && 
             placement.rowEnd === otherPlacement.rowEnd) ||
            (placement.rowStart < otherPlacement.rowEnd && 
             placement.rowEnd > otherPlacement.rowStart)
        );
    });
}

/**
 * Get color for a grid area
 * 
 * @param area - Area name
 * @returns Hex color string
 */
export function getAreaColor(area: string): string {
    if (area === ".") return "#ffffff";
    
    const colors = [
        "#e3f2fd", "#f3e5f5", "#e8f5e9", "#fff3e0", 
        "#fce4ec", "#e1f5fe", "#f1f8e9", "#fff8e1"
    ];
    
    const hash = area.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}