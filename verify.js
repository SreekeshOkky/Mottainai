const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('h3'));
    const penItem = items.find(el => el.textContent.includes('A nice pen'));
    if (penItem) penItem.click();
  });
  
  await page.waitForSelector('input[placeholder*="Share your thoughts"]');
  
  page.on('response', async response => {
    if (response.url().includes('/api/chat')) {
      console.log('API STATUS:', response.status());
      console.log('API TEXT START:', (await response.text()).slice(0, 500));
    }
  });

  await page.type('input[placeholder*="Share your thoughts"]', 'test message');
  await page.click('.inputArea button[type="submit"]');
  
  await page.waitForTimeout(5000);
  
  const msgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.chatArea > div')).map(el => el.textContent);
  });
  console.log('RENDERED MSGS:', msgs);
  
  await browser.close();
})();
