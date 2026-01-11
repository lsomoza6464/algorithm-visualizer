/**
 * Environment-aware configuration
 * Automatically detects if running on GitHub Pages or localhost
 */

// Detect environment
const isGitHubPages = window.location.hostname.includes('github.io');
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Backend URLs
const BACKEND_URL = isGitHubPages
    ? 'https://leetcode-visualizer-backend.onrender.com'
    : 'http://localhost:3001';

// API Base for fetch requests
// On localhost, use proxy (empty string = same origin)
// On GitHub Pages, use direct backend URL
const API_BASE = isLocalhost ? '' : BACKEND_URL;

// Auth Base for OAuth redirects (full-page navigation)
const AUTH_BASE = BACKEND_URL;

console.log('[Config]', {
    environment: isGitHubPages ? 'GitHub Pages' : isLocalhost ? 'Localhost' : 'Other',
    API_BASE,
    AUTH_BASE,
    hostname: window.location.hostname
});
