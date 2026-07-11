#!/usr/bin/env node
// validate-full.js - Validação completa

const { execSync } = require('child_process');

function exec(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit', stdio: ['ignore', 'inherit', 'inherit'] });
  } catch (e) {
    console.error(`❌ Falha: ${cmd}`);
    process.exit(1);
  }
}

async function main() {
  console.log('🔍 VALIDAÇÃO COMPLETA\n');
  
  console.log('\n1️⃣ LINT');
  exec('npm run lint');
  
  console.log('\n2️⃣ TYPECHECK');
  exec('npx tsc --noEmit --incremental');
  
  console.log('\n3️⃣ TESTES');
  exec('npm test');
  
  console.log('\n4️⃣ BUILD');
  exec('npm run build');
  
  console.log('\n✅ VALIDAÇÃO COMPLETA - TUDO OK');
}

require('child_process').execSync('', { stdio: 'inherit' });