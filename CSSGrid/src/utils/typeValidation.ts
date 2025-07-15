import { CSSProperties } from "react";
import {
    AutoFlowEnum,
    JustifyItemsEnum,
    AlignItemsEnum,
    JustifyContentEnum,
    AlignContentEnum,
    JustifySelfEnum,
    AlignSelfEnum,
    RenderAsEnum,
    CSSGridContainerProps,
    CSSGridPreviewProps
} from "../../typings/CSSGridProps";
import {
    RuntimeGridContainer,
    RuntimeGridItem,
    RuntimeGridContainerPreview,
    RuntimeGridItemPreview
} from "../types/ConditionalTypes";

/**
 * Type guard to check if a value is a valid enum member
 */
function isValidEnumValue<T extends Record<string, string>>(value: any, enumObj: T): value is T[keyof T] {
    if (typeof value !== "string") {
        return false;
    }
    return Object.values(enumObj).includes(value);
}

/**
 * Type guard for AutoFlowEnum
 */
export function isAutoFlowEnum(value: any): value is AutoFlowEnum {
    return isValidEnumValue(value, {
        row: "row",
        column: "column",
        dense: "dense",
        columnDense: "columnDense"
    });
}

/**
 * Type guard for JustifyItemsEnum
 */
export function isJustifyItemsEnum(value: any): value is JustifyItemsEnum {
    return isValidEnumValue(value, {
        start: "start",
        end: "end",
        center: "center",
        stretch: "stretch"
    });
}

/**
 * Type guard for AlignItemsEnum
 */
export function isAlignItemsEnum(value: any): value is AlignItemsEnum {
    return isValidEnumValue(value, {
        start: "start",
        end: "end",
        center: "center",
        stretch: "stretch"
    });
}

/**
 * Type guard for JustifyContentEnum
 */
export function isJustifyContentEnum(value: any): value is JustifyContentEnum {
    return isValidEnumValue(value, {
        start: "start",
        end: "end",
        center: "center",
        stretch: "stretch",
        spaceBetween: "spaceBetween",
        spaceAround: "spaceAround",
        spaceEvenly: "spaceEvenly"
    });
}

/**
 * Type guard for AlignContentEnum
 */
export function isAlignContentEnum(value: any): value is AlignContentEnum {
    return isValidEnumValue(value, {
        start: "start",
        end: "end",
        center: "center",
        stretch: "stretch",
        spaceBetween: "spaceBetween",
        spaceAround: "spaceAround",
        spaceEvenly: "spaceEvenly"
    });
}

/**
 * Type guard for JustifySelfEnum
 */
export function isJustifySelfEnum(value: any): value is JustifySelfEnum {
    return isValidEnumValue(value, {
        auto: "auto",
        start: "start",
        end: "end",
        center: "center",
        stretch: "stretch"
    });
}

/**
 * Type guard for AlignSelfEnum
 */
export function isAlignSelfEnum(value: any): value is AlignSelfEnum {
    return isValidEnumValue(value, {
        auto: "auto",
        start: "start",
        end: "end",
        center: "center",
        stretch: "stretch"
    });
}

/**
 * Type guard for RenderAsEnum
 */
export function isRenderAsEnum(value: any): value is RenderAsEnum {
    return isValidEnumValue(value, {
        auto: "auto",
        div: "div",
        section: "section",
        article: "article",
        header: "header",
        footer: "footer",
        nav: "nav",
        main: "main",
        aside: "aside"
    });
}

/**
 * Validate and cast props to RuntimeGridContainer
 * Ensures type safety at runtime
 */
export function validateRuntimeGridContainer(props: CSSGridContainerProps): RuntimeGridContainer {
    if (!props || typeof props !== "object") {
        throw new Error("Invalid props structure: props must be an object");
    }

    // Cast is safe after validation
    const runtimeProps = props as RuntimeGridContainer;

    // Validate enum properties if they exist
    if (runtimeProps.autoFlow && !isAutoFlowEnum(runtimeProps.autoFlow)) {
        console.warn(`Invalid autoFlow value: ${runtimeProps.autoFlow}, defaulting to "row"`);
        runtimeProps.autoFlow = "row";
    }

    if (runtimeProps.justifyItems && !isJustifyItemsEnum(runtimeProps.justifyItems)) {
        console.warn(`Invalid justifyItems value: ${runtimeProps.justifyItems}, defaulting to "stretch"`);
        runtimeProps.justifyItems = "stretch";
    }

    if (runtimeProps.alignItems && !isAlignItemsEnum(runtimeProps.alignItems)) {
        console.warn(`Invalid alignItems value: ${runtimeProps.alignItems}, defaulting to "stretch"`);
        runtimeProps.alignItems = "stretch";
    }

    if (runtimeProps.justifyContent && !isJustifyContentEnum(runtimeProps.justifyContent)) {
        console.warn(`Invalid justifyContent value: ${runtimeProps.justifyContent}, defaulting to "start"`);
        runtimeProps.justifyContent = "start";
    }

    if (runtimeProps.alignContent && !isAlignContentEnum(runtimeProps.alignContent)) {
        console.warn(`Invalid alignContent value: ${runtimeProps.alignContent}, defaulting to "stretch"`);
        runtimeProps.alignContent = "stretch";
    }

    return runtimeProps;
}

/**
 * Validate and cast props to RuntimeGridContainerPreview
 * Ensures type safety at runtime for preview components
 */
export function validateRuntimeGridContainerPreview(props: CSSGridPreviewProps): RuntimeGridContainerPreview {
    if (!props || typeof props !== "object") {
        throw new Error("Invalid props structure: props must be an object");
    }

    // Cast is safe after validation
    const runtimeProps = props as RuntimeGridContainerPreview;

    // Validate enum properties using the same logic as runtime container
    if (runtimeProps.autoFlow && !isAutoFlowEnum(runtimeProps.autoFlow)) {
        console.warn(`Invalid autoFlow value: ${runtimeProps.autoFlow}, defaulting to "row"`);
        runtimeProps.autoFlow = "row";
    }

    if (runtimeProps.justifyItems && !isJustifyItemsEnum(runtimeProps.justifyItems)) {
        console.warn(`Invalid justifyItems value: ${runtimeProps.justifyItems}, defaulting to "stretch"`);
        runtimeProps.justifyItems = "stretch";
    }

    if (runtimeProps.alignItems && !isAlignItemsEnum(runtimeProps.alignItems)) {
        console.warn(`Invalid alignItems value: ${runtimeProps.alignItems}, defaulting to "stretch"`);
        runtimeProps.alignItems = "stretch";
    }

    if (runtimeProps.justifyContent && !isJustifyContentEnum(runtimeProps.justifyContent)) {
        console.warn(`Invalid justifyContent value: ${runtimeProps.justifyContent}, defaulting to "start"`);
        runtimeProps.justifyContent = "start";
    }

    if (runtimeProps.alignContent && !isAlignContentEnum(runtimeProps.alignContent)) {
        console.warn(`Invalid alignContent value: ${runtimeProps.alignContent}, defaulting to "stretch"`);
        runtimeProps.alignContent = "stretch";
    }

    return runtimeProps;
}

/**
 * Validate and cast item to RuntimeGridItem
 */
export function validateRuntimeGridItem(item: any): RuntimeGridItem {
    if (!item || typeof item !== "object") {
        throw new Error("Invalid item structure: item must be an object");
    }

    const runtimeItem = item as RuntimeGridItem;

    // Validate enum properties if they exist
    if (runtimeItem.justifySelf && !isJustifySelfEnum(runtimeItem.justifySelf)) {
        console.warn(`Invalid justifySelf value: ${runtimeItem.justifySelf}, defaulting to "auto"`);
        runtimeItem.justifySelf = "auto";
    }

    if (runtimeItem.alignSelf && !isAlignSelfEnum(runtimeItem.alignSelf)) {
        console.warn(`Invalid alignSelf value: ${runtimeItem.alignSelf}, defaulting to "auto"`);
        runtimeItem.alignSelf = "auto";
    }

    return runtimeItem;
}

/**
 * Validate and cast item to RuntimeGridItemPreview
 */
export function validateRuntimeGridItemPreview(item: any): RuntimeGridItemPreview {
    if (!item || typeof item !== "object") {
        throw new Error("Invalid item structure: item must be an object");
    }

    const runtimeItem = item as RuntimeGridItemPreview;

    // Validate enum properties if they exist
    if (runtimeItem.justifySelf && !isJustifySelfEnum(runtimeItem.justifySelf)) {
        console.warn(`Invalid justifySelf value: ${runtimeItem.justifySelf}, defaulting to "auto"`);
        runtimeItem.justifySelf = "auto";
    }

    if (runtimeItem.alignSelf && !isAlignSelfEnum(runtimeItem.alignSelf)) {
        console.warn(`Invalid alignSelf value: ${runtimeItem.alignSelf}, defaulting to "auto"`);
        runtimeItem.alignSelf = "auto";
    }

    return runtimeItem;
}

/**
 * Safely get a dynamic property value with type validation
 */
export function getSafeEnumValue<T extends Record<string, any>, K extends keyof T>(
    obj: T,
    key: K,
    validator: (value: any) => boolean,
    defaultValue: any
): any {
    const value = obj[key];
    if (value === undefined || value === null) {
        return undefined;
    }
    return validator(value) ? value : defaultValue;
}

/**
 * Create a typed property key with validation
 */
export function createTypedPropertyKey<T>(prefix: string, property: string): keyof T {
    return `${prefix}${property}` as keyof T;
}

/**
 * Type-safe property accessor for dynamic breakpoint properties
 */
export function getBreakpointProperty<T extends Record<string, any>>(
    obj: T,
    breakpoint: string,
    property: string
): any {
    const key = createTypedPropertyKey<T>(breakpoint, property);
    return obj[key];
}

/**
 * Validate CSS property value for dynamic styles
 */
export function isValidCSSProperty(property: string): boolean {
    const allowedProperties = [
        "width",
        "height",
        "margin",
        "marginTop",
        "marginRight",
        "marginBottom",
        "marginLeft",
        "padding",
        "paddingTop",
        "paddingRight",
        "paddingBottom",
        "paddingLeft",
        "border",
        "borderTop",
        "borderRight",
        "borderBottom",
        "borderLeft",
        "borderWidth",
        "borderStyle",
        "borderColor",
        "borderRadius",
        "backgroundColor",
        "color",
        "fontSize",
        "fontWeight",
        "fontFamily",
        "textAlign",
        "textDecoration",
        "lineHeight",
        "letterSpacing",
        "opacity",
        "visibility",
        "display",
        "position",
        "top",
        "right",
        "bottom",
        "left",
        "zIndex",
        "overflow",
        "overflowX",
        "overflowY",
        "boxSizing",
        "flexDirection",
        "flexWrap",
        "justifyContent",
        "alignItems",
        "alignContent",
        "gridTemplateColumns",
        "gridTemplateRows",
        "gridGap",
        "gap",
        "transform",
        "transition",
        "animation",
        "boxShadow",
        "textShadow"
    ];

    return allowedProperties.includes(property);
}

/**
 * Type-safe style setter
 */
export function setTypeSafeStyle(styles: CSSProperties, property: string, value: string): void {
    if (isValidCSSProperty(property)) {
        (styles as Record<string, any>)[property] = value;
    } else {
        console.warn(`Attempted to set unsafe CSS property: ${property}`);
    }
}
