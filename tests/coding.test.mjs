import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogueFor,testCode} from '../catalogue.js';
import {freshProject,chooseCodingMode,codingMode,currentCode,interactionReady,canTestInteraction,breadboardReady,readyToFinish,validateProject,generateCode,switchPlatform} from '../core.js';
import {codingChoice,manualWorkbench} from '../coding.js';
const base=platform=>{const p=freshProject(platform);p.selected=['button','led','potentiometer'];p.tested={button:true,led:true};return p;};
test('new builds offer an explicit choice; existing generated projects retain their route',()=>{
 const p=base();assert.equal(codingMode(p),'');assert.equal((codingChoice(p).match(/aria-pressed="false"/g)||[]).length,2);
 const old={...p,rules:[{id:1,input:'button',outputs:['led'],mode:'hold',threshold:.5}]};delete old.codeMode;delete old.manual;
 old.code=old.generated=generateCode(old);old.breadboard.happy=true;
 const restored=validateProject(old);assert.equal(codingMode(restored),'generated');assert.equal(restored.code,old.code);assert.equal(restored.breadboard.happy,true);
 assert.throws(()=>validateProject({...p,codeMode:'invented'}),/Unknown coding choice/);
});
for(const platform of ['pico','pi']){
 test(`${platform}: self-written code can reach completion without generator rules`,()=>{
  let p=chooseCodingMode(base(platform),'manual');assert.deepEqual(p.manual.parts,p.selected);assert.equal(p.manual.code,'');assert.equal(canTestInteraction(p),false);
  p.manual.parts=['button','led'];p.manual.code='# My own program';assert.equal(canTestInteraction(p),true);assert.equal(p.rules.length,0);
  Object.assign(p.idea,{when:'Press',will:'Glow',person:'Laugh',looks:'Box',play:'Press nose'});p.breadboard.happy=true;p.build={body:'Box',access:true,secure:true,retest:true};p.play={worked:true,observed:'Pressed twice',next:'Keep it'};
  assert.equal(readyToFinish(p),true);p.completed=true;assert.equal(validateProject(JSON.parse(JSON.stringify(p))).completed,true);
 });
 test(`${platform}: external work needs explicit confirmation and real part test records`,()=>{
  const p=chooseCodingMode(base(platform),'manual');p.manual.parts=['button','led'];assert.equal(canTestInteraction(p),false);p.manual.external=true;assert.equal(canTestInteraction(p),true);
  p.tested.led=false;assert.equal(canTestInteraction(p),false);p.tested.led=true;p.manual.parts=['button'];assert.equal(canTestInteraction(p),false);
  p.manual.parts=['button','led'];p.selected=['button'];assert.equal(interactionReady(p),false);assert.equal(canTestInteraction(p),false);
 });
 test(`${platform}: mode changes preserve both scripts and require a new combined test`,()=>{
  let p=chooseCodingMode(base(platform),'manual');p.manual.parts=['button','led'];p.manual.code='# Mine';p.code='# Generated edits';p.backup='# Backup';p.breadboard.happy=true;p.build.retest=true;p.play.worked=true;p.completed=true;
  p=chooseCodingMode(p,'generated');assert.equal(currentCode(p),'# Generated edits');assert.equal(p.manual.code,'# Mine');assert.equal(p.backup,'# Backup');assert.equal(p.breadboard.happy,false);assert.equal(p.build.retest,false);assert.equal(p.play.worked,false);assert.equal(p.completed,false);
  p=chooseCodingMode(p,'manual');assert.equal(currentCode(p),'# Mine');assert.deepEqual(p.manual.parts,['button','led']);assert.equal(breadboardReady(p),false);
  p.breadboard.happy=true;assert.equal(chooseCodingMode(p,'manual').breadboard.happy,true,'reselecting the current mode is not a change');
  const restored=validateProject(JSON.parse(JSON.stringify(p)));assert.equal(restored.manual.code,'# Mine');assert.deepEqual(restored.manual.parts,['button','led']);assert.equal(restored.code,'# Generated edits');
 });
 test(`${platform}: every component offers its exact existing board-specific script`,()=>{
  const p=chooseCodingMode(base(platform),'manual');p.selected=catalogueFor(platform).map(c=>c.id);const html=manualWorkbench(p,'checkpoint');
  for(const c of catalogueFor(platform)){assert.ok(html.includes(`data-copy-test="${c.id}"`));assert.ok(html.includes(`data-download-test="${c.id}"`));assert.ok(html.includes(testCode(c.id,platform).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')));}
  assert.ok(!html.includes('id="rule-form"'));assert.ok(!html.includes('id="preview-state"'));
 });
}
test('both board drafts retain their chosen coding approach and bounded manual data',()=>{
 let p=chooseCodingMode(base('pico'),'manual');p.manual.code='# Pico';p.manual.parts=['button','led'];p=switchPlatform(p,'pi');assert.equal(codingMode(p),'');
 p=chooseCodingMode(p,'generated');p=switchPlatform(validateProject(p),'pico');assert.equal(codingMode(p),'manual');assert.equal(p.manual.code,'# Pico');
 const restored=validateProject({...p,manual:{code:'x'.repeat(100010),parts:['button','led','led','unknown','toString'],external:'yes'}});assert.equal(restored.manual.code.length,100000);assert.deepEqual(restored.manual.parts,['button','led']);assert.equal(restored.manual.external,false);
});
