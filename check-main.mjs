import { readFileSync } from 'fs';

const content = readFileSync('dist/assets/index-Cod4KOJY.js', 'utf-8');

// Search for "U" variable usage
const lines = content.split('\n');
for (let i = 0; i < Math.min(200, lines.length); i++) {
  const line = lines[i];
  if (line.includes('const U') || line.includes('let U') || line.includes('var U') || 
      line.includes(' U =') || line.includes(' U:')) {
    console.log(`Line ${i}: ${line.substring(0, 300)}`);
  }
}

// Also search for "U" as a single letter variable
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(' U =') || lines[i].includes(' U:') || lines[i].includes(' U,') || 
      lines[i].includes(' U;') || lines[i].includes(' U)') || lines[i].includes(' U}')) {
    console.log(`Line ${i}: ${lines[i].substring(0, 300)}`);
  }
}
