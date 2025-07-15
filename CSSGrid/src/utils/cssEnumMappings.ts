/**
 * CSS Enum Mappings
 *
 * Centralized mappings from Mendix enum values to CSS values.
 * Ensures consistent CSS output across all components.
 */

/**
 * CSS Grid Auto Flow mappings
 * Maps Mendix AutoFlowEnum to CSS grid-auto-flow values
 */
export const CSS_AUTO_FLOW_MAPPING = {
    row: "row",
    column: "column",
    dense: "dense",
    columnDense: "column dense"
} as const;

/**
 * CSS Justify Content mappings
 * Maps Mendix JustifyContentEnum to CSS justify-content values
 */
export const CSS_JUSTIFY_CONTENT_MAPPING = {
    start: "start",
    end: "end",
    center: "center",
    stretch: "stretch",
    spaceBetween: "space-between",
    spaceAround: "space-around",
    spaceEvenly: "space-evenly"
} as const;

/**
 * CSS Align Content mappings
 * Maps Mendix AlignContentEnum to CSS align-content values
 */
export const CSS_ALIGN_CONTENT_MAPPING = {
    start: "start",
    end: "end",
    center: "center",
    stretch: "stretch",
    spaceBetween: "space-between",
    spaceAround: "space-around",
    spaceEvenly: "space-evenly"
} as const;

/**
 * CSS Justify Items mappings
 * Maps Mendix JustifyItemsEnum to CSS justify-items values
 */
export const CSS_JUSTIFY_ITEMS_MAPPING = {
    start: "start",
    end: "end",
    center: "center",
    stretch: "stretch"
} as const;

/**
 * CSS Align Items mappings
 * Maps Mendix AlignItemsEnum to CSS align-items values
 */
export const CSS_ALIGN_ITEMS_MAPPING = {
    start: "start",
    end: "end",
    center: "center",
    stretch: "stretch",
    baseline: "baseline"
} as const;

/**
 * CSS Justify Self mappings
 * Maps Mendix JustifySelfEnum to CSS justify-self values
 */
export const CSS_JUSTIFY_SELF_MAPPING = {
    auto: "auto",
    start: "start",
    end: "end",
    center: "center",
    stretch: "stretch"
} as const;

/**
 * CSS Align Self mappings
 * Maps Mendix AlignSelfEnum to CSS align-self values
 */
export const CSS_ALIGN_SELF_MAPPING = {
    auto: "auto",
    start: "start",
    end: "end",
    center: "center",
    stretch: "stretch",
    baseline: "baseline"
} as const;

/**
 * Consolidated CSS enum mappings object
 * Contains all enum-to-CSS mappings in one place
 */
export const CSS_ENUM_MAPPINGS = {
    autoFlow: CSS_AUTO_FLOW_MAPPING,
    justifyContent: CSS_JUSTIFY_CONTENT_MAPPING,
    alignContent: CSS_ALIGN_CONTENT_MAPPING,
    justifyItems: CSS_JUSTIFY_ITEMS_MAPPING,
    alignItems: CSS_ALIGN_ITEMS_MAPPING,
    justifySelf: CSS_JUSTIFY_SELF_MAPPING,
    alignSelf: CSS_ALIGN_SELF_MAPPING
} as const;

/**
 * Type-safe helper to get CSS value from enum
 *
 * @param category - The enum category (e.g., 'autoFlow', 'justifyContent')
 * @param enumValue - The Mendix enum value
 * @returns The corresponding CSS value
 */
export function getCSSValueFromEnum<T extends keyof typeof CSS_ENUM_MAPPINGS>(
    category: T,
    enumValue: keyof (typeof CSS_ENUM_MAPPINGS)[T]
): string {
    return CSS_ENUM_MAPPINGS[category][enumValue] as string;
}

/**
 * Safely get CSS value with fallback
 *
 * @param category - The enum category
 * @param enumValue - The Mendix enum value
 * @param fallback - Fallback value if mapping not found
 * @returns The CSS value or fallback
 */
export function getSafeCSSValue<T extends keyof typeof CSS_ENUM_MAPPINGS>(
    category: T,
    enumValue: string | undefined,
    fallback = "auto"
): string {
    if (!enumValue || !(enumValue in CSS_ENUM_MAPPINGS[category])) {
        return fallback;
    }
    return CSS_ENUM_MAPPINGS[category][enumValue as keyof (typeof CSS_ENUM_MAPPINGS)[T]] as string;
}
