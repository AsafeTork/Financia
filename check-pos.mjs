import { readFileSync } from 'fs';

const content = readFileSync('dist/assets/vendor-DADPAC4l.js', 'utf-8');

// Show context around position 1254
const start = Math.max(0, 1254 - 200);
const end = Math.min(content.length, 1254 + 200);
console.log('Context around U:');
console.log(content.substring(start, end));
console.log('---');

// Also look for "U" variable declarations
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Look for any variable named U
  if (/\bU\b/.test(line) && (line.includes('const') || line.includes('let') || line.includes('var') || line.includes('U =') || line.includes('U:'))) {
    console.log(`Line ${i}: ${line.substring(0, 300)}`);
  }
}
