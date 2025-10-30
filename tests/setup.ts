/**
 * Jest test setup file
 * Configures global test environment and mocks
 */

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };
beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    Object.assign(console, originalConsole);
});

// Mock custom elements if not available
if (!window.customElements) {
    window.customElements = {
        define: jest.fn(),
        get: jest.fn(),
        upgrade: jest.fn(),
        whenDefined: jest.fn(() => Promise.resolve())
    } as any;
}