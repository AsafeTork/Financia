#!/usr/bin/env node
// validate-fast.js - Validação rápida apenas dos arquivos alterados

const { execFileSync } = require('child_process');

function exec(bin, args, options = {}) {
  try {
    return execFileSync(bin, args, { encoding: 'utf8', stdio: 'inherit', ...options });
  } catch (e) {
    console.error(`❌ Falha: ${bin} ${args.join(' ')}`);
    process.exit(1);
  }
}

function getChangedFiles() {
  try {
    const output = execFileSync(
      'git',
      ['diff', '--name-only', '--diff-filter=d', '-z', 'origin/main...HEAD', '--', '*.ts', '*.tsx', '*.js', '*.jsx'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    return output.split('\0').filter(f => f.length > 0);
  } catch {
    return [];
  }
}

async function main() {
  console.log('⚡ VALIDAÇÃO RÁPIDA - apenas arquivos alterados\n');
  
  const changedFiles = getChangedFiles();
  
  if (changedFiles.length === 0) {
    console.log('ℹ️  Nenhum arquivo TypeScript/JavaScript alterado');
    return;
  }
  
  console.log(`📝 Arquivos alterados (${changedFiles.length}):`);
  changedFiles.forEach(f => console.log(`  - ${f}`));
  console.log('');

  // 1. Lint apenas alterados
  console.log('🔍 Linting arquivos alterados...');
  try {
    exec('npx', ['eslint', '--cache', '--cache-strategy', 'content', ...changedFiles], { stdio: 'inherit' });
    console.log('✅ Lint OK\n');
  } catch {
    console.error('❌ Lint falhou');
    process.exit(1);
  }

  // 2. TypeCheck incremental apenas arquivos alterados
  console.log('🔍 TypeCheck incremental...');
  const tsFiles = changedFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
  if (tsFiles.length > 0) {
    exec('npx', ['tsc', '--noEmit', '--incremental', '--skipLibCheck', ...tsFiles], { stdio: 'inherit' });
    console.log('✅ TypeCheck OK\n');
  } else {
    console.log('ℹ️  Nenhum arquivo TS/TSX alterado, pulando typecheck\n');
  }

  // 3. Testes apenas dos arquivos alterados
  console.log('🧪 Testes afetados...');
  exec('npx', ['vitest', 'run', '--changed', '--reporter=dot'], { stdio: 'inherit' });
  console.log('✅ Testes OK\n');

  // 4. Build incremental
  console.log('🏗️ Build incremental...');
  exec('npm', ['run', 'build'], { stdio: 'inherit' });
  console.log('✅ Build OK\n');

  console.log('✅ VALIDAÇÃO RÁPIDA CONCLUÍDA COM SUCESSO');
}

main().catch(e => {
  console.error('❌ Erro:', e.message);
  process.exit(1);
}