import { AREA_VISUALIZATION } from "../../utils/constants";

/**
 * Generate vibrant colors for areas with better visibility
 * Each area gets a unique color from a predefined palette
 *
 * @param areas - Array of unique area names
 * @returns Record mapping area names to their colors
 */
export const generateAreaColors = (areas: string[]): Record<string, string> => {
    const baseColors = [
        `rgba(59, 130, 246, ${AREA_VISUALIZATION.COLOR_OPACITY})`, // Blue
        `rgba(239, 68, 68, ${AREA_VISUALIZATION.COLOR_OPACITY})`, // Red
        `rgba(16, 185, 129, ${AREA_VISUALIZATION.COLOR_OPACITY})`, // Green
        `rgba(245, 158, 11, ${AREA_VISUALIZATION.COLOR_OPACITY})`, // Yellow
        `rgba(139, 92, 246, ${AREA_VISUALIZATION.COLOR_OPACITY})`, // Purple
        `rgba(236, 72, 153, ${AREA_VISUALIZATION.COLOR_OPACITY})`, // Pink
        `rgba(14, 165, 233, ${AREA_VISUALIZATION.COLOR_OPACITY})`, // Sky
        `rgba(168, 85, 247, ${AREA_VISUALIZATION.COLOR_OPACITY})`, // Violet
        `rgba(251, 146, 60, ${AREA_VISUALIZATION.COLOR_OPACITY})`, // Orange
        `rgba(6, 182, 212, ${AREA_VISUALIZATION.COLOR_OPACITY})` // Cyan
    ];

    const colorMap: Record<string, string> = {};
    areas.forEach((area, index) => {
        colorMap[area] = baseColors[index % baseColors.length];
    });

    return colorMap;
};
