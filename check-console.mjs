import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  try {
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    if (errors.length > 0) {
      console.log('ERRORS FOUND:');
      errors.forEach(e => console.log(' - ', e));
    } else {
      console.log('No console errors found');
    }
  } catch (e) {
    console.log('Navigation error:', e.message);
  }
  
  await browser.close();
  process.exit(errors.length > 0 ? 1 : 0);
})();
