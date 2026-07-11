import { execSync } from 'child_process';

try {
  const output = execSync(
    'git diff --name-only --diff-filter=d origin/main...HEAD -- "*.ts" "*.tsx"',
    { encoding: 'utf8', stdio: 'pipe' }
  ).trim();

  if (!output) {
    console.log('ℹ️  Nenhum arquivo TS/TSX alterado');
    process.exit(0);
  }

  const files = output.split('\n').filter(f => f.length > 0);
  console.log(`🔍 Typecheck em ${files.length} arquivo(s) TS/TSX alterado(s):`);
  files.forEach(f => console.log(`  - ${f}`));

  execSync(`npx tsc --noEmit --incremental ${files.join(' ')}`, { stdio: 'inherit' });
  console.log('✅ Typecheck OK');
} catch (e) {
  console.error('❌ Typecheck falhou');
  process.exit(1);
}