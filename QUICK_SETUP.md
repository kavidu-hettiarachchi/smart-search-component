# Quick Setup Guide

## Prerequisites

- **Node.js**: 18.0.0 or higher (LTS recommended)
- **npm**: 8.0.0 or higher
- **Modern Browser**: Chrome 90+, Firefox 123+, Safari 16.4+, or Edge 90+

## Installation

```bash
npm install
```

## Development Commands

### Build the Project
```bash
npm run build
```
Compiles TypeScript files from `src/` to `demo/js/`

### Development Server
```bash
npm run dev
```
Builds the project and starts a local server at http://localhost:8080

### Run Tests
```bash
npm test
```
Runs the comprehensive Jest test suite (86 tests)

### Watch Mode
```bash
npm run watch
```
Continuous TypeScript compilation during development

## Project Structure

```
smart-search-component/
├── src/
│   ├── search/
│   │   ├── smart-search.ts      # Main component
│   │   └── smart-search.css     # Component styles
│   └── utils/                   # Utility modules
├── tests/                       # Jest test files
├── demo/                        # Demo application
├── data/                        # Sample JSON data
└── docs/                        # Documentation
```

## Configuration Options

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
  --border-color: #d1d5db;
  --border-radius: 8px;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

## Usage Examples

### Basic Implementation
```html
<smart-search 
  placeholder="Search accounts, customers, transactions..."
  theme="light">
</smart-search>

<script type="module" src="./demo/js/search/smart-search.js"></script>
```

### Advanced Configuration
```html
<smart-search 
  placeholder="Search banking data..."
  min-search-length="2"
  debounce-delay="200"
  max-results="25"
  data-endpoint="./api/search/"
  theme="dark">
</smart-search>
```

### Event Handling
```javascript
const searchComponent = document.querySelector('smart-search');

searchComponent.addEventListener('result-selected', (e) => {
  console.log('Selected:', e.detail.result);
});

searchComponent.addEventListener('search-performed', (e) => {
  console.log(`Found ${e.detail.resultCount} results`);
});
```

## Data Format

The component expects three JSON files at your data endpoint:

### accounts.json
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

### customers.json
```json
[
  {
    "id": "1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "customerId": "CUST-001",
    "accountType": "Premium"
  }
]
```

### transactions.json
```json
[
  {
    "id": "1",
    "transactionId": "TXN-001",
    "merchant": "Amazon",
    "amount": 89.99,
    "category": "Shopping",
    "type": "Debit",
    "date": "2025-10-15"
  }
]
```

## Troubleshooting

### Common Issues

**Build Errors:**
- Ensure TypeScript 5.0+ is installed
- Check `tsconfig.json` configuration
- Verify all imports are correct

**Test Failures:**
- Run `npm install` to ensure dependencies are up to date
- Check Jest configuration in `jest.config.js`
- Ensure test environment has DOM support

**Development Server Issues:**
- Verify port 8080 is available
- Check file paths in demo HTML
- Ensure build completed successfully

### Performance Tips

- Use `debounce-delay` to reduce API calls
- Limit `max-results` for better performance
- Enable browser caching for static assets
- Use CDN for Font Awesome icons

## Testing Coverage

The project includes comprehensive test coverage:

- **86 total tests** across component and utility functions
- **Component Tests**: Configuration, theming, keyboard navigation, search functionality
- **Utility Tests**: Validation, async operations, component utilities
- **Integration Tests**: Event handling, DOM manipulation, lifecycle management

## Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full Web Components support |
| Firefox | 123+ | Declarative Shadow DOM support |
| Safari | 16.4+ | Custom Elements v1 support |
| Edge | 90+ | Chromium-based, full support |

## Next Steps

1. **Install Dependencies**: `npm install`
2. **Build Project**: `npm run build`
3. **Start Development**: `npm run dev`
4. **Run Tests**: `npm test`
5. **Customize**: Modify CSS custom properties and attributes
6. **Deploy**: Copy built files to your web server

For detailed technical information, see [TECHNICAL_JUSTIFICATION.md](./TECHNICAL_JUSTIFICATION.md).
For comprehensive API documentation, see [README.md](./README.md).
