import { readFileSync } from 'fs';

const content = readFileSync('dist/assets/vendor-DADPAC4l.js', 'utf-8');

// Find the area around the error - let's search for patterns that could be "Cannot access 'U'"
const idx = content.indexOf('U');
console.log('First U at:', idx);

// Let's look for variable declarations around U
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Look for patterns like "const U", "let U", "var U", or "U ="
  if (/\b(const|let|var)\s+U\b/.test(line) || /\bU\s*=/.test(line)) {
    console.log(`Line ${i}: ${line.substring(0, 200)}`);
  }
}

// Also search for "before initialization" pattern in source
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('before initialization') || lines[i].includes('Cannot access')) {
    console.log(`Line ${i}: ${lines[i].substring(0, 200)}`);
  }
}
