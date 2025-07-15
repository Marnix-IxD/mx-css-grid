import { createElement, Fragment } from "react";
import { GridMetrics } from "../../types/ConditionalTypes";
import { DEBUG_OVERLAY, Z_INDEX, COLORS, SVG } from "../../utils/constants";

interface DebugOverlayProps {
    gridMetrics: GridMetrics | null;
    showGridLines: boolean;
    showGridGaps: boolean;
}

/**
 * Debug Overlay Component
 * Renders grid lines, gap visualizations, and measurements
 */
export const DebugOverlay: React.FC<DebugOverlayProps> = ({ gridMetrics, showGridLines, showGridGaps }) => {
    if (!gridMetrics || (!showGridLines && !showGridGaps)) {
        return null;
    }

    const { tracks, gaps, gridBox } = gridMetrics;
    if (!gridBox) {
        return null;
    }

    const width = gridBox.width;
    const height = gridBox.height;

    return (
        <svg
            className="css-grid-preview-debug-svg"
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: Z_INDEX.DEBUG_OVERLAY
            }}
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
        >
            {/* Define stripe pattern for gaps */}
            <defs>
                <pattern
                    id="gap-stripes"
                    x="0"
                    y="0"
                    width={SVG.PATTERN_SIZE}
                    height={SVG.PATTERN_SIZE}
                    patternUnits="userSpaceOnUse"
                    patternTransform={`rotate(${SVG.STRIPE_ROTATION_ANGLE})`}
                >
                    <rect
                        x="0"
                        y="0"
                        width={SVG.PATTERN_SIZE}
                        height={SVG.PATTERN_SIZE}
                        fill={`rgba(255, 0, 61, ${DEBUG_OVERLAY.GAP_OPACITY * SVG.DEBUG_LINE_OPACITY_MULTIPLIER})`}
                    />
                    <rect
                        x="0"
                        y="0"
                        width={SVG.PATTERN_HALF_SIZE}
                        height={SVG.PATTERN_SIZE}
                        fill={`rgba(255, 0, 61, ${DEBUG_OVERLAY.GAP_OPACITY})`}
                    />
                </pattern>
            </defs>

            {/* Gap visualization with measurements */}
            {showGridGaps && gaps.column > 0 && tracks.columns.length > 2 && (
                <g className="grid-gaps-column">
                    {tracks.columns.slice(0, -1).map((_, i) => {
                        if (i === tracks.columns.length - 2) {
                            return null;
                        } // Skip the last gap
                        const nextColPos = tracks.columns[i + 1];
                        return (
                            <g key={`gap-col-${i}`}>
                                <rect
                                    x={nextColPos}
                                    y={0}
                                    width={gaps.column}
                                    height={height}
                                    fill="url(#gap-stripes)"
                                />
                                {/* Gap measurement text */}
                                <text
                                    x={nextColPos + gaps.column / 2}
                                    y={height / 2}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize={DEBUG_OVERLAY.GAP_LABEL_SIZE}
                                    fill={`rgba(255, 0, 61, 0.8)`}
                                    fontWeight="bold"
                                    transform={`rotate(-90 ${nextColPos + gaps.column / 2} ${height / 2})`}
                                    style={{
                                        filter: "drop-shadow(0 0 2px white) drop-shadow(0 0 2px white)"
                                    }}
                                >
                                    {Math.round(gaps.column)}px
                                </text>
                            </g>
                        );
                    })}
                </g>
            )}

            {showGridGaps && gaps.row > 0 && tracks.rows.length > 2 && (
                <g className="grid-gaps-row">
                    {tracks.rows.slice(0, -1).map((_, i) => {
                        if (i === tracks.rows.length - 2) {
                            return null;
                        } // Skip the last gap
                        const nextRowPos = tracks.rows[i + 1];
                        return (
                            <g key={`gap-row-${i}`}>
                                <rect x={0} y={nextRowPos} width={width} height={gaps.row} fill="url(#gap-stripes)" />
                                {/* Gap measurement text */}
                                <text
                                    x={width / 2}
                                    y={nextRowPos + gaps.row / 2}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize={DEBUG_OVERLAY.GAP_LABEL_SIZE}
                                    fill={`rgba(255, 0, 61, 0.8)`}
                                    fontWeight="bold"
                                    style={{
                                        filter: "drop-shadow(0 0 2px white) drop-shadow(0 0 2px white)"
                                    }}
                                >
                                    {Math.round(gaps.row)}px
                                </text>
                            </g>
                        );
                    })}
                </g>
            )}

            {/* Grid lines with numbers */}
            {showGridLines && (
                <g className="grid-lines">
                    {/* Vertical lines with column numbers */}
                    {tracks.columns.map((x, i) => {
                        const lineNumber = i + 1;
                        const isFirst = i === 0;
                        const isLast = i === tracks.columns.length - 1;
                        const hasGapBefore = i > 0 && gaps.column > 0;

                        return (
                            <g key={`v-${i}`}>
                                {/* For first and last lines, just draw one line */}
                                {(isFirst || isLast) && (
                                    <line
                                        x1={x}
                                        y1={0}
                                        x2={x}
                                        y2={height}
                                        stroke={COLORS.GRID_LINE}
                                        strokeWidth={DEBUG_OVERLAY.LINE_WIDTH}
                                        opacity={DEBUG_OVERLAY.LINE_OPACITY}
                                    />
                                )}

                                {/* For middle lines with gaps, draw lines on both sides of gap */}
                                {!isFirst && !isLast && (
                                    <Fragment>
                                        {hasGapBefore && (
                                            <line
                                                x1={x}
                                                y1={0}
                                                x2={x}
                                                y2={height}
                                                stroke={COLORS.GRID_LINE}
                                                strokeWidth={DEBUG_OVERLAY.LINE_WIDTH}
                                                opacity={DEBUG_OVERLAY.LINE_OPACITY}
                                            />
                                        )}
                                        <line
                                            x1={x + gaps.column}
                                            y1={0}
                                            x2={x + gaps.column}
                                            y2={height}
                                            stroke={COLORS.GRID_LINE}
                                            strokeWidth={DEBUG_OVERLAY.LINE_WIDTH}
                                            opacity={DEBUG_OVERLAY.LINE_OPACITY}
                                        />
                                    </Fragment>
                                )}

                                {/* Column line numbers positioned inside grid */}
                                {/* Top labels */}
                                <rect
                                    x={
                                        isFirst
                                            ? x + 4
                                            : isLast
                                            ? x - DEBUG_OVERLAY.LINE_LABEL_PADDING.x - 4
                                            : x - DEBUG_OVERLAY.LINE_LABEL_PADDING.x / 2
                                    }
                                    y={4}
                                    width={DEBUG_OVERLAY.LINE_LABEL_PADDING.x}
                                    height={DEBUG_OVERLAY.LINE_LABEL_PADDING.y}
                                    fill="white"
                                    stroke={COLORS.GRID_LINE}
                                    strokeWidth={DEBUG_OVERLAY.LINE_WIDTH}
                                    opacity="0.9"
                                    rx="2"
                                />
                                <text
                                    x={isFirst ? x + 14 : isLast ? x - 14 : x}
                                    y={12}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize={DEBUG_OVERLAY.LINE_LABEL_SIZE}
                                    fill={COLORS.GRID_LINE}
                                    fontWeight="bold"
                                >
                                    {lineNumber}
                                </text>
                                {/* Bottom labels */}
                                <rect
                                    x={
                                        isFirst
                                            ? x + 4
                                            : isLast
                                            ? x - DEBUG_OVERLAY.LINE_LABEL_PADDING.x - 4
                                            : x - DEBUG_OVERLAY.LINE_LABEL_PADDING.x / 2
                                    }
                                    y={height - DEBUG_OVERLAY.LINE_LABEL_PADDING.y - 4}
                                    width={DEBUG_OVERLAY.LINE_LABEL_PADDING.x}
                                    height={DEBUG_OVERLAY.LINE_LABEL_PADDING.y}
                                    fill="white"
                                    stroke={COLORS.GRID_LINE}
                                    strokeWidth={DEBUG_OVERLAY.LINE_WIDTH}
                                    opacity="0.9"
                                    rx="2"
                                />
                                <text
                                    x={isFirst ? x + 14 : isLast ? x - 14 : x}
                                    y={height - 12}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize={DEBUG_OVERLAY.LINE_LABEL_SIZE}
                                    fill={COLORS.GRID_LINE}
                                    fontWeight="bold"
                                >
                                    {lineNumber}
                                </text>
                            </g>
                        );
                    })}

                    {/* Horizontal lines with row numbers */}
                    {tracks.rows.map((y, i) => {
                        const lineNumber = i + 1;
                        const isFirst = i === 0;
                        const isLast = i === tracks.rows.length - 1;
                        const hasGapBefore = i > 0 && gaps.row > 0;

                        return (
                            <g key={`h-${i}`}>
                                {/* For first and last lines, just draw one line */}
                                {(isFirst || isLast) && (
                                    <line
                                        x1={0}
                                        y1={y}
                                        x2={width}
                                        y2={y}
                                        stroke={COLORS.GRID_LINE}
                                        strokeWidth={DEBUG_OVERLAY.LINE_WIDTH}
                                        opacity={DEBUG_OVERLAY.LINE_OPACITY}
                                    />
                                )}

                                {/* For middle lines with gaps, draw lines on both sides of gap */}
                                {!isFirst && !isLast && (
                                    <Fragment>
                                        {hasGapBefore && (
                                            <line
                                                x1={0}
                                                y1={y}
                                                x2={width}
                                                y2={y}
                                                stroke={COLORS.GRID_LINE}
                                                strokeWidth={DEBUG_OVERLAY.LINE_WIDTH}
                                                opacity={DEBUG_OVERLAY.LINE_OPACITY}
                                            />
                                        )}
                                        <line
                                            x1={0}
                                            y1={y + gaps.row}
                                            x2={width}
                                            y2={y + gaps.row}
                                            stroke={COLORS.GRID_LINE}
                                            strokeWidth={DEBUG_OVERLAY.LINE_WIDTH}
                                            opacity={DEBUG_OVERLAY.LINE_OPACITY}
                                        />
                                    </Fragment>
                                )}

                                {/* Row line numbers positioned inside grid */}
                                {/* Left labels */}
                                <rect
                                    x={4}
                                    y={
                                        isFirst
                                            ? y + 4
                                            : isLast
                                            ? y - DEBUG_OVERLAY.LINE_LABEL_PADDING.y - 4
                                            : y - DEBUG_OVERLAY.LINE_LABEL_PADDING.y / 2
                                    }
                                    width={DEBUG_OVERLAY.LINE_LABEL_PADDING.x}
                                    height={DEBUG_OVERLAY.LINE_LABEL_PADDING.y}
                                    fill="white"
                                    stroke={COLORS.GRID_LINE}
                                    strokeWidth={DEBUG_OVERLAY.LINE_WIDTH}
                                    opacity="0.9"
                                    rx="2"
                                />
                                <text
                                    x={14}
                                    y={isFirst ? y + 12 : isLast ? y - 12 : y}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize={DEBUG_OVERLAY.LINE_LABEL_SIZE}
                                    fill={COLORS.GRID_LINE}
                                    fontWeight="bold"
                                >
                                    {lineNumber}
                                </text>
                                {/* Right labels */}
                                <rect
                                    x={width - DEBUG_OVERLAY.LINE_LABEL_PADDING.x - 4}
                                    y={
                                        isFirst
                                            ? y + 4
                                            : isLast
                                            ? y - DEBUG_OVERLAY.LINE_LABEL_PADDING.y - 4
                                            : y - DEBUG_OVERLAY.LINE_LABEL_PADDING.y / 2
                                    }
                                    width={DEBUG_OVERLAY.LINE_LABEL_PADDING.x}
                                    height={DEBUG_OVERLAY.LINE_LABEL_PADDING.y}
                                    fill="white"
                                    stroke={COLORS.GRID_LINE}
                                    strokeWidth={DEBUG_OVERLAY.LINE_WIDTH}
                                    opacity="0.9"
                                    rx="2"
                                />
                                <text
                                    x={width - 14}
                                    y={isFirst ? y + 12 : isLast ? y - 12 : y}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize={DEBUG_OVERLAY.LINE_LABEL_SIZE}
                                    fill={COLORS.GRID_LINE}
                                    fontWeight="bold"
                                >
                                    {lineNumber}
                                </text>
                            </g>
                        );
                    })}
                </g>
            )}
        </svg>
    );
};
