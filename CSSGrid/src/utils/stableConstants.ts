/**
 * Stable Constants for CSS Grid
 *
 * These constants are extracted outside of components to maintain stable references
 * and prevent unnecessary re-renders and hook re-executions.
 */

/**
 * Semantic element mappings for auto-detection
 * Used when renderAs is set to "auto"
 */
export const SEMANTIC_ELEMENT_MAPPINGS: Readonly<Record<string, string>> = {
    header: "header",
    nav: "nav",
    navigation: "nav",
    main: "main",
    content: "main",
    aside: "aside",
    sidebar: "aside",
    footer: "footer",
    article: "article",
    section: "section"
};

/**
 * Elements with implicit ARIA roles that shouldn't be overridden
 */
export const ELEMENTS_WITH_IMPLICIT_ROLES: readonly string[] = ["main", "nav", "header", "footer", "article", "aside"];

/**
 * CSS class name constants
 */
export const CSS_CLASSES = {
    GRID: "css-grid",
    GRID_ITEM: "css-grid__item",
    GRID_ITEM_PLACEHOLDER: "css-grid__item--placeholder",
    GRID_RESPONSIVE: "css-grid--responsive"
} as const;

/**
 * Default placement object for area validation failures
 */
export const DEFAULT_AUTO_PLACEMENT = {
    placementType: "auto" as const,
    gridArea: undefined,
    columnStart: undefined,
    columnEnd: undefined,
    rowStart: undefined,
    rowEnd: undefined
};

/**
 * Empty deps array for effects that should only run once
 */
export const EMPTY_DEPS: readonly never[] = [];
