import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// For __dirname support in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Folder containing the .js files
const folderPath = path.join(__dirname, '../leetcode-solutions/javascript'); // <-- Replace with your folder

fs.readdir(folderPath, (err, files) => {
  if (err) {
    console.error('Error reading folder:', err);
    return;
  }

  files.forEach(file => {
    const ext = path.extname(file);
    if (ext === '.js') {
      const jsFilePath = path.join(folderPath, file);
      const txtFilePath = path.join(folderPath, file.replace(/\.js$/, '.txt'));

      fs.readFile(jsFilePath, 'utf8', (readErr, data) => {
        if (readErr) {
          console.error(`Error reading ${file}:`, readErr);
          return;
        }

        fs.writeFile(txtFilePath, data, 'utf8', writeErr => {
          if (writeErr) {
            console.error(`Error writing ${txtFilePath}:`, writeErr);
          } else {
            console.log(`Converted: ${file} → ${path.basename(txtFilePath)}`);
          }
        });
      });
    }
  });
});
