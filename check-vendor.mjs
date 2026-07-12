import { readFileSync } from 'fs';

const content = readFileSync('dist/assets/vendor-DADPAC4l.js', 'utf-8');

// Look for the problematic line around column 40 in the minified file
// Let's find variable 'U' declarations
const lines = content.split('\n');
console.log('Total lines:', lines.length);

// Look for 'U' variable
for (let i = 0; i < Math.min(lines.length, 100); i++) {
  if (lines[i].includes('var U') || lines[i].includes('const U') || lines[i].includes('let U') || lines[i].includes(' U=')) {
    console.log(`Line ${i}:`, lines[i].substring(0, 200));
  }
}
