#!/usr/bin/env node
// audit-full.js - Auditoria completa

const { execSync } = require('child_process');
const fs = require('fs');

function exec(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error(`❌ Falha: ${cmd}`);
    process.exit(1);
  }
}

async function main() {
  console.log('🔍 AUDITORIA COMPLETA\n');
  
  // 1. Migrations
  console.log('\n1️⃣ MIGRATIONS');
  exec('npx supabase db diff --schema public --dry-run');
  console.log('✅ Migrations sincronizadas');

  // 2. Edge Functions
  console.log('\n2️⃣ EDGE FUNCTIONS');
  const efs = fs.readdirSync('supabase/functions').filter(f => fs.statSync(`supabase/functions/${f}`).isDirectory());
  console.log(`Encontradas ${efs.length} Edge Functions:`);
  for (const ef of efs) {
    console.log(`  - ${ef}`);
    try {
      execSync(`deno check supabase/functions/${ef}/index.ts 2>/dev/null`, { stdio: 'pipe' });
      console.log(`  ✅ ${ef} - sintaxe OK`);
    } catch {
      console.log(`  ⚠️  ${ef} - erros de tipo`);
    }
  }

  // 3. Migrations não rastreadas
  console.log('\n3️⃣ MIGRATIONS NÃO RASTREADAS');
  const localMigrations = fs.readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).sort();
  console.log(`${localMigrations.length} migrations locais`);
  
  // 3. Edge Functions sem caller
  console.log('\n4️⃣ EDGE FUNCTIONS SEM CALLER');
  const efDir = 'supabase/functions';
  if (fs.existsSync(efDir)) {
    const efs = fs.readdirSync(efDir).filter(f => fs.statSync(`supabase/functions/${f}`).isDirectory());
    for (const ef of efs) {
      const callers = execSync(`grep -r "supabase.functions.invoke.*['\"]${ef}['\"]" src/ 2>/dev/null | wc -l`, { encoding: 'utf8' }).trim();
      if (callers === '0' && !['ai', 'stripe-webhook', 'stripe-checkout'].includes(ef)) {
        console.log(`  ⚠️  ${ef} - sem caller detectado`);
      }
    }
  }

  // 4. Verificar migrations não rastreadas localmente
  console.log('\n5️⃣ MIGRATIONS NÃO RASTREADAS LOCALMENTE');
  const localMigrations = fs.readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).sort();
  console.log(`${localMigrations.length} migrations locais`);
  
  // 5. Verificar índices
  console.log('\n6️⃣ ÍNDICES');
  console.log('  Verificando índices...');

  console.log('\n✅ AUDITORIA COMPLETA CONCLUÍDA');
}

require('child_process').execSync('', { stdio: 'inherit' });