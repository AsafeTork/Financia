import { execFileSync } from 'child_process';
import { existsSync } from 'fs';

try {
  const output = execFileSync(
    'git',
    ['diff', '--name-only', '--diff-filter=d', '-z', 'origin/main...HEAD', '--', '*.ts', '*.tsx', '*.js', '*.jsx', '*.cjs'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );

  if (!output || output.length === 0) {
    console.log('ℹ️  Nenhum arquivo TS/JS alterado');
    process.exit(0);
  }

  const files = output
    .split('\0')
    .filter(f => f.length > 0 && existsSync(f) && !f.startsWith('scripts/'));

  if (files.length === 0) {
    console.log('ℹ️  Nenhum arquivo TS/JS alterado (excluindo scripts/)');
    process.exit(0);
  }
  console.log(`🔍 Lint em ${files.length} arquivo(s) alterado(s):`);
  files.forEach(f => console.log(`  - ${f}`));

  execFileSync('npx', ['eslint', ...files], { stdio: 'inherit' });
  console.log('✅ Lint OK');
} catch (e) {
  console.error('❌ Lint falhou');
  process.exit(1);
}