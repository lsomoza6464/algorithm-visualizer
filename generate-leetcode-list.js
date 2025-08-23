import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Function to generate LeetCode problems list from txt files
function generateLeetCodeProblemsList() {
    const javascriptDir = path.join(__dirname, 'leetcode-solutions', 'javascript');
    const outputFile = path.join(__dirname, 'leetcode-problems.json');
    
    try {
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
        
        // Write to JSON file
        fs.writeFileSync(outputFile, JSON.stringify(problems, null, 2));
        
        console.log(`Generated leetcode-problems.json with ${problems.length} problems`);
        console.log('Sample problems:');
        problems.slice(0, 5).forEach(problem => {
            console.log(`  ${problem.id} - ${problem.title} (${problem.slug})`);
        });
        
    } catch (error) {
        console.error('Error generating LeetCode problems list:', error);
    }
}

// Run the function
generateLeetCodeProblemsList(); 