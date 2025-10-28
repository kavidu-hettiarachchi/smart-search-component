# Quick Setup Guide

> **📋 Prerequisites:** Before starting, ensure you have reviewed the [Technical Justification & Web Standards Compliance](TECHNICAL_JUSTIFICATION.md) document to understand the architectural decisions and technology choices.

## 🔧 Configuration Options

### Environment Variables

```bash
# Optional: Set custom port for development server
export PORT=3000

# Optional: Enable verbose TypeScript compilation
export TS_NODE_COMPILER_OPTIONS='{"strict": true}'
```

### Component Configuration

The Smart Search Component supports several configuration options:

```html
<!-- Basic usage -->
<smart-search></smart-search>

<!-- With custom placeholder -->
<smart-search placeholder="Search products..."></smart-search>

<!-- With custom debounce delay (milliseconds) -->
<smart-search debounce="500"></smart-search>

<!-- With custom maximum results -->
<smart-search max-results="20"></smart-search>
```

### CSS Custom Properties

Customize the component appearance using CSS variables:

```css
smart-search {
  --search-border-color: #e1e5e9;
  --search-focus-color: #007bff;
  --search-background: #ffffff;
  --search-text-color: #333333;
  --search-placeholder-color: #6c757d;
  --search-border-radius: 4px;
  --search-font-size: 14px;
  --search-padding: 8px 12px;
}
```

---

## 📋 Prerequisites

### Required Software
- **Node.js 18+** and **npm 8+** (LTS recommended)
- **Modern browser** with Web Components support:
  - Chrome 90+ (Declarative Shadow DOM support)
  - Firefox 123+ (Full Web Components support)
  - Safari 16.4+ (Complete implementation)
  - Edge 90+ (Chromium-based)

### Development Environment
- **Text editor or IDE** (VS Code recommended for TypeScript support)
- **Terminal/Command Line** access
- **Git** (for cloning repository)

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: 4GB minimum (8GB recommended for development)
- **Disk Space**: 500MB for project and dependencies

---

## 🚀 Quick Start

### Step 0: Clone Repository (if needed)

```bash
git clone https://github.com/kavidu-hettiarachchi/smart-search-component.git
cd smart-search-component
```

### Step 1: Install Dependencies

```bash
npm install
```

**Expected output:**
```
added 150 packages in 10s
```

**What this does:**
- Installs TypeScript compiler (`tsc`)
- Installs Jest testing framework
- Installs type definitions for Jest
- Sets up development dependencies

### Step 2: Build the Component

```bash
npm run build
```

**Expected output:**
```
> smart-search-component@1.0.0 build
> tsc

# TypeScript compilation completes
```

This compiles `src/search/smart-search.ts` to `demo/js/search/smart-search.js`

### Step 3: Start the Demo Server

```bash
npm run serve
```

**Expected output:**
```
Starting up http-server, serving demo
Available on:
  http://127.0.0.1:8080
  http://192.168.1.x:8080
Hit CTRL-C to stop the server
```

**What this does:**
- Starts HTTP server on port 8080
- Serves the `demo/` directory
- Opens browser automatically (`-o` flag)
- Enables CORS for local development

### Step 4: Open in Browser

Navigate to `http://localhost:8080` and you should see:
- Search input with icon
- Tab filters (All, Accounts, Customers, Transactions)
- Sample banking data loaded
- Theme toggle button

---

## ✅ Verify Installation

### Test 1: Search Functionality
1. Type "john" in the search box
2. Should see customer results appear
3. Results should be highlighted

### Test 2: Filter Tabs
1. Type "checking" in the search box
2. Click "Accounts" tab
3. Should see only account results

### Test 3: Keyboard Navigation
1. Type "test" in search box
2. Press ↓ (down arrow)
3. Press ↓ again
4. Press Enter
5. Should select highlighted result

### Test 4: Theme Toggle
1. Click moon icon in top-right
2. Should switch to dark theme
3. Click sun icon
4. Should switch back to light theme

---

## 🧪 Run Tests

```bash
npm test
```

**Expected output:**
```
PASS  tests/smart-search.test.ts
  SmartSearchComponent
    Component Rendering
      ✓ should render the component (50ms)
      ✓ should have shadow DOM (10ms)
      ✓ should render search input (15ms)
      ...
    
Test Suites: 1 passed, 1 total
Tests:       58 passed, 58 total
Snapshots:   0 total
Time:        3.5s
```

---

## 📝 Project Structure After Build

```
smart-search-component/
├── src/
│   └── search/
│       ├── smart-search.ts      # Main component source
│       └── smart-search.css     # Component styles
├── demo/
│   ├── index.html               # Demo application
│   ├── css/
│   │   └── demo.css            # Demo styles
│   └── js/
│       └── search/              # Compiled output
├── data/                        # Sample data files
│   ├── accounts.json
│   ├── customers.json
│   └── transactions.json
├── tests/
│   └── smart-search.test.ts    # Test suite
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## 🔧 Development Workflow

### Watch Mode (Recommended for Development)

```bash
# Terminal 1: Watch for TypeScript changes
npm run watch

# Terminal 2: Serve the demo
npm run serve
```

**What watch mode does:**
- Monitors `src/search/smart-search.ts` for changes
- Automatically recompiles on file save
- Preserves source maps for debugging
- No need to manually run `npm run build`

Now any changes to `src/search/smart-search.ts` will automatically recompile.

### All-in-One Command

```bash
npm run dev
```

**What this does:**
- Runs `npm run build` once
- Starts the HTTP server
- Good for quick testing, not development

### Production Build

```bash
npm run build
```

**Outputs:**
- `demo/js/search/smart-search.js` - Compiled JavaScript
- `demo/js/search/smart-search.d.ts` - TypeScript definitions  
- `demo/js/search/smart-search.js.map` - Source maps

---

## 🎨 Customization Quick Start

### Change Placeholder Text

**In HTML:**
```html
<smart-search placeholder="Find anything..."></smart-search>
```

**Via JavaScript:**
```javascript
const search = document.querySelector('smart-search');
search.setAttribute('placeholder', 'Search our database...');
```

### Change Theme

**In HTML:**
```html
<smart-search theme="dark"></smart-search>
```

**Via JavaScript:**
```javascript
const search = document.querySelector('smart-search');
search.setAttribute('theme', 'dark');
```

### Configure Search Behavior

```html
<smart-search 
  min-search-length="3"
  debounce-delay="500"
  max-results="20"
></smart-search>
```

### Listen to Events

```javascript
const search = document.querySelector('smart-search');

search.addEventListener('result-selected', (e) => {
  console.log('User selected:', e.detail.result);
  alert(`Selected: ${e.detail.result.title}`);
});

search.addEventListener('search-performed', (e) => {
  console.log(`Found ${e.detail.resultCount} results`);
});
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'typescript'"

**Solution:**
```bash
npm install
```

### Issue: "Port 8080 already in use"

**Solutions:**
```bash
# Option 1: Use a different port
npx http-server demo -p 3000

# Option 2: Kill process using port 8080 (macOS/Linux)
lsof -ti:8080 | xargs kill -9

# Option 3: Kill process using port 8080 (Windows)
netstat -ano | findstr :8080
taskkill /PID <PID_NUMBER> /F
```

### Issue: "Component not rendering"

**Checklist:**
1. ✅ Is TypeScript compiled? Check `demo/js/search/smart-search.js` exists
2. ✅ Is Font Awesome loaded? Check browser console for 404 errors
3. ✅ Is component registered? Check `customElements.get('smart-search')`

**Debug in browser console:**
```javascript
// Check if component is defined
console.log(customElements.get('smart-search')); // Should return class

// Check if component has shadow root
const search = document.querySelector('smart-search');
console.log(search.shadowRoot); // Should return shadow root
```

### Issue: "Data not loading"

**Solution:**
Ensure demo is served via HTTP server, not opened as `file://`

```bash
# ❌ Wrong
open demo/index.html

# ✅ Correct
npm run serve
```

### Issue: CSS not loading

**Check:**
1. Is `src/search/smart-search.css` present?
2. Is path correct in `loadStyles()` method?
3. Check browser network tab for 404 errors

### Issue: Theme not applying

**Problem**: Theme attribute not working  
**Solution**: Use setAttribute, not property

```javascript
// ✅ Correct
search.setAttribute('theme', 'dark');

// ❌ Wrong
search.theme = 'dark';
```

## ⚡ Performance Tips

1. **Debounce Delay**: Increase for slower networks
   ```html
   <smart-search debounce-delay="500"></smart-search>
   ```

2. **Max Results**: Limit results for better performance
   ```html
   <smart-search max-results="20"></smart-search>
   ```

3. **Min Search Length**: Reduce unnecessary searches
   ```html
   <smart-search min-search-length="3"></smart-search>
   ```

4. **Data Caching**: Implement caching in your data endpoint

---

## 📦 Using in Your Project

### Step 1: Copy Built Files

```bash
cp demo/js/search/smart-search.js your-project/lib/
cp demo/js/search/smart-search.d.ts your-project/lib/
```

### Step 2: Include in Your HTML

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Font Awesome (required for icons) -->
  <link rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
</head>
<body>
  <smart-search></smart-search>
  
  <script type="module" src="lib/smart-search.js"></script>
</body>
</html>
```

### Step 3: Prepare Your Data

Create three JSON files in a `data/` directory:

**data/accounts.json:**
```json
[
  {
    "id": "1",
    "title": "Checking Account",
    "accountNumber": "****1234",
    "balance": 5000,
    "type": "Checking",
    "status": "Active"
  }
]
```

**data/customers.json:**
```json
[
  {
    "id": "1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "customerId": "CUST-001",
    "accountType": "Premium",
    "totalAccounts": 2
  }
]
```

**data/transactions.json:**
```json
[
  {
    "id": "1",
    "transactionId": "TXN-001",
    "merchant": "Coffee Shop",
    "amount": 4.50,
    "category": "Food & Dining",
    "type": "Debit",
    "date": "2025-10-28",
    "description": "Morning coffee"
  }
]
```

### Step 4: Point to Your Data

```html
<smart-search data-endpoint="./data/"></smart-search>
```
**Happy Coding! 🎉**
