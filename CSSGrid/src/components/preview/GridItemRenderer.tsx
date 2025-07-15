import { createElement, CSSProperties } from "react";
import { Selectable } from "mendix/preview/Selectable";
import { RuntimeGridItemPreview, GridItemPlacement } from "../../types/ConditionalTypes";
import { getGridItemPlacement } from "../../utils/gridHelpers";
import { JustifySelfEnum, AlignSelfEnum } from "../../../typings/CSSGridProps";
import { EMPTY_ITEM_MIN_HEIGHT, CSS_VALUES, SVG } from "../../utils/constants";

interface GridItemRendererProps {
    item: RuntimeGridItemPreview;
    index: number;
    useNamedAreas: boolean;
    isHidden: boolean;
    activePlacement: GridItemPlacement;
    activeAlignment: {
        justifySelf: JustifySelfEnum;
        alignSelf: AlignSelfEnum;
        zIndex: string;
    };
    effectivePlacementType: string;
    itemName: string;
    hasResponsive: boolean;
    semanticElement: string;
    activeJustifyItems: string;
    activeAlignItems: string;
}

/**
 * Grid Item Renderer Component
 * Renders individual grid items with proper styling and content
 */
export const GridItemRenderer: React.FC<GridItemRendererProps> = ({
    item,
    index,
    useNamedAreas,
    isHidden,
    activePlacement,
    activeAlignment,
    effectivePlacementType,
    itemName,
    hasResponsive,
    semanticElement,
    activeJustifyItems,
    activeAlignItems
}) => {
    const placementStyles = getGridItemPlacement(
        {
            ...activePlacement,
            placementType: effectivePlacementType
        },
        useNamedAreas
    );

    const ContentRenderer = item.content?.renderer;
    const hasContent = !!ContentRenderer;

    // Empty items always stretch to serve as drop zones
    // Items with content respect their alignment settings
    const itemStyles: CSSProperties = {
        position: "relative",
        minHeight: `${EMPTY_ITEM_MIN_HEIGHT}px`,
        boxSizing: "border-box",
        ...placementStyles,
        justifySelf: activeAlignment.justifySelf !== "auto" ? activeAlignment.justifySelf : undefined,
        alignSelf: activeAlignment.alignSelf !== "auto" ? activeAlignment.alignSelf : undefined,
        zIndex: activeAlignment.zIndex || undefined,
        // Add hidden styling for preview
        ...(isHidden && {
            opacity: CSS_VALUES.HIDDEN_ITEM_OPACITY,
            background: `repeating-linear-gradient(${SVG.STRIPE_ROTATION_ANGLE}deg, transparent, transparent ${SVG.PATTERN_HALF_SIZE}px, rgba(255, 0, 0, 0.1) ${SVG.PATTERN_HALF_SIZE}px, rgba(255, 0, 0, 0.1) ${SVG.PATTERN_SIZE}px)`,
            border: "2px dashed rgba(255, 0, 0, 0.5)",
            borderRadius: "4px"
        })
    };

    // Only force dimensions for empty items
    if (!hasContent) {
        itemStyles.width = CSS_VALUES.FULL_WIDTH;
        itemStyles.height = CSS_VALUES.FULL_HEIGHT;
    }

    // Build caption intelligently to avoid repetition
    let itemCaption: string;
    if (semanticElement !== "div") {
        // Check if the item name is the same as the semantic element
        const normalizedItemName = itemName.toLowerCase().trim();
        if (
            normalizedItemName === semanticElement ||
            (normalizedItemName === "content" && semanticElement === "main") ||
            (normalizedItemName === "navigation" && semanticElement === "nav") ||
            (normalizedItemName === "sidebar" && semanticElement === "aside")
        ) {
            // Just show the HTML tag if they're essentially the same
            itemCaption = `<${semanticElement}>`;
        } else {
            // Show both if they differ
            itemCaption = `${itemName} <${semanticElement}>`;
        }
    } else {
        // Just show the item name for div elements
        itemCaption = itemName;
    }

    // Add responsive indicator
    itemCaption += hasResponsive ? " 📱" : "";

    // Add hidden indicator
    itemCaption += isHidden ? " 🚫" : "";

    const itemClasses = ["css-grid-preview-item", "css-grid__item", item.className].filter(Boolean).join(" ");

    // Determine content wrapper dimensions based on alignment
    const contentWrapperStyles: CSSProperties = {};

    if (hasContent) {
        // Determine effective alignSelf (inherit from container if "auto")
        const effectiveAlignSelf = activeAlignment.alignSelf === "auto" ? activeAlignItems : activeAlignment.alignSelf;

        // Determine effective justifySelf (inherit from container if "auto")
        const effectiveJustifySelf =
            activeAlignment.justifySelf === "auto" ? activeJustifyItems : activeAlignment.justifySelf;

        // If effective alignSelf is stretch, content should fill height
        if (effectiveAlignSelf === "stretch") {
            contentWrapperStyles.height = "100%";
        } else {
            contentWrapperStyles.height = "fit-content";
        }

        // If effective justifySelf is stretch, content should fill width
        if (effectiveJustifySelf === "stretch") {
            contentWrapperStyles.width = "100%";
        } else {
            contentWrapperStyles.width = "fit-content";
        }
    }

    return (
        <Selectable key={`selectable_item_${index}`} object={item} caption={itemCaption}>
            <div
                className={itemClasses}
                style={itemStyles}
                data-item-index={index}
                data-item-name={itemName}
                data-placement-type={effectivePlacementType}
                data-responsive={hasResponsive}
            >
                {ContentRenderer ? (
                    <div className="css-grid-preview-content" style={contentWrapperStyles}>
                        <ContentRenderer>
                            <div />
                        </ContentRenderer>
                    </div>
                ) : (
                    <div className="css-grid-preview-empty">
                        <span className="css-grid-preview-empty-text">{itemName}</span>
                    </div>
                )}
            </div>
        </Selectable>
    );
};
