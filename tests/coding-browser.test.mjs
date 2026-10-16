const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {freshProject} from '../core.js';
import {testCode} from '../catalogue.js';
import {checkTextContrast} from './colour-contrast.mjs';
await mkdir('outputs',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const nav=id=>page.locator(`.navlist [data-action="nav-${id}"]`).click();
const tab=()=>page.locator('[data-make-tab="code"]').click();
const mode=id=>page.locator(`[data-code-mode="${id}"]`).click();
const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('toy-workshop-v1')));
const load=async p=>{await page.locator('#project-file').setInputFiles({name:'coding.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p))});await page.getByRole('button',{name:'Open saved project',exact:true}).click();};
const download=async locator=>{const waiting=page.waitForEvent('download');await locator.click();const file=await waiting;return {name:file.suggestedFilename(),text:await readFile(await file.path(),'utf8')};};
try{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.copiedCode=value;}}}));
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:4173');await page.locator('h1').waitFor();
 for(const platform of ['pico','pi']){
  await page.setViewportSize({width:1440,height:1000});
  const p=freshProject(platform);p.page='make';p.selected=['button','led','potentiometer'];p.tested={button:true,led:true};Object.assign(p.idea,{when:'press a button',will:'light up',person:'laugh',looks:'A box',play:'Press its nose'});
  await load(p);await tab();
  assert.equal(await page.locator('[data-code-mode][aria-pressed="true"]').count(),0);assert.equal(await page.locator('#rule-form, #code-editor, #manual-code-editor').count(),0);
  await page.screenshot({path:`outputs/coding-${platform}-choice.png`});
  await page.locator('[data-code-mode="manual"]').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('[data-code-mode="manual"]').evaluate(el=>el===document.activeElement),true);
  assert.equal(await page.locator('.manual-component').count(),3);assert.equal(await page.locator('#rule-form, #preview-state, #code-editor').count(),0);
  assert.equal(await page.locator('#manual-code-editor').inputValue(),'');assert.equal(await page.locator('#breadboard-happy').isEnabled(),false);
  const buttonCard=page.locator('.manual-component').filter({has:page.locator('[data-copy-test="button"]')});
  assert.equal(await buttonCard.locator('pre code').textContent(),testCode('button',platform));
  await buttonCard.screenshot({path:`outputs/coding-${platform}-component.png`});
  await buttonCard.locator('[data-copy-test]').click();assert.equal(await page.evaluate(()=>window.copiedCode),testCode('button',platform));
  const componentDownload=await download(buttonCard.locator('[data-download-test]'));assert.equal(componentDownload.name,'test_button.py');assert.equal(componentDownload.text,testCode('button',platform));
  await page.locator('[data-manual-part="potentiometer"]').uncheck();
  const own=`from ${platform==='pi'?'gpiozero':'picozero'} import Button, LED\nfrom time import sleep\n\nbutton = Button(${platform==='pi'?24:10})\nled = LED(${platform==='pi'?26:11})\n\ntry:\n    while True:\n        led.value = button.is_pressed\n        sleep(0.02)\nfinally:\n    led.off()\n# <my own toy>\n`;
  await page.locator('#manual-code-editor').fill(own);assert.equal(await page.locator('#breadboard-happy').isEnabled(),true,'unused untested pot does not block manual coding');
  await page.locator('#breadboard-happy').check();assert.equal((await saved()).rules.length,0);
  await mode('generated');assert.equal((await saved()).breadboard.happy,false);await page.getByRole('button',{name:'Add to my code',exact:true}).click();
  const combined=await page.locator('#code-editor').inputValue();assert.match(combined,/button.is_pressed/);assert.match(combined,/led.value/);
  await page.locator('#code-editor').fill(combined+'\n# My generated-script edit\n');
  await mode('manual');assert.equal(await page.locator('#manual-code-editor').inputValue(),own);assert.equal(await page.locator('[data-manual-part="potentiometer"]').isChecked(),false);assert.equal(await page.locator('#preview-state').count(),0);
  const ownDownload=await download(page.locator('.manual-program [data-action="download-code"]'));assert.equal(ownDownload.name,'my_toy.py');assert.equal(ownDownload.text,own);
  await nav('parts');await page.locator('[data-pick="led"]').click();await nav('make');await tab();assert.equal(await page.locator('#manual-code-editor').inputValue(),own);assert.equal(await page.locator('#breadboard-happy').isEnabled(),false);assert.match(await page.locator('.manual-scripts .warning').textContent(),/LED — not in your current kit/);
  await nav('parts');await page.locator('[data-pick="led"]').click();await nav('make');await tab();assert.equal(await page.locator('#breadboard-happy').isEnabled(),true);
  const copy=await download(page.locator('.header-actions [data-action="export"]'));const exported=JSON.parse(copy.text);assert.equal(exported.codeMode,'manual');assert.equal(exported.manual.code,own);assert.match(exported.code,/My generated-script edit/);
  await load(exported);await tab();assert.equal(await page.locator('#manual-code-editor').inputValue(),own);await mode('generated');assert.match(await page.locator('#code-editor').inputValue(),/My generated-script edit/);await mode('manual');
  for(const width of [1440,768,390,320]){
   await page.setViewportSize({width,height:1000});await checkTextContrast(page);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'manual '+platform+' '+width);
   if(width===1440||width===390){await page.locator('.coding-choice').scrollIntoViewIfNeeded();await page.screenshot({path:`outputs/coding-${platform}-manual-${width}.png`});}
   await mode('generated');await checkTextContrast(page);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'generated '+platform+' '+width);await mode('manual');
  }
  // A learner coding entirely in Thonny can finish without creating any generated rule.
  await page.setViewportSize({width:1440,height:1000});await load(p);await tab();await mode('manual');await page.locator('[data-manual-part="potentiometer"]').uncheck();
  await page.locator('#manual-external').check();assert.equal(await page.locator('#manual-code-editor').inputValue(),'');assert.equal(await page.locator('#breadboard-happy').isEnabled(),true);await page.locator('#breadboard-happy').check();
  await page.reload();await tab();assert.equal(await page.locator('#manual-external').isChecked(),true);assert.equal(await page.locator('#breadboard-happy').isChecked(),true);assert.equal((await saved()).rules.length,0);
  await nav('play');assert.equal(await page.locator('.callout.warning').count(),0);await page.locator('#build-body').fill('Cardboard box');
  for(const key of ['access','secure','retest'])await page.locator(`[data-section="build"][data-key="${key}"]`).check();
  await page.locator('#play-observed').fill('Pressed the nose again');await page.locator('#play-next').fill('Keep the light');await page.locator('[data-section="play"][data-key="worked"]').check();
  await nav('finish');assert.equal(await page.locator('[data-action="finish"]').isEnabled(),true);assert.equal(await page.locator('[data-action="download-code"]').isEnabled(),false);assert.match(await page.locator('main').textContent(),/Code kept only in Thonny needs a separate .py copy/);
  const finished=JSON.parse((await download(page.locator('[data-action="finish"]'))).text);assert.equal(finished.completed,true);assert.equal(finished.rules.length,0);assert.equal(finished.manual.external,true);
  await load(finished);assert.equal((await saved()).completed,true);
 }
 assert.deepEqual(errors,[]);console.log('PASS: explicit coding choice on both boards; exact component scripts/copy/download; own and generated edits kept; no rule or preview forced on manual path; missing/unused parts; save/import/reload; 16 responsive coding views; external Thonny route completes without generated rules.');
}finally{await browser.close();}
