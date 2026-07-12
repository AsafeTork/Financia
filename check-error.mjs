import { readFileSync } from 'fs';

const content = readFileSync('dist/assets/index-Cod4KOJY.js', 'utf-8');

// Look at the error location - line 32, column 132686
const lines = content.split('\n');
console.log('Total lines:', lines.length);

// Line 32
if (lines[31]) {
  console.log('Line 32 (index 31):');
  console.log(lines[31].substring(132680, 132720));
}

// Also check around that area
for (let i = 30; i < 35; i++) {
  if (lines[i]) {
    console.log(`Line ${i+1} length: ${lines[i].length}`);
    if (lines[i].length > 132680) {
      console.log(`  Contains error position: ${lines[i].substring(132670, 132710)}`);
    }
  }
}
