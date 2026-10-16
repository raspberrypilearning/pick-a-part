const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
import {piCatalogue,byIdFor} from '../catalogue.js';
import {freshProject} from '../core.js';
import {checkTextContrast} from './colour-contrast.mjs';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],badAssets=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/assets/')&&!r.ok())badAssets.push(r.url());});
const nav=id=>page.locator(`.navlist [data-action="nav-${id}"]`).click();
const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('toy-workshop-v1')));
const load=async p=>{await page.locator('#project-file').setInputFiles({name:'platform.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p))});await page.getByRole('button',{name:'Open saved project',exact:true}).click();};
const pick=async id=>{if(!await page.locator(`[data-pick="${id}"]`).isVisible())await page.locator(`[data-more="${byIdFor('pi')[id].kind}"] > summary`).click();await page.locator(`[data-pick="${id}"]`).click();};
try{
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:4173');await page.locator('h1').waitFor();
 assert.equal(await page.locator('[data-platform="pico"]').getAttribute('aria-pressed'),'true');
 await nav('idea');await page.locator('#idea-when').fill('press a button');await page.locator('#idea-will').fill('drive my rover');await page.locator('#idea-looks').fill('A box with a camera');
 await nav('parts');await page.locator('[data-pick="button"]').click();
 await page.locator('[data-platform="pi"]').focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('[data-platform="pi"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-platform="pi"]').evaluate(e=>e===document.activeElement),true);
 assert.deepEqual((await saved()).selected,[]);assert.equal(await page.locator('[data-pick]').count(),23);
 assert.equal(await page.locator('.more-parts[open]').count(),0);assert.equal(await page.locator('.featured-parts [data-pick="robot"]').count(),1);assert.equal(await page.locator('.featured-parts [data-pick="picamera"]').count(),1);
 await page.locator('[data-action="suggest-parts"]').click();assert.deepEqual((await saved()).selected,['picamera','robot','button']);
 await page.screenshot({path:'outputs/pi-parts.png',fullPage:true});
 for(const c of piCatalogue){
  if(!await page.locator(`[data-card="${c.id}"] [data-brick]`).isVisible())await page.locator(`[data-more="${c.kind}"] > summary`).click();
  await page.locator(`[data-card="${c.id}"] [data-brick]`).click();await page.locator('.wiring-image').evaluate(img=>img.decode());
  assert.match(await page.locator('.wiring-image').getAttribute('src'),/wiring\/pi\//);assert.equal(await page.locator(`#brick-dialog a[href$="/${c.id}-pi.html"]`).count()>=1,true);
  assert.doesNotMatch(await page.locator('#brick-dialog pre').textContent(),/picozero|from machine|MicroPython/);
  if(c.pins.length){await page.locator('.pin-guide summary').click();for(const pin of c.pins)assert.equal(await page.locator('.pin-used text').filter({hasText:new RegExp(` · GPIO${pin}$`)}).count(),1);}
  if(c.id==='button')assert.match(await page.locator('.contact-guide').textContent(),/GPIO24 \(physical pin 18\)/);
  await page.locator('[data-action="close-brick"]').click();
 }
 await nav('ready');assert.match(await page.locator('main').textContent(),/Picamera2/);assert.match(await page.locator('.setup-code').textContent(),/import gpiozero/);assert.doesNotMatch(await page.locator('.setup-code').textContent(),/pico_led/);
 await nav('make');await page.locator('[data-make-tab="code"]').click();await page.locator('[data-code-mode="generated"]').click();assert.equal(await page.locator('#rule-input option[value="picamera"]').count(),0);assert.match(await page.locator('main').textContent(),/code your own/);
 await page.getByRole('button',{name:'Add to my code',exact:true}).click();const generated=await page.locator('#code-editor').inputValue();assert.match(generated,/Button\(24\)/);assert.match(generated,/robot.forward/);
 await page.locator('#code-editor').fill(generated+'\n# Keep my Pi changes\n');
 const piDraft=await saved();await page.locator('[data-platform="pico"]').click();assert.deepEqual((await saved()).selected,['button']);assert.equal((await saved()).code,'');
 await page.locator('[data-platform="pi"]').click();assert.equal((await saved()).code,piDraft.code);
 await page.reload();assert.equal(await page.locator('[data-platform="pi"]').getAttribute('aria-pressed'),'true');assert.equal((await saved()).code,piDraft.code);
 await load(await saved());assert.equal((await saved()).code,piDraft.code);assert.deepEqual((await saved()).drafts.pico.selected,['button']);
 // Every composer-supported Pi brick reaches code, preview and physical-making help.
 for(const c of piCatalogue.filter(c=>!c.manualOnly)){
  const p=freshProject('pi');p.selected=c.kind==='detect'?[c.id,'led']:['button',c.id];p.page='make';await load(p);await page.locator('[data-make-tab="code"]').click();await page.locator('[data-code-mode="generated"]').click();await page.getByRole('button',{name:'Add to my code',exact:true}).click();
  assert.ok((await page.locator('#code-editor').inputValue()).length>100);
  if(c.analogue)await page.locator('#preview-value').fill(String(c.range?.max||1));else await page.locator('#preview-press').click();
  assert.doesNotMatch(await page.locator('main').textContent(),/undefined|NaN|\$\{board/);
  await nav('play');assert.match(await page.locator('.assembly-guide').textContent(),/Mount the Pi beside/);
 }
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:900});
  for(const route of ['journey','idea','parts','ready','make','play','finish']){
   await nav(route);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,route+' '+width);await checkTextContrast(page);
  }
  await nav('parts');for(const kind of ['detect','do']){const d=page.locator(`[data-more="${kind}"]`);if(!await d.evaluate(e=>e.open))await d.locator('summary').click();}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'expanded '+width);
  if(width===390){await page.locator('.board-choice').scrollIntoViewIfNeeded();await page.screenshot({path:'outputs/pi-mobile.png'});}
 }
 assert.deepEqual(errors,[]);assert.deepEqual(badAssets,[]);
 console.log('PASS: Pi/Pico keyboard toggle, 23 Pi bricks and all diagrams, hints/collapses, camera extension, 22 composer parts, setup, separate saved drafts, reload/import, 28 responsive routes and contrast.');
}finally{await browser.close();}
