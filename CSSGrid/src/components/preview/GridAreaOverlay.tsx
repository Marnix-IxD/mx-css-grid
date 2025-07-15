import { createElement, Fragment } from "react";
import { AREA_VISUALIZATION, Z_INDEX, TYPOGRAPHY, ANIMATION } from "../../utils/constants";

interface GridAreaOverlayProps {
    showGridAreas: boolean;
    useNamedAreas: boolean;
    parsedAreas: string[][] | null;
    areaColorMap: Record<string, string>;
}

/**
 * Grid Area Overlay Component
 * Creates area backgrounds behind content with labels on top
 */
export const GridAreaOverlay: React.FC<GridAreaOverlayProps> = ({
    showGridAreas,
    useNamedAreas,
    parsedAreas,
    areaColorMap
}) => {
    if (!showGridAreas || !useNamedAreas || !parsedAreas) {
        return null;
    }

    const processedAreas = new Set<string>();

    return (
        <Fragment>
            {parsedAreas.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                    if (cell === "." || processedAreas.has(cell)) {
                        return null;
                    }

                    // Find the full extent of this area
                    let minRow = rowIndex;
                    let maxRow = rowIndex;
                    let minCol = colIndex;
                    let maxCol = colIndex;

                    for (let r = 0; r < parsedAreas.length; r++) {
                        for (let c = 0; c < parsedAreas[r].length; c++) {
                            if (parsedAreas[r][c] === cell) {
                                minRow = Math.min(minRow, r);
                                maxRow = Math.max(maxRow, r);
                                minCol = Math.min(minCol, c);
                                maxCol = Math.max(maxCol, c);
                            }
                        }
                    }

                    processedAreas.add(cell);

                    return (
                        <div
                            key={`area-${cell}`}
                            className="css-grid-preview-area-overlay"
                            style={{
                                gridRow: `${minRow + 1} / ${maxRow + 2}`,
                                gridColumn: `${minCol + 1} / ${maxCol + 2}`,
                                backgroundColor: areaColorMap[cell],
                                border: `${AREA_VISUALIZATION.BORDER_WIDTH}px dashed rgba(0, 0, 0, ${AREA_VISUALIZATION.BORDER_OPACITY})`,
                                borderRadius: `${AREA_VISUALIZATION.BORDER_RADIUS}px`,
                                pointerEvents: "none",
                                position: "relative",
                                width: "100%",
                                height: "100%",
                                boxSizing: "border-box",
                                // Ensure areas fill their grid cells
                                justifySelf: "stretch",
                                alignSelf: "stretch",
                                zIndex: Z_INDEX.AREA_BACKGROUND // Behind content
                            }}
                        >
                            <div
                                className="css-grid-preview-area-label-container"
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    zIndex: Z_INDEX.AREA_LABEL_MAX, // Maximum z-index for label
                                    pointerEvents: "none"
                                }}
                            >
                                <span
                                    className="css-grid-preview-area-label"
                                    style={{
                                        display: "inline-block",
                                        fontSize: `${TYPOGRAPHY.FONT_SIZE_NORMAL}px`,
                                        fontWeight: 600,
                                        color: "white",
                                        textTransform: "uppercase",
                                        letterSpacing: TYPOGRAPHY.LETTER_SPACING_WIDE,
                                        background: `rgba(59, 130, 246, ${AREA_VISUALIZATION.LABEL_BACKGROUND_OPACITY})`,
                                        padding: "2px 6px",
                                        borderRadius: "3px",
                                        whiteSpace: "nowrap",
                                        boxShadow: ANIMATION.DEFAULT_SHADOW
                                    }}
                                >
                                    {cell.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    );
                })
            )}
        </Fragment>
    );
};
