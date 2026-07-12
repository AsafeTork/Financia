import { readFileSync } from 'fs';

const content = readFileSync('dist/assets/index-B4MAxKDo.js', 'utf-8');

// Search for "U" variable usage
const idx = content.indexOf('const U');
if (idx >= 0) {
  console.log('Found const U at:', idx);
  console.log(content.substring(Math.max(0, idx - 100), idx + 200));
}

const idx2 = content.indexOf('let U');
if (idx2 >= 0) {
  console.log('Found let U at:', idx2);
  console.log(content.substring(Math.max(0, idx2 - 100), idx2 + 200));
}

const idx3 = content.indexOf('var U');
if (idx3 >= 0) {
  console.log('Found var U at:', idx3);
  console.log(content.substring(Math.max(0, idx3 - 100), idx3 + 200));
}

// Also search for "U" being used before declaration
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Cannot access') || lines[i].includes('before initialization')) {
    console.log(`Line ${i}: ${lines[i].substring(0, 300)}`);
  }
}

// Search for "U" as a variable name
for (let i = 0; i < Math.min(200, content.length); i++) {
  if (content[i] === 'U' && content[i+1] === ' ' && content[i+2] === '=') {
    console.log('Found U = at:', i);
    console.log(content.substring(Math.max(0, i - 50), i + 100));
    break;
  }
}
