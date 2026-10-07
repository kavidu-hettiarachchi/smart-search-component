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
        console.error('Error reading data files:', error.message);
        return {
            accounts: [],
            customers: [],
            transactions: []
        };
    }
}

// Simple HTTP server to serve the data
const http = require('http');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT) || 3001;
// Only these origins may read the data cross-origin (comma-separated override via env)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:8080,http://127.0.0.1:8080').split(',');

const server = http.createServer((req, res) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }

    const pathname = req.url.split('?')[0];
    if (pathname === '/api/search-data' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(getCombinedData()));
    } else {
        res.statusCode = 404;
        res.end('Not Found');
    }
});

server.listen(PORT, HOST, () => {
    console.log(`Data API server running on http://${HOST}:${PORT}`);
    console.log(`Data endpoint: http://${HOST}:${PORT}/api/search-data`);
});
