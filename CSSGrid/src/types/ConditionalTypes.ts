/**
 * Conditional Types for CSS Grid Widget
 *
 * These types extend the auto-generated types from CSSGridProps.d.ts
 * to handle properties that are conditionally available based on
 * the Mendix config API settings.
 *
 * When properties are hidden via the config API, they may be undefined
 * at runtime even though they have default values in the XML.
 */

import { ItemsType, ItemsPreviewType, CSSGridContainerProps, CSSGridPreviewProps } from "../../typings/CSSGridProps";

/**
 * Helper type to make specific properties optional
 */
type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Item responsive properties that are conditional on enableResponsive
 * These properties are hidden when enableResponsive is false
 */
type ConditionalItemResponsiveProps =
    | "xsHidden"
    | "xsEnabled"
    | "xsPlacementType"
    | "xsGridArea"
    | "xsColumnStart"
    | "xsColumnEnd"
    | "xsRowStart"
    | "xsRowEnd"
    | "smHidden"
    | "smEnabled"
    | "smPlacementType"
    | "smGridArea"
    | "smColumnStart"
    | "smColumnEnd"
    | "smRowStart"
    | "smRowEnd"
    | "mdHidden"
    | "mdEnabled"
    | "mdPlacementType"
    | "mdGridArea"
    | "mdColumnStart"
    | "mdColumnEnd"
    | "mdRowStart"
    | "mdRowEnd"
    | "lgHidden"
    | "lgEnabled"
    | "lgPlacementType"
    | "lgGridArea"
    | "lgColumnStart"
    | "lgColumnEnd"
    | "lgRowStart"
    | "lgRowEnd"
    | "xlHidden"
    | "xlEnabled"
    | "xlPlacementType"
    | "xlGridArea"
    | "xlColumnStart"
    | "xlColumnEnd"
    | "xlRowStart"
    | "xlRowEnd"
    | "xxlHidden"
    | "xxlEnabled"
    | "xxlPlacementType"
    | "xxlGridArea"
    | "xxlColumnStart"
    | "xxlColumnEnd"
    | "xxlRowStart"
    | "xxlRowEnd"
    | "xxxlHidden"
    | "xxxlEnabled"
    | "xxxlPlacementType"
    | "xxxlGridArea"
    | "xxxlColumnStart"
    | "xxxlColumnEnd"
    | "xxxlRowStart"
    | "xxxlRowEnd"
    | "xxxxlHidden"
    | "xxxxlEnabled"
    | "xxxxlPlacementType"
    | "xxxxlGridArea"
    | "xxxxlColumnStart"
    | "xxxxlColumnEnd"
    | "xxxxlRowStart"
    | "xxxxlRowEnd";

/**
 * Item placement properties that are conditional on placementType
 * - 'area' hides: columnStart, columnEnd, rowStart, rowEnd
 * - 'coordinates' hides: gridArea
 * - 'span' hides: gridArea, columnEnd, rowEnd
 * - 'auto' hides: all placement properties
 */
type ConditionalItemPlacementProps = "gridArea" | "columnStart" | "columnEnd" | "rowStart" | "rowEnd";

/**
 * Runtime type for grid items with conditional properties
 * Used in the main component where properties might be undefined
 */
export type RuntimeGridItem = MakeOptional<ItemsType, ConditionalItemResponsiveProps | ConditionalItemPlacementProps>;

/**
 * Preview type for grid items with conditional properties
 * Used in the editor preview component
 */
export type RuntimeGridItemPreview = MakeOptional<
    ItemsPreviewType,
    ConditionalItemResponsiveProps | ConditionalItemPlacementProps
>;

/**
 * Container responsive properties that are conditional on enableBreakpoints
 * These properties are hidden when enableBreakpoints is false
 */
type ConditionalContainerResponsiveProps =
    | "xsEnabled"
    | "xsColumns"
    | "xsRows"
    | "xsAreas"
    | "xsGap"
    | "xsRowGap"
    | "xsColumnGap"
    | "xsAutoFlow"
    | "xsAutoRows"
    | "xsAutoColumns"
    | "xsJustifyItems"
    | "xsAlignItems"
    | "xsJustifyContent"
    | "xsAlignContent"
    | "xsMinHeight"
    | "xsMaxHeight"
    | "xsMinWidth"
    | "xsMaxWidth"
    | "smEnabled"
    | "smColumns"
    | "smRows"
    | "smAreas"
    | "smGap"
    | "smRowGap"
    | "smColumnGap"
    | "smAutoFlow"
    | "smAutoRows"
    | "smAutoColumns"
    | "smJustifyItems"
    | "smAlignItems"
    | "smJustifyContent"
    | "smAlignContent"
    | "smMinHeight"
    | "smMaxHeight"
    | "smMinWidth"
    | "smMaxWidth"
    | "mdEnabled"
    | "mdColumns"
    | "mdRows"
    | "mdAreas"
    | "mdGap"
    | "mdRowGap"
    | "mdColumnGap"
    | "mdAutoFlow"
    | "mdAutoRows"
    | "mdAutoColumns"
    | "mdJustifyItems"
    | "mdAlignItems"
    | "mdJustifyContent"
    | "mdAlignContent"
    | "mdMinHeight"
    | "mdMaxHeight"
    | "mdMinWidth"
    | "mdMaxWidth"
    | "lgEnabled"
    | "lgColumns"
    | "lgRows"
    | "lgAreas"
    | "lgGap"
    | "lgRowGap"
    | "lgColumnGap"
    | "lgAutoFlow"
    | "lgAutoRows"
    | "lgAutoColumns"
    | "lgJustifyItems"
    | "lgAlignItems"
    | "lgJustifyContent"
    | "lgAlignContent"
    | "lgMinHeight"
    | "lgMaxHeight"
    | "lgMinWidth"
    | "lgMaxWidth"
    | "xlEnabled"
    | "xlColumns"
    | "xlRows"
    | "xlAreas"
    | "xlGap"
    | "xlRowGap"
    | "xlColumnGap"
    | "xlAutoFlow"
    | "xlAutoRows"
    | "xlAutoColumns"
    | "xlJustifyItems"
    | "xlAlignItems"
    | "xlJustifyContent"
    | "xlAlignContent"
    | "xlMinHeight"
    | "xlMaxHeight"
    | "xlMinWidth"
    | "xlMaxWidth"
    | "xxlEnabled"
    | "xxlColumns"
    | "xxlRows"
    | "xxlAreas"
    | "xxlGap"
    | "xxlRowGap"
    | "xxlColumnGap"
    | "xxlAutoFlow"
    | "xxlAutoRows"
    | "xxlAutoColumns"
    | "xxlJustifyItems"
    | "xxlAlignItems"
    | "xxlJustifyContent"
    | "xxlAlignContent"
    | "xxlMinHeight"
    | "xxlMaxHeight"
    | "xxlMinWidth"
    | "xxlMaxWidth";

/**
 * Container properties that are conditional on useNamedAreas
 * - gridTemplateAreas is hidden when useNamedAreas is false
 * - Individual breakpoint areas are hidden when useNamedAreas is false
 */
type ConditionalContainerAreaProps =
    | "gridTemplateAreas"
    | "xsAreas"
    | "smAreas"
    | "mdAreas"
    | "lgAreas"
    | "xlAreas"
    | "xxlAreas";

/**
 * Container properties that are conditional on gap settings
 * - rowGap and columnGap are hidden when gap is set
 */
type ConditionalContainerGapProps = "rowGap" | "columnGap";

/**
 * Container properties that are conditional on enableVirtualization
 */
type ConditionalContainerVirtualizationProps = "virtualizeThreshold";

/**
 * Runtime type for container with conditional properties
 */
export type RuntimeGridContainer = MakeOptional<
    CSSGridContainerProps,
    | ConditionalContainerResponsiveProps
    | ConditionalContainerAreaProps
    | ConditionalContainerGapProps
    | ConditionalContainerVirtualizationProps
>;

/**
 * Preview type for container with conditional properties
 */
export type RuntimeGridContainerPreview = MakeOptional<
    CSSGridPreviewProps,
    | ConditionalContainerResponsiveProps
    | ConditionalContainerAreaProps
    | ConditionalContainerGapProps
    | ConditionalContainerVirtualizationProps
>;

/**
 * Grid item placement configuration used in helper functions
 */
export interface GridItemPlacement {
    placementType: string;
    gridArea?: string;
    columnStart?: string;
    columnEnd?: string;
    rowStart?: string;
    rowEnd?: string;
}

/**
 * Breakpoint configuration for responsive behavior
 */
export interface BreakpointConfig {
    size: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
    minWidth: number;
    maxWidth?: number;
    label: string;
}

/**
 * Grid metrics for debug visualization
 */
export interface GridMetrics {
    tracks: {
        columns: number[];
        rows: number[];
    };
    gaps: {
        column: number;
        row: number;
    };
    containerBox: DOMRect | null;
    gridBox: DOMRect | null;
}
