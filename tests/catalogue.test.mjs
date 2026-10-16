const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {catalogue,byId,rangeFor} from '../catalogue.js';
import {freshProject,generateCode} from '../core.js';
import {checkTextContrast} from './colour-contrast.mjs';
await mkdir('outputs',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[],badImages=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.url().includes('/assets/')&&!r.ok())badImages.push(r.url());});
const nav=id=>page.locator(`.navlist [data-action="nav-${id}"]`).click();
const click=id=>page.locator(`[data-action="${id}"]`).first().click();
const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('toy-workshop-v1')));
const pick=async id=>{if(!await page.locator(`[data-pick="${id}"]`).isVisible())await page.locator(`[data-more="${byId[id].kind}"] > summary`).click();await page.locator(`[data-pick="${id}"]`).click();};
const load=async p=>{await page.locator('#project-file').setInputFiles({name:'catalogue-test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p))});await page.getByRole('button',{name:'Open saved project',exact:true}).click();};
try{
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:4173');await page.locator('h1').waitFor();
 await nav('idea');
 for(const [key,value]of Object.entries({when:'tilts the box',will:'glow in rainbow colours',person:'try different angles',looks:'A cardboard box',play:'Tilt it to change colour.'}))await page.locator(`#idea-${key}`).fill(value);
 await page.getByRole('button',{name:'Review my idea'}).click();await click('review-next');
 assert.equal(await page.locator('[data-pick]').count(),21);
 assert.deepEqual(await page.locator('.featured-parts [data-pick]').evaluateAll(nodes=>nodes.map(n=>n.dataset.pick)),['tilt-switch','rgb-led']);
 assert.equal(await page.locator('.more-parts[open]').count(),0);
 assert.match(await page.locator('[data-card="tilt-switch"] .match-reason').textContent(),/tilts/);
 assert.deepEqual((await saved()).selected,[]);
 await page.screenshot({path:'outputs/catalogue-suggestions.png',fullPage:true});
 await click('suggest-parts');assert.deepEqual((await saved()).selected,['tilt-switch','rgb-led']);
 await page.locator('[data-more="detect"] > summary').focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('[data-more="detect"]').getAttribute('open'),'');
 await pick('distance');assert.equal(await page.locator('.featured-parts [data-pick="distance"]').count(),1);
 assert.equal(await page.locator('[data-more="detect"]').getAttribute('open'),'','adding a part keeps the expanded list open');
 assert.equal(await page.locator('[data-pick="distance"]').evaluate(el=>el===document.activeElement),true);
 await page.locator('[data-view="component"]').click();assert.match(await page.locator('[data-pick="distance"] h3').textContent(),/Distance sensor/);
 await page.screenshot({path:'outputs/catalogue-expanded.png',fullPage:true});
 // Every Pico brick has working help, an original reference and the right highlighted pins.
 for(const c of catalogue){
  if(!await page.locator(`[data-brick="${c.id}"]`).first().isVisible())await page.locator(`[data-more="${c.kind}"] > summary`).click();
  await page.locator(`[data-card="${c.id}"] [data-brick]`).click();
  await page.locator('.wiring-image').evaluate(img=>img.decode());
  assert.match(await page.locator('#brick-dialog pre').textContent(),new RegExp(c.variable));
  await page.locator('.pin-guide summary').click();
  for(const pin of c.pins)assert.equal(await page.locator('.pin-used text').filter({hasText:new RegExp(` · GP${pin}$`)}).count(),1);
  assert.match(await page.locator('#brick-dialog a').filter({hasText:'original Pico'}).getAttribute('href'),new RegExp(`${c.id}-pico.html$`));
  await click('close-brick');
 }
 assert.equal(await page.locator('.other-platforms').count(),0);
 assert.equal(await page.locator('[data-platform="pi"]').count(),1,'Pi bricks now have their own board choice');
 // Adding another sounder asks; cancelling preserves the project, swapping pauses old rules.
 const p=freshProject();p.selected=['button','passive-buzzer'];p.page='parts';p.rules=[{id:1,input:'button',outputs:['passive-buzzer'],mode:'hold',threshold:.5,direction:'above'}];p.generated=generateCode(p);p.code=p.generated+'\n# Keep my edits\n';p.tested['passive-buzzer']=true;
 await load(p);await pick('speaker');assert.match(await page.locator('#confirm-dialog').textContent(),/shares Pico pins/);
 await click('close-confirm');assert.deepEqual((await saved()).selected,p.selected);
 await pick('speaker');await page.getByRole('button',{name:'Swap parts',exact:true}).click();
 let state=await saved();assert.deepEqual(state.selected,['button','speaker']);assert.equal(state.rules.length,1);assert.match(state.code,/# Keep my edits/);assert.equal(state.tested['passive-buzzer'],false);
 await nav('make');await page.locator('[data-make-tab="code"]').click();assert.equal(await page.locator('.rule-card.suspended').count(),1);
 // Run each new part through selection -> code -> preview -> physical-making help.
 for(const c of catalogue.filter(c=>!['button','potentiometer','capacitive-touch','ldr','led','passive-buzzer','servo'].includes(c.id))){
  const fixture=freshProject();fixture.selected=c.kind==='detect'?[c.id,'led']:['button',c.id];fixture.page='make';await load(fixture);await page.locator('[data-make-tab="code"]').click();
  if(c.range){assert.equal(await page.locator('#rule-threshold').inputValue(),'25');assert.match(await page.locator('[for="rule-threshold"]').textContent(),/°C/);}
  await page.getByRole('button',{name:'Add to my code',exact:true}).click();
  assert.match(await page.locator('#code-editor').inputValue(),new RegExp(c.variable));
  if(c.analogue)await page.locator('#preview-value').fill(String(rangeFor(c.id).max));else await page.locator('#preview-press').click();
  assert.doesNotMatch(await page.locator('.preview').textContent(),/undefined|NaN/);
  await nav('play');assert.match(await page.locator('.assembly-guide').textContent(),new RegExp(c.name.toLowerCase().replace(/[()]/g,'\\$&')));
 }
 // Chosen extras stay visible after the idea changes and after save/import.
 await nav('parts');assert.equal(await page.locator('.featured-parts [data-pick="stepper"]').count(),1);
 await nav('idea');await page.locator('#idea-will').fill('light up');await nav('parts');assert.equal(await page.locator('.featured-parts [data-pick="stepper"]').count(),1);
 const keep=await saved();await load(keep);assert.equal(await page.locator('.featured-parts [data-pick="stepper"]').count(),1);
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:900});
  for(const group of ['detect','do']){
   const details=page.locator(`[data-more="${group}"]`);if(!await details.evaluate(el=>el.open))await details.locator('summary').click();
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`Expanded catalogue overflows ${width}px`);
  await checkTextContrast(page);
  if(width===390){await page.locator('[data-strand="do"]').scrollIntoViewIfNeeded();await page.screenshot({path:'outputs/catalogue-mobile.png'});}
 }
 assert.deepEqual(errors,[]);assert.deepEqual(badImages,[]);
 console.log('PASS: 21 selectable Pico bricks; Pi selector; matching and collapsed extras; keyboard and focus; all wiring/help; explicit pin swaps; new-part code/preview/build; save/import; mobile and contrast.');
}finally{await browser.close();}
