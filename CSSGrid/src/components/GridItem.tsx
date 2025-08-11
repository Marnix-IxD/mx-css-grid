/**
 * Memoized Grid Item Component
 *
 * Performance-optimized component for rendering individual grid items.
 * Only re-renders when its specific props change, not when parent re-renders.
 */

import { createElement, memo, ReactElement, CSSProperties, useEffect } from "react";
import { RuntimeGridItem } from "../types/ConditionalTypes";

/**
 * Props for the optimized GridItem component
 */
export interface IGridItemProps {
    // Core props
    item: RuntimeGridItem;
    index: number;

    // Computed props from parent
    isVisible: boolean;
    isHidden: boolean;
    itemName: string;
    placementInfo: string;

    // Style props
    className: string;
    styles: CSSProperties;

    // ARIA attributes
    ariaAttributes: Record<string, any>;

    // Performance tracking
    onRender?: (index: number) => void;
}

/**
 * Memoized GridItem Component
 *
 * This component only re-renders when:
 * - Its content changes
 * - Its placement/positioning changes
 * - Its visibility changes
 * - Its styles or classes change
 *
 * It does NOT re-render when:
 * - Other items in the grid change
 * - Parent component re-renders for unrelated reasons
 * - Virtualization updates for other items
 */
const GridItemComponent = ({
    item,
    index,
    isVisible,
    isHidden,
    itemName,
    placementInfo,
    className,
    styles,
    ariaAttributes,
    onRender
}: IGridItemProps): ReactElement | null => {
    // Track renders in debug mode only on mount
    useEffect(() => {
        if (onRender) {
            onRender(index);
        }
    }, []); // Empty dependency array - only run on mount

    // Don't render if not visible (virtualization)
    if (!isVisible) {
        return null;
    }

    // Don't render if hidden at current breakpoint
    if (isHidden) {
        return null;
    }

    // Extract semantic element from aria attributes (passed from parent)
    const { "data-semantic-element": semanticElement, ...restAriaAttributes } = ariaAttributes;
    const element = semanticElement || item.renderAs || "div";
    const hasResponsive = item.enableResponsive || false;

    return createElement(
        element,
        {
            "data-grid-index": index,
            "data-grid-item": itemName,
            "data-placement": placementInfo,
            "data-responsive": hasResponsive,
            className,
            style: styles,
            ...restAriaAttributes
        },
        item.content
    );
};

/**
 * Memoized GridItem with custom comparison
 *
 * We use a custom comparison function to ensure we only re-render
 * when relevant props actually change.
 */
export const GridItem = memo(GridItemComponent, (prevProps, nextProps) => {
    // Check if any render-affecting props changed
    if (
        // Core props
        prevProps.item.content !== nextProps.item.content ||
        prevProps.index !== nextProps.index ||
        // Visibility
        prevProps.isVisible !== nextProps.isVisible ||
        prevProps.isHidden !== nextProps.isHidden ||
        // Placement
        prevProps.item.placementType !== nextProps.item.placementType ||
        prevProps.item.gridArea !== nextProps.item.gridArea ||
        prevProps.item.columnStart !== nextProps.item.columnStart ||
        prevProps.item.columnEnd !== nextProps.item.columnEnd ||
        prevProps.item.rowStart !== nextProps.item.rowStart ||
        prevProps.item.rowEnd !== nextProps.item.rowEnd ||
        // Styles
        prevProps.item.justifySelf !== nextProps.item.justifySelf ||
        prevProps.item.alignSelf !== nextProps.item.alignSelf ||
        prevProps.item.zIndex !== nextProps.item.zIndex ||
        prevProps.item.renderAs !== nextProps.item.renderAs ||
        prevProps.item.className !== nextProps.item.className ||
        // Computed props
        prevProps.className !== nextProps.className ||
        prevProps.itemName !== nextProps.itemName ||
        prevProps.placementInfo !== nextProps.placementInfo ||
        // Responsive config changed
        prevProps.item.enableResponsive !== nextProps.item.enableResponsive
    ) {
        return false; // Props changed, should re-render
    }

    // For styles and aria attributes, do a shallow comparison of the object properties
    // This prevents re-renders when the object reference changes but the content is the same

    // Compare styles
    const prevStyleKeys = Object.keys(prevProps.styles);
    const nextStyleKeys = Object.keys(nextProps.styles);
    if (prevStyleKeys.length !== nextStyleKeys.length) {
        return false; // Different number of style properties
    }
    for (const key of prevStyleKeys) {
        if ((prevProps.styles as any)[key] !== (nextProps.styles as any)[key]) {
            return false; // Style value changed
        }
    }

    // Compare aria attributes
    const prevAriaKeys = Object.keys(prevProps.ariaAttributes);
    const nextAriaKeys = Object.keys(nextProps.ariaAttributes);
    if (prevAriaKeys.length !== nextAriaKeys.length) {
        return false; // Different number of aria attributes
    }
    for (const key of prevAriaKeys) {
        if (prevProps.ariaAttributes[key] !== nextProps.ariaAttributes[key]) {
            return false; // Aria attribute changed
        }
    }

    return true; // Props are the same, skip re-render
});

GridItem.displayName = "GridItem";
