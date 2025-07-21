import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function parseSolutions(txt) {
  const solutionPattern = /\/\*\*([\s\S]*?)\*\/\s*([\s\S]*?)(?=\/\*\*|$)/g;

  const solutions = [];
  let match;

  while ((match = solutionPattern.exec(txt)) !== null) {
    const doc = match[1].trim();
    const code = match[2].trim();

    // Extract title (first non-empty line that doesn't start with @ or *)
    const titleMatch = doc.split('\n')
      .map(line => line.replace(/^\s*\*\s?/, '').trim())
      .find(line => line && !line.startsWith('@'));

    // Extract @param lines
    const paramMatches = Array.from(doc.matchAll(/@param\s+{[^}]+}\s+(\w+)/g)).map(m => m[1]);

    // Extract @return line
    const returnMatch = doc.match(/@return\s+{[^}]+}/);
    const returnType = returnMatch ? returnMatch[0] : null;

    solutions.push({
      title: titleMatch || '',
      params: paramMatches,
      return: returnType,
      code: code
    });
  }

  return solutions;
}

// Example usage:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Now use path.resolve like before
const filePath = path.resolve(__dirname, '../leetcode-solutions/javascript/0001-two-sum.txt');
const txt = fs.readFileSync(filePath, 'utf8');
//const txt = fs.readFileSync('./leetcode-solutions/javascript/0001-two-sum.txt', 'utf8');
const parsed = parseSolutions(txt);

// Output parsed content
parsed.forEach((sol, i) => {
  console.log(`--- Solution ${i + 1} ---`);
  console.log('Title:', sol.title);
  console.log('Params:', sol.params);
  console.log('Return:', sol.return);
  console.log('Code:\n', sol.code);
  console.log();
});
