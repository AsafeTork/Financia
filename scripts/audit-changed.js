#!/usr/bin/env node
// audit-changed.js - Auditoria incremental apenas de arquivos alterados

const { execFileSync } = require('child_process');

function run(bin, args, options = {}) {
  try {
    return execFileSync(bin, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000, ...options });
  } catch (e) {
    return '';
  }
}

function exec(bin, args, options = {}) {
  try {
    execFileSync(bin, args, { stdio: ['ignore', 'inherit', 'inherit'], timeout: 120000, ...options });
  } catch (e) {
    console.error(`❌ Falha: ${bin} ${args.join(' ')}`);
    process.exit(1);
  }
}

async function main() {
  console.log('🔍 AUDITORIA INCREMENTAL - apenas arquivos alterados\n');

  const files = run('git', ['diff', '--name-only', '--diff-filter=d', '-z', 'origin/main...HEAD']).split('\0').filter(f => f.length > 0);
  
  if (files.length === 0) {
    console.log('ℹ️  Nenhum arquivo alterado');
    return;
  }

  console.log(`📝 Arquivos alterados (${files.length}):`);
  files.forEach(f => console.log(`  - ${f}`));
  console.log('');

  // Categorizar
  const migrations = [];
  const edgeFunctions = [];
  const frontendFiles = [];
  const configFiles = [];

  for (const f of files) {
    if (f.startsWith('supabase/migrations/')) migrations.push(f);
    else if (f.startsWith('supabase/functions/')) edgeFunctions.push(f);
    else if (f.startsWith('src/')) frontendFiles.push(f);
    else configFiles.push(f);
  }

  const issues = [];

  // 1. Migrações novas
  if (migrations.length) {
    console.log('\n📦 Migrações novas:');
    migrations.forEach(m => console.log(`  - ${m}`));
    try {
      execFileSync('npx', ['supabase', 'db', 'diff', '--schema', 'public', '--dry-run'], { stdio: 'ignore' });
      console.log('  ✅ Migrações aplicam sem erro');
    } catch (e) {
      issues.push({ file: 'migrations', issue: 'Migração falha no dry-run', severity: 'high' });
    }
  }

  // 2. Frontend alterado
  if (frontendFiles.length) {
    console.log('\n📝 Frontend alterado:');
    frontendFiles.forEach(f => console.log(`  - ${f}`));
  }

  // 3. Edge Functions
  if (edgeFunctions.length) {
    console.log('\n⚡ Edge Functions alteradas:');
    edgeFunctions.forEach(f => console.log(`  - ${f}`));
  }

  // 4. Build rápido
  console.log('\n🔨 Verificando build...');
  try {
    execFileSync('npm', ['run', 'build'], { stdio: 'ignore', timeout: 120000 });
    console.log('  ✅ Build OK');
  } catch (e) {
    issues.push({ file: 'build', issue: 'Build falhou', severity: 'critical' });
  }

  // 5. Lint apenas alterados
  console.log('\n🔍 Lint nos alterados...');
  const changedTS = run('git', ['diff', '--name-only', '--diff-filter=d', '-z', 'origin/main...HEAD', '--', '*.ts', '*.tsx']);
  if (changedTS) {
    const changedTSFiles = changedTS.split('\0').filter(f => f.length > 0);
    if (changedTSFiles.length > 0) {
      try {
        execFileSync('npx', ['eslint', '--cache', '--cache-strategy', 'content', ...changedTSFiles], { stdio: 'ignore' });
        console.log('  ✅ Lint OK');
      } catch (e) {
        issues.push({ file: 'lint', issue: 'Lint falhou em arquivos alterados', severity: 'high' });
      }
    }
  }

  // 4. Typecheck apenas alterados
  console.log('\n🔍 Typecheck nos alterados...');
  const changedTSFilesList = changedTS.split('\0').filter(f => f.length > 0);
  if (changedTSFilesList.length > 0) {
    try {
      execFileSync('npx', ['tsc', '--noEmit', '--incremental', ...changedTSFilesList], { stdio: 'ignore' });
      console.log('  ✅ Typecheck OK');
    } catch (e) {
      issues.push({ file: 'typecheck', issue: 'Typecheck falhou em arquivos alterados', severity: 'high' });
    }
  }

  // 5. Testes alterados
  console.log('\n🧪 Testes alterados...');
  try {
    execFileSync('npx', ['vitest', 'run', '--changed'], { stdio: 'ignore', timeout: 60000 });
    console.log('  ✅ Testes alterados OK');
  } catch (e) {
    issues.push({ file: 'test:changed', issue: 'Testes alterados falharam', severity: 'high' });
  }

  // Resumo
  console.log('\n' + '='.repeat(50));
  if (issues.length === 0) {
    console.log('✅ AUDITORIA INCREMENTAL PASSOU - Sem problemas');
    process.exit(0);
  } else {
    console.log('❌ AUDITORIA INCREMENTAL FALHOU:');
    issues.forEach(i => console.log(`  [${i.severity.toUpperCase()}] ${i.file}: ${i.issue}`));
    process.exit(1);
  }
}

main();