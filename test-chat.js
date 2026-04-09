const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Add an item if it doesn't exist
  await page.type('input[placeholder*="desire"]', 'A nice pen');
  await page.click('form button[type="submit"]');
  await page.waitForTimeout(500);
  
  // Click the item
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('h3'));
    const penItem = items.find(el => el.textContent.includes('A nice pen'));
    if (penItem) penItem.click();
  });
  
  await page.waitForSelector('input[placeholder*="Share your thoughts"]');
  console.log("Chat modal opened!");
  
  // Send chat message
  await page.type('input[placeholder*="Share your thoughts"]', 'Hello, I want it.');
  await page.click('.inputArea button[type="submit"]');
  
  await page.waitForTimeout(2000);
  
  // Get chat contents
  const chatMessages = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.chatArea > div')).map(el => el.textContent);
  });
  console.log("CHAT MESSAGES RENDERED:", chatMessages);
  
  await browser.close();
})();
