import { readFileSync } from 'fs';

const content = readFileSync('dist/assets/vendor-DADPAC4l.js', 'utf-8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);
console.log('First 50 lines:');
for (let i = 0; i < Math.min(50, lines.length); i++) {
  console.log(`${i}: ${lines[i].substring(0, 200)}`);
}
