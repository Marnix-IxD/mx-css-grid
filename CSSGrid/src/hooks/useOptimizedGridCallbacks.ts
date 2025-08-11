/**
 * Optimized Grid Callbacks Hook
 *
 * Splits large callbacks into smaller, focused functions with stable references
 * to minimize re-renders and improve performance.
 */

import { useCallback, CSSProperties } from "react";
import { RuntimeGridItem, GridItemPlacement } from "../types/ConditionalTypes";
import { getGridItemPlacement, parseGridAreas } from "../utils/gridHelpers";
import {
    SEMANTIC_ELEMENT_MAPPINGS,
    DEFAULT_AUTO_PLACEMENT,
    ELEMENTS_WITH_IMPLICIT_ROLES
} from "../utils/stableConstants";

interface IAreaValidationResult {
    isValid: boolean;
    placement: GridItemPlacement;
}

interface IGridConfig {
    areas?: string;
    columns?: string;
    rows?: string;
}

/**
 * Hook for area validation logic
 * Extracted to minimize dependencies and create stable references
 */
export function useAreaValidation(allDefinedAreas: Set<string>, activeConfig: IGridConfig) {
    return useCallback(
        (placement: GridItemPlacement, itemIndex: number): IAreaValidationResult => {
            if (placement.placementType !== "area" || !placement.gridArea) {
                return { isValid: true, placement };
            }

            // Check if area exists in current configuration
            const currentAreas = activeConfig.areas ? parseGridAreas(activeConfig.areas) : null;
            const currentAreaNames = currentAreas
                ? new Set(currentAreas.flat().filter(a => a !== "."))
                : new Set<string>();

            if (!currentAreaNames.has(placement.gridArea) && !allDefinedAreas.has(placement.gridArea)) {
                console.warn(
                    `Item ${itemIndex + 1}: Grid area "${placement.gridArea}" is not defined in current configuration`
                );
                return {
                    isValid: false,
                    placement: DEFAULT_AUTO_PLACEMENT
                };
            }

            return { isValid: true, placement };
        },
        [allDefinedAreas, activeConfig.areas]
    );
}

/**
 * Hook for semantic element detection
 * Memoized to prevent recreating the detection function
 */
export function useSemanticElementDetection(validateCSSIdentifier: (identifier: string) => string) {
    return useCallback(
        (runtimeItem: RuntimeGridItem): string => {
            if (runtimeItem.renderAs && runtimeItem.renderAs !== "auto" && runtimeItem.renderAs !== "div") {
                return runtimeItem.renderAs;
            }

            if (runtimeItem.renderAs === "auto") {
                const rawAreaName = runtimeItem.gridArea || runtimeItem.itemName || "";
                const areaName = validateCSSIdentifier(rawAreaName.toLowerCase().trim());
                return SEMANTIC_ELEMENT_MAPPINGS[areaName] || "div";
            }

            return runtimeItem.renderAs || "div";
        },
        [validateCSSIdentifier]
    );
}

/**
 * Hook for building item styles
 * Separated to reduce renderGridItems complexity
 */
export function useItemStyleBuilder(
    enableBreakpoints: boolean,
    buildItemCSSVariables: (item: RuntimeGridItem) => Record<string, string>,
    getActiveItemPlacement: (item: RuntimeGridItem) => GridItemPlacement,
    validateAreaPlacement: (placement: GridItemPlacement, index: number) => IAreaValidationResult,
    useNamedAreas: boolean
) {
    return useCallback(
        (runtimeItem: RuntimeGridItem, index: number): CSSProperties => {
            let itemStyles: CSSProperties = {};

            if (runtimeItem.enableResponsive && enableBreakpoints) {
                // Responsive items use CSS variables
                const itemCssVars = buildItemCSSVariables(runtimeItem);
                itemStyles = { ...itemCssVars } as React.CSSProperties;
            } else {
                // Non-responsive items get direct CSS properties
                itemStyles = {
                    justifySelf: runtimeItem.justifySelf !== "auto" ? runtimeItem.justifySelf : undefined,
                    alignSelf: runtimeItem.alignSelf !== "auto" ? runtimeItem.alignSelf : undefined,
                    zIndex: runtimeItem.zIndex || undefined
                };

                let placement = getActiveItemPlacement(runtimeItem);
                const validationResult = validateAreaPlacement(placement, index);

                if (!validationResult.isValid) {
                    placement = validationResult.placement;
                }

                itemStyles = {
                    ...itemStyles,
                    ...getGridItemPlacement(placement, useNamedAreas)
                };
            }

            return itemStyles;
        },
        [enableBreakpoints, buildItemCSSVariables, getActiveItemPlacement, validateAreaPlacement, useNamedAreas]
    );
}

/**
 * Hook for building ARIA attributes
 * Extracted to create stable reference
 */
export function useAriaAttributesBuilder(
    containerRole: string,
    useNamedAreas: boolean,
    enableVirtualization: boolean,
    shouldVirtualize: boolean,
    totalItems: number
) {
    return useCallback(
        (
            runtimeItem: RuntimeGridItem,
            index: number,
            semanticElement: string,
            accessibleLabel: string
        ): Record<string, any> => {
            const itemAriaAttrs: Record<string, string | number | undefined> = {};

            itemAriaAttrs["aria-label"] = accessibleLabel;
            itemAriaAttrs["data-semantic-element"] = semanticElement;

            // Only set role if the semantic element doesn't have an implicit role
            const hasImplicitRole = ELEMENTS_WITH_IMPLICIT_ROLES.includes(semanticElement);

            if (!hasImplicitRole) {
                if (runtimeItem.placementType === "area" && runtimeItem.gridArea && useNamedAreas) {
                    itemAriaAttrs.role = "region";
                } else if (containerRole === "grid") {
                    itemAriaAttrs.role = "gridcell";
                }
            }

            // For virtualized grids, add position information
            if (enableVirtualization && shouldVirtualize && containerRole === "grid") {
                itemAriaAttrs["aria-setsize"] = totalItems;
                itemAriaAttrs["aria-posinset"] = index + 1;
            }

            return itemAriaAttrs;
        },
        [containerRole, useNamedAreas, enableVirtualization, shouldVirtualize, totalItems]
    );
}
