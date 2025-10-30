# Smart Search Web Component

A reusable, accessible, and highly configurable search component built with TypeScript and Web Components standard. Designed for banking applications but flexible enough for any domain requiring advanced search capabilities.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Web Components](https://img.shields.io/badge/Web%20Components-v1-green.svg)](https://www.webcomponents.org/)
[![Version](https://img.shields.io/badge/Version-1.0.0-green.svg)](package.json)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📚 Documentation

- **[Quick Setup Guide](./QUICK_SETUP.md)** - Installation, configuration, and step-by-step setup
- **[Technical Documentation](./TECHNICAL_JUSTIFICATION.md)** - Architecture decisions and implementation details

---

## 🌟 Features

### Core Functionality
- **Real-time Search**: Debounced search with configurable delay
- **Filter Tabs**: Filter results by type (All, Accounts, Customers, Transactions)
- **Keyboard Navigation**: Full keyboard support (Arrow keys, Enter, Escape, Tab)
- **Search Highlighting**: Automatically highlights matching terms in results
- **Clear Functionality**: One-click clear button

### Advanced Features
- **Dynamic Positioning**: Dropdown auto-adjusts based on viewport space
- **Theme Support**: Built-in light/dark theme with CSS custom properties
- **Accessibility**: WCAG 2.1 compliant with comprehensive ARIA support
- **Mobile Responsive**: Touch-friendly on all devices
- **Event-Driven**: Rich custom events for parent application integration
- **Type-Safe**: Full TypeScript support with exported types

### Technical Excellence
- **Shadow DOM**: Complete style isolation
- **Framework-Agnostic**: Works with React, Vue, Angular, vanilla JS
- **Configurable**: Multiple configuration options via attributes
- **Tested**: Comprehensive test suite with 86 tests
- **Modern Standards**: Built with ES2020+ and Web Components v1

### Demo Images

![enter image description here](https://kavidu.com/dev/1.png)
![enter image description here](https://kavidu.com/dev/2.png)
![enter image description here](https://kavidu.com/dev/3.png)
![enter image description here](https://kavidu.com/dev/4.png)
![enter image description here](https://kavidu.com/dev/5.png)
![enter image description here](https://kavidu.com/dev/6.png)

---

## 📦 Installation

For complete installation instructions, prerequisites, and step-by-step setup guide, see **[QUICK_SETUP.md](./QUICK_SETUP.md)**.

---

## 🚀 Quick Start

### Basic Usage

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Search Demo</title>
  
  <!-- Include Font Awesome for icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
</head>
<body>
  <!-- Use the component -->
  <smart-search 
    placeholder="Search anything..."
    theme="light"
  ></smart-search>

  <!-- Load the component -->
  <script type="module" src="path/to/smart-search.js"></script>
</body>
</html>
```

### With Configuration

```html
<smart-search 
  placeholder="Search accounts, customers, transactions..."
  min-search-length="2"
  debounce-delay="300"
  max-results="50"
  data-endpoint="./api/search/"
  theme="dark"
></smart-search>
```

---

## ⚙️ Configuration

### Component Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `placeholder` | string | "Search..." | Input placeholder text |
| `min-search-length` | number | 1 | Minimum characters to trigger search |
| `debounce-delay` | number | 300 | Debounce delay in milliseconds |
| `max-results` | number | 10 | Maximum results to display |
| `data-endpoint` | string | "./data/" | Data source endpoint |
| `theme` | string | "light" | Theme: "light" or "dark" |

### CSS Custom Properties

```css
smart-search {
  --primary-color: #2563eb;
  --background: #ffffff;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #d1d5db;
  --border-radius: 8px;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --font-size: 14px;
  --spacing: 12px;
}

/* Dark theme */
smart-search[theme="dark"] {
  --background: #1f2937;
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --border-color: #374151;
}
```

---

## 📡 Events

The component emits custom events for integration with your application:

### Event Types

```javascript
const searchComponent = document.querySelector('smart-search');

// Data loaded successfully
searchComponent.addEventListener('data-loaded', (e) => {
  console.log('Data loaded:', e.detail);
});

// Data loading failed
searchComponent.addEventListener('data-load-error', (e) => {
  console.error('Load error:', e.detail.error);
});

// Search performed
searchComponent.addEventListener('search-performed', (e) => {
  console.log(`Found ${e.detail.resultCount} results for "${e.detail.query}"`);
  console.log('Active tab:', e.detail.activeTab);
});

// Result selected
searchComponent.addEventListener('result-selected', (e) => {
  console.log('Selected result:', e.detail.result);
  // e.detail.result contains: { id, type, title, subtitle, metadata, icon, rawData }
});

// Tab changed
searchComponent.addEventListener('tab-changed', (e) => {
  console.log('Tab changed to:', e.detail.activeTab);
});

// Dropdown state changes
searchComponent.addEventListener('dropdown-opened', () => {
  console.log('Dropdown opened');
});

searchComponent.addEventListener('dropdown-closed', () => {
  console.log('Dropdown closed');
});

// Search cleared
searchComponent.addEventListener('search-cleared', () => {
  console.log('Search cleared');
});

// Theme changed
searchComponent.addEventListener('theme-changed', (e) => {
  console.log('Theme changed to:', e.detail.theme);
});
```

---

## 🗂️ Data Structure

### Expected Data Format

The component expects three JSON files at your data endpoint:

#### accounts.json
```json
[
  {
    "id": "1",
    "title": "Primary Checking",
    "accountNumber": "****1234",
    "balance": 5420.50,
    "type": "Checking",
    "status": "Active"
  }
]
```

#### customers.json
```json
[
  {
    "id": "1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "customerId": "CUST-001",
    "accountType": "Premium",
    "totalAccounts": 3
  }
]
```

#### transactions.json
```json
[
  {
    "id": "1",
    "transactionId": "TXN-001",
    "merchant": "Amazon",
    "amount": 89.99,
    "category": "Shopping",
    "type": "Debit",
    "date": "2025-10-15",
    "description": "Online purchase"
  }
]
```

### TypeScript Interfaces

```typescript
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
```

---

## ⌨️ Keyboard Navigation

| Key | Action |
|-----|--------|
| `↓` Arrow Down | Navigate to next result |
| `↑` Arrow Up | Navigate to previous result |
| `Enter` | Select highlighted result |
| `Escape` | Close dropdown and blur input |
| `Tab` | Close dropdown and move focus |

---

## ♿ Accessibility

The component is built with accessibility as a first-class concern:

### ARIA Support
- ✅ `role="search"` on container
- ✅ `role="combobox"` on input
- ✅ `role="listbox"` on results
- ✅ `role="option"` on result items
- ✅ `role="tablist"` and `role="tab"` on filters
- ✅ `aria-expanded` for dropdown state
- ✅ `aria-selected` for selected items
- ✅ `aria-activedescendant` for keyboard navigation
- ✅ `aria-label` for screen reader context

### WCAG 2.1 Compliance
- ✅ Level AA contrast ratios (4.5:1 minimum)
- ✅ Focus indicators with visible outlines
- ✅ Logical tab order and focus management
- ✅ Semantic HTML structure
- ✅ Screen reader announcements
- ✅ Keyboard-only navigation support

---

## 🌐 Framework Integration

### React

```jsx
import React, { useRef, useEffect } from 'react';
import 'smart-search-component';

function SearchWrapper() {
  const searchRef = useRef(null);

  useEffect(() => {
    const handleResultSelected = (e) => {
      console.log('Selected:', e.detail.result);
    };

    searchRef.current?.addEventListener('result-selected', handleResultSelected);

    return () => {
      searchRef.current?.removeEventListener('result-selected', handleResultSelected);
    };
  }, []);

  return (
    <smart-search
      ref={searchRef}
      placeholder="Search..."
      theme="light"
    />
  );
}
```

### Vue 3

```vue
<template>
  <smart-search
    placeholder="Search..."
    theme="light"
    @result-selected="handleResultSelected"
  />
</template>

<script setup>
import 'smart-search-component';

const handleResultSelected = (event) => {
  console.log('Selected:', event.detail.result);
};
</script>
```

### Angular

```typescript
// app.module.ts
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import 'smart-search-component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }

// component.html
<smart-search
  placeholder="Search..."
  theme="light"
  (result-selected)="handleResultSelected($event)"
></smart-search>
```

---

## 🌐 Browser Support

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full Web Components support |
| Firefox | 123+ | Declarative Shadow DOM support |
| Safari | 16.4+ | Custom Elements v1 support |
| Edge | 90+ | Chromium-based, full support |

---

## 🧪 Testing

The component includes comprehensive test coverage:

- **86 total tests** across component and utility functions
- **Component Tests**: Configuration, theming, keyboard navigation, search functionality
- **Utility Tests**: Validation, async operations, component utilities
- **Integration Tests**: Event handling, DOM manipulation, lifecycle management

Run tests with:
```bash
npm test
```

---

## 🚀 Getting Started

1. **Installation**: See [QUICK_SETUP.md](./QUICK_SETUP.md) for detailed setup instructions
2. **Configuration**: Customize attributes and CSS custom properties
3. **Integration**: Add event listeners for your application logic
4. **Theming**: Modify CSS variables or use built-in themes
5. **Testing**: Run the test suite to verify functionality

---

### Development for Used Services

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Web Components Specification](https://www.webcomponents.org/)
- [Jest Testing Framework](https://jestjs.io/)
- [GitHub](https://github.com)
- [Jsoncrack](https://jsoncrack.com/)
- [Stackedit](https://stackedit.io/)

### Tools Used for the Development

- macOS
- iTerm2
- Trae
- WebStorm
- Google Chrome
- git
---

## 📖 Documentation

- **[Quick Setup Guide](./QUICK_SETUP.md)** - Installation, configuration, and examples
- **[Technical Documentation](./TECHNICAL_JUSTIFICATION.md)** - Architecture, standards compliance, and implementation details

---

**Happy Searching! 🔍**
