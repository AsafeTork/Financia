import { execFileSync } from 'child_process';

try {
  const output = execFileSync(
    'git',
    ['diff', '--name-only', '--diff-filter=d', '-z', 'origin/main...HEAD', '--', '*.ts', '*.tsx'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );

  if (!output || output.length === 0) {
    console.log('ℹ️  Nenhum arquivo TS/TSX alterado');
    process.exit(0);
  }

  const files = output.split('\0').filter(f => f.length > 0);
  console.log(`🔍 Typecheck em ${files.length} arquivo(s) TS/TSX alterado(s):`);
  files.forEach(f => console.log(`  - ${f}`));

  execFileSync('npx', ['tsc', '--noEmit', '--incremental', ...files], { stdio: 'inherit' });
  console.log('✅ Typecheck OK');
} catch (e) {
  console.error('❌ Typecheck falhou');
  process.exit(1);
}