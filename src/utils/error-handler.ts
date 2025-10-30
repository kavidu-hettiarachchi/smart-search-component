// Centralized error handling utility for the Smart Search Component

import { logError, logWarn } from './logger.js';

// Error severity levels
export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

// Error categories
export enum ErrorCategory {
    DATA_LOAD = 'data-load',
    CONFIGURATION = 'configuration',
    RENDER = 'render',
    EVENT_HANDLER = 'event-handler',
    NETWORK = 'network',
    VALIDATION = 'validation'
}

// Error context interface
export interface ErrorContext {
    readonly category: ErrorCategory;
    readonly severity: ErrorSeverity;
    readonly component: string;
    readonly method?: string;
    readonly userMessage?: string;
    readonly recoverable: boolean;
    readonly metadata?: Record<string, unknown>;
}

// Handled error interface
export interface HandledError {
    readonly originalError: Error;
    readonly context: ErrorContext;
    readonly timestamp: string;
    readonly id: string;
}

// Factory class for creating standardized errors
// Eliminates duplication of error creation patterns across the codebase
export class ErrorFactory {
    static createSmartSearchError(type: string, message: string): Error {
        return new Error(`[SmartSearch] ${type}: ${message}`);
    }

    // Creates a timeout error with consistent formatting
    static createTimeoutError(operation: string, timeout: number): Error {
        return new Error(`[SmartSearch] Timeout: ${operation} exceeded ${timeout}ms`);
    }

    // Creates a validation error with consistent formatting
    static createValidationError(field: string, value: any, constraint?: string): Error {
        const constraintText = constraint ? ` (${constraint})` : '';
        return new Error(`[SmartSearch] Validation: Invalid ${field} value: ${value}${constraintText}`);
    }

    // Creates a network error with consistent formatting
    static createNetworkError(operation: string, status?: number, statusText?: string): Error {
        const statusInfo = status ? ` (HTTP ${status}${statusText ? `: ${statusText}` : ''})` : '';
        return new Error(`[SmartSearch] Network: ${operation} failed${statusInfo}`);
    }

    // Creates a configuration error with consistent formatting
    static createConfigurationError(setting: string, value: any, expected?: string): Error {
        const expectedText = expected ? `, expected: ${expected}` : '';
        return new Error(`[SmartSearch] Configuration: Invalid ${setting} = ${value}${expectedText}`);
    }

    // Creates a render error with consistent formatting
    static createRenderError(component: string, reason: string): Error {
        return new Error(`[SmartSearch] Render: Failed to render ${component} - ${reason}`);
    }

    // Wraps an existing error with SmartSearch context
    static wrapError(originalError: Error, context: string): Error {
        return new Error(`[SmartSearch] ${context}: ${originalError.message}`);
    }
}

// Error handler singleton class
class ErrorHandler {
    private static instance: ErrorHandler;
    private errorHistory: HandledError[] = [];
    private readonly maxHistorySize: number = 50;
    private errorListeners: ((error: HandledError) => void)[] = [];

    private constructor() {}

    public static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    public handle(error: Error, context: ErrorContext): HandledError {
        const handledError: HandledError = {
            originalError: error,
            context,
            timestamp: new Date().toISOString(),
            id: this.generateErrorId()
        };

        this.addToHistory(handledError);
        this.logError(handledError);
        this.notifyListeners(handledError);

        return handledError;
    }

    public handleAsync(
        promise: Promise<unknown>,
        context: ErrorContext,
        fallbackValue?: unknown
    ): Promise<unknown> {
        return promise.catch((error) => {
            this.handle(error, context);
            if (fallbackValue !== undefined) {
                return fallbackValue;
            }
            throw error;
        });
    }

    public wrapMethod<T extends (...args: unknown[]) => unknown>(
        method: T,
        context: Omit<ErrorContext, 'method'>
    ): T {
        const methodName = method.name || 'anonymous';
        const fullContext = { ...context, method: methodName };
        
        return ((...args: unknown[]) => {
            try {
                const result = method(...args);
                if (result instanceof Promise) {
                    return this.handleAsync(result, fullContext);
                }
                return result;
            } catch (error) {
                this.handle(error as Error, fullContext);
                throw error;
            }
        }) as T;
    }

    public createError(
        message: string,
        context: ErrorContext,
        originalError?: Error
    ): Error {
        const error = new Error(message);
        error.name = `${context.category.toUpperCase()}_ERROR`;
        // Store original error in a custom property for compatibility
        (error as unknown as { originalError?: Error }).originalError = originalError;
        return error;
    }

    public isRecoverable(error: HandledError): boolean {
        return error.context.recoverable;
    }

    public getSeverityLevel(error: HandledError): ErrorSeverity {
        return error.context.severity;
    }

    public addErrorListener(listener: (error: HandledError) => void): void {
        this.errorListeners.push(listener);
    }

    public removeErrorListener(listener: (error: HandledError) => void): void {
        const index = this.errorListeners.indexOf(listener);
        if (index > -1) {
            this.errorListeners.splice(index, 1);
        }
    }

    public getErrorHistory(): readonly HandledError[] {
        return [...this.errorHistory];
    }

    public clearHistory(): void {
        this.errorHistory = [];
    }

    private addToHistory(error: HandledError): void {
        this.errorHistory.push(error);
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory.shift();
        }
    }

    private logError(error: HandledError): void {
        const context = `${error.context.component}${error.context.method ? '.' + error.context.method : ''}`;
        const message = `[${error.context.category}] ${error.originalError.message}`;
        
        if (error.context.severity === ErrorSeverity.CRITICAL || error.context.severity === ErrorSeverity.HIGH) {
            logError(message, context, error.originalError, {
                severity: error.context.severity,
                recoverable: error.context.recoverable,
                metadata: error.context.metadata
            });
        } else {
            logWarn(message, context, {
                severity: error.context.severity,
                recoverable: error.context.recoverable,
                metadata: error.context.metadata
            });
        }
    }

    private notifyListeners(error: HandledError): void {
        this.errorListeners.forEach(listener => {
            try {
                listener(error);
            } catch (listenerError) {
                console.error('Error in error listener:', listenerError);
            }
        });
    }

    private generateErrorId(): string {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export const handleError = (error: Error, context: ErrorContext): HandledError =>
    errorHandler.handle(error, context);

export const handleAsyncError = (
    promise: Promise<unknown>,
    context: ErrorContext,
    fallbackValue?: unknown
): Promise<unknown> =>
    errorHandler.handleAsync(promise, context, fallbackValue);

export const wrapMethod = <T extends (...args: unknown[]) => unknown>(
    method: T,
    context: Omit<ErrorContext, 'method'>
): T =>
    errorHandler.wrapMethod(method, context);

export const createError = (
    message: string,
    context: ErrorContext,
    originalError?: Error
): Error =>
    errorHandler.createError(message, context, originalError);
