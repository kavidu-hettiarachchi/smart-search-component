// Validation Utilities
// Provides reusable validation and data sanitization functions

import { SHARED_CONSTANTS } from './constants.js';

// Result of a validation operation
export interface ValidationResult {
    // Whether the validation passed
    readonly isValid: boolean;

    // The validated value (may be transformed)
    readonly value: unknown;

    // Error message if validation failed
    readonly error?: string;
}

// Represents a visible range for virtual scrolling
export interface VisibleRange {
    // Starting index of visible items
    readonly startIndex: number;

    // Ending index of visible items
    readonly endIndex: number;
}

// Utility class for validation and math operations
export class ValidationUtils {

    // Clamps a value between minimum and maximum bounds
    static clampValue(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    // Ensures a value is at least the minimum required
    static ensureMinimum(value: number, min: number): number {
        return Math.max(min, value);
    }

    // Ensures a value does not exceed the maximum allowed
    static ensureMaximum(value: number, max: number): number {
        return Math.min(max, value);
    }

    // Validates that a number is within acceptable bounds
    static isWithinBounds(value: number, min: number, max: number): boolean {
        return value >= min && value <= max;
    }

    // Validates an array index is within bounds
    static isValidIndex(index: number, arrayLength: number): boolean {
        return index >= 0 && index < arrayLength;
    }

    // Validates that a string is not empty after trimming
    static isNonEmptyString(value: string): boolean {
        return value.trim().length > 0;
    }

    // Normalizes a search query by converting to lowercase and trimming whitespace
    static normalizeSearchQuery(query: string): string {
        return query.toLowerCase().trim();
    }

    // Validates that a search query meets minimum length requirements
    static isValidSearchQuery(
        query: string,
        minLength: number = SHARED_CONSTANTS.VALIDATION.MIN_SEARCH_LENGTH
    ): boolean {
        return ValidationUtils.isNonEmptyString(query) &&
            query.trim().length >= minLength;
    }

    // Checks if a value matches a search query (case-insensitive)
    static matchesQuery(value: string, query: string): boolean {
        const normalizedValue = ValidationUtils.normalizeSearchQuery(value);
        const normalizedQuery = ValidationUtils.normalizeSearchQuery(query);
        return normalizedValue.includes(normalizedQuery);
    }

    // Sanitizes a string by removing potentially harmful characters
    static sanitizeString(input: string): string {
        return input.replace(/[<>'"&]/g, '');
    }

    // Parses an integer with a fallback value if parsing fails
    static parseIntWithFallback(value: string, fallback: number): number {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? fallback : parsed;
    }

    // Parses a float with a fallback value if parsing fails
    static parseFloatWithFallback(value: string, fallback: number): number {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? fallback : parsed;
    }

    // Validates configuration values and applies defaults/constraints
    static validateConfigValue(
        value: number | undefined,
        defaultValue: number,
        min: number,
        max?: number
    ): number {
        if (value === undefined || isNaN(value)) {
            return defaultValue;
        }

        let validatedValue = ValidationUtils.ensureMinimum(value, min);

        if (max !== undefined) {
            validatedValue = ValidationUtils.ensureMaximum(validatedValue, max);
        }

        return validatedValue;
    }

    // Calculates visible range for virtual scrolling
    static calculateVisibleRange(
        scrollTop: number,
        itemHeight: number,
        containerHeight: number,
        totalItems: number,
        buffer: number = SHARED_CONSTANTS.PERFORMANCE.VIRTUAL_SCROLL_BUFFER
    ): VisibleRange {
        // Calculate the first visible item index (with buffer)
        const visibleStart = Math.max(
            0,
            Math.floor(scrollTop / itemHeight) - buffer
        );

        // Calculate number of visible items (plus buffers)
        const visibleCount = Math.ceil(containerHeight / itemHeight) + (buffer * 2);

        // Calculate the last visible item index (capped at totalItems)
        const visibleEnd = Math.min(
            totalItems,
            visibleStart + visibleCount
        );

        return {
            startIndex: visibleStart,
            endIndex: visibleEnd
        };
    }
}