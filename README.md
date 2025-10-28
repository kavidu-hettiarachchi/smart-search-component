# Smart Search Web Component

A reusable, accessible, and highly configurable search component built with TypeScript and Web Components standard. Designed for banking applications but flexible enough for any domain requiring advanced search capabilities.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Web Components](https://img.shields.io/badge/Web%20Components-v1-green.svg)](https://www.webcomponents.org/)
[![Version](https://img.shields.io/badge/Version-1.0.0-green.svg)](package.json)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📚 Documentation

- **[Quick Setup Guide](./QUICK_SETUP.md)** - Installation, prerequisites, and step-by-step setup
- **[Technical Justification](./TECHNICAL_JUSTIFICATION.md)** - Architecture decisions and web standards compliance

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
- **Tested**: Comprehensive test suite with Jest
- **Modern Standards**: Built with ES2020+ and Web Components v1

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

## 🎨 Configuration

For detailed configuration options including environment variables, component attributes, and CSS custom properties, see **[QUICK_SETUP.md](./QUICK_SETUP.md#configuration-options)**.

---

## 📡 Events

The component emits custom events that bubble through the Shadow DOM:

### Available Events

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

// Dropdown opened
searchComponent.addEventListener('dropdown-opened', () => {
  console.log('Dropdown opened');
});

// Dropdown closed
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

### Required Data Format

The component expects three JSON files in your data endpoint:

#### 1. `accounts.json`
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

#### 2. `customers.json`
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

#### 3. `transactions.json`
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

## 🎨 Theming

For complete theming information including CSS custom properties and theme switching, see **[QUICK_SETUP.md](./QUICK_SETUP.md#customization-quick-start)**.

---

## ⌨️ Keyboard Shortcuts

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

### Keyboard Support
- ✅ Full keyboard navigation
- ✅ Focus management
- ✅ Focus trap prevention
- ✅ Screen reader announcements

### WCAG 2.1 Compliance
- ✅ Level AA contrast ratios
- ✅ Focus indicators
- ✅ Logical tab order
- ✅ Semantic HTML

---

## 🏗️ Development

For detailed development setup, build commands, and project structure information, see **[QUICK_SETUP.md](./QUICK_SETUP.md#development-workflow)**.

For technical architecture and technology decisions, see **[TECHNICAL_JUSTIFICATION.md](./TECHNICAL_JUSTIFICATION.md)**.

---

## 🧪 Testing

For complete testing information, test commands, and coverage details, see **[QUICK_SETUP.md](./QUICK_SETUP.md#run-tests)**.

---

## 🌐 Browser Support

For detailed browser compatibility information and Web Components feature requirements, see **[TECHNICAL_JUSTIFICATION.md](./TECHNICAL_JUSTIFICATION.md#version-compatibility-matrix)**.

---
## 🔧 Framework Integration

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

## 🐛 Troubleshooting

For troubleshooting guides, common issues, and performance tips, see **[QUICK_SETUP.md](./QUICK_SETUP.md#troubleshooting)**.

---

### Development Environment

For complete development environment setup and requirements, see **[QUICK_SETUP.md](./QUICK_SETUP.md#prerequisites)** and **[TECHNICAL_JUSTIFICATION.md](./TECHNICAL_JUSTIFICATION.md#version-compatibility-matrix)**.

---

### Development Tools and Services

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Web Components Specification](https://www.webcomponents.org/)
- [Jest Testing Framework](https://jestjs.io/)
- [GitHub](https://github.com)

---

**Happy Searching! 🔍**
