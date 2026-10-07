import '../src/search/smart-search';
import {highlightText, isSafeEndpoint, validateConfig} from '../src/utils/component-utils';

describe('security hardening', () => {
    test('highlightText does not match inside HTML entities', () => {
        expect(highlightText('A & B', 'amp')).toBe('A &amp; B');
        expect(highlightText('Tom & Jerry', 'tom')).toBe('<mark>Tom</mark> &amp; Jerry');
    });

    test('highlightText escapes markup', () => {
        expect(highlightText('<img src=x onerror=alert(1)>', 'img')).not.toContain('<img');
    });

    test('isSafeEndpoint only allows http(s)', () => {
        expect(isSafeEndpoint('https://example.com/data')).toBe(true);
        expect(isSafeEndpoint('./data')).toBe(true);
        expect(isSafeEndpoint('javascript:alert(1)')).toBe(false);
        expect(isSafeEndpoint('data:text/html,hi')).toBe(false);
    });

    test('validateConfig rejects unsafe endpoints and caps limits', () => {
        const cfg = validateConfig({dataEndpoint: 'javascript:alert(1)', maxResults: 1e9, debounceDelay: 1e9});
        expect(cfg.dataEndpoint).toBe('./data');
        expect(cfg.maxResults).toBe(100);
        expect(cfg.debounceDelay).toBeLessThanOrEqual(10000);
    });

    test('placeholder cannot inject attributes', () => {
        const el = document.createElement('smart-search');
        el.setAttribute('placeholder', '" onfocus="window.__xss=1');
        document.body.appendChild(el);
        const input = el.shadowRoot!.querySelector('input')!;
        expect(input.hasAttribute('onfocus')).toBe(false);
        expect(input.placeholder).toBe('" onfocus="window.__xss=1');
        el.remove();
    });
});
