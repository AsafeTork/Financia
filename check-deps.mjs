import { readFileSync } from 'fs';

const mainBundle = readFileSync('dist/assets/index-CeQmd1v8.js', 'utf-8');
console.log('Main bundle dependency map:');
console.log(mainBundle.substring(0, 2000));
console.log('\n---');

// Check vendor chunks load in correct order
const vendorReact = readFileSync('dist/assets/vendor-react-D3NO69lq.js', 'utf-8');
console.log('\nvendor-react imports:');
const reactImports = vendorReact.match(/from\s+['"](\.[^'"]+)['"]/g);
if (reactImports) reactImports.forEach(i => console.log('  ', i));

const vendorReactDom = readFileSync('dist/assets/vendor-react-dom-BaZu6UB1.js', 'utf-8');
console.log('\nvendor-react-dom imports:');
const domImports = vendorReactDom.match(/from\s+['"](\.[^'"]+)['"]/g);
if (domImports) domImports.forEach(i => console.log('  ', i));

const vendorScheduler = readFileSync('dist/assets/vendor-scheduler-CbiHYZlt.js', 'utf-8');
console.log('\nvendor-scheduler imports:');
const schedImports = vendorScheduler.match(/from\s+['"](\.[^'"]+)['"]/g);
if (schedImports) schedImports.forEach(i => console.log('  ', i));
