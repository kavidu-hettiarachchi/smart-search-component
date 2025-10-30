// Centralized utility functions for the Smart Search Component

import { SHARED_CONSTANTS } from './constants.js';

// Component configuration interface
export interface ComponentConfig {
    readonly placeholder: string;
    readonly minSearchLength: number;
    readonly debounceDelay: number;
    readonly maxResults: number;
    readonly enableFilters: boolean;
    readonly highlightMatches: boolean;
    readonly dataEndpoint: string;
}

// Error type enumeration
export enum ErrorType {
    DATA_LOAD_FAILED = 'DATA_LOAD_FAILED',
    INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
    RENDER_FAILED = 'RENDER_FAILED',
    EVENT_HANDLER_FAILED = 'EVENT_HANDLER_FAILED'
}

// Default configuration
export const DEFAULT_CONFIG: ComponentConfig = {
    placeholder: 'Search accounts, customers, and transactions...',
    minSearchLength: 2,
    debounceDelay: 300,
    maxResults: 10,
    enableFilters: true,
    highlightMatches: true,
    dataEndpoint: './data'
} as const;

// Validates component configuration
export function validateConfig(config: Partial<ComponentConfig>): ComponentConfig {
    return {
        placeholder: config.placeholder || DEFAULT_CONFIG.placeholder,
        minSearchLength: Math.max(
            SHARED_CONSTANTS.VALIDATION.MIN_CONFIG_VALUE,
            config.minSearchLength || DEFAULT_CONFIG.minSearchLength
        ),
        debounceDelay: Math.max(
            SHARED_CONSTANTS.VALIDATION.MIN_DEBOUNCE_DELAY,
            config.debounceDelay || DEFAULT_CONFIG.debounceDelay
        ),
        maxResults: Math.max(
            SHARED_CONSTANTS.VALIDATION.MIN_CONFIG_VALUE,
            config.maxResults || DEFAULT_CONFIG.maxResults
        ),
        enableFilters: config.enableFilters ?? DEFAULT_CONFIG.enableFilters,
        highlightMatches: config.highlightMatches ?? DEFAULT_CONFIG.highlightMatches,
        dataEndpoint: config.dataEndpoint || DEFAULT_CONFIG.dataEndpoint
    };
}

// Escapes HTML characters to prevent XSS
export function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Highlights matching text in search results
export function highlightText(text: string, query: string): string {
    if (!query.trim()) return escapeHtml(text);

    const escapedText = escapeHtml(text);
    const escapedQuery = escapeHtml(query);
    const regex = new RegExp(`(${escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

    return escapedText.replace(regex, '<mark>$1</mark>');
}

// Formats currency values
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Formats date strings
export function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    } catch {
        return dateString;
    }
}

// Type-safe search matching function with improved relevance filtering
export function matchesSearch<T extends Record<string, unknown>>(
    item: T,
    query: string,
    fields: (keyof T)[]
): boolean {
    const normalizedQuery = query.toLowerCase().trim();

    // Return false for empty queries
    if (!normalizedQuery) return false;

    return fields.some(field => {
        const value = item[field];
        if (value === null || value === undefined) return false;

        const normalizedValue = String(value).toLowerCase();

        // For better search relevance, implement multiple matching strategies:

        // Exact match (highest priority)
        if (normalizedValue === normalizedQuery) return true;

        // Starts with match (high priority for names, titles, etc.)
        if (normalizedValue.startsWith(normalizedQuery)) return true;

        // Word boundary match (for multi-word fields)
        const words = normalizedValue.split(/\s+/);
        if (words.some(word => word.startsWith(normalizedQuery))) return true;

        // For numeric queries, be more strict with ID fields
        if (/^\d+$/.test(normalizedQuery)) {
            const fieldName = String(field).toLowerCase();

            // For ID fields, only match if the query appears at word boundaries or end of string
            if (fieldName.includes('id') || fieldName.includes('number')) {
                // Match if query appears at the end (like account numbers ending in digits)
                if (normalizedValue.endsWith(normalizedQuery)) return true;

                // Match if query appears after a non-digit character (like "CUST-123")
                const regex = new RegExp(`[^\\d]${normalizedQuery}(?:[^\\d]|$)`);
                if (regex.test(normalizedValue)) return true;

                // Don't match partial digits in the middle of longer numbers
                return false;
            }
        }

        // For non-ID fields, allow contains match but with minimum length requirement
        if (normalizedQuery.length >= 3) {
            return normalizedValue.includes(normalizedQuery);
        }

        return false;
    });
}