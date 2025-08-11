/**
 * Error Boundary for CSS Grid Widget
 *
 * Provides graceful error handling and recovery for the grid component
 */

import { Component, ReactNode, ErrorInfo, createElement } from "react";
import { isDevelopmentEnvironment } from "../utils/mendixEnvironment";

interface IErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    gridName?: string;
}

interface IErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class GridErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
    constructor(props: IErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): IErrorBoundaryState {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to console in development
        if (isDevelopmentEnvironment()) {
            console.error("[CSS Grid Error]:", error);
            console.error("Component Stack:", errorInfo.componentStack);
        }

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Update state with error info
        this.setState({
            error,
            errorInfo
        });
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div
                    className="css-grid-error-boundary"
                    style={{
                        padding: "20px",
                        backgroundColor: "#f8f8f8",
                        border: "1px solid #e0e0e0",
                        borderRadius: "4px",
                        textAlign: "center",
                        color: "#666"
                    }}
                >
                    <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>Grid Error</h3>
                    <p style={{ margin: "0" }}>
                        {this.props.gridName
                            ? `The ${this.props.gridName} grid encountered an error.`
                            : "The grid encountered an error."}
                    </p>
                    {isDevelopmentEnvironment() && this.state.error && (
                        <details style={{ marginTop: "10px", textAlign: "left" }}>
                            <summary style={{ cursor: "pointer" }}>Error Details</summary>
                            <pre
                                style={{
                                    fontSize: "12px",
                                    overflow: "auto",
                                    padding: "10px",
                                    backgroundColor: "#fff",
                                    border: "1px solid #ddd",
                                    borderRadius: "4px",
                                    marginTop: "10px"
                                }}
                            >
                                {this.state.error.toString()}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
