/**
 * Mendix Environment Detection Utilities
 *
 * Provides methods to detect the current Mendix environment
 * without relying on Node.js process.env
 */

declare global {
    interface Window {
        mx: {
            appUrl: string;
            baseUrl: string;
            remoteUrl: string;
            isOffline?: boolean;
        };
    }
}

/**
 * Mendix environment types
 */
export enum MendixEnvironment {
    LOCAL = "local",
    DEVELOPMENT = "development",
    TEST = "test",
    ACCEPTANCE = "acceptance",
    PRODUCTION = "production",
    SANDBOX = "sandbox"
}

/**
 * Detects the current Mendix environment based on URL patterns
 */
export function getMendixEnvironment(): MendixEnvironment {
    try {
        // Check if mx object exists
        if (typeof window !== "undefined" && window.mx && window.mx.appUrl) {
            const appUrl = window.mx.appUrl.toLowerCase();

            // Local development (Mendix Studio Pro)
            if (appUrl.includes("localhost:8080") || appUrl.includes("127.0.0.1:8080")) {
                return MendixEnvironment.LOCAL;
            }

            // Mendix sandbox environment
            if (appUrl.includes(".mxapps.io") || appUrl.includes("sandbox")) {
                return MendixEnvironment.SANDBOX;
            }

            // Development environment
            if (appUrl.includes("-dev") || appUrl.includes("development")) {
                return MendixEnvironment.DEVELOPMENT;
            }

            // Test environment
            if (appUrl.includes("-test") || appUrl.includes("testing")) {
                return MendixEnvironment.TEST;
            }

            // Acceptance environment
            if (appUrl.includes("-accp") || appUrl.includes("-acc") || appUrl.includes("acceptance")) {
                return MendixEnvironment.ACCEPTANCE;
            }

            // Default to production for any other URL
            return MendixEnvironment.PRODUCTION;
        }

        // Fallback to local if mx object is not available
        return MendixEnvironment.LOCAL;
    } catch {
        // If any error occurs, assume local environment
        return MendixEnvironment.LOCAL;
    }
}

/**
 * Checks if the current environment is a development environment
 * (local, development, test, or sandbox)
 */
export function isDevelopmentEnvironment(): boolean {
    const env = getMendixEnvironment();
    return [
        MendixEnvironment.LOCAL,
        MendixEnvironment.DEVELOPMENT,
        MendixEnvironment.TEST,
        MendixEnvironment.SANDBOX
    ].includes(env);
}

/**
 * Checks if the current environment is a production environment
 * (acceptance or production)
 */
export function isProductionEnvironment(): boolean {
    const env = getMendixEnvironment();
    return [MendixEnvironment.ACCEPTANCE, MendixEnvironment.PRODUCTION].includes(env);
}

/**
 * Gets a human-readable environment name
 */
export function getEnvironmentDisplayName(): string {
    const env = getMendixEnvironment();

    switch (env) {
        case MendixEnvironment.LOCAL:
            return "Local Development";
        case MendixEnvironment.DEVELOPMENT:
            return "Development";
        case MendixEnvironment.TEST:
            return "Test";
        case MendixEnvironment.ACCEPTANCE:
            return "Acceptance";
        case MendixEnvironment.PRODUCTION:
            return "Production";
        case MendixEnvironment.SANDBOX:
            return "Sandbox";
        default:
            return "Unknown";
    }
}
