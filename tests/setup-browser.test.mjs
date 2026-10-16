const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {setupTest} from '../guidance.js';
import {checkTextContrast} from './colour-contrast.mjs';
await mkdir('outputs',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const nav=id=>page.locator(`.navlist [data-action="nav-${id}"]`).click();
const dialog=page.locator('#setup-dialog');
const open=topic=>page.locator(`main [data-setup-help="${topic}"]`).click();
const saved=()=>page.evaluate(()=>localStorage.getItem('toy-workshop-v1'));
try{
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:4173');await page.locator('h1').waitFor();
 await nav('idea');await page.locator('#idea-when').fill('press my toy’s nose');await nav('ready');
 await page.locator('[data-key="editor"]').check();
 const before=await saved();
 assert.equal(await page.locator('main details').count(),0,'setup help is not hidden in a collapse');
 assert.equal(await page.locator('main [data-setup-help]').count(),5);
 const expected={connect:/Thonny is where you write/,firmware:/RP2350/,'library':/manual installation guide/,connection:/known USB data cable/,'missing-library':/Installing it only on the computer is not enough/};
 const imageCounts={connect:3,firmware:0,library:3,connection:1,'missing-library':0};
 for(const [topic,content]of Object.entries(expected)){
  await open(topic);assert.equal(await dialog.isVisible(),true);assert.match(await dialog.textContent(),content);
  assert.equal(await dialog.locator('.setup-figure').count(),imageCounts[topic]);
  if(topic==='connect'||topic==='connection'){
   assert.match(await dialog.textContent(),/bottom-right corner of the Thonny window/);
   assert.match(await dialog.textContent(),/Click the interpreter name there/);
   assert.match(await dialog.textContent(),/Run → Select interpreter/);
   assert.equal(await dialog.locator('img[src$="thonny-switch-interpreter.jpg"]').count(),1);
  }
  assert.equal(await dialog.getAttribute('aria-labelledby'),'setup-title');
  assert.equal(await page.locator('#setup-title').evaluate(el=>el===document.activeElement),true);
  // Native modal keeps keyboard navigation out of the background page.
  for(let n=0;n<12;n++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement===document.body||!!document.activeElement.closest('#setup-dialog')),true);}
  await page.keyboard.press('Escape');assert.equal(await dialog.isVisible(),false);
  assert.equal(await page.locator(`main [data-setup-help="${topic}"]`).evaluate(el=>el===document.activeElement),true);
  assert.equal(await saved(),before,'opening and closing help must not mutate progress');
 }
 await open('connect');
 const enlarged=page.waitForEvent('popup');await dialog.locator('.setup-figure a').first().click();
 const imagePage=await enlarged;await imagePage.waitForLoadState();
 assert.match(imagePage.url(),/assets\/setup\/pico-top-plug\.png$/);await imagePage.close();
 assert.equal(await dialog.isVisible(),true,'opening an image keeps the setup guide and place');
 await dialog.locator('[data-setup-help="firmware"]').click();
 assert.match(await dialog.textContent(),/Protect existing work/);assert.match(await dialog.textContent(),/stop and ask your club leader/);
 await dialog.getByRole('button',{name:'Back to Get ready',exact:true}).click();
 assert.equal(await page.locator('main [data-setup-help="connect"]').evaluate(el=>el===document.activeElement),true,'nested help returns to original opener');
 await open('library');assert.equal(await dialog.locator('pre code').textContent(),setupTest);
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedSetup=text;}}}));
 await dialog.locator('[data-action="copy-setup"]').click();await page.waitForFunction(()=>document.querySelector('#setup-status').textContent.startsWith('Copied.'));
 assert.equal(await page.evaluate(()=>window.copiedSetup),setupTest);
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined}));
 await dialog.locator('[data-action="copy-setup"]').click();assert.match(await page.locator('#setup-status').textContent(),/Clipboard unavailable/);
 const downloaded=page.waitForEvent('download');await dialog.locator('[data-action="download-setup"]').click();
 const file=await downloaded;assert.equal(file.suggestedFilename(),'check_pico.py');assert.equal(await readFile(await file.path(),'utf8'),setupTest);
 await dialog.getByRole('button',{name:'Close setup help',exact:true}).click();
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:900});
  for(const topic of Object.keys(expected)){
   await open(topic);await checkTextContrast(page);
   for(const image of await dialog.locator('.setup-figure img').all()){
    await image.scrollIntoViewIfNeeded();await image.evaluate(img=>img.decode());
    const rendered=await image.evaluate(img=>{const box=img.getBoundingClientRect(),style=getComputedStyle(img);return{width:box.width-parseFloat(style.borderLeftWidth)-parseFloat(style.borderRightWidth),height:box.height-parseFloat(style.borderTopWidth)-parseFloat(style.borderBottomWidth),naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,alt:img.alt,link:img.closest('a').getAttribute('href'),src:img.getAttribute('src')};});
    assert.ok(rendered.naturalWidth>0&&rendered.alt.length>20,'setup image loads and has meaningful alt text');
    assert.ok(Math.abs(rendered.width/rendered.height-rendered.naturalWidth/rendered.naturalHeight)<.03,'image is not distorted');
    assert.equal(rendered.link,rendered.src,'full-size link opens the original image');
   }
   const box=await dialog.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1);
   assert.equal(await dialog.evaluate(el=>el.scrollWidth>el.clientWidth+1),false,`${topic} overflows at ${width}`);
   await dialog.evaluate(el=>{el.scrollTop=el.scrollHeight;});
   const closeBox=await dialog.getByRole('button',{name:'Close setup help',exact:true}).boundingBox();assert.ok(closeBox.y>=0&&closeBox.y+closeBox.height<=900,'close stays reachable');
   await dialog.getByRole('button',{name:'Close setup help',exact:true}).click();
   if(width===1440&&topic==='firmware'||[1440,390,320].includes(width)&&['connect','connection','library'].includes(topic)){
    await open(topic);assert.ok(await dialog.evaluate(el=>el.scrollTop<5),'reopening starts at the top');
    const figure=topic==='library'?dialog.locator('.setup-figure').first():dialog.locator('.setup-figure').last();
    if(await figure.count())await figure.scrollIntoViewIfNeeded();
    await page.screenshot({path:`outputs/setup-${width}-${topic}.png`});await page.keyboard.press('Escape');
   }
  }
 }
 assert.equal(await saved(),before);await page.reload();assert.equal(await page.locator('[data-key="editor"]').isChecked(),true);assert.equal(await dialog.isVisible(),false);
 await page.locator('[data-platform="pi"]').click();assert.equal(await page.locator('main [data-setup-help]').count(),0);assert.match(await page.locator('main').textContent(),/gpiozero/);
 assert.deepEqual(errors,[]);
 console.log('PASS: five Pico setup popups, bottom-right interpreter guidance, six source images with alt text and full-size links, keyboard/focus/close, nested guides, copy fallback and download, unchanged progress, reload, 20 responsive dialog checks and Pi isolation.');
}finally{await browser.close();}
