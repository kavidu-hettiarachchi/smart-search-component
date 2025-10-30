/**
 * Smart Search Web Component for Banking Application
 * 
 * A reusable, accessible, and highly configurable search component built with TypeScript and Web Components.
 * Designed for banking applications but flexible enough for any domain requiring advanced search capabilities.
 * 
 * @version 1.0.0
 */

import {logWarn, logError} from '../utils/logger.js';
import {
    validateConfig,
    escapeHtml,
    highlightText,
    formatCurrency,
    formatDate,
    matchesSearch,
    ErrorType,
    type ComponentConfig
} from '../utils/component-utils.js';
import {
    createError,
    ErrorCategory,
    ErrorSeverity,
    ErrorFactory,
    type ErrorContext
} from '../utils/error-handler.js';
import {SHARED_CONSTANTS} from '../utils/constants.js';
import {AsyncUtils} from '../utils/async-utils.js';
import {ValidationUtils} from '../utils/validation-utils.js';

// Represents a search result item
interface SearchResult {
    readonly id: string;
    readonly type: SearchResultType;
    readonly title: string;
    readonly subtitle: string;
    readonly metadata?: string;
    readonly icon?: string;
    readonly rawData: AccountData | CustomerData | TransactionData;
}


// Search data structure containing all searchable entities
interface SearchData {
    accounts: AccountData[];
    customers: CustomerData[];
    transactions: TransactionData[];
}

// Account data structure
interface AccountData extends Record<string, unknown> {
    readonly id: string;
    readonly title: string;
    readonly accountNumber: string;
    readonly balance: number;
    readonly type: string;
    readonly status: string;
}

// Customer data structure
interface CustomerData extends Record<string, unknown> {
    readonly id: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly customerId: string;
    readonly accountType: string;
    readonly totalAccounts: number;
}

// Transaction data structure
interface TransactionData extends Record<string, unknown> {
    readonly id: string;
    readonly transactionId: string;
    readonly merchant: string;
    readonly amount: number;
    readonly category: string;
    readonly type: string;
    readonly date: string;
    readonly description: string;
}

// Custom event detail interfaces
export interface DataLoadedEventDetail {
    readonly success: boolean;
}

export interface DataLoadErrorEventDetail {
    readonly error: Error;
}

export interface SearchPerformedEventDetail {
    readonly query: string;
    readonly resultCount: number;
    readonly activeTab: SearchTab;
}

export interface ResultSelectedEventDetail {
    readonly result: SearchResult;
}

export interface TabChangedEventDetail {
    readonly activeTab: SearchTab;
}

export interface ThemeChangedEventDetail {
    readonly theme: Theme;
}

// Interface for cached search results
interface CachedSearchResult {
    readonly query: string;
    readonly tab: SearchTab;
    readonly results: SearchResult[];
    readonly timestamp: number;
}

// Type definitions for better type safety
type SearchResultType = 'account' | 'customer' | 'transaction';
type SearchTab = 'all' | 'account' | 'customer' | 'transaction';
type Theme = 'light' | 'dark';
type KeyboardKey = 'ArrowDown' | 'ArrowUp' | 'Enter' | 'Escape' | 'Tab';

// CSS class names for consistent styling
const CSS_CLASSES = {
    SEARCH_CONTAINER: 'search-container',
    SEARCH_WRAPPER: 'search-wrapper',
    SEARCH_INPUT: 'search-input',
    SEARCH_ICON: 'search-icon',
    CLEAR_BUTTON: 'clear-button',
    DROPDOWN: 'dropdown',
    TABS_CONTAINER: 'tabs-container',
    TAB: 'tab',
    TAB_ACTIVE: 'active',
    TAB_ICON: 'tab-icon',
    RESULTS_CONTAINER: 'results-container',
    RESULTS_LIST: 'results-list',
    RESULT_ITEM: 'result-item',
    RESULT_SELECTED: 'selected',
    RESULT_HEADER: 'result-header',
    RESULT_ICON: 'result-icon',
    RESULT_CONTENT: 'result-content',
    RESULT_TITLE: 'result-title',
    RESULT_SUBTITLE: 'result-subtitle',
    RESULT_METADATA: 'result-metadata',
    NO_RESULTS: 'no-results',
    NO_RESULTS_ICON: 'no-results-icon',
    NO_RESULTS_TEXT: 'no-results-text',
    VISIBLE: 'visible',
    OPEN: 'open'
} as const;

// Custom event names
const EVENTS = {
    DATA_LOADED: 'data-loaded',
    DATA_LOAD_ERROR: 'data-load-error',
    SEARCH_PERFORMED: 'search-performed',
    RESULT_SELECTED: 'result-selected',
    TAB_CHANGED: 'tab-changed',
    DROPDOWN_OPENED: 'dropdown-opened',
    DROPDOWN_CLOSED: 'dropdown-closed',
    SEARCH_CLEARED: 'search-cleared',
    THEME_CHANGED: 'theme-changed'
} as const;

// Theme management constants
const THEME_STORAGE_KEY = 'smart-search-theme';
const DEFAULT_THEME: Theme = 'light';

// Icon mappings for different result types
const RESULT_ICONS = {
    account: 'fas fa-university',
    customer: 'fas fa-user',
    transaction: 'fas fa-exchange-alt',
    all: 'fas fa-th'
} as const;

// Smart Search Web Component
// A comprehensive search component that provides real-time search functionality
// with filtering, keyboard navigation, and accessibility features.
class SmartSearchComponent extends HTMLElement {

    private readonly shadow: ShadowRoot;
    private config: ComponentConfig;

    // DOM element references
    private searchInput: HTMLInputElement | null = null;
    private resultsContainer: HTMLElement | null = null;
    private tabsContainer: HTMLElement | null = null;
    private clearButton: HTMLElement | null = null;
    private dropdown: HTMLElement | null = null;

    // Cache for frequently accessed result items
    private cachedResultItems: NodeListOf<Element> | null = null;
    private resultItemsCacheValid: boolean = false;

    // Store bound handlers to prevent memory leaks
    private boundHandlers = {
        search: this.handleSearch.bind(this),
        keydown: this.handleKeyDown.bind(this),
        focus: this.handleFocus.bind(this),
        clear: this.handleClear.bind(this),
        tabClick: this.handleTabClick.bind(this),
        clickOutside: this.handleClickOutside.bind(this),
        resize: this.handleResize.bind(this),
        scroll: this.handleScroll.bind(this),
        resultClick: this.handleResultClick.bind(this),
        resultHover: this.handleResultHover.bind(this)
    };

    // Tab elements for cleanup
    private tabElements: Element[] = [];

    // Shadow keyboard handler for cleanup
    private shadowKeyboardHandler: ((event: Event) => void) | null = null;

    // Component State
    private searchData: SearchData = {
        accounts: [],
        customers: [],
        transactions: []
    };
    private filteredResults: SearchResult[] = [];
    private selectedIndex: number = SHARED_CONSTANTS.UI.DEFAULT_SELECTED_INDEX;
    private selectedResult: SearchResult | null = null;
    private activeTab: SearchTab = 'all';
    private isOpen: boolean = false;
    private searchDebouncer: ((query: string) => void) | null = null;

    // Theme management
    private currentTheme: Theme = DEFAULT_THEME;
    private externalThemeButton: HTMLElement | null = null;
    private boundThemeToggleHandler: (() => void) | null = null;

    // Caching properties for performance optimization
    private searchCache: Map<string, CachedSearchResult> = new Map();

    // Virtual scrolling properties
    private virtualScrollContainer: HTMLElement | null = null;
    private virtualScrollViewport: HTMLElement | null = null;
    private visibleStartIndex: number = 0;
    private visibleEndIndex: number = 0;
    private totalHeight: number = 0;

    // Creates a new SmartSearchComponent instance
    constructor() {
        super();
        this.shadow = this.attachShadow({mode: 'open'});
        this.config = validateConfig({});
    }

    // Observed attributes for reactive updates
    static get observedAttributes(): string[] {
        return ['placeholder', 'min-search-length', 'debounce-delay', 'max-results', 'data-endpoint', 'theme'];
    }

    // Called when the component is connected to the DOM
    async connectedCallback(): Promise<void> {
        try {
            await this.initializeComponent();
        } catch (error) {
            this.handleError(ErrorType.RENDER_FAILED, 'Failed to initialize component', error as Error);
        }
    }

    // Called when the component is disconnected from the DOM
    disconnectedCallback(): void {
        this.cleanup();
    }

    // Called when observed attributes change
    attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        if (oldValue === newValue) return;

        try {
            this.handleAttributeChange(name, newValue);
        } catch (error) {
            this.handleError(ErrorType.INVALID_CONFIGURATION, `Invalid attribute: ${name}`, error as Error);
        }
    }

    // Initializes the component
    private async initializeComponent(): Promise<void> {
        this.render();
        await this.loadData();
        this.initializeDemoFunctionality();
        this.attachEventListeners();
        this.initializeVirtualScrolling();
        this.initializeTheme();
    }

    // Handles attribute changes
    private handleAttributeChange(name: string, newValue: string): void {
        const configUpdate = {
            placeholder: this.config.placeholder,
            minSearchLength: this.config.minSearchLength,
            debounceDelay: this.config.debounceDelay,
            maxResults: this.config.maxResults,
            enableFilters: this.config.enableFilters,
            highlightMatches: this.config.highlightMatches,
            dataEndpoint: this.config.dataEndpoint
        };

        switch (name) {
            case 'placeholder':
                configUpdate.placeholder = newValue;
                if (this.searchInput) this.searchInput.placeholder = newValue;
                break;
            case 'min-search-length':
                configUpdate.minSearchLength = ValidationUtils.parseIntWithFallback(newValue, SHARED_CONSTANTS.DEFAULTS.FALLBACK_MIN_SEARCH);
                break;
            case 'debounce-delay':
                configUpdate.debounceDelay = ValidationUtils.parseIntWithFallback(newValue, SHARED_CONSTANTS.DEFAULTS.FALLBACK_DEBOUNCE);
                break;
            case 'max-results':
                configUpdate.maxResults = ValidationUtils.parseIntWithFallback(newValue, SHARED_CONSTANTS.DEFAULTS.FALLBACK_MAX_RESULTS);
                break;
            case 'data-endpoint':
                configUpdate.dataEndpoint = newValue;
                break;
            case 'theme':
                this.updateTheme(newValue as Theme);
                return;
        }

        this.config = validateConfig(configUpdate);
    }

    // Cleans up resources when component is destroyed
    private cleanup(): void {
        this.removeEventListeners();
        this.cleanupThemeButton();
    }

    // Cleanup theme button listeners
    private cleanupThemeButton(): void {
        if (this.externalThemeButton && this.boundThemeToggleHandler) {
            this.externalThemeButton.removeEventListener('click', this.boundThemeToggleHandler);
            this.boundThemeToggleHandler = null;
        }
        this.externalThemeButton = null;
    }

    // Loads search data from configured endpoint
    private async loadData(): Promise<void> {
        try {
            const response = await AsyncUtils.fetchWithTimeout(this.config.dataEndpoint, SHARED_CONSTANTS.TIMEOUTS.PRIMARY_ENDPOINT);

            if (!response.ok) {
                throw ErrorFactory.createNetworkError('Data fetch', response.status, response.statusText);
            }

            const data = await response.json();
            this.searchData = data;

            this.dispatchCustomEvent(EVENTS.DATA_LOADED, {success: true});

        } catch (error) {
            logError('Failed to load data from primary endpoint', 'SmartSearchComponent.loadData', error as Error);
            try {
                await this.loadDataFallback();
            } catch (fallbackError) {
                logError('Failed to load data from fallback endpoint', 'SmartSearchComponent.loadData', fallbackError as Error);
                this.dispatchCustomEvent(EVENTS.DATA_LOAD_ERROR, {error: fallbackError});
            }
        }
    }

    // Fallback data loading method
    private async loadDataFallback(): Promise<void> {
        try {
            // Load individual JSON files as expected by tests
            const [accountsRes, customersRes, transactionsRes] = await Promise.all([
                AsyncUtils.fetchWithTimeout('../data/accounts.json', SHARED_CONSTANTS.TIMEOUTS.FALLBACK_ENDPOINT),
                AsyncUtils.fetchWithTimeout('../data/customers.json', SHARED_CONSTANTS.TIMEOUTS.FALLBACK_ENDPOINT),
                AsyncUtils.fetchWithTimeout('../data/transactions.json', SHARED_CONSTANTS.TIMEOUTS.FALLBACK_ENDPOINT)
            ]);

            if (!accountsRes.ok || !customersRes.ok || !transactionsRes.ok) {
                throw ErrorFactory.createNetworkError(
                    `One or more data endpoints failed`,
                    accountsRes.status || customersRes.status || transactionsRes.status,
                    'Failed to load data files'
                );
            }

            const [accounts, customers, transactions] = await Promise.all([
                accountsRes.json(),
                customersRes.json(),
                transactionsRes.json()
            ]);

            this.searchData = {
                accounts,
                customers,
                transactions
            };

            this.dispatchCustomEvent(EVENTS.DATA_LOADED, {success: true});

        } catch (error) {
            throw error;
        }
    }

    // Attaches all event listeners
    private attachEventListeners(): void {
        // Search input events
        this.searchInput?.addEventListener('input', this.boundHandlers.search);
        this.searchInput?.addEventListener('keydown', this.boundHandlers.keydown);
        this.searchInput?.addEventListener('focus', this.boundHandlers.focus);

        // Clear button
        this.clearButton?.addEventListener('click', this.boundHandlers.clear);

        // Tab buttons - store references for cleanup
        const tabs = this.tabsContainer?.querySelectorAll(`.${CSS_CLASSES.TAB}`);
        this.tabElements = Array.from(tabs || []);
        this.tabElements.forEach(tab => {
            tab.addEventListener('click', this.boundHandlers.tabClick);
        });

        // Global keyboard events - capture on shadow root to handle all keyboard navigation
        this.shadowKeyboardHandler = (event: Event) => {
            if (event instanceof KeyboardEvent) {
                this.boundHandlers.keydown(event);
            }
        };
        this.shadow.addEventListener('keydown', this.shadowKeyboardHandler);

        // Global events
        document.addEventListener('click', this.boundHandlers.clickOutside);
        window.addEventListener('resize', this.boundHandlers.resize);
        window.addEventListener('scroll', this.boundHandlers.scroll, true);
    }

    // Removes all event listeners to prevent memory leaks
    private removeEventListeners(): void {
        // Remove search input events
        this.searchInput?.removeEventListener('input', this.boundHandlers.search);
        this.searchInput?.removeEventListener('keydown', this.boundHandlers.keydown);
        this.searchInput?.removeEventListener('focus', this.boundHandlers.focus);

        // Remove clear button event
        this.clearButton?.removeEventListener('click', this.boundHandlers.clear);

        // Remove tab events
        this.tabElements.forEach(tab => {
            tab.removeEventListener('click', this.boundHandlers.tabClick);
        });
        this.tabElements = [];

        // Remove result events (these are attached dynamically)
        this.removeResultEventListeners();

        // Remove shadow keyboard handler
        if (this.shadowKeyboardHandler) {
            this.shadow.removeEventListener('keydown', this.shadowKeyboardHandler);
            this.shadowKeyboardHandler = null;
        }

        // Remove global events
        document.removeEventListener('click', this.boundHandlers.clickOutside);
        window.removeEventListener('resize', this.boundHandlers.resize);
        window.removeEventListener('scroll', this.boundHandlers.scroll, true);
    }

    // Removes result-specific event listeners
    private removeResultEventListeners(): void {
        const resultItems = this.getResultItems();
        resultItems?.forEach(item => {
            item.removeEventListener('click', this.boundHandlers.resultClick);
            item.removeEventListener('mouseenter', this.boundHandlers.resultHover);
        });
    }

    // Handles search input events
    private handleSearch(event: Event): void {
        try {
            const query = (event.target as HTMLInputElement).value;
            this.updateClearButtonVisibility(query);
            this.performDebouncedSearch(query);
        } catch (error) {
            this.handleError(ErrorType.EVENT_HANDLER_FAILED, 'Search handler failed', error as Error);
        }
    }

    // Handles keyboard navigation
    private handleKeyDown(event: KeyboardEvent): void {
        try {
            if (!this.isOpen) {
                if (event.key === 'ArrowDown' && this.searchInput?.value) {
                    this.openDropdown();
                    event.preventDefault();
                }
                return;
            }

            this.handleKeyboardNavigation(event.key as KeyboardKey, event);
        } catch (error) {
            this.handleError(ErrorType.EVENT_HANDLER_FAILED, 'Keyboard handler failed', error as Error);
        }
    }

    // Handles keyboard navigation within dropdown
    private handleKeyboardNavigation(key: KeyboardKey, event: KeyboardEvent): void {
        switch (key) {
            case 'ArrowDown':
                event.preventDefault();
                this.navigateResults(SHARED_CONSTANTS.NAVIGATION.DOWN);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.navigateResults(SHARED_CONSTANTS.NAVIGATION.UP);
                break;
            case 'Enter':
                event.preventDefault();
                if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredResults.length) {
                    this.selectResult(this.filteredResults[this.selectedIndex]);
                }
                break;
            case 'Escape':
                event.preventDefault();
                this.closeDropdown();
                this.searchInput?.blur();
                this.announceToScreenReader('Search closed');
                break;
            case 'Tab':
                // Allow natural tab navigation, only prevent default if we need to manage focus
                if (this.isOpen && this.filteredResults.length > 0) {
                    // If dropdown is open with results, handle tab navigation within component
                    this.handleTabNavigation(event);
                } else {
                    // Allow natural tab to next element outside component
                    this.closeDropdown();
                }
                break;
        }
    }

    // Handles Tab key navigation within the component
    private handleTabNavigation(event: KeyboardEvent): void {
        const focusableElements = this.getFocusableElements();
        const currentIndex = focusableElements.findIndex(el => el === event.target);

        if (event.shiftKey) {
            // Shift+Tab - go backwards
            if (currentIndex <= 0) {
                // Allow tab out of component backwards
                this.closeDropdown();
                return;
            }
            event.preventDefault();
            focusableElements[currentIndex - 1].focus();
        } else {
            // Tab - go forwards
            if (currentIndex >= focusableElements.length - 1) {
                // Allow tab out of component forwards
                this.closeDropdown();
                return;
            }
            event.preventDefault();
            focusableElements[currentIndex + 1].focus();
        }
    }

    // Gets all focusable elements within the component
    private getFocusableElements(): HTMLElement[] {
        const elements: HTMLElement[] = [];

        // Add search input
        if (this.searchInput) {
            elements.push(this.searchInput);
        }

        // Add clear button if visible
        if (this.clearButton && this.clearButton.style.display !== 'none') {
            elements.push(this.clearButton);
        }

        // Add tab buttons
        const tabs = this.tabsContainer?.querySelectorAll(`.${CSS_CLASSES.TAB}`) as NodeListOf<HTMLElement>;
        if (tabs) {
            elements.push(...Array.from(tabs));
        }

        // Add result items if dropdown is open
        if (this.isOpen) {
            const resultItems = this.getResultItems() as NodeListOf<HTMLElement>;
            if (resultItems) {
                elements.push(...Array.from(resultItems));
            }
        }

        return elements.filter(el => el && !el.hasAttribute('disabled'));
    }

    // Announces status changes to screen readers
    private announceToScreenReader(message: string): void {
        const statusElement = this.shadow.querySelector('.search-status') as HTMLElement;
        if (statusElement) {
            statusElement.textContent = message;
            // Clear the message after a short delay to allow for repeated announcements
            setTimeout(() => {
                statusElement.textContent = '';
            }, 1000);
        }
    }

    // Handles focus events
    private handleFocus(): void {
        if (this.searchInput?.value && this.searchInput.value.length >= this.config.minSearchLength) {
            // Always perform search on focus to show relevant matches
            // This ensures the dropdown appears with the selected result and other partial matches
            this.performSearch(this.searchInput.value);
        }
    }

    // Handles clear button clicks
    private handleClear(): void {
        try {
            if (this.searchInput) {
                this.searchInput.value = '';
                this.searchInput.focus();
            }
            this.updateClearButtonVisibility('');
            this.filteredResults = [];
            this.selectedResult = null;
            this.selectedIndex = SHARED_CONSTANTS.UI.DEFAULT_SELECTED_INDEX;

            // Reset active tab to 'all' for complete UI state reset
            this.setActiveTab('all');

            // Clear external result display (demo page)
            const externalResultDisplay = document.getElementById('selectedResult');
            if (externalResultDisplay) {
                externalResultDisplay.innerHTML = 'Search and select a result to see details here';
                externalResultDisplay.className = 'no-selection';
            }

            // Clear any internal result display elements
            const internalResultDisplays = this.shadow.querySelectorAll('.selected-result-display');
            internalResultDisplays.forEach(display => {
                display.innerHTML = 'Search and select a result to see details here';
                display.className = 'no-selection';
            });

            this.closeDropdown();
            this.dispatchCustomEvent(EVENTS.SEARCH_CLEARED, {});
        } catch (error) {
            this.handleError(ErrorType.EVENT_HANDLER_FAILED, 'Clear handler failed', error as Error);
        }
    }

    // Handles tab clicks
    private handleTabClick(event: Event): void {
        try {
            const tab = event.target as HTMLElement;
            const tabName = tab.dataset.tab || tab.closest(`.${CSS_CLASSES.TAB}`)?.getAttribute('data-tab');

            if (!tabName) return;

            this.setActiveTab(tabName as SearchTab);

            // Re-perform search with new filter
            if (this.searchInput?.value && this.searchInput.value.length >= this.config.minSearchLength) {
                this.performSearch(this.searchInput.value);
            }
        } catch (error) {
            this.handleError(ErrorType.EVENT_HANDLER_FAILED, 'Tab click handler failed', error as Error);
        }
    }

    // Handles clicks outside the component
    private handleClickOutside(event: Event): void {
        if (!this.contains(event.target as Node)) {
            this.closeDropdown();
        }
    }

    // Handles window resize events
    private handleResize(): void {
        if (this.isOpen) {
            this.updateDropdownPosition();
        }
    }

    // Handles scroll events
    private handleScroll(): void {
        if (this.isOpen) {
            this.updateDropdownPosition();
        }
    }

    // Initializes virtual scrolling for large result sets
    private initializeVirtualScrolling(): void {
        if (!this.resultsContainer) return;

        // Create virtual scroll container
        this.virtualScrollContainer = document.createElement('div');
        this.virtualScrollContainer.className = 'virtual-scroll-container';

        // Create viewport for visible items
        this.virtualScrollViewport = document.createElement('div');
        this.virtualScrollViewport.className = 'virtual-scroll-viewport';

        this.virtualScrollContainer.appendChild(this.virtualScrollViewport);

        // Add scroll listener for virtual scrolling
        this.virtualScrollContainer.addEventListener('scroll', () => {
            this.updateVirtualScrolling();
        });
    }

    // Updates virtual scrolling based on scroll position
    private updateVirtualScrolling(): void {
        if (!this.virtualScrollContainer || !this.virtualScrollViewport) return;

        const scrollTop = this.virtualScrollContainer.scrollTop;
        const containerHeight = this.virtualScrollContainer.clientHeight;
        const itemHeight = SHARED_CONSTANTS.PERFORMANCE.VIRTUAL_SCROLL_ITEM_HEIGHT;
        const buffer = SHARED_CONSTANTS.PERFORMANCE.VIRTUAL_SCROLL_BUFFER;

        // Calculate visible range
        this.visibleStartIndex = ValidationUtils.ensureMinimum(Math.floor(scrollTop / itemHeight) - buffer, 0);
        this.visibleEndIndex = ValidationUtils.ensureMaximum(
            Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer,
            this.filteredResults.length - 1
        );

        // Update total height
        this.totalHeight = this.filteredResults.length * itemHeight;

        // Update viewport transform
        const offsetY = this.visibleStartIndex * itemHeight;
        this.virtualScrollViewport.style.transform = `translateY(${offsetY}px)`;

        // Render only visible items
        this.renderVirtualScrollItems();
    }

    // Renders only the visible items in virtual scrolling
    private renderVirtualScrollItems(): void {
        if (!this.virtualScrollViewport) return;

        const visibleItems = this.filteredResults.slice(this.visibleStartIndex, this.visibleEndIndex + 1);

        this.virtualScrollViewport.innerHTML = visibleItems.map((result, index) => {
            const actualIndex = this.visibleStartIndex + index;
            const isSelected = actualIndex === this.selectedIndex;

            return `
                <div class="${CSS_CLASSES.RESULT_ITEM} ${isSelected ? CSS_CLASSES.RESULT_SELECTED : ''}" 
                     data-index="${actualIndex}"
                     style="height: ${SHARED_CONSTANTS.PERFORMANCE.VIRTUAL_SCROLL_ITEM_HEIGHT}px;">
                    <div class="${CSS_CLASSES.RESULT_HEADER}">
                        <i class="${CSS_CLASSES.RESULT_ICON} ${result.icon || RESULT_ICONS[result.type]}"></i>
                        <div class="${CSS_CLASSES.RESULT_CONTENT}">
                            <div class="${CSS_CLASSES.RESULT_TITLE}">${escapeHtml(result.title)}</div>
                            <div class="${CSS_CLASSES.RESULT_SUBTITLE}">${escapeHtml(result.subtitle)}</div>
                            ${result.metadata ? `<div class="${CSS_CLASSES.RESULT_METADATA}">${escapeHtml(result.metadata)}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Set container height to maintain scroll behavior
        if (this.virtualScrollContainer) {
            this.virtualScrollContainer.style.height = `${ValidationUtils.ensureMaximum(this.totalHeight, 400)}px`;
        }
    }

    // Handles result item clicks
    private handleResultClick(event: Event): void {
        try {
            const item = event.currentTarget as HTMLElement;
            const index = parseInt(item.dataset.index || '-1');

            if (index >= 0 && index < this.filteredResults.length) {
                const result = this.filteredResults[index];
                this.selectResult(result);
            }
        } catch (error) {
            this.handleError(ErrorType.EVENT_HANDLER_FAILED, 'Result click handler failed', error as Error);
        }
    }

    // Handles result item hover
    private handleResultHover(event: Event): void {
        const item = event.currentTarget as HTMLElement;
        const index = parseInt(item.dataset.index || '-1');
        this.setSelectedIndex(index);
    }

    // Renders the component HTML structure
    private render(): void {
        try {
            this.renderStyles();
            this.renderHTML();
            this.cacheElementReferences();
        } catch (error) {
            this.handleError(ErrorType.RENDER_FAILED, 'Failed to render component', error as Error);
        }
    }

    // Loads and applies component styles with performance optimization
    private async renderStyles(): Promise<void> {
        try {
            // Add Font Awesome with performance optimization
            const fontAwesomeLink = document.createElement('link');
            fontAwesomeLink.rel = 'stylesheet';
            fontAwesomeLink.href = SHARED_CONSTANTS.CDN_URLS.FONT_AWESOME;
            fontAwesomeLink.crossOrigin = 'anonymous';
            // Preload for better performance
            fontAwesomeLink.setAttribute('rel', 'preload');
            fontAwesomeLink.setAttribute('as', 'style');
            fontAwesomeLink.onload = () => {
                fontAwesomeLink.setAttribute('rel', 'stylesheet');
            };
            this.shadow.appendChild(fontAwesomeLink);

            // Load consolidated component styles with constructable stylesheets if supported
            try {
                const response = await fetch('../src/search/smart-search.css');
                const css = await response.text();

                // Use constructable stylesheets for better performance if supported
                if ('adoptedStyleSheets' in this.shadow && 'CSSStyleSheet' in window) {
                    try {
                        const sheet = new CSSStyleSheet();
                        await sheet.replace(css);
                        this.shadow.adoptedStyleSheets = [sheet];
                    } catch (constructableError) {
                        // Fallback to traditional style element
                        this.createStyleElement(css);
                    }
                } else {
                    // Fallback for browsers without constructable stylesheets support
                    this.createStyleElement(css);
                }
            } catch (error) {
                logWarn('Could not load smart-search.css, component may not display correctly', 'SmartSearchComponent.renderStyles');
            }
        } catch (error) {
            logWarn('Could not load component styles, component may not display correctly', 'SmartSearchComponent.renderStyles');
        }
    }

    // Helper method to create traditional style element
    private createStyleElement(css: string): void {
        const style = document.createElement('style');
        style.textContent = css;
        this.shadow.appendChild(style);
    }

    // Renders the component HTML structure
    private renderHTML(): void {
        this.shadow.innerHTML += `
            <div class="${CSS_CLASSES.SEARCH_CONTAINER}" role="search">
                <div class="${CSS_CLASSES.SEARCH_WRAPPER}">
                    <i class="${CSS_CLASSES.SEARCH_ICON} fas fa-search" aria-hidden="true"></i>
                    <input
                        type="text"
                        class="${CSS_CLASSES.SEARCH_INPUT}"
                        placeholder="${this.config.placeholder}"
                        role="combobox"
                        aria-label="Search banking data"
                        aria-autocomplete="list"
                        aria-expanded="false"
                        aria-controls="search-results"
                        aria-haspopup="listbox"
                        aria-describedby="search-instructions"
                    />
                    <button class="${CSS_CLASSES.CLEAR_BUTTON}" aria-label="Clear search" type="button">
                        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                </div>

                <div class="${CSS_CLASSES.DROPDOWN}" role="listbox" id="search-results" aria-label="Search results">
                    ${this.renderTabs()}
                    <div class="${CSS_CLASSES.RESULTS_CONTAINER}">
                        <ul class="${CSS_CLASSES.RESULTS_LIST}"></ul>
                    </div>
                </div>
                                
                <!-- Live region for search status announcements -->
                <div id="search-status" class="sr-only" aria-live="polite" aria-atomic="true"></div>
            </div>
        `;
    }

    // Renders the filter tabs
    private renderTabs(): string {
        const tabs = [
            {id: 'all', icon: RESULT_ICONS.all, label: 'All'},
            {id: 'account', icon: RESULT_ICONS.account, label: 'Accounts'},
            {id: 'customer', icon: RESULT_ICONS.customer, label: 'Customers'},
            {id: 'transaction', icon: RESULT_ICONS.transaction, label: 'Transactions'}
        ];

        return `
            <div class="${CSS_CLASSES.TABS_CONTAINER}" role="tablist">
                ${tabs.map(tab => `
                    <button 
                        class="${CSS_CLASSES.TAB} ${tab.id === 'all' ? CSS_CLASSES.TAB_ACTIVE : ''}" 
                        data-tab="${tab.id}" 
                        role="tab" 
                        aria-selected="${tab.id === 'all'}" 
                        aria-controls="panel-${tab.id}"
                    >
                        <i class="${CSS_CLASSES.TAB_ICON} ${tab.icon}" aria-hidden="true"></i>
                        <span>${tab.label}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    // Caches references to DOM elements
    private cacheElementReferences(): void {
        this.searchInput = this.shadow.querySelector(`.${CSS_CLASSES.SEARCH_INPUT}`);
        this.resultsContainer = this.shadow.querySelector(`.${CSS_CLASSES.RESULTS_LIST}`);
        this.tabsContainer = this.shadow.querySelector(`.${CSS_CLASSES.TABS_CONTAINER}`);
        this.clearButton = this.shadow.querySelector(`.${CSS_CLASSES.CLEAR_BUTTON}`);
        this.dropdown = this.shadow.querySelector(`.${CSS_CLASSES.DROPDOWN}`);
    }

    // Gets cached search results if available and not expired
    private getCachedResults(query: string, tab: SearchTab): SearchResult[] | null {
        const cacheKey = `${ValidationUtils.normalizeSearchQuery(query)}_${tab}`;
        const cached = this.searchCache.get(cacheKey);

        if (!cached) {
            return null;
        }

        const isExpired = Date.now() - cached.timestamp > SHARED_CONSTANTS.PERFORMANCE.CACHE_EXPIRY_MS;
        if (isExpired) {
            this.searchCache.delete(cacheKey);
            return null;
        }

        return cached.results;
    }

    // Caches search results with expiry
    private setCachedResults(query: string, tab: SearchTab, results: SearchResult[]): void {
        const cacheKey = `${ValidationUtils.normalizeSearchQuery(query)}_${tab}`;

        // Limit cache size
        if (this.searchCache.size >= SHARED_CONSTANTS.PERFORMANCE.SEARCH_CACHE_SIZE) {
            const firstKey = this.searchCache.keys().next().value;
            if (firstKey) {
                this.searchCache.delete(firstKey);
            }
        }

        this.searchCache.set(cacheKey, {
            query: ValidationUtils.normalizeSearchQuery(query),
            tab,
            results: [...results], // Create a copy to avoid mutations
            timestamp: Date.now()
        });
    }

    // Clears expired cache entries
    private clearExpiredCache(): void {
        const now = Date.now();
        for (const [key, cached] of this.searchCache.entries()) {
            if (now - cached.timestamp > SHARED_CONSTANTS.PERFORMANCE.CACHE_EXPIRY_MS) {
                this.searchCache.delete(key);
            }
        }
    }

    // Updates clear button visibility based on input value
    private updateClearButtonVisibility(query: string): void {
        if (this.clearButton) {
            if (query.length > 0) {
                this.clearButton.classList.add(CSS_CLASSES.VISIBLE);
            } else {
                this.clearButton.classList.remove(CSS_CLASSES.VISIBLE);
            }
        }
    }

    // Performs debounced search
    private performDebouncedSearch(query: string): void {
        // Initialize debouncer if not already created
        if (!this.searchDebouncer) {
            let timeoutId: number;
            this.searchDebouncer = (searchQuery: string) => {
                clearTimeout(timeoutId);
                timeoutId = window.setTimeout(() => {
                    this.performSearch(searchQuery);
                }, this.config.debounceDelay);
            };
        }

        // Use the debouncer utility with the query
        this.searchDebouncer(query);
    }

    // Performs search with caching optimization
    private performSearch(query: string): void {
        if (query.length < this.config.minSearchLength) {
            this.filteredResults = [];
            this.renderResults(query);
            this.closeDropdown();
            this.dispatchCustomEvent(EVENTS.SEARCH_PERFORMED, {
                query,
                resultCount: 0,
                activeTab: this.activeTab
            });
            return;
        }

        // Check cache first
        const cachedResults = this.getCachedResults(query, this.activeTab);
        if (cachedResults) {
            this.filteredResults = cachedResults;
            this.renderResults(query);

            // Always open dropdown for valid queries to show results or "No results found" message
            this.openDropdown();

            this.announceToScreenReader(
                this.filteredResults.length === 0
                    ? `No results found for "${query}"`
                    : `${this.filteredResults.length} result${this.filteredResults.length === 1 ? '' : 's'} found for "${query}"`
            );
            this.dispatchCustomEvent(EVENTS.SEARCH_PERFORMED, {
                query,
                resultCount: this.filteredResults.length,
                activeTab: this.activeTab
            });
            return;
        }

        // Clear expired cache entries periodically
        this.clearExpiredCache();

        let results: SearchResult[] = [];

        try {
            if (this.activeTab === 'all') {
                results = [
                    ...this.searchAccounts(query),
                    ...this.searchCustomers(query),
                    ...this.searchTransactions(query)
                ];
            } else if (this.activeTab === 'account') {
                results = this.searchAccounts(query);
            } else if (this.activeTab === 'customer') {
                results = this.searchCustomers(query);
            } else if (this.activeTab === 'transaction') {
                results = this.searchTransactions(query);
            }

            // Limit results
            results = results.slice(0, this.config.maxResults);

            // Cache the results
            this.setCachedResults(query, this.activeTab, results);

            this.filteredResults = results;
            this.renderResults(query);

            // Always open dropdown for valid queries to show results or "No results found" message
            this.openDropdown();

            // Announce search results to screen readers
            this.announceToScreenReader(
                this.filteredResults.length === 0
                    ? `No results found for "${query}"`
                    : `${this.filteredResults.length} result${this.filteredResults.length === 1 ? '' : 's'} found for "${query}"`
            );
        } catch (error) {
            // Handle search errors gracefully
            logError('Search operation failed', 'SmartSearchComponent.performSearch', error as Error);
            this.filteredResults = [];
            this.renderResults(query);
            this.closeDropdown();
        }

        this.dispatchCustomEvent(EVENTS.SEARCH_PERFORMED, {
            query,
            resultCount: this.filteredResults.length,
            activeTab: this.activeTab
        });
    }

    // Generic search method that handles all data types
    private searchByType<T extends AccountData | CustomerData | TransactionData>(
        data: T[],
        query: string,
        searchFields: string[],
        type: SearchResultType,
        formatter: (item: T) => Omit<SearchResult, 'id' | 'type' | 'rawData'>
    ): SearchResult[] {
        return data
            .filter(item => matchesSearch(item, query, searchFields))
            .map(item => ({
                id: item.id,
                type,
                rawData: item,
                ...formatter(item)
            }));
    }

    // Searches through account data
    private searchAccounts(query: string): SearchResult[] {
        return this.searchByType(
            this.searchData.accounts,
            query,
            ['accountNumber', 'title', 'type'],
            'account',
            (account) => ({
                title: account.title,
                subtitle: `${account.accountNumber} • ${formatCurrency(account.balance)}`,
                metadata: `${account.type} • ${account.status}`,
                icon: RESULT_ICONS.account
            })
        );
    }

    // Searches through customer data
    private searchCustomers(query: string): SearchResult[] {
        return this.searchByType(
            this.searchData.customers,
            query,
            ['firstName', 'lastName', 'email', 'customerId'],
            'customer',
            (customer) => ({
                title: `${customer.firstName} ${customer.lastName}`,
                subtitle: customer.email,
                metadata: `${customer.accountType} • ${customer.totalAccounts} accounts`,
                icon: RESULT_ICONS.customer
            })
        );
    }

    // Searches through transaction data
    private searchTransactions(query: string): SearchResult[] {
        return this.searchByType(
            this.searchData.transactions,
            query,
            ['transactionId', 'merchant', 'category', 'description'],
            'transaction',
            (transaction) => ({
                title: transaction.merchant,
                subtitle: `${formatCurrency(transaction.amount)} • ${transaction.category}`,
                metadata: `${transaction.type} • ${formatDate(transaction.date)}`,
                icon: RESULT_ICONS.transaction
            })
        );
    }

    // Renders search results
    private renderResults(query: string): void {
        if (!this.resultsContainer) return;

        // Invalidate cache before rendering new results
        this.invalidateResultItemsCache();

        if (this.filteredResults.length === 0) {
            this.renderNoResults(query);
            return;
        }

        const html = this.filteredResults.map((result, index) => {
            const highlightedTitle = this.config.highlightMatches
                ? highlightText(result.title, query)
                : escapeHtml(result.title);
            const highlightedSubtitle = this.config.highlightMatches
                ? highlightText(result.subtitle, query)
                : escapeHtml(result.subtitle);

            return `
                <li 
                    class="${CSS_CLASSES.RESULT_ITEM}" 
                    data-index="${index}"
                    role="option"
                    aria-selected="false"
                    tabindex="-1"
                >
                    <div class="${CSS_CLASSES.RESULT_HEADER}">
                        <div class="${CSS_CLASSES.RESULT_ICON} ${result.type}">
                            <i class="${result.icon}" aria-hidden="true"></i>
                        </div>
                        <div class="${CSS_CLASSES.RESULT_CONTENT}">
                            <div class="${CSS_CLASSES.RESULT_TITLE}">${highlightedTitle}</div>
                            <div class="${CSS_CLASSES.RESULT_SUBTITLE}">${highlightedSubtitle}</div>
                            ${result.metadata ? `<div class="${CSS_CLASSES.RESULT_METADATA}">${escapeHtml(result.metadata)}</div>` : ''}
                        </div>
                    </div>
                </li>
            `;
        }).join('');

        this.resultsContainer.innerHTML = html;
        this.attachResultEventListeners();
        this.selectedIndex = -1;
    }

    // Renders no results message
    private renderNoResults(query: string): void {
        if (!this.resultsContainer) return;

        this.resultsContainer.innerHTML = `
            <div class="${CSS_CLASSES.NO_RESULTS}">
                <div class="${CSS_CLASSES.NO_RESULTS_ICON}">
                    <i class="fas fa-search"></i>
                </div>
                <div class="${CSS_CLASSES.NO_RESULTS_TEXT}">No results found for "${escapeHtml(query)}"</div>
            </div>
        `;
    }

    // Attaches event listeners to result items
    private attachResultEventListeners(): void {
        const resultItems = this.getResultItems();
        resultItems?.forEach(item => {
            item.addEventListener('click', this.boundHandlers.resultClick);
            item.addEventListener('mouseenter', this.boundHandlers.resultHover);
        });
    }

    // Navigates through results using keyboard
    private navigateResults(direction: number): void {
        const newIndex = this.selectedIndex + direction;

        if (newIndex < SHARED_CONSTANTS.UI.DEFAULT_SELECTED_INDEX || newIndex >= this.filteredResults.length) {
            return;
        }

        this.setSelectedIndex(newIndex);
        this.scrollToSelected();
    }

    // Gets cached result items or queries them if cache is invalid
    private getResultItems(): NodeListOf<Element> | null {
        if (!this.resultItemsCacheValid || !this.cachedResultItems) {
            this.cachedResultItems = this.resultsContainer?.querySelectorAll(`.${CSS_CLASSES.RESULT_ITEM}`) || null;
            this.resultItemsCacheValid = true;
        }
        return this.cachedResultItems;
    }

    // Invalidates the result items cache
    private invalidateResultItemsCache(): void {
        this.resultItemsCacheValid = false;
        this.cachedResultItems = null;
    }

    // Sets the selected result index
    private setSelectedIndex(index: number): void {
        const items = this.getResultItems();
        if (!items) return;

        // Remove previous selection
        if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
            items[this.selectedIndex].classList.remove(CSS_CLASSES.RESULT_SELECTED);
            items[this.selectedIndex].setAttribute('aria-selected', 'false');
            items[this.selectedIndex].setAttribute('tabindex', '-1');
        }

        this.selectedIndex = index;

        // Add new selection
        if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
            items[this.selectedIndex].classList.add(CSS_CLASSES.RESULT_SELECTED);
            items[this.selectedIndex].setAttribute('aria-selected', 'true');
            items[this.selectedIndex].setAttribute('tabindex', '0');
            (items[this.selectedIndex] as HTMLElement).focus();

            // Announce to screen reader
            const result = this.filteredResults[this.selectedIndex];
            if (result) {
                this.announceToScreenReader(`${result.title}, ${result.subtitle}`);
            }
        }

        // Update selected result display
        const selectedResultDisplay = this.shadow.querySelector('.selected-result-display');
        if (selectedResultDisplay && this.selectedIndex >= 0 && this.filteredResults[this.selectedIndex]) {
            const result = this.filteredResults[this.selectedIndex];
            selectedResultDisplay.textContent = `Selected: ${result.title}`;
        } else if (selectedResultDisplay) {
            selectedResultDisplay.textContent = '';
        }
    }

    // Scrolls to the selected result
    private scrollToSelected(): void {
        if (this.selectedIndex < 0 || !this.dropdown || !this.resultsContainer) return;

        const items = this.getResultItems();
        const selectedItem = items?.[this.selectedIndex] as HTMLElement;

        if (selectedItem) {
            const dropdownRect = this.dropdown.getBoundingClientRect();
            const itemRect = selectedItem.getBoundingClientRect();

            if (itemRect.bottom > dropdownRect.bottom) {
                selectedItem.scrollIntoView({block: 'nearest', behavior: 'smooth'});
            } else if (itemRect.top < dropdownRect.top) {
                selectedItem.scrollIntoView({block: 'nearest', behavior: 'smooth'});
            }
        }
    }

    // Updates highlighting for the selected result
    private updateResultHighlighting(): void {
        if (!this.selectedResult) return;

        const resultItems = this.getResultItems();
        if (!resultItems) return;

        // Find the index of the selected result
        const selectedIndex = this.filteredResults.findIndex(result => result.id === this.selectedResult!.id);

        if (selectedIndex >= 0 && selectedIndex < resultItems.length) {
            // Remove previous selection highlighting
            resultItems.forEach(item => {
                item.classList.remove(CSS_CLASSES.RESULT_SELECTED);
                item.setAttribute('aria-selected', 'false');
            });

            // Add highlighting to the selected result
            const selectedItem = resultItems[selectedIndex] as HTMLElement;
            selectedItem.classList.add(CSS_CLASSES.RESULT_SELECTED);
            selectedItem.setAttribute('aria-selected', 'true');
        }
    }

    // Selects a result and dispatches selection event
    private selectResult(result: SearchResult): void {
        this.selectedResult = result;
        this.dispatchCustomEvent(EVENTS.RESULT_SELECTED, {result});

        if (this.searchInput) {
            this.searchInput.value = result.title;
        }

        // Update highlighting to show selected result
        this.updateResultHighlighting();

        // Keep dropdown open briefly to show selection, then close
        setTimeout(() => {
            this.closeDropdown();
        }, 150);
    }

    // Sets the active tab and clears cache when switching tabs
    private setActiveTab(tab: SearchTab): void {
        if (this.activeTab !== tab) {
            this.activeTab = tab;

            // Clear cache when switching tabs for fresh results
            this.searchCache.clear();

            // Update tab UI
            this.tabElements.forEach((tabElement, index) => {
                const tabType = ['all', 'account', 'customer', 'transaction'][index] as SearchTab;
                if (tabType === tab) {
                    tabElement.classList.add(CSS_CLASSES.TAB_ACTIVE);
                    tabElement.setAttribute('aria-selected', 'true');
                } else {
                    tabElement.classList.remove(CSS_CLASSES.TAB_ACTIVE);
                    tabElement.setAttribute('aria-selected', 'false');
                }
            });

            // Announce tab change to screen readers
            const tabNames = {
                'all': 'All results',
                'account': 'Accounts',
                'customer': 'Customers',
                'transaction': 'Transactions'
            };
            this.announceToScreenReader(`Switched to ${tabNames[tab]} tab`);

            // Re-perform search if there's a query
            if (this.searchInput && ValidationUtils.isNonEmptyString(this.searchInput.value)) {
                this.performSearch(ValidationUtils.normalizeSearchQuery(this.searchInput.value));
            }

            this.dispatchCustomEvent(EVENTS.TAB_CHANGED, {activeTab: this.activeTab});
        }
    }

    // Opens the dropdown
    private openDropdown(): void {
        if (this.isOpen) return;

        this.isOpen = true;
        this.dropdown?.classList.add(CSS_CLASSES.OPEN);
        this.updateDropdownPosition();

        if (this.searchInput) {
            this.searchInput.setAttribute('aria-expanded', 'true');
        }

        this.dispatchCustomEvent(EVENTS.DROPDOWN_OPENED, {});
    }

    // Closes the dropdown
    private closeDropdown(): void {
        if (!this.isOpen) return;

        this.isOpen = false;
        this.dropdown?.classList.remove(CSS_CLASSES.OPEN);
        this.setSelectedIndex(-1);

        if (this.searchInput) {
            this.searchInput.setAttribute('aria-expanded', 'false');
        }

        this.dispatchCustomEvent(EVENTS.DROPDOWN_CLOSED, {});
    }

    // Updates dropdown position based on viewport
    private updateDropdownPosition(): void {
        if (!this.dropdown) return;

        const rect = this.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        if (spaceBelow < 300 && spaceAbove > spaceBelow) {
            this.dropdown.style.bottom = '100%';
            this.dropdown.style.top = 'auto';
        } else {
            this.dropdown.style.top = '100%';
            this.dropdown.style.bottom = 'auto';
        }
    }

    // Updates the component theme
    private updateTheme(theme: Theme): void {
        // Apply theme to host element
        this.setAttribute('data-theme', theme);

        // Apply theme to shadow root for internal styling
        if (this.shadow) {
            const shadowHost = this.shadow.host as HTMLElement;
            shadowHost.setAttribute('data-theme', theme);
        }

        // Dispatch theme change event
        this.dispatchCustomEvent(EVENTS.THEME_CHANGED, {theme});
    }

    // Initializes theme management
    private initializeTheme(): void {
        try {
            // Get theme from attribute, localStorage, or default
            const attributeTheme = this.getAttribute('theme') as Theme;
            const storedTheme = this.getStoredTheme();
            const initialTheme = attributeTheme || storedTheme || DEFAULT_THEME;

            // Validate theme value
            const validTheme = (initialTheme === 'light' || initialTheme === 'dark') ? initialTheme : DEFAULT_THEME;

            // Force initial theme application to ensure DOM attribute is set
            this.setTheme(validTheme, true);
            this.setupExternalThemeButton();
        } catch (error) {
            logError('Failed to initialize theme, using default', 'SmartSearchComponent.initializeTheme', error as Error);
            this.setTheme(DEFAULT_THEME, true);
        }
    }

    // Gets stored theme from localStorage
    private getStoredTheme(): Theme | null {
        try {
            const stored = localStorage.getItem(THEME_STORAGE_KEY);
            return (stored === 'light' || stored === 'dark') ? stored : null;
        } catch {
            return null;
        }
    }

    // Stores theme in localStorage
    private storeTheme(theme: Theme): void {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            // Silently fail if localStorage is not available
        }
    }

    // Sets up external theme button integration
    private setupExternalThemeButton(): void {
        try {
            // Clean up existing button listener
            this.cleanupThemeButton();

            // Look for theme button in the document
            const themeButton = document.getElementById('themeToggle');
            if (themeButton) {
                this.externalThemeButton = themeButton;

                // Create bound handler to avoid memory leaks
                this.boundThemeToggleHandler = this.handleThemeToggle.bind(this);

                // Add click listener
                themeButton.addEventListener('click', this.boundThemeToggleHandler);

                // Update button state
                this.updateThemeButton();
            }
        } catch (error) {
            logWarn('Failed to setup external theme button', 'SmartSearchComponent.setupExternalThemeButton');
        }
    }

    // Handles theme toggle from external button
    private handleThemeToggle(): void {
        try {
            const newTheme: Theme = this.currentTheme === 'light' ? 'dark' : 'light';
            this.setTheme(newTheme);
        } catch (error) {
            logError('Failed to toggle theme', 'SmartSearchComponent.handleThemeToggle', error as Error);
        }
    }

    // Updates external theme button appearance
    private updateThemeButton(): void {
        if (!this.externalThemeButton) return;

        try {
            const isDark = this.currentTheme === 'dark';
            const button = this.externalThemeButton;

            // Update Font Awesome icon
            const iconElement = button.querySelector('i');
            if (iconElement) {
                // Remove existing theme classes
                iconElement.classList.remove('fa-moon', 'fa-sun');
                // Add appropriate theme class
                iconElement.classList.add(isDark ? 'fa-sun' : 'fa-moon');
            }

            // Update aria-label
            button.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);

            // Update title
            button.setAttribute('title', `Switch to ${isDark ? 'light' : 'dark'} theme`);

            // Update data attribute for styling
            button.setAttribute('data-theme', this.currentTheme);
        } catch (error) {
            logWarn('Failed to update theme button appearance', 'SmartSearchComponent.updateThemeButton');
        }
    }

    // Updates page theme with optimized performance
    private updatePageTheme(theme: Theme): void {
        try {
            // Use requestAnimationFrame for smooth transitions
            requestAnimationFrame(() => {
                const documentElement = document.documentElement;
                const body = document.body;

                // Batch DOM operations for better performance
                const isCurrentlyDark = body.classList.contains('dark-theme');
                const shouldBeDark = theme === 'dark';

                // Only apply changes if theme actually changed
                if (isCurrentlyDark !== shouldBeDark) {
                    // Add transition class temporarily for smooth theme change
                    documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
                    body.style.transition = 'background-color 0.3s ease, color 0.3s ease';

                    // Apply theme attributes (for component styling)
                    documentElement.setAttribute('data-theme', theme);
                    body.setAttribute('data-theme', theme);

                    // Apply theme classes (for demo page styling) - batch operation
                    if (shouldBeDark) {
                        body.classList.add('dark-theme');
                    } else {
                        body.classList.remove('dark-theme');
                    }

                    // Remove transition after animation completes
                    setTimeout(() => {
                        documentElement.style.transition = '';
                        body.style.transition = '';
                    }, 300);
                }
            });
        } catch (error) {
            logWarn('Failed to update page theme', 'SmartSearchComponent.updatePageTheme');
        }
    }

    // Public method to set theme
    public setTheme(theme: Theme, force: boolean = false): void {
        try {
            // Validate and sanitize theme input
            if (theme !== 'light' && theme !== 'dark') {
                logWarn(`Invalid theme value: ${theme}, using default`, 'SmartSearchComponent.setTheme');
                theme = DEFAULT_THEME;
            }

            // Prevent unnecessary updates (unless forced)
            if (this.currentTheme === theme && !force) {
                return;
            }

            const previousTheme = this.currentTheme;
            this.currentTheme = theme;

            // Apply theme changes
            this.updateTheme(theme);
            this.updatePageTheme(theme);
            this.updateThemeButton();
            this.storeTheme(theme);

            // Log theme change for debugging
            logWarn(`Theme changed from ${previousTheme} to ${theme}`, 'SmartSearchComponent.setTheme');
        } catch (error) {
            logError('Failed to set theme', 'SmartSearchComponent.setTheme', error as Error);
            // Fallback to default theme on error
            if (theme !== DEFAULT_THEME) {
                this.setTheme(DEFAULT_THEME, force);
            }
        }
    }

    // Public method to get current theme
    public getTheme(): Theme {
        return this.currentTheme;
    }

    // Public method to toggle theme
    public toggleTheme(): void {
        const newTheme: Theme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    // Initializes demo-specific functionality
    private initializeDemoFunctionality(): void {
        // Add demo event listeners for showcasing functionality
        this.addEventListener(EVENTS.RESULT_SELECTED, this.handleDemoResultSelected.bind(this));
    }

    // Handles result selection in demo mode
    private handleDemoResultSelected(event: Event): void {
        const customEvent = event as CustomEvent<ResultSelectedEventDetail>;
        const result = customEvent.detail.result;

        // Try to find external selectedResult div first
        let selectedDiv = document.getElementById('selectedResult') as HTMLElement;

        // If external div not found, create internal display as fallback
        if (!selectedDiv) {
            selectedDiv = this.shadow.querySelector('.selected-result-display') as HTMLElement;

            if (!selectedDiv) {
                selectedDiv = document.createElement('div');
                selectedDiv.className = 'selected-result-display';
                this.shadow.appendChild(selectedDiv);
            }
        }

        // Format the result data with better styling and error handling
        const formattedMetadata = result.metadata ? escapeHtml(result.metadata) : '';
        const formattedRawData = JSON.stringify(result.rawData, null, 2);

        selectedDiv.innerHTML = `
            <div class="selected-result-content">
                <h4><i class="${RESULT_ICONS[result.type] || 'fas fa-info-circle'}"></i> Selected Result</h4>
                <div class="result-details">
                    <p><strong>Type:</strong> <span class="result-type ${result.type}">${escapeHtml(result.type)}</span></p>
                    <p><strong>Title:</strong> <span class="result-title">${escapeHtml(result.title)}</span></p>
                    <p><strong>Subtitle:</strong> <span class="result-subtitle">${escapeHtml(result.subtitle)}</span></p>
                    ${formattedMetadata ? `<p><strong>Metadata:</strong> <span class="result-metadata">${formattedMetadata}</span></p>` : ''}
                </div>
                <details class="raw-data-details">
                    <summary>Raw Data</summary>
                    <pre class="raw-data-content">${escapeHtml(formattedRawData)}</pre>
                </details>
            </div>
        `;

        // Add visual feedback for selection
        selectedDiv.classList.add('result-updated');
        setTimeout(() => {
            selectedDiv?.classList.remove('result-updated');
        }, 300);
    }

    // Clears the search input and results
    public clear(): void {
        this.handleClear();
    }

    // Sets the active filter tab
    public setTab(tab: SearchTab): void {
        this.setActiveTab(tab);
    }

    // Gets the current search results
    public getResults(): SearchResult[] {
        return [...this.filteredResults];
    }

    // Gets the currently active tab
    public getActiveTab(): SearchTab {
        return this.activeTab;
    }

    // Performs a search programmatically (for testing)
    public search(query: string): void {
        if (this.searchInput) {
            this.searchInput.value = query;
            this.performSearch(query);
        }
    }

    // Handles component errors
    private handleError(type: ErrorType, message: string, originalError?: Error): void {
        // Map ErrorType to ErrorCategory
        const categoryMap: Record<ErrorType, ErrorCategory> = {
            [ErrorType.DATA_LOAD_FAILED]: ErrorCategory.DATA_LOAD,
            [ErrorType.INVALID_CONFIGURATION]: ErrorCategory.CONFIGURATION,
            [ErrorType.RENDER_FAILED]: ErrorCategory.RENDER,
            [ErrorType.EVENT_HANDLER_FAILED]: ErrorCategory.EVENT_HANDLER
        };

        const context: ErrorContext = {
            category: categoryMap[type],
            severity: ErrorSeverity.MEDIUM,
            component: 'SmartSearchComponent',
            method: 'handleError',
            userMessage: message,
            recoverable: true,
            metadata: {errorType: type}
        };

        const error = createError(message, context, originalError);
        logError('Component error occurred', 'SmartSearchComponent.handleError', originalError);

        this.dispatchCustomEvent(EVENTS.DATA_LOAD_ERROR, {error});
    }

    // Dispatches a custom event
    private dispatchCustomEvent<T>(eventName: string, detail: T): void {
        this.dispatchEvent(new CustomEvent(eventName, {
            detail,
            bubbles: true,
            composed: true
        }));
    }
}

// Register the custom element
customElements.define('smart-search', SmartSearchComponent);

export {SmartSearchComponent};
export type {SearchResult, ComponentConfig, SearchData};