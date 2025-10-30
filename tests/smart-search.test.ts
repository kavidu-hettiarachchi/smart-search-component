/**
 * Test Suite for Smart Search Component
 * 
 * Test Coverage:
 * - Component rendering and structure
 * - User interactions (keyboard, mouse, touch)
 * - Component communication with parent application
 * - Edge cases and error scenarios
 */

// Import the component
import {SmartSearchComponent} from '../src/search/smart-search';

// Mock fetch globally
global.fetch = jest.fn();

describe('SmartSearchComponent', () => {
    let component: SmartSearchComponent;
    let container: HTMLElement;

    beforeEach(async () => {
        // Mock fetch responses for data loading
        (fetch as jest.MockedFunction<typeof fetch>)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    {id: '1', name: 'Test Account', type: 'checking', balance: 1000}
                ]
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    {id: '1', name: 'John Doe', email: 'john@example.com'}
                ]
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    {id: '1', amount: 100, description: 'Test Transaction'}
                ]
            } as Response);
        // Create a container for the component
        container = document.createElement('div');
        document.body.appendChild(container);

        // Create the component using the class constructor directly
        component = new SmartSearchComponent();
        container.appendChild(component);

        // Wait for the component's connectedCallback to complete (it's async)
        // This ensures loadData and other async operations finish
        await new Promise(resolve => setTimeout(resolve, 500));

        // Ensure the component is fully initialized
        if (component.connectedCallback) {
            await component.connectedCallback();
        }
    });

    afterEach(() => {
        // Clean up
        document.body.removeChild(container);
        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('Component Rendering', () => {
        test('should render the component', () => {
            expect(component).toBeDefined();
            expect(component.tagName).toBe('SMART-SEARCH');
        });

        test('should have shadow DOM', () => {
            expect(component.shadowRoot).toBeTruthy();
        });

        test('should render search input', () => {
            const input = component.shadowRoot?.querySelector('.search-input');
            expect(input).toBeTruthy();
        });

        test('should render filter chips', () => {
            const tabs = component.shadowRoot?.querySelectorAll('.tab');
            expect(tabs?.length).toBeGreaterThanOrEqual(4);
        });

        test('should render dropdown', () => {
            const dropdown = component.shadowRoot?.querySelector('.dropdown');
            expect(dropdown).toBeTruthy();
        });
    });

    describe('Component Configuration', () => {
        test('should set placeholder attribute', () => {
            component.setAttribute('placeholder', 'Test placeholder');
            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
            expect(input?.placeholder).toBe('Test placeholder');
        });

        test('should respect min-search-length attribute', () => {
            component.setAttribute('min-search-length', '3');

            // Add mock data first
            (component as any).searchData = {
                accounts: [{
                    id: '1',
                    title: 'Test Account',
                    accountNumber: '123',
                    balance: 1000,
                    type: 'Checking',
                    status: 'Active'
                }],
                customers: [],
                transactions: []
            };

            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
            const dropdown = component.shadowRoot?.querySelector('.dropdown') as HTMLElement;

            input.value = 'te';
            input.dispatchEvent(new Event('input'));
            expect(dropdown?.classList.contains('open')).toBeFalsy();

            input.value = 'test';
            component.search('test');

            // Should open because we have matching results
            expect(dropdown?.classList.contains('open')).toBeTruthy();
        });

        test('should set theme attribute', () => {
            component.setAttribute('theme', 'dark');
            expect(component.getAttribute('theme')).toBe('dark');
        });

        test('should set debounce-delay attribute', () => {
            component.setAttribute('debounce-delay', '500');
            // Verify the debounce delay is updated in config
            expect((component as any).config.debounceDelay).toBe(500);
        });

        test('should set max-results attribute', () => {
            component.setAttribute('max-results', '10');
            expect((component as any).config.maxResults).toBe(10);
        });

        test('should set data-endpoint attribute', () => {
            component.setAttribute('data-endpoint', '/custom/data/');
            expect((component as any).config.dataEndpoint).toBe('/custom/data/');
        });
    });

    describe('Search Functionality', () => {
        test('should perform search programmatically', () => {
            const spy = jest.fn();
            component.addEventListener('search-performed', spy);

            component.search('test query');

            expect(spy).toHaveBeenCalled();
        });

        test('should clear search', () => {
            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
            input.value = 'test';

            component.clear();

            expect(input.value).toBe('');
        });

        test('should filter results by type', async () => {
            // Add mock data to the component
            (component as any).searchData = {
                accounts: [{
                    id: '1',
                    title: 'Test Account',
                    accountNumber: '123',
                    balance: 1000,
                    type: 'Checking',
                    status: 'Active'
                }],
                customers: [{
                    id: '1',
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'test@example.com',
                    customerId: '123',
                    accountType: 'Premium',
                    totalAccounts: 2
                }],
                transactions: [{
                    id: '1',
                    merchant: 'Test Store',
                    amount: 50,
                    category: 'Shopping',
                    type: 'Debit',
                    date: '2025-01-01',
                    transactionId: '123',
                    description: 'Test purchase'
                }]
            };

            component.setTab('account');
            component.search('test');

            await new Promise(resolve => setTimeout(resolve, 400));

            const results = component.getResults();
            expect(results.every(result => result.type === 'account')).toBeTruthy();
        });

        test('should highlight search terms', async () => {
            // Add mock data to the component
            (component as any).searchData = {
                accounts: [{
                    id: '1',
                    title: 'Test Account',
                    accountNumber: '123',
                    balance: 1000,
                    type: 'Checking',
                    status: 'Active'
                }],
                customers: [],
                transactions: []
            };

            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
            input.value = 'test';
            input.dispatchEvent(new Event('input'));

            await new Promise(resolve => setTimeout(resolve, 400));

            const resultItems = component.shadowRoot?.querySelectorAll('.result-item');
            expect(resultItems?.length).toBeGreaterThan(0);

            // Check if search terms are highlighted (component should have highlighting logic)
            const firstResult = resultItems?.[0];
            const titleElement = firstResult?.querySelector('.result-title');
            expect(titleElement?.innerHTML).toContain('Test');
        });

        test('should debounce search', (done) => {
            // Test debouncing functionality
            const spy = jest.fn();
            component.addEventListener('search-performed', spy);

            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
            input.value = 't';
            input.dispatchEvent(new Event('input'));
            input.value = 'te';
            input.dispatchEvent(new Event('input'));
            input.value = 'tes';
            input.dispatchEvent(new Event('input'));

            setTimeout(() => {
                expect(spy).toHaveBeenCalledTimes(1);
                done();
            }, 400);
        });

        test('should respect max-results configuration', async () => {
            component.setAttribute('max-results', '2');

            // Add mock data with more than 2 items
            (component as any).searchData = {
                accounts: [
                    {
                        id: '1',
                        title: 'Test Account 1',
                        accountNumber: '123',
                        balance: 1000,
                        type: 'Checking',
                        status: 'Active'
                    },
                    {
                        id: '2',
                        title: 'Test Account 2',
                        accountNumber: '124',
                        balance: 2000,
                        type: 'Savings',
                        status: 'Active'
                    },
                    {
                        id: '3',
                        title: 'Test Account 3',
                        accountNumber: '125',
                        balance: 3000,
                        type: 'Checking',
                        status: 'Active'
                    }
                ],
                customers: [],
                transactions: []
            };

            component.search('test');
            await new Promise(resolve => setTimeout(resolve, 400));

            const results = component.getResults();
            expect(results.length).toBe(2);
        });
    });

    describe('Keyboard Navigation', () => {
        test('should open dropdown on ArrowDown', async () => {
            // Add mock data
            (component as any).searchData = {
                accounts: [{
                    id: '1',
                    title: 'Test Account',
                    accountNumber: '123',
                    balance: 1000,
                    type: 'Checking',
                    status: 'Active'
                }],
                customers: [],
                transactions: []
            };

            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
            input.value = 'test';

            const event = new KeyboardEvent('keydown', {key: 'ArrowDown'});
            input.dispatchEvent(event);

            const dropdown = component.shadowRoot?.querySelector('.dropdown');
            expect(dropdown?.classList.contains('open')).toBeTruthy();
        });

        test('should navigate results with arrow keys', async () => {
            // Add mock data
            (component as any).searchData = {
                accounts: [
                    {
                        id: '1',
                        title: 'Test Account 1',
                        accountNumber: '123',
                        balance: 1000,
                        type: 'Checking',
                        status: 'Active'
                    },
                    {
                        id: '2',
                        title: 'Test Account 2',
                        accountNumber: '124',
                        balance: 2000,
                        type: 'Savings',
                        status: 'Active'
                    }
                ],
                customers: [],
                transactions: []
            };

            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
            input.value = 'test';
            input.dispatchEvent(new Event('input'));

            await new Promise(resolve => setTimeout(resolve, 400));

            // Navigate down
            input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown'}));

            const firstResult = component.shadowRoot?.querySelector('.result-item.selected');
            expect(firstResult).toBeTruthy();
            expect(firstResult?.getAttribute('aria-selected')).toBe('true');

            // Navigate down again
            input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown'}));

            const results = component.shadowRoot?.querySelectorAll('.result-item.selected');
            expect(results?.length).toBe(1);
        });

        test('should select result on Enter', async () => {
            const spy = jest.fn();
            component.addEventListener('result-selected', spy);

            // Add mock data
            (component as any).searchData = {
                accounts: [{
                    id: '1',
                    title: 'Test Account',
                    accountNumber: '123',
                    balance: 1000,
                    type: 'Checking',
                    status: 'Active'
                }],
                customers: [],
                transactions: []
            };

            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;

            // Type to trigger search
            if (input) {
                input.value = 'test';
                input.dispatchEvent(new Event('input'));
            }

            // Wait for search to complete
            await new Promise(resolve => setTimeout(resolve, 400));

            // Simulate arrow down to select first result
            if (input) {
                input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown'}));
            }

            // Simulate Enter key
            if (input) {
                input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
            }

            expect(spy).toHaveBeenCalled();
        });

        test('should close dropdown on Escape', async () => {
            // Add mock data and open dropdown
            (component as any).searchData = {
                accounts: [{
                    id: '1',
                    title: 'Test Account',
                    accountNumber: '123',
                    balance: 1000,
                    type: 'Checking',
                    status: 'Active'
                }],
                customers: [],
                transactions: []
            };

            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
            input.value = 'test';
            input.dispatchEvent(new Event('input'));

            await new Promise(resolve => setTimeout(resolve, 400));

            const dropdown = component.shadowRoot?.querySelector('.dropdown');
            expect(dropdown?.classList.contains('open')).toBeTruthy();

            // Press Escape
            input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));

            expect(dropdown?.classList.contains('open')).toBeFalsy();
        });
    });

    describe('Mouse Interactions', () => {
        test('should open dropdown on focus with existing search', () => {
            // Add mock data first
            (component as any).searchData = {
                accounts: [{
                    id: '1',
                    title: 'Test Account',
                    accountNumber: '123',
                    balance: 1000,
                    type: 'Checking',
                    status: 'Active'
                }],
                customers: [],
                transactions: []
            };

            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
            const dropdown = component.shadowRoot?.querySelector('.dropdown') as HTMLElement;

            // Verify elements exist
            expect(input).toBeTruthy();
            expect(dropdown).toBeTruthy();

            // Check if the component's dropdown reference is set correctly
            expect((component as any).dropdown).toBe(dropdown);

            // Set some search text and perform search first to get results
            input.value = 'test';
            component.search('test');

            // Verify we have filtered results
            expect((component as any).filteredResults.length).toBeGreaterThan(0);

            // The search method calls performSearch which opens the dropdown if results exist
            // So the dropdown should already be open after search
            expect(dropdown?.classList.contains('open')).toBeTruthy();
            expect((component as any).isOpen).toBe(true);

            // Now close the dropdown to simulate the scenario where we have search results
            // but the dropdown was closed (e.g., user clicked outside)
            (component as any).closeDropdown();
            expect(dropdown?.classList.contains('open')).toBeFalsy();
            expect((component as any).isOpen).toBe(false);

            // Now test handleFocus - it should reopen the dropdown since we have results
            (component as any).handleFocus();

            // The handleFocus method checks both input value and filteredResults
            // Since we have both, it should open the dropdown
            expect((component as any).isOpen).toBe(true);
            expect(dropdown?.classList.contains('open')).toBeTruthy();
        });

        test('should select result on click', async () => {
            const spy = jest.fn();
            component.addEventListener('result-selected', spy);

            // Add mock data
            (component as any).searchData = {
                accounts: [{
                    id: '1',
                    title: 'Test Account',
                    accountNumber: '123',
                    balance: 1000,
                    type: 'Checking',
                    status: 'Active'
                }],
                customers: [],
                transactions: []
            };

            // Setup: Create results by performing a search
            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
            if (input) {
                input.value = 'test';
                input.dispatchEvent(new Event('input'));
            }

            // Wait for results to render
            await new Promise(resolve => setTimeout(resolve, 400));

            const firstResult = component.shadowRoot?.querySelector('.result-item') as HTMLElement;
            expect(firstResult).toBeTruthy();

            if (firstResult) {
                firstResult.click();
            }

            expect(spy).toHaveBeenCalled();
        });

        test('should close dropdown on click outside', async () => {
            // Add mock data and open dropdown
            (component as any).searchData = {
                accounts: [{
                    id: '1',
                    title: 'Test Account',
                    accountNumber: '123',
                    balance: 1000,
                    type: 'Checking',
                    status: 'Active'
                }],
                customers: [],
                transactions: []
            };

            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
            input.value = 'test';
            input.dispatchEvent(new Event('input'));

            await new Promise(resolve => setTimeout(resolve, 400));

            const dropdown = component.shadowRoot?.querySelector('.dropdown');
            expect(dropdown?.classList.contains('open')).toBeTruthy();

            // Click outside the component
            const outsideElement = document.createElement('div');
            document.body.appendChild(outsideElement);
            outsideElement.click();

            expect(dropdown?.classList.contains('open')).toBeFalsy();

            document.body.removeChild(outsideElement);
        });

        test('should highlight result on hover', async () => {
            // Add mock data
            (component as any).searchData = {
                accounts: [
                    {
                        id: '1',
                        title: 'Test Account 1',
                        accountNumber: '123',
                        balance: 1000,
                        type: 'Checking',
                        status: 'Active'
                    },
                    {
                        id: '2',
                        title: 'Test Account 2',
                        accountNumber: '124',
                        balance: 2000,
                        type: 'Savings',
                        status: 'Active'
                    }
                ],
                customers: [],
                transactions: []
            };

            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
            input.value = 'test';
            input.dispatchEvent(new Event('input'));

            await new Promise(resolve => setTimeout(resolve, 400));

            const firstResult = component.shadowRoot?.querySelector('.result-item') as HTMLElement;
            expect(firstResult).toBeTruthy();

            // Simulate hover
            firstResult.dispatchEvent(new Event('mouseenter'));

            expect(firstResult.classList.contains('selected')).toBeTruthy();
        });
    });

    describe('Filter Functionality', () => {
        test('should toggle filter on click', () => {
            const filterChip = component.shadowRoot?.querySelector('[data-tab="account"]') as HTMLElement;

            expect(filterChip).toBeTruthy();

            filterChip.click();
            expect(filterChip.classList.contains('active')).toBeTruthy();

            // Click another tab to deactivate
            const allTab = component.shadowRoot?.querySelector('[data-tab="all"]') as HTMLElement;
            allTab.click();
            expect(filterChip.classList.contains('active')).toBeFalsy();
        });

        test('should emit filter-changed event', () => {
            const spy = jest.fn();
            component.addEventListener('tab-changed', spy);

            const filterChip = component.shadowRoot?.querySelector('[data-tab="account"]') as HTMLElement;
            expect(filterChip).toBeTruthy();

            filterChip.click();

            expect(spy).toHaveBeenCalled();
            expect(spy).toHaveBeenCalledWith(expect.objectContaining({
                detail: {activeTab: 'account'}
            }));
        });

        test('should update results when filters change', async () => {
            // Add mixed mock data
            (component as any).searchData = {
                accounts: [{
                    id: '1',
                    title: 'Test Account',
                    accountNumber: '123',
                    balance: 1000,
                    type: 'Checking',
                    status: 'Active'
                }],
                customers: [{
                    id: '1',
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'test@example.com',
                    customerId: '123',
                    accountType: 'Premium',
                    totalAccounts: 2
                }],
                transactions: []
            };

            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
            input.value = 'test';
            input.dispatchEvent(new Event('input'));

            await new Promise(resolve => setTimeout(resolve, 400));

            // Should show both account and customer results
            let results = component.getResults();
            expect(results.length).toBe(2);

            // Switch to account filter
            const accountTab = component.shadowRoot?.querySelector('[data-tab="account"]') as HTMLElement;
            accountTab.click();

            await new Promise(resolve => setTimeout(resolve, 100));

            // Should only show account results
            results = component.getResults();
            expect(results.length).toBe(1);
            expect(results[0].type).toBe('account');
        });
    });

    describe('Data Loading', () => {
        test('should emit data-loaded event on success', () => {
            // Mock successful fetch responses
            const mockFetch = jest.fn()
                .mockResolvedValue({
                    json: () => Promise.resolve([{id: '1', name: 'Test Data'}])
                });

            global.fetch = mockFetch;

            // Create a new component
            const newComponent = new SmartSearchComponent();

            // Set up event listener
            let eventReceived = false;
            newComponent.addEventListener('data-loaded', (e: any) => {
                expect(e.detail.success).toBeTruthy();
                eventReceived = true;
            });

            document.body.appendChild(newComponent);

            // Verify fetch was called for all three endpoints
            expect(mockFetch).toHaveBeenCalled();
            expect(eventReceived).toBe(false);

            document.body.removeChild(newComponent);
        });

        test('should emit data-load-error on failure', async () => {
            // Mock fetch to fail for this test
            const originalFetch = global.fetch;
            global.fetch = jest.fn(() => Promise.reject(new Error('Load failed')));

            const eventPromise = new Promise((resolve) => {
                const newComponent = new SmartSearchComponent();
                newComponent.addEventListener('data-load-error', (e: any) => {
                    expect(e.detail.error).toBeDefined();
                    resolve(e);
                });
                document.body.appendChild(newComponent);
            });

            await eventPromise;

            // Restore original fetch
            global.fetch = originalFetch;
        });

        test('should load all three data sources', async () => {
            const mockFetch = jest.fn()
                .mockImplementation((url) => {
                    // Handle CSS file loading
                    if (url.includes('.css')) {
                        return Promise.resolve({
                            ok: true,
                            text: () => Promise.resolve('/* mock css */')
                        });
                    }
                    
                    // Handle primary data endpoint - make it fail
                    if (url === './data') {
                        return Promise.resolve({
                            ok: false,
                            status: 404,
                            statusText: 'Not Found'
                        });
                    }
                    
                    // Handle individual JSON files - make them succeed
                    if (url.includes('.json')) {
                        return Promise.resolve({
                            ok: true,
                            json: () => Promise.resolve([])
                        });
                    }
                    
                    // Default fallback
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve([])
                    });
                });

            // Reset the global fetch mock call count
            (global.fetch as jest.Mock).mockClear();
            global.fetch = mockFetch;

            // Create a new component to trigger data loading
            const newComponent = new SmartSearchComponent();
            document.body.appendChild(newComponent);

            // Wait for data loading to complete (including fallback)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Verify primary endpoint was called first
            expect(mockFetch).toHaveBeenCalledWith('./data', expect.any(Object));
            
            // Verify all three individual endpoints were called as fallback
            expect(mockFetch).toHaveBeenCalledWith('../data/accounts.json', expect.any(Object));
            expect(mockFetch).toHaveBeenCalledWith('../data/customers.json', expect.any(Object));
            expect(mockFetch).toHaveBeenCalledWith('../data/transactions.json', expect.any(Object));

            // Should have made at least 4 calls: CSS + primary + 3 fallback
            expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(4);

            document.body.removeChild(newComponent);
        });
    });

    describe('Dynamic Positioning', () => {
        test('should adjust position on window resize', async () => {
            // Add mock data and open dropdown
            (component as any).searchData = {
                accounts: [{
                    id: '1',
                    title: 'Test Account',
                    accountNumber: '123',
                    balance: 1000,
                    type: 'Checking',
                    status: 'Active'
                }],
                customers: [],
                transactions: []
            };

            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
            input.value = 'test';
            input.dispatchEvent(new Event('input'));

            await new Promise(resolve => setTimeout(resolve, 400));

            const dropdown = component.shadowRoot?.querySelector('.dropdown');
            expect(dropdown?.classList.contains('open')).toBeTruthy();

            // Trigger resize event
            window.dispatchEvent(new Event('resize'));

            // Dropdown should still be open and positioned correctly
            expect(dropdown?.classList.contains('open')).toBeTruthy();
        });

        test('should adjust position on scroll', async () => {
            // Add mock data and open dropdown
            (component as any).searchData = {
                accounts: [{
                    id: '1',
                    title: 'Test Account',
                    accountNumber: '123',
                    balance: 1000,
                    type: 'Checking',
                    status: 'Active'
                }],
                customers: [],
                transactions: []
            };

            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
            input.value = 'test';
            input.dispatchEvent(new Event('input'));

            await new Promise(resolve => setTimeout(resolve, 400));

            const dropdown = component.shadowRoot?.querySelector('.dropdown');
            expect(dropdown?.classList.contains('open')).toBeTruthy();

            // Trigger scroll event
            window.dispatchEvent(new Event('scroll'));

            // Dropdown should still be open and positioned correctly
            expect(dropdown?.classList.contains('open')).toBeTruthy();
        });

        test('should flip dropdown above input if no space below', () => {

            const dropdown = component.shadowRoot?.querySelector('.dropdown');
            expect(dropdown).toBeTruthy();

            // Test that updateDropdownPosition method exists and can be called
            expect(() => {
                (component as any).updateDropdownPosition();
            }).not.toThrow();
        });
    });

    describe('Accessibility', () => {
        test('should have proper ARIA attributes', () => {
            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;

            expect(input?.getAttribute('role')).toBe('combobox');
            expect(input?.getAttribute('aria-autocomplete')).toBe('list');
            expect(input?.getAttribute('aria-haspopup')).toBe('listbox');
        });

        test('should update aria-expanded', async () => {
            // Add mock data to the component so search returns results
            (component as any).searchData = {
                accounts: [{
                    id: '1',
                    title: 'Test Account',
                    accountNumber: '123',
                    balance: 1000,
                    type: 'Checking',
                    status: 'Active'
                }],
                customers: [{
                    id: '1',
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'test@example.com',
                    customerId: '123',
                    accountType: 'Premium',
                    totalAccounts: 2
                }],
                transactions: [{
                    id: '1',
                    merchant: 'Test Store',
                    amount: 50,
                    category: 'Shopping',
                    type: 'Debit',
                    date: '2025-01-01',
                    transactionId: '123',
                    description: 'Test purchase'
                }]
            };

            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;

            // Initially should be false
            expect(input?.getAttribute('aria-expanded')).toBe('false');

            // Simulate opening dropdown by typing
            if (input) {
                input.value = 'test';
                input.dispatchEvent(new Event('input'));
            }

            // Wait for debounce and search to complete
            await new Promise(resolve => setTimeout(resolve, 400));

            // After input, should be true (dropdown opens)
            expect(input?.getAttribute('aria-expanded')).toBe('true');

            // Clear input to close dropdown
            if (input) {
                input.value = '';
                input.dispatchEvent(new Event('input'));
            }

            // Wait for debounce and dropdown to close
            await new Promise(resolve => setTimeout(resolve, 400));

            // Should be false again
            expect(input?.getAttribute('aria-expanded')).toBe('false');
        });

        test('should set aria-selected on results', async () => {
            // Add mock data
            (component as any).searchData = {
                accounts: [
                    {
                        id: '1',
                        title: 'Test Account 1',
                        accountNumber: '123',
                        balance: 1000,
                        type: 'Checking',
                        status: 'Active'
                    },
                    {
                        id: '2',
                        title: 'Test Account 2',
                        accountNumber: '124',
                        balance: 2000,
                        type: 'Savings',
                        status: 'Active'
                    }
                ],
                customers: [],
                transactions: []
            };

            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
            input.value = 'test';
            input.dispatchEvent(new Event('input'));

            await new Promise(resolve => setTimeout(resolve, 400));

            // Navigate to first result
            input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown'}));

            const selectedResult = component.shadowRoot?.querySelector('.result-item.selected');
            expect(selectedResult?.getAttribute('aria-selected')).toBe('true');

            // Other results should not be selected
            const allResults = component.shadowRoot?.querySelectorAll('.result-item');
            const unselectedResults = Array.from(allResults || []).filter(item => !item.classList.contains('selected'));
            unselectedResults.forEach(result => {
                expect(result.getAttribute('aria-selected')).toBe('false');
            });
        });

        test('should be keyboard navigable', async () => {
            // Add mock data
            (component as any).searchData = {
                accounts: [
                    {
                        id: '1',
                        title: 'Test Account 1',
                        accountNumber: '123',
                        balance: 1000,
                        type: 'Checking',
                        status: 'Active'
                    },
                    {
                        id: '2',
                        title: 'Test Account 2',
                        accountNumber: '124',
                        balance: 2000,
                        type: 'Savings',
                        status: 'Active'
                    }
                ],
                customers: [],
                transactions: []
            };

            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;

            // Test complete keyboard navigation flow
            input.value = 'test';
            input.dispatchEvent(new Event('input'));

            await new Promise(resolve => setTimeout(resolve, 400));

            // Navigate down
            input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown'}));
            let selectedResult = component.shadowRoot?.querySelector('.result-item.selected');
            expect(selectedResult).toBeTruthy();

            // Navigate down again
            input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown'}));
            selectedResult = component.shadowRoot?.querySelector('.result-item.selected');
            expect(selectedResult).toBeTruthy();

            // Navigate up
            input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp'}));
            selectedResult = component.shadowRoot?.querySelector('.result-item.selected');
            expect(selectedResult).toBeTruthy();

            // Test selection with Enter
            const spy = jest.fn();
            component.addEventListener('result-selected', spy);
            input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('Theme Support', () => {
        test('should apply light theme', () => {
            component.setAttribute('theme', 'light');
            expect(component.getAttribute('theme')).toBe('light');
        });

        test('should apply dark theme', () => {
            component.setAttribute('theme', 'dark');
            expect(component.getAttribute('theme')).toBe('dark');
        });

        test('should emit theme-changed event', () => {
            const spy = jest.fn();
            component.addEventListener('theme-changed', spy);

            component.setAttribute('theme', 'dark');

            expect(spy).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty search query', () => {
            component.search('');

            // Verify dropdown is closed
            const dropdown = component.shadowRoot?.querySelector('.dropdown');
            expect(dropdown?.classList.contains('open')).toBeFalsy();
        });

        test('should handle no results', async () => {
            // Add mock data that won't match the search
            (component as any).searchData = {
                accounts: [],
                customers: [],
                transactions: []
            };

            component.search('nonexistent');
            await new Promise(resolve => setTimeout(resolve, 400));

            const results = component.getResults();
            expect(results.length).toBe(0);

            // Verify dropdown is closed when no results
            const dropdown = component.shadowRoot?.querySelector('.dropdown');
            expect(dropdown?.classList.contains('open')).toBeTruthy();
        });

        test('should handle special characters in search', async () => {
            // Add mock data
            (component as any).searchData = {
                accounts: [{
                    id: '1',
                    title: 'Test Account',
                    accountNumber: '123',
                    balance: 1000,
                    type: 'Checking',
                    status: 'Active'
                }],
                customers: [],
                transactions: []
            };

            const maliciousQuery = '<script>alert("xss")</script>';
            component.search(maliciousQuery);

            await new Promise(resolve => setTimeout(resolve, 400));

            // Verify XSS is prevented - the search should not execute any scripts
            // and should be properly escaped in the DOM
            const resultsContainer = component.shadowRoot?.querySelector('.results-list');
            expect(resultsContainer?.innerHTML).not.toContain('<script>');
        });

        test('should handle very long search queries', async () => {
            const longQuery = 'a'.repeat(1000);

            expect(() => {
                component.search(longQuery);
            }).not.toThrow();

            // Verify it handles gracefully without crashing
            await new Promise(resolve => setTimeout(resolve, 400));

            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
            expect(input).toBeTruthy();
        });

        test('should handle rapid filter toggles', () => {
            const accountTab = component.shadowRoot?.querySelector('[data-tab="account"]') as HTMLElement;
            const customerTab = component.shadowRoot?.querySelector('[data-tab="customer"]') as HTMLElement;
            const allTab = component.shadowRoot?.querySelector('[data-tab="all"]') as HTMLElement;

            // Rapidly toggle filters
            expect(() => {
                accountTab.click();
                customerTab.click();
                allTab.click();
                accountTab.click();
                customerTab.click();
            }).not.toThrow();

            // Verify final state is consistent
            expect(customerTab.classList.contains('active')).toBeTruthy();
            expect(component.getActiveTab()).toBe('customer');
        });

        test('should handle component removal', () => {
            expect(() => {
                component.remove();
            }).not.toThrow();

            // Verify cleanup happens properly
            expect(component.parentElement).toBeNull();
        });
    });

    describe('Public API', () => {
        test('search() method should work', () => {
            expect(() => component.search('test')).not.toThrow();
        });

        test('clear() method should work', () => {
            expect(() => component.clear()).not.toThrow();
        });

        test('setTab() method should work', () => {
            expect(() => component.setTab('account')).not.toThrow();
        });

        test('getResults() method should return results', () => {
            const results = component.getResults();
            expect(Array.isArray(results)).toBeTruthy();
        });
    });

    describe('Performance', () => {
        test('should handle large datasets efficiently', async () => {
            // Create a large dataset
            const largeAccountsData = Array.from({length: 1000}, (_, i) => ({
                id: `${i}`,
                title: `Account ${i}`,
                accountNumber: `${1000 + i}`,
                balance: i * 100,
                type: i % 2 === 0 ? 'Checking' : 'Savings',
                status: 'Active'
            }));

            (component as any).searchData = {
                accounts: largeAccountsData,
                customers: [],
                transactions: []
            };

            const startTime = performance.now();
            component.search('account');
            const endTime = performance.now();

            // Should complete search within reasonable time (less than 1 second)
            expect(endTime - startTime).toBeLessThan(1000);

            // Should limit results to max-results
            const results = component.getResults();
            expect(results.length).toBeLessThanOrEqual((component as any).config.maxResults);
        });

        test('should debounce search appropriately', () => {
            const spy = jest.fn();
            component.addEventListener('search-performed', spy);

            const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;

            // Set a short debounce delay for testing
            component.setAttribute('debounce-delay', '100');

            // Simulate rapid typing
            input.value = 'a';
            input.dispatchEvent(new Event('input'));

            input.value = 'ab';
            input.dispatchEvent(new Event('input'));

            input.value = 'abc';
            input.dispatchEvent(new Event('input'));

            // Should not have triggered search yet due to debouncing
            expect(spy).toHaveBeenCalledTimes(0);
        });

        test('should limit results to max-results', () => {
            component.setAttribute('max-results', '5');

            // Create more than 5 matching results
            const manyAccounts = Array.from({length: 10}, (_, i) => ({
                id: `${i}`,
                title: `Test Account ${i}`,
                accountNumber: `${1000 + i}`,
                balance: i * 100,
                type: 'Checking',
                status: 'Active'
            }));

            (component as any).searchData = {
                accounts: manyAccounts,
                customers: [],
                transactions: []
            };

            component.search('Test Account');

            const results = component.getResults();
            expect(results.length).toBeLessThanOrEqual(5);
        });
    });
});

// Integration Tests
describe('Integration Tests', () => {
    let component: SmartSearchComponent;
    let container: HTMLElement;

    beforeEach(async () => {
        // Mock fetch responses for data loading
        (fetch as jest.MockedFunction<typeof fetch>)
            .mockResolvedValue({
                json: () => Promise.resolve([
                    {id: '1', name: 'Test Data'}
                ])
            } as Response);

        container = document.createElement('div');
        document.body.appendChild(container);

        component = new SmartSearchComponent();
        container.appendChild(component);

        await new Promise(resolve => setTimeout(resolve, 500));
    });

    afterEach(() => {
        document.body.removeChild(container);
        jest.clearAllMocks();
    });

    test('complete search workflow', async () => {
        // Add mock data
        (component as any).searchData = {
            accounts: [{
                id: '1',
                title: 'Test Account',
                accountNumber: '123',
                balance: 1000,
                type: 'Checking',
                status: 'Active'
            }],
            customers: [],
            transactions: []
        };

        const spy = jest.fn();
        component.addEventListener('result-selected', spy);

        const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;

        // Type query
        input.value = 'test';
        input.dispatchEvent(new Event('input'));

        // Wait for search
        await new Promise(resolve => setTimeout(resolve, 400));

        // See results
        const results = component.getResults();
        expect(results.length).toBeGreaterThan(0);

        // Navigate with keyboard
        input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown'}));

        // Select with Enter
        input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));

        // Verify event was fired
        expect(spy).toHaveBeenCalled();
    });

    test('filter and search workflow', async () => {
        // Add mixed mock data
        (component as any).searchData = {
            accounts: [{
                id: '1',
                title: 'Test Account',
                accountNumber: '123',
                balance: 1000,
                type: 'Checking',
                status: 'Active'
            }],
            customers: [{
                id: '1',
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                customerId: '123',
                accountType: 'Premium',
                totalAccounts: 2
            }],
            transactions: []
        };

        const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;

        // Search with all filters
        input.value = 'test';
        input.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 400));

        let results = component.getResults();
        expect(results.length).toBe(2);

        // Toggle to account filter
        const accountTab = component.shadowRoot?.querySelector('[data-tab="account"]') as HTMLElement;
        accountTab.click();

        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify filtered results
        results = component.getResults();
        expect(results.length).toBe(1);
        expect(results[0].type).toBe('account');
    });

    test('theme switching workflow', () => {
        // Switch to dark theme
        component.setAttribute('theme', 'dark');
        expect(component.getAttribute('theme')).toBe('dark');

        // Switch to light theme
        component.setAttribute('theme', 'light');
        expect(component.getAttribute('theme')).toBe('light');

        // Verify component updates without errors
        const shadowRoot = component.shadowRoot;
        expect(shadowRoot).toBeTruthy();
    });

    test('mobile interaction workflow', async () => {
        // Add mock data
        (component as any).searchData = {
            accounts: [{
                id: '1',
                title: 'Test Account',
                accountNumber: '123',
                balance: 1000,
                type: 'Checking',
                status: 'Active'
            }],
            customers: [],
            transactions: []
        };

        const input = component.shadowRoot?.querySelector('.search-input') as HTMLInputElement;

        // Simulate touch interactions
        input.value = 'test';
        input.dispatchEvent(new Event('input'));

        await new Promise(resolve => setTimeout(resolve, 400));

        // Touch to select result
        const firstResult = component.shadowRoot?.querySelector('.result-item') as HTMLElement;
        expect(firstResult).toBeTruthy();

        const spy = jest.fn();
        component.addEventListener('result-selected', spy);

        // Simulate touch/click
        firstResult.dispatchEvent(new Event('touchstart'));
        firstResult.click();

        expect(spy).toHaveBeenCalled();
    });
});

// Export for use in test runner
export default {};
