import { execSync } from 'child_process';
import { existsSync } from 'fs';

try {
  const output = execSync(
    'git diff --name-only --diff-filter=d origin/main...HEAD -- "*.ts" "*.tsx" "*.js" "*.jsx" "*.cjs"',
    { encoding: 'utf8', stdio: 'pipe' }
  ).trim();

  if (!output) {
    console.log('ℹ️  Nenhum arquivo TS/JS alterado');
    process.exit(0);
  }

  const files = output.split('\n').filter(f => f.length > 0 && existsSync(f) && !f.startsWith('scripts/'));

  if (files.length === 0) {
    console.log('ℹ️  Nenhum arquivo TS/JS alterado (excluindo scripts/)');
    process.exit(0);
  }
  console.log(`🔍 Lint em ${files.length} arquivo(s) alterado(s):`);
  files.forEach(f => console.log(`  - ${f}`));

  execSync(`npx eslint ${files.join(' ')}`, { stdio: 'inherit' });
  console.log('✅ Lint OK');
} catch (e) {
  console.error('❌ Lint falhou');
  process.exit(1);
}