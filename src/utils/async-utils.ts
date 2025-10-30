// Async utilities for the Smart Search component
// This module provides reusable async operations to eliminate code duplication

import { SHARED_CONSTANTS } from './constants.js';
import { logWarn } from './logger.js';

// Utility class for async operations
export class AsyncUtils {
    static async fetchWithTimeout(url: string, timeout: number = SHARED_CONSTANTS.TIMEOUTS.DEFAULT_FETCH): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    // Creates a debounced function that delays invoking the provided function
    static createDebouncer<T extends (...args: any[]) => void>(
        callback: T, 
        delay: number = SHARED_CONSTANTS.TIMEOUTS.DEBOUNCE_MIN
    ): (...args: Parameters<T>) => void {
        let timeoutId: number;
        
        return (...args: Parameters<T>) => {
            clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => callback.apply(this, args), delay);
        };
    }

    // Creates a timeout promise that rejects after the specified delay
    static createTimeoutPromise(delay: number, message: string = 'Operation timed out'): Promise<never> {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error(message)), delay);
        });
    }

    // Race a promise against a timeout
    static async withTimeout<T>(
        promise: Promise<T>, 
        timeout: number, 
        timeoutMessage?: string
    ): Promise<T> {
        return Promise.race([
            promise,
            AsyncUtils.createTimeoutPromise(timeout, timeoutMessage)
        ]);
    }

    // Delays execution for the specified number of milliseconds
    static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Retries an async operation with exponential backoff
    static async retry<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        baseDelay: number = 1000
    ): Promise<T> {
        let lastError: Error;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                
                if (attempt === maxRetries) {
                    break;
                }
                
                const delay = baseDelay * Math.pow(2, attempt);
                logWarn(`Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`, 'AsyncUtils.retry');
                await AsyncUtils.delay(delay);
            }
        }
        
        throw lastError!;
    }
}

// Type definitions for async utilities
export type DebouncedFunction<T extends (...args: any[]) => void> = (...args: Parameters<T>) => void;
export type AsyncOperation<T> = () => Promise<T>;
