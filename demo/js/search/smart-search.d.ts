/**
 * Smart Search Web Component for Banking Application
 * A reusable, accessible, and themeable search component
 */
interface SearchResult {
    id: string;
    type: 'account' | 'customer' | 'transaction';
    title: string;
    subtitle: string;
    metadata?: string;
    icon?: string;
    rawData: any;
}
interface ComponentConfig {
    placeholder?: string;
    minSearchLength?: number;
    debounceDelay?: number;
    maxResults?: number;
    enableFilters?: boolean;
    highlightMatches?: boolean;
    dataEndpoint?: string;
}
declare class SmartSearchComponent extends HTMLElement {
    private shadow;
    private searchInput;
    private resultsContainer;
    private tabsContainer;
    private clearButton;
    private dropdown;
    private themeToggle;
    private selectedResultDiv;
    private searchData;
    private filteredResults;
    private selectedIndex;
    private activeTab;
    private isOpen;
    private debounceTimer;
    private config;
    constructor();
    static get observedAttributes(): string[];
    attributeChangedCallback(name: string, oldValue: string, newValue: string): void;
    connectedCallback(): Promise<void>;
    disconnectedCallback(): void;
    private loadStyles;
    private render;
    private attachEventListeners;
    private removeEventListeners;
    private loadData;
    private handleSearch;
    private performSearch;
    private matchesSearch;
    private renderResults;
    private handleResultClick;
    private handleResultHover;
    private selectResult;
    private handleKeyDown;
    private navigateResults;
    private setSelectedIndex;
    private scrollToSelected;
    private handleFocus;
    private handleClear;
    private handleTabClick;
    private handleClickOutside;
    private handleResize;
    private handleScroll;
    private openDropdown;
    private closeDropdown;
    /**
     * Updates dropdown position based on available viewport space
     * Shows dropdown above input if insufficient space below
     */
    private updateDropdownPosition;
    private updateTheme;
    private highlightText;
    private escapeHtml;
    private escapeRegex;
    private formatCurrency;
    private formatDate;
    /**
     * Public API: Programmatically perform a search
     */
    search(query: string): void;
    /**
     * Public API: Clear the search input and results
     */
    clear(): void;
    /**
     * Public API: Set the active tab filter
     */
    setTab(tab: string): void;
    /**
     * Public API: Get current search results
     */
    getResults(): SearchResult[];
    /**
     * Public API: Get the currently active tab
     */
    getActiveTab(): string;
    private initializeDemoFunctionality;
    private initializeThemeManagement;
    private applyTheme;
    private initializeResultDisplay;
    private displaySelectedResult;
    private clearSelectedResult;
}
export { SmartSearchComponent, SearchResult, ComponentConfig };
//# sourceMappingURL=smart-search.d.ts.map