import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Proxy authentication and backend requests to C++ backend server
// With graceful error handling if backend is not running
const backendProxy = createProxyMiddleware({
    target: 'http://127.0.0.1:3001',  // Use IPv4 explicitly
    changeOrigin: true,
    ws: true,
    secure: false,
    logLevel: 'debug',
    timeout: 30000,
    proxyTimeout: 30000,
    onProxyReq: (proxyReq, req) => {
        console.log(`[Proxy] ${req.method} ${req.url} -> http://localhost:3001${req.url}`);
        // Forward cookies to backend
        if (req.headers.cookie) {
            proxyReq.setHeader('Cookie', req.headers.cookie);
        }
        // If body was parsed by express, re-write it for the proxy
        if (req.body) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[Proxy] Response: ${proxyRes.statusCode} from http://localhost:3001${req.url}`);
        // Forward cookies from backend
        if (proxyRes.headers['set-cookie']) {
            res.setHeader('set-cookie', proxyRes.headers['set-cookie']);
        }
    },
    onError: (err, req, res) => {
        console.error(`[Proxy Error] ${req.url}: ${err.message}`);
        if (!res.headersSent) {
            res.status(503).json({
                error: 'Backend service not available',
                message: err.message,
                url: req.url
            });
        }
    }
});

// Proxy all /api/* endpoints to C++ backend (except leetcode-problems which is handled locally)
// These must come BEFORE other middleware that might consume the request body
app.use('/api/auth', backendProxy);
app.use('/api/visualizations', express.json(), backendProxy);
app.use('/api/leetcode', express.json(), backendProxy);
app.use('/api/health', backendProxy);

// Middleware for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('.'));

// Endpoint to get LeetCode problems list
app.get('/api/leetcode-problems', (req, res) => {
    try {
        const javascriptDir = path.join(__dirname, 'leetcode-solutions', 'javascript');
        
        // Read all txt files from the javascript directory
        const files = fs.readdirSync(javascriptDir)
            .filter(file => file.endsWith('.txt'))
            .map(file => file.replace('.txt', ''))
            .sort();
        
        // Create the problems data
        const problems = files.map(filename => {
            // Extract problem ID and title from filename
            const match = filename.match(/^(\d+)-(.+)$/);
            if (match) {
                const [, id, title] = match;
                return {
                    id: parseInt(id),
                    title: title.replace(/-/g, ' '),
                    slug: title
                };
            }
            return {
                id: 0,
                title: filename,
                slug: filename
            };
        });
        
        res.json(problems);
    } catch (error) {
        console.error('Error reading LeetCode problems:', error);
        res.status(500).json({ error: 'Failed to read LeetCode problems' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('LeetCode problems endpoint: http://localhost:3000/api/leetcode-problems');
}); 