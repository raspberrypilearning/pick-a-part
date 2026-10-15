const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
import {mkdir,readFile,stat} from 'node:fs/promises';
import {checkTextContrast} from './colour-contrast.mjs';
import {catalogue} from '../catalogue.js';
await mkdir('outputs',{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1050},acceptDownloads:true});
const page=await context.newPage(),errors=[],failures=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/assets/')&&!r.ok())failures.push([r.url(),r.status()]);});
const nav=id=>page.locator(`.navlist [data-action="nav-${id}"]`).click();
const click=id=>page.locator(`[data-action="${id}"]`).first().click();
const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('toy-workshop-v1')));
try{
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:4173');await page.locator('h1').waitFor();
 assert.match(await page.locator('.save-reminder').textContent(),/shared or school computer/);
 assert.equal(await page.locator('.navlist .number').count(),0,'overview is not a numbered making step');
 assert.deepEqual(await page.locator('.journey-row h3').allTextContents(),await page.locator('.navlist button').allTextContents().then(a=>a.slice(1)));
 await nav('idea');
 for(const [key,value] of Object.entries({when:'spins the knob on its head',will:'make a noise that gets higher and higher',person:'try to make it scream lol',looks:'An angry little robot made from a cereal box.',play:'Turn the knob and see how high it screams.'}))await page.locator(`#idea-${key}`).fill(value);
 await page.getByRole('button',{name:'Review my idea'}).click();await click('review-next');
 assert.match(await page.locator('.suggestions').textContent(),/Potentiometer/);assert.match(await page.locator('.suggestions').textContent(),/Passive buzzer/);
 assert.deepEqual((await saved()).selected,[],'suggestions never silently choose parts');
 await click('suggest-parts');assert.deepEqual((await saved()).selected,['potentiometer','passive-buzzer']);
 assert.equal(await page.locator('.component-card .pin').filter({hasText:/GP\d/}).count(),0);
 await click('parts-next');assert.match(await page.locator('h1').textContent(),/Ready to try/);
 for(const key of ['editor','firmware','library'])await page.locator(`[data-section="setup"][data-key="${key}"]`).check();
 await page.reload();assert.equal(await page.locator('[data-key="library"]').isChecked(),true);
 assert.match(await page.locator('.setup-code').textContent(),/pico_led/);
 await page.screenshot({path:'outputs/feedback-get-ready.png',fullPage:true});
 await click('parts-workbench');
 for(const id of ['potentiometer','passive-buzzer']){
  await page.locator(`.part-row [data-brick="${id}"]`).click();
  if(id==='potentiometer'){
   await page.locator('.pin-guide summary').click();assert.match(await page.locator('.pin-guide').textContent(),/Pin 31/);
   assert.equal(await page.locator('.pin-guide .pin-used text').filter({hasText:'31 · GP26'}).count(),1);
   assert.deepEqual(await page.locator('.pin-guide .pin-used text').allTextContents(),['36 · 3V3 OUT','33 · AGND','31 · GP26']);
   assert.equal(await page.locator('.wiring-image').evaluate(img=>img.complete&&img.naturalWidth>0),true);
   await page.screenshot({path:'outputs/feedback-pin-guide.png',fullPage:true});
   await page.locator('.pin-guide svg').screenshot({path:'outputs/feedback-pico-pins.png'});
  }
  await page.locator(`[data-tested="${id}"]`).check();await click('close-brick');
 }
 await click('code-workbench');assert.equal(await page.locator('#rule-input').inputValue(),'potentiometer');assert.equal(await page.locator('#rule-mode').inputValue(),'follow');
 assert.equal(await page.locator('[data-draft-output="passive-buzzer"]').isChecked(),true);
 // A deliberate untick must survive rendering another control.
 await page.locator('[data-draft-output="passive-buzzer"]').uncheck();await page.locator('#rule-mode').selectOption('threshold');
 assert.equal(await page.locator('[data-draft-output="passive-buzzer"]').isChecked(),false);
 await page.locator('#rule-mode').selectOption('follow');await page.locator('[data-draft-output="passive-buzzer"]').check();
 await page.getByRole('button',{name:'Add to my code'}).click();
 assert.match(await page.locator('#sound-status').textContent(),/off until/);
 await page.locator('#preview-value').fill('0.5');assert.match(await page.locator('#preview-state').textContent(),/660 Hz/);
 await click('preview-sound');await page.waitForFunction(()=>document.querySelector('#sound-status').textContent.includes('Playing'));
 await page.locator('#preview-value').fill('1');assert.match(await page.locator('#preview-state').textContent(),/1100 Hz/);
 await click('mute-sound');assert.match(await page.locator('#sound-status').textContent(),/stopped/);
 await click('preview-sound');await page.waitForFunction(()=>document.querySelector('#sound-status').textContent.includes('finished'));
 await page.locator('.code-help summary').click();assert.match(await page.locator('.code-help').textContent(),/220–1100 Hz/);assert.match(await page.locator('.code-help').textContent(),/1760/);assert.doesNotMatch(await page.locator('.code-help').textContent(),/servo/i);
 assert.equal((await saved()).breadboard.happy,false,'audio does not claim a circuit test');
 assert.equal(await page.locator('#breadboard-next').isEnabled(),true);
 await page.locator('#breadboard-next').click();assert.match(await page.locator('.callout.warning').textContent(),/Prototype the interaction first/);
 assert.match(await page.locator('.assembly-guide').textContent(),/breadboard trimmer/);assert.match(await page.locator('.assembly-guide').textContent(),/shaft-sized hole/);assert.match(await page.locator('.assembly-guide').textContent(),/longer jumper lead/);
 await page.locator('#build-body').fill('A cereal box. Keep the board on a tray and make a hole above the knob.');
 assert.match(await page.locator('main').textContent(),/try to make it scream lol/);
 assert.doesNotMatch(await page.locator('#play-next').getAttribute('placeholder'),/button/);
 await page.screenshot({path:'outputs/feedback-build.png',fullPage:true});
 await click('troubleshoot');assert.match(await page.locator('.troubleshooting').textContent(),/jumper lead pulled out/);
 assert.equal((await saved()).tested.potentiometer,true,'opening help preserves the previous observation');
 await page.screenshot({path:'outputs/feedback-troubleshoot.png',fullPage:true});
 await page.locator('[data-retest="potentiometer"]').click();assert.equal(await page.locator('[data-tested="potentiometer"]').isChecked(),false);
 assert.equal((await saved()).breadboard.happy,false);assert.match((await saved()).build.body,/cereal box/);assert.match((await saved()).code,/buzzer.freq/);
 await click('close-brick');await nav('finish');assert.equal(await page.locator('[data-action="finish"]').isEnabled(),false,'unfinished hardware cannot be marked finished');
 assert.equal(await page.locator('#toy-name').inputValue(),'');assert.doesNotMatch(await page.locator('#toy-name').getAttribute('placeholder'),/creature/);
 const downloadPromise=page.waitForEvent('download');await page.locator('.save-reminder [data-action="export"]').click();const download=await downloadPromise;await download.saveAs('outputs/feedback-project.json');
 const exported=JSON.parse(await readFile('outputs/feedback-project.json','utf8'));assert.equal(exported.completed,false);assert.equal(exported.idea.person,'try to make it scream lol');
 await page.locator('#project-file').setInputFiles('outputs/feedback-project.json');await page.getByRole('button',{name:'Open saved project',exact:true}).click();assert.equal((await saved()).idea.person,exported.idea.person);
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:900});
  for(const id of ['journey','ready','play','make']){await nav(id);await checkTextContrast(page);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${id} overflows at ${width}`);if(width===390&&id==='ready')await page.screenshot({path:'outputs/feedback-ready-mobile.png',fullPage:true});}
 }
 let thumbs=0,all=0;for(const c of catalogue)for(const kind of ['components','wiring']){const size=(await stat(`assets/${kind}/${c.id}.webp`)).size;all+=size;if(kind==='components')thumbs+=size;}
 assert.ok(thumbs<200000,`Thumbnails too large: ${thumbs}`);assert.ok(all<1000000,`Runtime images too large: ${all}`);
 assert.deepEqual(failures,[]);assert.deepEqual(errors,[]);
 console.log(`PASS: cereal-box sound-toy journey; optional hints; setup; labelled pins; audio start/stop/timeout; tailored pitch help; no-kit exploration; fault finding; retest; save/import; responsive checks. Images: ${thumbs} bytes of thumbnails, ${all} bytes total.`);
}finally{await browser.close();}
