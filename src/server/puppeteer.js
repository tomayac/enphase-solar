import puppeteer from 'puppeteer';
import { LOCAL_IP } from './index.js';
import { getToken } from './authentication.js';

(async () => {
  const token = await getToken();

  const browser = await puppeteer.launch({
    headless: 'new', // false
    args: ['--ignore-certificate-errors'],
  });
  const page = await browser.newPage();
  await page.setCacheEnabled(false);

  await page.goto(`https://${LOCAL_IP}/home#auth`);
  await page.waitForSelector('#jwtbox');
  await page.type('#jwtbox', token);

  await page.click('#enterjwt');
  await page.waitForNavigation();

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.resourceType() === 'script') {
      request.abort();
    } else {
      request.continue();
    }
  });

  await page.goto(`https://${LOCAL_IP}/installer/setup/home`);
  page.on('console', async (msg) => {
    const msgArgs = msg.args();
    for (let i = 0; i < msgArgs.length; ++i) {
      console.log(JSON.parse(await msgArgs[i].jsonValue()));
    }
  });

  await page.evaluate(`
    document.body.innerHTML = '';
    document.head.innerHTML = '';

    const eventSource = new EventSource(
      \`https://${LOCAL_IP}/stream/meter\`
    );

    eventSource.addEventListener('error', (e) => {
      if (e.message === 'self signed certificate') {
        return;
      }
      console.error('{"error", e}');
    });

    eventSource.addEventListener('open', (e) => {
      console.log('{"open": true}');
    });

    eventSource.addEventListener('message', (e) => {
      const data = JSON.parse(e.data);
      const prod =
        data['production']['ph-a']['p'] +
        data['production']['ph-b']['p'] +
        data['production']['ph-c']['p'];
      const cons =
        data['total-consumption']['ph-a']['p'] +
        data['total-consumption']['ph-b']['p'] +
        data['total-consumption']['ph-c']['p'];
      const net =
        data['net-consumption']['ph-a']['p'] +
        data['net-consumption']['ph-b']['p'] +
        data['net-consumption']['ph-c']['p'];
      console.log('{"timestamp":' + Date.now() + ', "time": "' + new Date().toString().split(/ /)[4] + '", "produced": ' + prod.toFixed(0) + ', "consumed": ' + cons.toFixed(0) + ', "net": ' + net.toFixed(0) + '}');
    });`);
})();
