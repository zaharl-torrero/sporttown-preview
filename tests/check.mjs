import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const require=createRequire('D:/Yandex.Disk/lep-labs/30-products/1-porydok/Poryadok/package.json');
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/zahar/AppData/Local/Chromium/Application/chrome.exe'});
const origin=process.env.SPORTTOWN_URL||'http://127.0.0.1:8768/';
fs.mkdirSync('tmp/check',{recursive:true});
for(const width of [360,390,430,768,1024,1440,1920]){
 const page=await browser.newPage({viewport:{width,height:960},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',response=>{if(response.status()>=400&&response.url().startsWith(origin))errors.push(response.status()+' '+response.url())});
 await page.goto(origin,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('h1').count(),1);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow at ${width}`);
 await page.locator('[data-space="cardio"]').click();assert.match(await page.locator('#space-photo').getAttribute('src'),/cardio/);
 await page.locator('[data-space="cardio"]').press('ArrowRight');assert.equal(await page.locator('[data-space="functional"]').getAttribute('aria-selected'),'true');
 await page.locator('.space-image').click();await page.locator('#gallery[open]').waitFor();assert.match(await page.locator('#gallery-caption').textContent(),/Функциональная/);await page.locator('#gallery-next').click();assert.match(await page.locator('#gallery-caption').textContent(),/Характер/);await page.keyboard.press('Escape');assert.equal(await page.locator('#gallery[open]').count(),0);
 for(const [months,price] of [[1,6700],[3,17900],[6,26500],[12,39000]]){await page.locator(`[data-months="${months}"]`).click();assert.equal((await page.locator('#card-price').textContent()).replace(/\s/g,''),String(price));assert.equal(await page.locator(`[data-months="${months}"]`).getAttribute('aria-pressed'),'true');assert.match(await page.locator('#card-action').textContent(),new RegExp(String(months)));}
 await page.locator('.training').nth(1).locator('summary').click();await page.waitForFunction(()=>document.querySelector('#training-photo').getAttribute('src').includes('cardio'));assert.match(await page.locator('#training-photo').getAttribute('src'),/cardio/);
 await page.locator('.faq details').nth(1).locator('summary').click();assert.match(await page.locator('.faq details').nth(1).textContent(),/09:00/);
 if(width<=760){await page.evaluate(()=>window.scrollTo(0,0));await page.locator('.menu-toggle').click();assert.equal(await page.locator('#mobile-nav').isVisible(),true);await page.locator('#mobile-nav a[href="#membership"]').click();assert.equal(await page.locator('#mobile-nav').isVisible(),false)}
 await page.evaluate(async()=>{await Promise.all([...document.images].map(async im=>{im.loading='eager';await im.decode()}))});
 const broken=await page.evaluate(()=>[...document.images].filter(im=>!im.complete||!im.naturalWidth).map(im=>im.src));assert.deepEqual(broken,[],`Broken images ${width}`);
 assert.deepEqual(errors,[]);
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`tmp/check/${width}.jpg`,fullPage:true,type:'jpeg',quality:85});
 console.log(`${width}: layout, photos, cards, zones, gallery, FAQ OK`);await page.close();
}
const plain=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await plain.goto(origin);assert.equal(await plain.locator('h1').isVisible(),true);assert.match(await plain.locator('noscript').textContent(),/6 700/);await plain.close();
await browser.close();console.log('No-JS content OK');
