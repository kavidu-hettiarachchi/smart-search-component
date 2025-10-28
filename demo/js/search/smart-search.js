/**
 * Smart Search Web Component for Banking Application
 * A reusable, accessible, and themeable search component
 */
class SmartSearchComponent extends HTMLElement {
    constructor() {
        super();
        this.searchInput = null;
        this.resultsContainer = null;
        this.tabsContainer = null;
        this.clearButton = null;
        this.dropdown = null;
        this.themeToggle = null;
        this.selectedResultDiv = null;
        this.searchData = {
            accounts: [],
            customers: [],
            transactions: []
        };
        this.filteredResults = [];
        this.selectedIndex = -1;
        this.activeTab = 'all';
        this.isOpen = false;
        this.debounceTimer = null;
        this.config = {
            placeholder: 'Search accounts, customers, transactions...',
            minSearchLength: 1,
            debounceDelay: 300,
            maxResults: 50,
            enableFilters: true,
            highlightMatches: true,
            dataEndpoint: '../data/'
        };
        this.shadow = this.attachShadow({ mode: 'open' });
    }
    static get observedAttributes() {
        return ['placeholder', 'min-search-length', 'debounce-delay', 'max-results', 'data-endpoint', 'theme'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        switch (name) {
            case 'placeholder':
                this.config.placeholder = newValue;
                if (this.searchInput)
                    this.searchInput.placeholder = newValue;
                break;
            case 'min-search-length':
                this.config.minSearchLength = parseInt(newValue) || 1;
                break;
            case 'debounce-delay':
                this.config.debounceDelay = parseInt(newValue) || 300;
                break;
            case 'max-results':
                this.config.maxResults = parseInt(newValue) || 50;
                break;
            case 'data-endpoint':
                this.config.dataEndpoint = newValue;
                break;
            case 'theme':
                this.updateTheme(newValue);
                break;
        }
    }
    async connectedCallback() {
        this.render();
        await this.loadData();
        this.initializeDemoFunctionality();
        this.attachEventListeners();
        this.updateTheme(this.getAttribute('theme') || 'light');
    }
    disconnectedCallback() {
        this.removeEventListeners();
        if (this.debounceTimer)
            clearTimeout(this.debounceTimer);
    }
    async loadStyles() {
        try {
            const response = await fetch('../src/search/smart-search.css');
            const css = await response.text();
            const style = document.createElement('style');
            style.textContent = css;
            this.shadow.appendChild(style);
        }
        catch (error) {
            console.warn('Could not load smart-search.css, component may not display correctly');
        }
    }
    render() {
        const fontAwesomeLink = document.createElement('link');
        fontAwesomeLink.rel = 'stylesheet';
        fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css';
        fontAwesomeLink.crossOrigin = 'anonymous';
        this.shadow.appendChild(fontAwesomeLink);
        this.loadStyles();
        this.shadow.innerHTML += `
      <div class="search-container" role="search">
        <div class="search-wrapper">
          <i class="search-icon fas fa-search" aria-hidden="true"></i>
          <input
            type="text"
            class="search-input"
            placeholder="${this.config.placeholder}"
            role="combobox"
            aria-label="Search banking data"
            aria-autocomplete="list"
            aria-expanded="false"
            aria-controls="search-results"
            aria-haspopup="listbox"
          />
          <button class="clear-button" aria-label="Clear search" type="button">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        <div class="dropdown" role="listbox" id="search-results" aria-label="Search results">
          <div class="tabs-container" role="tablist">
            <button class="tab active" data-tab="all" role="tab" aria-selected="true" aria-controls="panel-all">
              <i class="tab-icon fas fa-th" aria-hidden="true"></i>
              <span>All</span>
            </button>
            <button class="tab" data-tab="account" role="tab" aria-selected="false" aria-controls="panel-account">
              <i class="tab-icon fas fa-university" aria-hidden="true"></i>
              <span>Accounts</span>
            </button>
            <button class="tab" data-tab="customer" role="tab" aria-selected="false" aria-controls="panel-customer">
              <i class="tab-icon fas fa-user" aria-hidden="true"></i>
              <span>Customers</span>
            </button>
            <button class="tab" data-tab="transaction" role="tab" aria-selected="false" aria-controls="panel-transaction">
              <i class="tab-icon fas fa-exchange-alt" aria-hidden="true"></i>
              <span>Transactions</span>
            </button>
          </div>
          <div class="results-container">
            <ul class="results-list"></ul>
          </div>
        </div>
      </div>
    `;
        // Get references to elements
        this.searchInput = this.shadow.querySelector('.search-input');
        this.resultsContainer = this.shadow.querySelector('.results-list');
        this.tabsContainer = this.shadow.querySelector('.tabs-container');
        this.clearButton = this.shadow.querySelector('.clear-button');
        this.dropdown = this.shadow.querySelector('.dropdown');
    }
    attachEventListeners() {
        // Search input events
        this.searchInput?.addEventListener('input', this.handleSearch.bind(this));
        this.searchInput?.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.searchInput?.addEventListener('focus', this.handleFocus.bind(this));
        // Clear button
        this.clearButton?.addEventListener('click', this.handleClear.bind(this));
        // Tab buttons
        const tabs = this.tabsContainer?.querySelectorAll('.tab');
        tabs?.forEach(tab => {
            tab.addEventListener('click', this.handleTabClick.bind(this));
        });
        // Click outside to close
        document.addEventListener('click', this.handleClickOutside.bind(this));
        // Window resize and scroll
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('scroll', this.handleScroll.bind(this), true);
    }
    removeEventListeners() {
        document.removeEventListener('click', this.handleClickOutside.bind(this));
        window.removeEventListener('resize', this.handleResize.bind(this));
        window.removeEventListener('scroll', this.handleScroll.bind(this), true);
    }
    async loadData() {
        try {
            const endpoint = this.config.dataEndpoint || './data/';
            const [accountsRes, customersRes, transactionsRes] = await Promise.all([
                fetch(`${endpoint}accounts.json`),
                fetch(`${endpoint}customers.json`),
                fetch(`${endpoint}transactions.json`)
            ]);
            this.searchData.accounts = await accountsRes.json();
            this.searchData.customers = await customersRes.json();
            this.searchData.transactions = await transactionsRes.json();
            this.dispatchEvent(new CustomEvent('data-loaded', {
                detail: { success: true },
                bubbles: true,
                composed: true
            }));
        }
        catch (error) {
            console.error('Failed to load search data:', error);
            this.dispatchEvent(new CustomEvent('data-load-error', {
                detail: { error },
                bubbles: true,
                composed: true
            }));
        }
    }
    handleSearch(event) {
        const query = event.target.value;
        // Show/hide clear button
        if (this.clearButton) {
            if (query.length > 0) {
                this.clearButton.classList.add('visible');
            }
            else {
                this.clearButton.classList.remove('visible');
            }
        }
        // Debounce search
        if (this.debounceTimer)
            clearTimeout(this.debounceTimer);
        if (query.length < (this.config.minSearchLength || 1)) {
            this.closeDropdown();
            return;
        }
        this.debounceTimer = window.setTimeout(() => {
            this.performSearch(query);
        }, this.config.debounceDelay);
    }
    performSearch(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        // Search accounts
        if (this.activeTab === 'all' || this.activeTab === 'account') {
            this.searchData.accounts.forEach(account => {
                if (this.matchesSearch(account, lowerQuery, ['accountNumber', 'title', 'type'])) {
                    results.push({
                        id: account.id,
                        type: 'account',
                        title: account.title,
                        subtitle: `${account.accountNumber} • ${this.formatCurrency(account.balance)}`,
                        metadata: `${account.type} • ${account.status}`,
                        icon: 'fas fa-university',
                        rawData: account
                    });
                }
            });
        }
        // Search customers
        if (this.activeTab === 'all' || this.activeTab === 'customer') {
            this.searchData.customers.forEach(customer => {
                if (this.matchesSearch(customer, lowerQuery, ['firstName', 'lastName', 'email', 'customerId'])) {
                    results.push({
                        id: customer.id,
                        type: 'customer',
                        title: `${customer.firstName} ${customer.lastName}`,
                        subtitle: customer.email,
                        metadata: `${customer.accountType} • ${customer.totalAccounts} accounts`,
                        icon: 'fas fa-user',
                        rawData: customer
                    });
                }
            });
        }
        // Search transactions
        if (this.activeTab === 'all' || this.activeTab === 'transaction') {
            this.searchData.transactions.forEach(transaction => {
                if (this.matchesSearch(transaction, lowerQuery, ['transactionId', 'merchant', 'category', 'description'])) {
                    results.push({
                        id: transaction.id,
                        type: 'transaction',
                        title: transaction.merchant,
                        subtitle: `${this.formatCurrency(transaction.amount)} • ${transaction.category}`,
                        metadata: `${transaction.type} • ${this.formatDate(transaction.date)}`,
                        icon: 'fas fa-exchange-alt',
                        rawData: transaction
                    });
                }
            });
        }
        this.filteredResults = results.slice(0, this.config.maxResults);
        this.renderResults(query);
        // Always open dropdown to show results or "no results" message
        this.openDropdown();
        // Dispatch search event
        this.dispatchEvent(new CustomEvent('search-performed', {
            detail: { query, resultCount: this.filteredResults.length, activeTab: this.activeTab },
            bubbles: true,
            composed: true
        }));
    }
    matchesSearch(item, query, fields) {
        return fields.some(field => {
            const value = item[field];
            if (value === null || value === undefined)
                return false;
            return String(value).toLowerCase().includes(query);
        });
    }
    renderResults(query) {
        if (!this.resultsContainer)
            return;
        if (this.filteredResults.length === 0) {
            this.resultsContainer.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">
            <i class="fas fa-search"></i>
          </div>
          <div class="no-results-text">No results found for "${this.escapeHtml(query)}"</div>
        </div>
      `;
            return;
        }
        // Render results without grouping (tabs handle the filtering)
        let html = '';
        this.filteredResults.forEach((result) => {
            const globalIndex = this.filteredResults.indexOf(result);
            const highlightedTitle = this.config.highlightMatches
                ? this.highlightText(result.title, query)
                : this.escapeHtml(result.title);
            const highlightedSubtitle = this.config.highlightMatches
                ? this.highlightText(result.subtitle, query)
                : this.escapeHtml(result.subtitle);
            html += `
        <li 
          class="result-item" 
          data-index="${globalIndex}"
          role="option"
          aria-selected="false"
          tabindex="-1"
        >
          <div class="result-header">
            <div class="result-icon ${result.type}">
              <i class="${result.icon}" aria-hidden="true"></i>
            </div>
            <div class="result-content">
              <div class="result-title">${highlightedTitle}</div>
              <div class="result-subtitle">${highlightedSubtitle}</div>
              ${result.metadata ? `<div class="result-metadata">${this.escapeHtml(result.metadata)}</div>` : ''}
            </div>
          </div>
        </li>
      `;
        });
        this.resultsContainer.innerHTML = html;
        // Attach click handlers to result items
        const resultItems = this.resultsContainer.querySelectorAll('.result-item');
        resultItems.forEach(item => {
            item.addEventListener('click', this.handleResultClick.bind(this));
            item.addEventListener('mouseenter', this.handleResultHover.bind(this));
        });
        this.selectedIndex = -1;
    }
    handleResultClick(event) {
        const item = event.currentTarget;
        const index = parseInt(item.dataset.index || '-1');
        if (index >= 0 && index < this.filteredResults.length) {
            const result = this.filteredResults[index];
            this.selectResult(result);
        }
    }
    handleResultHover(event) {
        const item = event.currentTarget;
        const index = parseInt(item.dataset.index || '-1');
        this.setSelectedIndex(index);
    }
    selectResult(result) {
        this.dispatchEvent(new CustomEvent('result-selected', {
            detail: { result },
            bubbles: true,
            composed: true
        }));
        if (this.searchInput) {
            this.searchInput.value = result.title;
        }
        this.closeDropdown();
    }
    handleKeyDown(event) {
        if (!this.isOpen) {
            if (event.key === 'ArrowDown' && this.searchInput?.value) {
                this.openDropdown();
                event.preventDefault();
            }
            return;
        }
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.navigateResults(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.navigateResults(-1);
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
                break;
            case 'Tab':
                this.closeDropdown();
                break;
        }
    }
    navigateResults(direction) {
        const newIndex = this.selectedIndex + direction;
        if (newIndex < -1 || newIndex >= this.filteredResults.length) {
            return;
        }
        this.setSelectedIndex(newIndex);
        this.scrollToSelected();
    }
    setSelectedIndex(index) {
        const items = this.resultsContainer?.querySelectorAll('.result-item');
        if (!items)
            return;
        // Remove previous selection
        if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
            items[this.selectedIndex].classList.remove('selected');
            items[this.selectedIndex].setAttribute('aria-selected', 'false');
        }
        this.selectedIndex = index;
        // Add new selection
        if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
            items[this.selectedIndex].classList.add('selected');
            items[this.selectedIndex].setAttribute('aria-selected', 'true');
        }
        // Update aria-activedescendant
        if (this.searchInput) {
            if (this.selectedIndex >= 0) {
                const selectedId = `result-${this.selectedIndex}`;
                this.searchInput.setAttribute('aria-activedescendant', selectedId);
            }
            else {
                this.searchInput.removeAttribute('aria-activedescendant');
            }
        }
    }
    scrollToSelected() {
        if (this.selectedIndex < 0 || !this.dropdown || !this.resultsContainer)
            return;
        const items = this.resultsContainer.querySelectorAll('.result-item');
        const selectedItem = items[this.selectedIndex];
        if (selectedItem) {
            const dropdownRect = this.dropdown.getBoundingClientRect();
            const itemRect = selectedItem.getBoundingClientRect();
            if (itemRect.bottom > dropdownRect.bottom) {
                selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
            else if (itemRect.top < dropdownRect.top) {
                selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }
    handleFocus() {
        if (this.searchInput?.value && this.searchInput.value.length >= this.config.minSearchLength) {
            this.openDropdown();
        }
    }
    handleClear() {
        if (this.searchInput) {
            this.searchInput.value = '';
            this.searchInput.focus();
        }
        if (this.clearButton) {
            this.clearButton.classList.remove('visible');
        }
        this.filteredResults = [];
        this.closeDropdown();
        this.clearSelectedResult();
        this.dispatchEvent(new CustomEvent('search-cleared'));
    }
    handleTabClick(event) {
        const tab = event.target;
        const tabName = tab.dataset.tab || tab.closest('.tab')?.getAttribute('data-tab');
        if (!tabName)
            return;
        // Update active tab
        this.activeTab = tabName;
        const tabs = this.tabsContainer?.querySelectorAll('.tab');
        tabs?.forEach(t => {
            if (t.dataset.tab === tabName) {
                t.classList.add('active');
                t.setAttribute('aria-selected', 'true');
            }
            else {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            }
        });
        // Re-perform search with new tab if there's a query
        if (this.searchInput?.value) {
            this.performSearch(this.searchInput.value);
        }
        else {
            // If no search query, ensure dropdown is closed
            this.closeDropdown();
        }
        this.dispatchEvent(new CustomEvent('tab-changed', {
            detail: { activeTab: this.activeTab },
            bubbles: true,
            composed: true
        }));
    }
    handleClickOutside(event) {
        if (!this.contains(event.target)) {
            this.closeDropdown();
        }
    }
    handleResize() {
        if (this.isOpen) {
            this.updateDropdownPosition();
        }
    }
    handleScroll() {
        if (this.isOpen) {
            this.updateDropdownPosition();
        }
    }
    openDropdown() {
        if (!this.dropdown)
            return;
        if (this.isOpen) {
            return;
        }
        this.isOpen = true;
        this.dropdown.classList.add('open');
        if (this.searchInput) {
            this.searchInput.setAttribute('aria-expanded', 'true');
        }
        this.updateDropdownPosition();
        // Set focus to first result if available
        const firstResult = this.dropdown.querySelector('.result-item');
        if (firstResult) {
            firstResult.setAttribute('tabindex', '0');
        }
        this.dispatchEvent(new CustomEvent('dropdown-opened', {
            bubbles: true,
            composed: true
        }));
    }
    closeDropdown() {
        if (!this.dropdown || !this.isOpen)
            return;
        this.isOpen = false;
        this.dropdown.classList.remove('open');
        if (this.searchInput) {
            this.searchInput.setAttribute('aria-expanded', 'false');
        }
        this.selectedIndex = -1;
        this.dispatchEvent(new CustomEvent('dropdown-closed', {
            bubbles: true,
            composed: true
        }));
    }
    /**
     * Updates dropdown position based on available viewport space
     * Shows dropdown above input if insufficient space below
     */
    updateDropdownPosition() {
        if (!this.dropdown)
            return;
        const rect = this.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        // If not enough space below but more space above, show dropdown above
        if (spaceBelow < 300 && spaceAbove > spaceBelow) {
            this.dropdown.style.top = 'auto';
            this.dropdown.style.bottom = '100%';
            this.dropdown.style.marginBottom = '8px';
            this.dropdown.style.marginTop = '0';
        }
        else {
            this.dropdown.style.top = 'calc(100% + 8px)';
            this.dropdown.style.bottom = 'auto';
            this.dropdown.style.marginTop = '0';
            this.dropdown.style.marginBottom = '0';
        }
    }
    updateTheme(theme) {
        this.setAttribute('theme', theme);
        this.dispatchEvent(new CustomEvent('theme-changed', {
            detail: { theme },
            bubbles: true,
            composed: true
        }));
    }
    // Utility methods
    highlightText(text, query) {
        const escapedText = this.escapeHtml(text);
        const escapedQuery = this.escapeRegex(query);
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        return escapedText.replace(regex, '<span class="highlight">$1</span>');
    }
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    escapeRegex(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
    formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    }
    /**
     * Public API: Programmatically perform a search
     */
    search(query) {
        if (this.searchInput) {
            this.searchInput.value = query;
            this.performSearch(query);
        }
    }
    /**
     * Public API: Clear the search input and results
     */
    clear() {
        this.handleClear();
    }
    /**
     * Public API: Set the active tab filter
     */
    setTab(tab) {
        this.activeTab = tab;
        // Update UI
        const tabs = this.tabsContainer?.querySelectorAll('.tab');
        tabs?.forEach(t => {
            const tabName = t.dataset.tab;
            if (tabName === tab) {
                t.classList.add('active');
                t.setAttribute('aria-selected', 'true');
            }
            else {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            }
        });
        // Re-search if there's a query
        if (this.searchInput?.value) {
            this.performSearch(this.searchInput.value);
        }
    }
    /**
     * Public API: Get current search results
     */
    getResults() {
        return this.filteredResults;
    }
    /**
     * Public API: Get the currently active tab
     */
    getActiveTab() {
        return this.activeTab;
    }
    initializeDemoFunctionality() {
        // Find theme toggle and selected result div in the document
        this.themeToggle = document.getElementById('themeToggle');
        this.selectedResultDiv = document.getElementById('selectedResult');
        // Initialize theme management
        this.initializeThemeManagement();
        // Initialize result display
        this.initializeResultDisplay();
        // Log component API
        console.log('Smart Search Component loaded!');
        console.log('Available methods:', {
            search: 'searchComponent.search(query)',
            clear: 'searchComponent.clear()',
            setTab: 'searchComponent.setTab("all"|"account"|"customer"|"transaction")',
            getResults: 'searchComponent.getResults()',
            getActiveTab: 'searchComponent.getActiveTab()'
        });
    }
    initializeThemeManagement() {
        if (!this.themeToggle)
            return;
        // Apply saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme(savedTheme);
        // Add theme toggle event listener
        this.themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            this.applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
    applyTheme(theme) {
        if (!this.themeToggle)
            return;
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            this.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            this.setAttribute('theme', 'dark');
        }
        else {
            document.body.classList.remove('dark-theme');
            this.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            this.setAttribute('theme', 'light');
        }
    }
    initializeResultDisplay() {
        // Add event listeners for component events
        this.addEventListener('result-selected', (e) => {
            const customEvent = e;
            this.displaySelectedResult(customEvent.detail.result);
            console.log('Selected:', customEvent.detail.result);
        });
        this.addEventListener('search-performed', (e) => {
            const customEvent = e;
            console.log(`Search: "${customEvent.detail.query}" - Found ${customEvent.detail.resultCount} results in tab: ${customEvent.detail.activeTab}`);
        });
        this.addEventListener('tab-changed', (e) => {
            const customEvent = e;
            console.log('Tab changed to:', customEvent.detail.activeTab);
        });
        this.addEventListener('search-cleared', () => {
            this.clearSelectedResult();
        });
        // Initialize with empty state
        this.clearSelectedResult();
    }
    displaySelectedResult(result) {
        if (!this.selectedResultDiv)
            return;
        const iconMap = {
            account: 'fa-university',
            customer: 'fa-user',
            transaction: 'fa-exchange-alt'
        };
        this.selectedResultDiv.innerHTML = `
      <div class="selected-result-container">
        <div class="selected-result-icon ${result.type}">
          <i class="fas ${iconMap[result.type]}"></i>
        </div>
        <div class="selected-result-content">
          <div class="selected-result-type">
            ${result.type}
          </div>
          <h4 class="selected-result-title">${this.escapeHtml(result.title)}</h4>
          <p class="selected-result-subtitle">${this.escapeHtml(result.subtitle)}</p>
          ${result.metadata ? `<p class="selected-result-metadata">${this.escapeHtml(result.metadata)}</p>` : ''}
          <div class="selected-result-raw-data">
            <div class="selected-result-raw-data-label">RAW DATA:</div>
            <pre class="selected-result-raw-data-content">${JSON.stringify(result.rawData, null, 2)}</pre>
          </div>
        </div>
      </div>
    `;
    }
    clearSelectedResult() {
        if (!this.selectedResultDiv)
            return;
        this.selectedResultDiv.innerHTML = `
      <div class="no-selection">
        <div class="no-selection-icon">
          <i class="fas fa-mouse-pointer"></i>
        </div>
        <p>Search and select a result to see details here</p>
      </div>
    `;
    }
}
// Register the custom element
if (!customElements.get('smart-search')) {
    customElements.define('smart-search', SmartSearchComponent);
}
// Export for TypeScript modules
export { SmartSearchComponent };
//# sourceMappingURL=smart-search.js.map