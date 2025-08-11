/**
 * Simplified Performance Debugging for CSS Grid Widget
 *
 * Tracks only essential metrics:
 * - Initial render time
 * - Item re-renders
 * - Virtualization changes
 */

import { useEffect, useRef, useCallback } from "react";

/**
 * Simple performance metrics
 */
export interface IPerformanceMetrics {
    initialRenderTime: number;
    itemRenderCounts: Map<number, number>;
    virtualizationChanges: number;
}

/**
 * Simplified hook to track essential performance metrics
 */
export function usePerformanceDebugger(
    componentName: string,
    debugMode: boolean,
    logToConsole: boolean = true,
    trackItemRenders: boolean = false
): {
    metrics: IPerformanceMetrics | null;
    trackBreakpointChange: () => void;
    trackVirtualizationUpdate: () => void;
    trackItemRender: (index: number) => void;
    resetMetrics: () => void;
    getPerformanceReport: () => string;
} {
    // Simple refs for tracking
    const itemRenderCountsRef = useRef<Map<number, number>>(new Map());
    const virtualizationChangesRef = useRef<number>(0);
    const initialRenderTimeRef = useRef<number>(0);
    const mountTimeRef = useRef<number>(0);

    // Track initial render time
    useEffect(() => {
        if (!debugMode) return;

        mountTimeRef.current = performance.now();

        // Measure after first paint
        requestAnimationFrame(() => {
            initialRenderTimeRef.current = performance.now() - mountTimeRef.current;

            if (logToConsole) {
                console.debug(`[${componentName}] Initial render: ${initialRenderTimeRef.current.toFixed(2)}ms`);
            }
        });
    }, []); // Only on mount

    /**
     * Track virtualization updates
     */
    const trackVirtualizationUpdate = useCallback(() => {
        if (!debugMode) return;

        virtualizationChangesRef.current++;

        if (logToConsole) {
            console.debug(`[${componentName}] Virtualization update #${virtualizationChangesRef.current}`);
        }
    }, [debugMode, logToConsole, componentName]);

    /**
     * Track individual item renders
     */
    const trackItemRender = useCallback(
        (index: number) => {
            if (!debugMode || !trackItemRenders) return;

            const currentCount = itemRenderCountsRef.current.get(index) || 0;
            itemRenderCountsRef.current.set(index, currentCount + 1);

            // Log warning for items that render too many times
            if (currentCount + 1 === 10 && logToConsole) {
                console.warn(`[${componentName}] Item ${index} has rendered 10 times`);
            }
        },
        [debugMode, trackItemRenders, logToConsole, componentName]
    );

    /**
     * No-op for backwards compatibility
     */
    const trackBreakpointChange = useCallback(() => {
        // Removed - not essential for debugging
    }, []);

    /**
     * Reset metrics
     */
    const resetMetrics = useCallback(() => {
        if (!debugMode) return;

        itemRenderCountsRef.current.clear();
        virtualizationChangesRef.current = 0;
    }, [debugMode]);

    /**
     * Generate simple performance report
     */
    const getPerformanceReport = useCallback((): string => {
        if (!debugMode) return "Debug mode disabled";

        const report = [
            `=== ${componentName} Performance Report ===`,
            `Initial Render: ${initialRenderTimeRef.current.toFixed(2)}ms`,
            `Virtualization Updates: ${virtualizationChangesRef.current}`
        ];

        if (trackItemRenders && itemRenderCountsRef.current.size > 0) {
            report.push("");
            report.push("Item Render Counts:");

            // Only show items that rendered more than once
            Array.from(itemRenderCountsRef.current.entries())
                .filter(([_, count]) => count > 1)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .forEach(([index, count]) => {
                    report.push(`  - Item ${index}: ${count} renders`);
                });
        }

        return report.join("\n");
    }, [debugMode, componentName, trackItemRenders]);

    // Log final report on unmount
    useEffect(() => {
        if (!debugMode) return;

        return () => {
            // Only log if we have meaningful data
            if (logToConsole && (virtualizationChangesRef.current > 0 || itemRenderCountsRef.current.size > 0)) {
                console.debug(`[${componentName}] Unmounting - Final report:`);
                console.log(getPerformanceReport());
            }
        };
    }, []); // Empty deps - only on unmount

    // Return simplified metrics
    const metrics: IPerformanceMetrics | null = debugMode
        ? {
              initialRenderTime: initialRenderTimeRef.current,
              itemRenderCounts: itemRenderCountsRef.current,
              virtualizationChanges: virtualizationChangesRef.current
          }
        : null;

    return {
        metrics,
        trackBreakpointChange,
        trackVirtualizationUpdate,
        trackItemRender,
        resetMetrics,
        getPerformanceReport
    };
}

/**
 * Hook to track why a component re-rendered
 * Simplified version - only logs in debug mode
 */
export function useRenderTracker(componentName: string, props: Record<string, any>, debugMode: boolean): void {
    const previousPropsRef = useRef<Record<string, any>>();

    useEffect(() => {
        if (!debugMode) return;

        if (previousPropsRef.current) {
            const changes: string[] = [];

            Object.keys(props).forEach(key => {
                if (props[key] !== previousPropsRef.current![key]) {
                    changes.push(key);
                }
            });

            if (changes.length > 0) {
                console.debug(`[${componentName}] Re-rendered due to props:`, changes);
            }
        }

        previousPropsRef.current = { ...props };
    });
}

/**
 * Removed PerformanceOverlay component
 * React DevTools provides better visualization
 */
