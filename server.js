import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

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