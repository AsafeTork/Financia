import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:5173';
const LOG_DIR = path.resolve(__dirname, '..', 'docs', 'QA');
const SCREENSHOT_DIR = path.join(LOG_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const issues = [];
let consoleLogs = [];
let networkErrors = [];

function recordIssue({ title, severity, steps, console: consoleMsgs, request, response: resp, file, rootCause, fix }) {
  const issue = { title, severity, steps, console: consoleMsgs || [], request: request || [], response: resp || null, file, rootCause, fix };
  issues.push(issue);
  console.log(`\n!!! ISSUE [${severity}]: ${title}`);
}

async function captureAndLog(page, label) {
  const logs = consoleLogs.filter(l => l.type === 'error' || l.type === 'warning');
  const nets = networkErrors.filter(n => n.status >= 400);
  try {
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${label}.png`), fullPage: true });
  } catch (e) {
    console.log(`Screenshot failed for ${label}: ${e.message}`);
  }
  return { logs, nets };
}

async function runAudit() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'pt-BR',
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Reset per-page tracking
  function resetTracking() {
    consoleLogs = [];
    networkErrors = [];
  }

  // Monitor console
  page.on('console', msg => {
    const entry = { type: msg.type(), text: msg.text(), location: msg.location() };
    consoleLogs.push(entry);
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[${msg.type().toUpperCase()}] ${msg.text().substring(0, 200)}`);
    }
  });

  // Monitor network
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (status >= 400) {
      networkErrors.push({ status, url, method: response.request().method() });
      console.log(`[NETWORK ${status}] ${url.substring(0, 150)}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}`);
    consoleLogs.push({ type: 'pageerror', text: err.message, stack: err.stack });
  });

  // =========================================
  // 1. LANDING PAGE
  // =========================================
  console.log('\n=== 1. LANDING PAGE ===');
  resetTracking();
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => 
    page.goto(BASE, { waitUntil: 'load', timeout: 30000 })
  );
  await page.waitForTimeout(3000);
  let snap = await captureAndLog(page, '01-landing');

  // Check for blank page or JS error
  const bodyText = await page.locator('#root').textContent().catch(() => '');
  if (!bodyText || bodyText.trim().length < 5) {
    recordIssue({
      title: 'Landing page não renderizou conteúdo',
      severity: 'P0',
      steps: 'Acessar http://localhost:5173',
      console: consoleLogs.filter(l => l.type === 'error'),
      file: 'src/App.jsx, src/features/landing/Landing.jsx',
      rootCause: 'Erro no lazy loading ou Suspense',
      fix: 'Verificar se o Landing.jsx compila e o lazy import está correto'
    });
  }

  // =========================================
  // 2. LANDING COM onEnter
  // =========================================
  console.log('\n=== 2. LANDING - Tentar abrir Login ===');
  // Try clicking "Entrar" button
  const entrarBtn = page.locator('button, a').filter({ hasText: /Entrar|Acessar|Login|Começar/i }).first();
  if (await entrarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await entrarBtn.click();
    await page.waitForTimeout(2000);
    snap = await captureAndLog(page, '02-login-click');
  } else {
    // Set localStorage to skip landing
    await page.evaluate(() => localStorage.setItem('financia_seen', '1'));
    await page.reload({ waitUntil: 'networkidle' }).catch(() => page.reload());
    await page.waitForTimeout(3000);
    snap = await captureAndLog(page, '02-login-direct');
  }

  // =========================================
  // 3. LOGIN FORM
  // =========================================
  console.log('\n=== 3. LOGIN FORM ===');
  resetTracking();
  
  // Check if login form appeared
  let emailInput = page.locator('input[type="email"]').first();
  if (!(await emailInput.isVisible({ timeout: 3000 }).catch(() => false))) {
    // Try direct
    await page.goto(`${BASE}/#/dashboard`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    emailInput = page.locator('input[type="email"]').first();
  }

  if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    snap = await captureAndLog(page, '03-login-form');
    console.log('Login form is visible');

    // Test invalid login
    await emailInput.fill('teste@erro.com');
    const passInput = page.locator('input[type="password"]').first();
    if (await passInput.isVisible().catch(() => false)) {
      await passInput.fill('senha_errada');
      
      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
        snap = await captureAndLog(page, '03-login-failed');
      }
    }
  } else {
    console.log('Login form NOT visible - checking app state...');
    recordIssue({
      title: 'Login form não aparece',
      severity: 'P0',
      steps: 'Acessar app sem sessão',
      console: consoleLogs.filter(l => l.type === 'error' || l.type === 'warning'),
      file: 'src/features/auth/Login.jsx',
      rootCause: 'Componente Login pode estar quebrado ou condição de renderização incorreta',
      fix: 'Verificar estado showLogin e sessão'
    });
  }

  // =========================================
  // 4. APP ROUTES (sem sessão tenta acessar)
  // =========================================
  console.log('\n=== 4. APP ROUTES (sem auth) ===');
  resetTracking();
  const routes = ['dashboard', 'income', 'expense', 'inventory', 'report', 'settings', 'planos', 'brandstudio', 'email'];
  for (const route of routes) {
    console.log(`  Route: ${route}`);
    resetTracking();
    await page.goto(`${BASE}/#/${route}`, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
    snap = await captureAndLog(page, `04-route-${route}`);
    
    if (snap.logs.some(l => l.type === 'error') || snap.nets.length > 0) {
      const errors = snap.logs.filter(l => l.type === 'error');
      if (errors.length > 0) {
        recordIssue({
          title: `Erro ao acessar rota /${route} (sem sessão)`,
          severity: 'P2',
          steps: `Navegar para /${route} sem estar logado`,
          console: errors,
          file: `src/features/${route === 'income' || route === 'expense' ? 'transactions' : route === 'inventory' ? 'inventory' : route === 'report' ? 'reports' : route === 'settings' ? 'settings' : route === 'planos' ? 'plans' : route === 'brandstudio' ? 'branding' : route === 'email' ? 'email' : route}/**`,
          rootCause: 'Rota protegida pode estar tentando carregar dados antes da autenticação',
          fix: 'Adicionar verificação de sessão antes de carregar hooks de dados'
        });
      }
    }
  }

  // =========================================
  // 5. LEGAL PAGES
  // =========================================
  console.log('\n=== 5. LEGAL PAGES ===');
  resetTracking();
  for (const route of ['privacidade', 'termos']) {
    console.log(`  ${route}`);
    await page.goto(`${BASE}/#/${route}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    snap = await captureAndLog(page, `05-${route}`);
    const text = await page.locator('body').textContent().catch(() => '');
    if (!text || text.trim().length < 50) {
      recordIssue({
        title: `Página legal "${route}" vazia`,
        severity: 'P1',
        steps: `Navegar para /${route}`,
        file: `src/features/landing/${route === 'privacidade' ? 'PrivacyPolicy' : 'TermsOfService'}.jsx`,
        rootCause: 'Lazy loading ou conteúdo não carregado',
        fix: 'Verificar import lazy e conteúdo do componente'
      });
    }
  }

  // =========================================
  // 6. AUTH - Criar conta de teste
  // =========================================
  console.log('\n=== 6. CRIAÇÃO DE CONTA ===');
  
  // Try signup via Supabase directly since UI might vary
  // First check if signup form exists
  await page.goto(`${BASE}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  
  // Ensure we see login
  await page.evaluate(() => { localStorage.setItem('financia_seen', '1'); });
  await page.reload({ waitUntil: 'networkidle' }).catch(() => page.reload());
  await page.waitForTimeout(3000);
  snap = await captureAndLog(page, '06-auth-view');

  // =========================================
  // 7. TEST NETWORK ERRORS
  // =========================================
  console.log('\n=== 7. NETWORK AUDIT ===');
  const allNets = networkErrors.filter(n => n.status >= 400);
  if (allNets.length > 0) {
    recordIssue({
      title: `Requisições com erro HTTP (${allNets.length} encontradas)`,
      severity: 'P1',
      steps: 'Navegação geral pelo app',
      request: allNets.map(n => `${n.method} ${n.url} -> ${n.status}`),
      file: 'Vários',
      rootCause: 'Endpoints podem estar indisponíveis ou configuração incorreta',
      fix: 'Verificar conectividade com Supabase e endpoints'
    });
  }

  // =========================================
  // 8. CONSOLE ERRORS SUMMARY
  // =========================================
  console.log('\n=== 8. CONSOLE AUDIT ===');
  const allConsoleErrors = consoleLogs.filter(l => l.type === 'error' || l.type === 'pageerror');
  const allConsoleWarnings = consoleLogs.filter(l => l.type === 'warning');
  
  console.log(`Console errors: ${allConsoleErrors.length}`);
  console.log(`Console warnings: ${allConsoleWarnings.length}`);
  console.log(`Network errors (400+): ${allNets.length}`);

  // =========================================
  // Summary
  // =========================================
  console.log('\n========================================');
  console.log(`AUDIT COMPLETE - ${issues.length} issues found`);
  console.log('========================================\n');

  // Generate markdown report
  const p0 = issues.filter(i => i.severity === 'P0').length;
  const p1 = issues.filter(i => i.severity === 'P1').length;
  const p2 = issues.filter(i => i.severity === 'P2').length;
  const p3 = issues.filter(i => i.severity === 'P3').length;

  let md = `# Functional Audit Report

**Date:** ${new Date().toISOString().split('T')[0]}
**Environment:** Local (http://localhost:5173)
**Supabase:** kxeqhorxhlgwcgywovqr (sa-east-1)

## Summary

| Severity | Count |
|----------|-------|
| P0 (Critical) | ${p0} |
| P1 (High) | ${p1} |
| P2 (Medium) | ${p2} |
| P3 (Low) | ${p3} |
| **Total** | **${issues.length}** |

## Console Log

- **Total console events captured:** ${consoleLogs.length}
- **Errors:** ${allConsoleErrors.length}
- **Warnings:** ${allConsoleWarnings.length}

## Network

- **HTTP 4xx/5xx:** ${allNets.length}
${allNets.map(n => `  - \`${n.status}\` ${n.method} ${n.url}`).join('\n')}

## Issues Found

`;

  issues.forEach((issue, idx) => {
    md += `### ${idx + 1}. [${issue.severity}] ${issue.title}\n\n`;
    md += `**Steps:** ${issue.steps}\n\n`;
    md += `**File(s):** ${issue.file || 'N/A'}\n\n`;
    md += `**Root Cause:** ${issue.rootCause || 'N/A'}\n\n`;
    md += `**Fix:** ${issue.fix || 'N/A'}\n\n`;
    if (issue.console && issue.console.length > 0) {
      md += `**Console:**\n\`\`\`\n${issue.console.map(c => `[${c.type}] ${c.text}`).join('\n').substring(0, 500)}\n\`\`\`\n\n`;
    }
    if (issue.request && issue.request.length > 0) {
      md += `**Requests:**\n\`\`\`\n${issue.request.join('\n').substring(0, 500)}\n\`\`\`\n\n`;
    }
  });

  // All console logs section
  md += `\n## Complete Console Log\n\n`;
  md += `<details><summary>Click to expand (${consoleLogs.length} entries)</summary>\n\n`;
  md += `\`\`\`\n`;
  consoleLogs.forEach(l => {
    md += `[${l.type}] ${l.text}\n`;
  });
  md += `\`\`\`\n`;
  md += `</details>\n`;

  md += `\n## Screenshots\n\n`;
  const screenshots = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png'));
  screenshots.forEach(s => {
    md += `- ${s}\n`;
  });

  fs.writeFileSync(path.join(LOG_DIR, 'FUNCTIONAL_AUDIT.md'), md);
  console.log(`Report saved to ${LOG_DIR}/FUNCTIONAL_AUDIT.md`);

  // Save JSON
  const report = {
    timestamp: new Date().toISOString(),
    totalIssues: issues.length,
    consoleErrors: allConsoleErrors.length,
    consoleWarnings: allConsoleWarnings.length,
    networkErrors: allNets,
    issues,
  };
  fs.writeFileSync(path.join(LOG_DIR, 'audit-results.json'), JSON.stringify(report, null, 2));

  await browser.close();
  return report;
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
