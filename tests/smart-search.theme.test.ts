/**
 * Comprehensive unit tests for SmartSearchComponent theme switching functionality
 */

import { SmartSearchComponent } from '../src/search/smart-search';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock console methods to avoid test output noise
const originalConsole = { ...console };
beforeEach(() => {
    console.warn = jest.fn();
    console.error = jest.fn();
    localStorageMock.clear();
});

afterEach(() => {
    Object.assign(console, originalConsole);
});

describe('SmartSearchComponent Theme Switching', () => {
    let component: SmartSearchComponent;
    let container: HTMLDivElement;

    beforeEach(async () => {
        // Clear localStorage before each test
        localStorage.clear();
        
        // Create fresh component instance
        container = document.createElement('div');
        component = new SmartSearchComponent();
        
        // Append to DOM and trigger connection
        container.appendChild(component);
        document.body.appendChild(container);
        
        // Manually trigger connectedCallback for testing and wait for it
        await component.connectedCallback();
        
        // Give a small delay to ensure all async operations complete
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    afterEach(() => {
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        localStorageMock.clear();
    });

    describe('Theme Initialization', () => {
        test('should initialize with default light theme', () => {
            // Debug: Log the actual values
            console.log('getTheme():', component.getTheme());
            console.log('getAttribute(data-theme):', component.getAttribute('data-theme'));
            console.log('currentTheme property:', (component as any).currentTheme);
            
            expect(component.getTheme()).toBe('light');
            expect(component.getAttribute('data-theme')).toBe('light');
        });

        test('should initialize with theme from attribute', () => {
            const newComponent = new SmartSearchComponent();
            newComponent.setAttribute('theme', 'dark');
            document.body.appendChild(newComponent);
            newComponent.connectedCallback();
            
            return new Promise<void>((resolve) => {
                setTimeout(() => {
                    expect(newComponent.getTheme()).toBe('dark');
                    document.body.removeChild(newComponent);
                    resolve();
                }, 10);
            });
        });

        test('should initialize with stored theme from localStorage', () => {
            localStorageMock.setItem('smart-search-theme', 'dark');
            
            const newComponent = new SmartSearchComponent();
            container.appendChild(newComponent);
            newComponent.connectedCallback();
            
            return new Promise<void>((resolve) => {
                setTimeout(() => {
                    expect(newComponent.getTheme()).toBe('dark');
                    expect(newComponent.getAttribute('data-theme')).toBe('dark');
                    resolve();
                }, 10);
            });
        });

        test('should prefer attribute over localStorage', () => {
            localStorageMock.setItem('smart-search-theme', 'dark');
            const newComponent = new SmartSearchComponent();
            newComponent.setAttribute('theme', 'light');
            container.appendChild(newComponent);
            newComponent.connectedCallback();
            expect(newComponent.getTheme()).toBe('light');
        });

        test('should use default light theme when no explicit theme is set', () => {
            const newComponent = new SmartSearchComponent();
            container.appendChild(newComponent);
            newComponent.connectedCallback();
            expect(newComponent.getTheme()).toBe('light');
        });
    });

    describe('Theme Setting and Getting', () => {
        test('should set and get light theme correctly', () => {
            component.setTheme('light');
            expect(component.getTheme()).toBe('light');
            expect(component.getAttribute('data-theme')).toBe('light');
        });

        test('should set and get dark theme correctly', () => {
            component.setTheme('dark');
            expect(component.getTheme()).toBe('dark');
            expect(component.getAttribute('data-theme')).toBe('dark');
        });

        test('should reject invalid theme values and use default', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            component.setTheme('invalid' as any);
            expect(component.getTheme()).toBe('light');
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringMatching(/\[.*\] WARN \[SmartSearchComponent\.setTheme\]: Invalid theme value: invalid, using default/),
                undefined
            );
            consoleSpy.mockRestore();
        });

        test('should prevent unnecessary theme updates', () => {
            component.setTheme('dark');
            const dispatchEventSpy = jest.spyOn(component, 'dispatchEvent');
            
            // Setting the same theme should not trigger an update
            component.setTheme('dark');
            
            expect(dispatchEventSpy).not.toHaveBeenCalled();
            
            dispatchEventSpy.mockRestore();
        });
    });

    describe('Theme Toggle', () => {
        test('should toggle from light to dark', () => {
            component.setTheme('light');
            component.toggleTheme();
            expect(component.getTheme()).toBe('dark');
        });

        test('should toggle from dark to light', () => {
            component.setTheme('dark');
            component.toggleTheme();
            expect(component.getTheme()).toBe('light');
        });

        test('should toggle multiple times correctly', () => {
            component.setTheme('light');
            
            component.toggleTheme();
            expect(component.getTheme()).toBe('dark');
            
            component.toggleTheme();
            expect(component.getTheme()).toBe('light');
            
            component.toggleTheme();
            expect(component.getTheme()).toBe('dark');
        });
    });

    describe('Theme Persistence', () => {
        test('should store theme in localStorage when set', () => {
            component.setTheme('dark');
            expect(localStorageMock.getItem('smart-search-theme')).toBe('dark');
            
            component.setTheme('light');
            expect(localStorageMock.getItem('smart-search-theme')).toBe('light');
        });

        test('should persist theme across component instances', () => {
            component.setTheme('dark');
            
            const newComponent = new SmartSearchComponent();
            container.appendChild(newComponent);
            newComponent.connectedCallback();
            
            // Wait for initialization to complete
            return new Promise<void>((resolve) => {
                setTimeout(() => {
                    expect(newComponent.getTheme()).toBe('dark');
                    resolve();
                }, 10);
            });
        });
    });

    describe('DOM Theme Application', () => {
        test('should apply theme to host element', () => {
            component.setTheme('dark');
            expect(component.getAttribute('data-theme')).toBe('dark');
            
            component.setTheme('light');
            expect(component.getAttribute('data-theme')).toBe('light');
        });

        test('should apply theme to document elements', (done) => {
            component.setTheme('dark');
            
            // Wait for requestAnimationFrame to complete
            requestAnimationFrame(() => {
                expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
                expect(document.body.getAttribute('data-theme')).toBe('dark');
                
                component.setTheme('light');
                
                requestAnimationFrame(() => {
                    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
                    expect(document.body.getAttribute('data-theme')).toBe('light');
                    done();
                });
            });
        });

        test('should apply theme to shadow DOM', (done) => {
            const shadowRoot = component.shadowRoot;
            expect(shadowRoot).toBeTruthy();
            
            component.setTheme('dark');
            
            // Wait for requestAnimationFrame to complete
            requestAnimationFrame(() => {
                expect(shadowRoot!.host.getAttribute('data-theme')).toBe('dark');
                done();
            });
        });
    });

    describe('External Theme Button Integration', () => {
        test('should setup external theme button correctly', () => {
            const button = document.createElement('button');
            button.id = 'themeToggle'; // Use the correct ID that the component looks for
            document.body.appendChild(button);
            
            // Use reflection to access private method for testing
            (component as any).setupExternalThemeButton();
            
            // Simulate button click
            button.click();
            
            // Theme should have toggled
            expect(component.getTheme()).toBe('dark');
            
            document.body.removeChild(button);
        });

        test('should handle missing external button gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            // Ensure no button exists
            const existingButton = document.getElementById('themeToggle');
            if (existingButton) {
                document.body.removeChild(existingButton);
            }
            
            expect(() => {
                (component as any).setupExternalThemeButton();
            }).not.toThrow();
            
            // Should not log warning for missing button (it's expected behavior)
            expect(consoleSpy).not.toHaveBeenCalledWith(
                expect.stringContaining('Failed to setup external theme button')
            );
            
            consoleSpy.mockRestore();
        });

        test('should cleanup external button listeners', () => {
            const button = document.createElement('button');
            button.id = 'themeToggle';
            document.body.appendChild(button);
            
            (component as any).setupExternalThemeButton();
            (component as any).cleanupThemeButton();
            
            // Button click should not affect theme after cleanup
            const initialTheme = component.getTheme();
            button.click();
            expect(component.getTheme()).toBe(initialTheme);
            
            document.body.removeChild(button);
        });

        test('should update external button attributes', () => {
            const button = document.createElement('button');
            button.id = 'themeToggle';
            document.body.appendChild(button);
            
            (component as any).setupExternalThemeButton();
            component.setTheme('dark');
            
            expect(button.getAttribute('data-theme')).toBe('dark');
            
            document.body.removeChild(button);
        });
    });

    describe('Error Handling', () => {
        test('should handle theme setting errors gracefully', () => {
            // Mock setAttribute to throw an error
            const originalSetAttribute = component.setAttribute;
            component.setAttribute = jest.fn().mockImplementation(() => {
                throw new Error('DOM error');
            });
            
            expect(() => {
                component.setTheme('dark');
            }).not.toThrow();
            
            expect(console.error).toHaveBeenCalled();
            
            // Restore original method
            component.setAttribute = originalSetAttribute;
        });

        test('should handle localStorage errors gracefully', () => {
            // Mock localStorage to throw an error
            const originalSetItem = localStorageMock.setItem;
            localStorageMock.setItem = jest.fn().mockImplementation(() => {
                throw new Error('Storage error');
            });
            
            expect(() => {
                component.setTheme('dark');
            }).not.toThrow();
            
            // Restore original method
            localStorageMock.setItem = originalSetItem;
        });
    });

    describe('Theme Transitions', () => {
        test('should apply smooth transitions during theme change', (done) => {
            component.setTheme('light');
            
            // Change to dark theme
            component.setTheme('dark');
            
            // Use requestAnimationFrame to wait for the optimized theme update
            requestAnimationFrame(() => {
                setTimeout(() => {
                    const documentElement = document.documentElement;
                    const body = document.body;
                    
                    // Transitions should be applied during theme change
                    expect(documentElement.style.transition).toContain('background-color');
                    expect(body.style.transition).toContain('background-color');
                    
                    // Wait for transition to complete
                    setTimeout(() => {
                        // Transitions should be removed after completion
                        expect(documentElement.style.transition).toBe('');
                        expect(body.style.transition).toBe('');
                        done();
                    }, 350); // Wait slightly longer than transition duration
                }, 10); // Check immediately after requestAnimationFrame
            });
        });
    });

    describe('Component State Consistency', () => {
        test('should maintain theme consistency across component lifecycle', () => {
            component.setTheme('dark');
            
            // Simulate component disconnect and reconnect
            component.disconnectedCallback();
            component.connectedCallback();
            
            expect(component.getTheme()).toBe('dark');
            expect(component.getAttribute('data-theme')).toBe('dark');
        });

        test('should handle multiple rapid theme changes', () => {
            const themes: Array<'light' | 'dark'> = ['dark', 'light', 'dark', 'light', 'dark'];
            
            themes.forEach(theme => {
                component.setTheme(theme);
            });
            
            expect(component.getTheme()).toBe('dark');
            expect(component.getAttribute('data-theme')).toBe('dark');
        });
    });

    describe('Accessibility and Standards Compliance', () => {
        test('should use default light theme when no system preference is configured', () => {
            // Create new component to test initialization without system preference
            const newComponent = new SmartSearchComponent();
            container.appendChild(newComponent);
            newComponent.connectedCallback();
            
            // Should initialize with default light theme
            expect(newComponent.getTheme()).toBe('light');
        });

        test('should update ARIA attributes during theme changes', () => {
            const button = document.createElement('button');
            button.id = 'themeToggle';
            button.innerHTML = '<span>🌙</span>';
            document.body.appendChild(button);
            
            (component as any).setupExternalThemeButton();
            component.setTheme('dark');
            
            // ARIA attributes should be updated correctly
            expect(button.getAttribute('aria-label')).toBe('Switch to light theme');
            expect(button.getAttribute('title')).toBe('Switch to light theme');
            expect(button.getAttribute('data-theme')).toBe('dark');
            
            document.body.removeChild(button);
        });
    });
});