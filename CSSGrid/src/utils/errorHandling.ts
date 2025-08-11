/**
 * Error Handling Utilities for CSS Grid
 *
 * Provides consistent error handling, logging, and recovery mechanisms
 */

import { isDevelopmentEnvironment } from "./mendixEnvironment";

/**
 * Error severity levels
 */
export enum ErrorSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}

/**
 * Grid-specific error types
 */
export enum GridErrorType {
    CONFIGURATION = "configuration",
    RENDER = "render",
    PLACEMENT = "placement",
    RESPONSIVE = "responsive",
    VIRTUALIZATION = "virtualization",
    PERFORMANCE = "performance"
}

/**
 * Custom error class for grid-specific errors
 */
export class GridError extends Error {
    constructor(
        message: string,
        public type: GridErrorType,
        public severity: ErrorSeverity = ErrorSeverity.ERROR,
        public details?: Record<string, any>
    ) {
        super(message);
        this.name = "GridError";

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, GridError);
        }
    }
}

/**
 * Safe error logger that respects environment
 */
export function logGridError(error: Error | GridError, context?: string, additionalData?: Record<string, any>): void {
    // In production, use console.debug to avoid polluting user console
    const logMethod = isDevelopmentEnvironment() ? console.error : console.debug;

    const errorInfo = {
        message: error.message,
        type: error instanceof GridError ? error.type : "unknown",
        severity: error instanceof GridError ? error.severity : ErrorSeverity.ERROR,
        context,
        details: error instanceof GridError ? error.details : undefined,
        additionalData,
        timestamp: new Date().toISOString()
    };

    logMethod("[CSS Grid Error]", errorInfo);
}

/**
 * Validates grid configuration and throws descriptive errors
 */
export function validateGridConfiguration(config: {
    columns?: string;
    rows?: string;
    areas?: string;
    gap?: string;
}): void {
    // Validate grid template columns
    if (config.columns && config.columns.trim() === "") {
        throw new GridError("Grid template columns cannot be empty", GridErrorType.CONFIGURATION, ErrorSeverity.ERROR, {
            columns: config.columns
        });
    }

    // Validate grid template rows
    if (config.rows && config.rows.trim() === "") {
        throw new GridError("Grid template rows cannot be empty", GridErrorType.CONFIGURATION, ErrorSeverity.ERROR, {
            rows: config.rows
        });
    }

    // Validate grid areas format
    if (config.areas) {
        const areaLines = config.areas.trim().split(/\s*[\n\r]+\s*/);
        if (areaLines.length === 0) {
            throw new GridError(
                "Grid template areas cannot be empty",
                GridErrorType.CONFIGURATION,
                ErrorSeverity.ERROR,
                { areas: config.areas }
            );
        }

        // Check for consistent column count
        const columnCounts = areaLines.map(line => line.trim().split(/\s+/).length);
        const firstCount = columnCounts[0];
        if (!columnCounts.every(count => count === firstCount)) {
            throw new GridError(
                "Grid template areas must have consistent column count across all rows",
                GridErrorType.CONFIGURATION,
                ErrorSeverity.ERROR,
                {
                    areas: config.areas,
                    columnCounts,
                    expected: firstCount
                }
            );
        }
    }

    // Validate gap values
    if (
        config.gap &&
        !/^(\d+(\.\d+)?(px|em|rem|%|vh|vw)|0)(\s+(\d+(\.\d+)?(px|em|rem|%|vh|vw)|0))?$/.test(config.gap.trim())
    ) {
        throw new GridError(
            "Invalid gap value. Must be a valid CSS length value",
            GridErrorType.CONFIGURATION,
            ErrorSeverity.WARNING,
            { gap: config.gap }
        );
    }
}

/**
 * Safe wrapper for callbacks that might throw
 */
export function safeExecute<T>(callback: () => T, errorContext: string, fallbackValue?: T): T | undefined {
    try {
        return callback();
    } catch (error) {
        logGridError(error instanceof Error ? error : new Error(String(error)), errorContext);
        return fallbackValue;
    }
}

/**
 * Async version of safeExecute
 */
export async function safeExecuteAsync<T>(
    callback: () => Promise<T>,
    errorContext: string,
    fallbackValue?: T
): Promise<T | undefined> {
    try {
        return await callback();
    } catch (error) {
        logGridError(error instanceof Error ? error : new Error(String(error)), errorContext);
        return fallbackValue;
    }
}

/**
 * Validates item placement and provides helpful error messages
 */
export function validateItemPlacement(item: any, index: number, availableAreas?: Set<string>): void {
    if (!item) {
        throw new GridError(
            `Grid item at index ${index} is null or undefined`,
            GridErrorType.PLACEMENT,
            ErrorSeverity.ERROR,
            { index }
        );
    }

    // Validate area placement
    if (item.placementType === "area" && item.gridArea) {
        if (availableAreas && !availableAreas.has(item.gridArea)) {
            logGridError(
                new GridError(
                    `Grid area "${item.gridArea}" is not defined in the current grid configuration`,
                    GridErrorType.PLACEMENT,
                    ErrorSeverity.WARNING,
                    {
                        itemIndex: index,
                        requestedArea: item.gridArea,
                        availableAreas: Array.from(availableAreas)
                    }
                ),
                `Item ${index} placement validation`
            );
        }
    }

    // Validate coordinate placement
    if (item.placementType === "coordinates") {
        const coords = {
            columnStart: item.columnStart,
            columnEnd: item.columnEnd,
            rowStart: item.rowStart,
            rowEnd: item.rowEnd
        };

        // Check for invalid span values
        Object.entries(coords).forEach(([key, value]) => {
            if (value && typeof value === "string" && value.includes("span")) {
                const spanMatch = value.match(/span\s+(\d+)/);
                if (spanMatch) {
                    const spanValue = parseInt(spanMatch[1], 10);
                    if (spanValue <= 0 || spanValue > 1000) {
                        throw new GridError(
                            `Invalid span value in ${key}: ${value}. Span must be between 1 and 1000`,
                            GridErrorType.PLACEMENT,
                            ErrorSeverity.ERROR,
                            { itemIndex: index, [key]: value }
                        );
                    }
                }
            }
        });
    }
}

/**
 * Performance warning helper
 */
export function checkPerformanceThresholds(metrics: {
    itemCount: number;
    renderTime?: number;
    virtualizedItems?: number;
}): void {
    // Warn about large grids without virtualization
    if (metrics.itemCount > 500 && (!metrics.virtualizedItems || metrics.virtualizedItems === metrics.itemCount)) {
        logGridError(
            new GridError(
                `Grid contains ${metrics.itemCount} items without virtualization. Consider enabling virtualization for better performance.`,
                GridErrorType.PERFORMANCE,
                ErrorSeverity.WARNING,
                metrics
            ),
            "Performance check"
        );
    }

    // Warn about slow renders
    if (metrics.renderTime && metrics.renderTime > 100) {
        logGridError(
            new GridError(
                `Grid render took ${metrics.renderTime}ms, which may cause performance issues`,
                GridErrorType.PERFORMANCE,
                ErrorSeverity.WARNING,
                metrics
            ),
            "Render performance"
        );
    }
}
