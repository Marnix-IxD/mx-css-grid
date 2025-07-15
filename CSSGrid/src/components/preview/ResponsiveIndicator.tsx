import { createElement, ReactNode } from "react";
import { RuntimeGridContainerPreview, RuntimeGridItemPreview } from "../../types/ConditionalTypes";
import { forEachEnabledBreakpoint, getBreakpointsToProcess, ResponsiveMode } from "../../utils/breakpointHelpers";
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, CSS_VALUES } from "../../utils/constants";

interface ResponsiveIndicatorProps {
    hasResponsiveContainer: boolean;
    showGridInfo: boolean;
    enableBreakpoints: boolean;
    containerWidth: number;
    containerHeight: number;
    runtimeProps: RuntimeGridContainerPreview;
    items: RuntimeGridItemPreview[];
    isItemHiddenAtCurrentBreakpoint: (item: RuntimeGridItemPreview) => boolean;
    responsiveMode: string;
}

/**
 * Responsive Indicator Component
 * Shows the current breakpoint status and container dimensions
 */
export const ResponsiveIndicator: React.FC<ResponsiveIndicatorProps> = ({
    hasResponsiveContainer,
    showGridInfo,
    enableBreakpoints,
    containerWidth,
    containerHeight,
    runtimeProps,
    items,
    isItemHiddenAtCurrentBreakpoint,
    responsiveMode
}) => {
    if (!hasResponsiveContainer || !showGridInfo) {
        return null;
    }

    // Build the active breakpoints display with visual highlighting
    const breakpointElements: ReactNode[] = [];

    // Determine which breakpoint's styles are actually being applied
    let actuallyActiveBreakpoint: string | null = null;

    if (enableBreakpoints) {
        const mode: ResponsiveMode = responsiveMode === "cascade" ? "cascade" : "exact";
        const activeBreakpoints = getBreakpointsToProcess(mode, containerWidth, runtimeProps);

        if (activeBreakpoints.length > 0) {
            // In cascade mode, the last (highest) breakpoint in the list is the one being applied
            // In exact mode, there's only one breakpoint in the list
            actuallyActiveBreakpoint = activeBreakpoints[activeBreakpoints.length - 1].size;
        }
    }

    // BASE is highlighted when no breakpoint styles are being applied
    const isBaseActive = !actuallyActiveBreakpoint;

    // Always show BASE as the foundation configuration
    if (isBaseActive) {
        breakpointElements.push(
            <span
                key="base"
                style={{
                    backgroundColor: "#3b82f6",
                    color: "white",
                    padding: SPACING.INDICATOR_PADDING,
                    borderRadius: `${BORDER_RADIUS.SM}px`,
                    fontSize: `${TYPOGRAPHY.FONT_SIZE_NORMAL}px`,
                    fontWeight: CSS_VALUES.FONT_WEIGHT_SEMIBOLD,
                    marginLeft: "2px",
                    marginRight: "2px"
                }}
            >
                BASE
            </span>
        );
    } else {
        breakpointElements.push("BASE");
    }

    forEachEnabledBreakpoint(runtimeProps, config => {
        const breakpointName = config.size.toUpperCase();
        const isActive = config.size === actuallyActiveBreakpoint;

        breakpointElements.push(",");

        if (isActive) {
            breakpointElements.push(
                <span
                    key={config.size}
                    style={{
                        backgroundColor: "#3b82f6",
                        color: "white",
                        padding: SPACING.INDICATOR_PADDING,
                        borderRadius: `${BORDER_RADIUS.SM}px`,
                        fontSize: `${TYPOGRAPHY.FONT_SIZE_NORMAL}px`,
                        fontWeight: CSS_VALUES.FONT_WEIGHT_SEMIBOLD,
                        marginLeft: "2px",
                        marginRight: "2px"
                    }}
                >
                    {breakpointName}
                </span>
            );
        } else {
            breakpointElements.push(breakpointName);
        }
    });

    // Count hidden items at current breakpoint
    const hiddenItemsCount = items.filter(item => isItemHiddenAtCurrentBreakpoint(item)).length;
    const hiddenText = hiddenItemsCount > 0 ? ` | Hidden: ${hiddenItemsCount}` : "";

    return (
        <div className="css-grid-preview-info">
            <span className="css-grid-preview-info-icon">📱</span>
            <span className="css-grid-preview-info-text">
                Active: {breakpointElements} | {containerWidth}×{containerHeight}px{hiddenText}
            </span>
        </div>
    );
};
