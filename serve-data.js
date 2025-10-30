const fs = require('fs');
const path = require('path');

// Function to serve combined data
function getCombinedData() {
    try {
        const accounts = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/accounts.json'), 'utf8'));
        const customers = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/customers.json'), 'utf8'));
        const transactions = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/transactions.json'), 'utf8'));
        
        return {
            accounts,
            customers,
            transactions
        };
    } catch (error) {
        console.error('Error reading data files:', error);
        return {
            accounts: [],
            customers: [],
            transactions: []
        };
    }
}

// Simple HTTP server to serve the data
const http = require('http');

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.url === '/api/search-data' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        const data = getCombinedData();
        res.end(JSON.stringify(data));
    } else {
        res.statusCode = 404;
        res.end('Not Found');
    }
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Data API server running on http://localhost:${PORT}`);
    console.log(`Data endpoint: http://localhost:${PORT}/api/search-data`);
});