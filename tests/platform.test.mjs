import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {catalogue,piCatalogue,byIdFor,testCode} from '../catalogue.js';
import {piPins} from '../pi-bricks.js';
import {freshProject,switchPlatform,validateProject,generateCode,modeOptions,suggestedParts,partChoices,materials,partsSharePins,selectionConflicts,canTestInteraction} from '../core.js';
const fixture=(input,output,mode)=>{const p=freshProject('pi');p.selected=[input,output];p.rules=[{id:1,input,outputs:[output],mode,threshold:input.startsWith('temperature-')?25:.5,direction:'above'}];return p;};
test('Pi has all 23 source bricks with separate code, wiring and physical pins',()=>{
 assert.equal(catalogue.length,21);assert.equal(piCatalogue.length,23);
 for(const c of piCatalogue){
  assert.equal(c.platform,'pi');assert.ok(c.wiring);assert.ok(c.test);assert.ok(c.safety);
  for(const pin of c.pins)assert.ok(c.connections.includes(piPins.indexOf('GPIO'+pin)+1),c.id);
  assert.doesNotMatch(testCode(c.id,'pi'),/picozero|from machine|ticks_ms|\.is_closed|\.is_open/);
  assert.doesNotMatch(c.wiring,/Pico|\bGP\d/);
 }
 assert.match(testCode('button','pi'),/Button\(24\)/);
 assert.match(testCode('button'),/Button\(10\)/);
 assert.ok(materials(fixture('button','robot','hold')).includes('2 × 100 nF ceramic capacitors'));
 assert.match(byIdFor('pi').robot.wiring,/pin 16 and GND/);
});
test('switching preserves two independent builds and shares only the idea/page',()=>{
 let p=freshProject();p.idea.when='press the nose';p.selected=['button','led'];p.rules=[{id:1,input:'button',outputs:['led'],mode:'hold',threshold:.5,direction:'above'}];p.code=p.generated=generateCode(p);p.code+='\n# my edits';p.backup='# older draft';p.tested.button=true;p.setup.editor=true;p.build.body='Foil nose';p.play.observed='Pressed it again';
 const original=validateProject(p);p=switchPlatform(p,'pi');assert.deepEqual(p.selected,[]);assert.equal(p.code,'');assert.deepEqual(p.tested,{});assert.equal(p.setup.editor,false);assert.equal(p.idea.when,original.idea.when);
 p.selected=['button','robot','picamera'];p.code='# Pi code';p.tested.robot=true;p.build.body='Pi rover';p.idea.will='drive forwards';
 p=validateProject(JSON.parse(JSON.stringify(p)));p=switchPlatform(p,'pico');
 for(const key of ['selected','rules','code','generated','backup','tested','setup','build','play'])assert.deepEqual(p[key],original[key],key);
 assert.equal(p.idea.will,'drive forwards');p=switchPlatform(p,'pi');assert.deepEqual(p.selected,['button','robot','picamera']);assert.equal(p.code,'# Pi code');assert.equal(p.tested.robot,true);
});
test('version 1 projects migrate to Pico without losing a valid breadboard check',()=>{
 const old=fixture('button','led','hold');delete old.platform;delete old.drafts;old.version=1;old.code=old.generated=generateCode(old);old.tested.button=old.tested.led=true;old.breadboard.happy=true;
 const migrated=validateProject(old);assert.equal(migrated.platform,'pico');assert.equal(migrated.version,2);assert.equal(migrated.breadboard.happy,true);assert.equal(migrated.code,old.code);
 assert.throws(()=>validateProject({...old,platform:'made-up'}),/Unknown board/);
 assert.throws(()=>validateProject({...freshProject(),drafts:{pi:{selected:[],rules:[{id:1}]}}}),/invalid interaction/);
});
test('Pi suggestions foreground camera and rover; the rest remains expandable',()=>{
 const p=freshProject('pi');p.idea.when='press a button';p.idea.will='drive a rover';p.idea.looks='A robot with a camera';
 assert.deepEqual(suggestedParts(p).map(h=>h.id),['picamera','robot','button']);
 assert.deepEqual(partChoices(p,'do').featured.map(c=>c.id),['robot']);assert.equal(partChoices(p,'do').more.length,9);
 const pico={...p,platform:'pico'};assert.ok(!suggestedParts(pico).some(h=>['picamera','robot'].includes(h.id)));
});
test('shared ADC is allowed, alternative drives/sounders/PIRs still conflict',()=>{
 assert.equal(partsSharePins('potentiometer','temperature-sensor','pi'),false);
 const groups=[['buzzer','passive-buzzer','speaker'],['pir','am312-pir'],['robot','stepper','motor-driver']];
 for(const a of piCatalogue)for(const b of piCatalogue)if(a!==b)assert.equal(partsSharePins(a.id,b.id,'pi'),groups.some(g=>g.includes(a.id)&&g.includes(b.id)),a.id+'/'+b.id);
 const p=fixture('button','robot','hold');p.selected.push('motor-driver');assert.equal(generateCode(p),'');assert.equal(canTestInteraction(p),false);assert.equal(selectionConflicts(p).length,1);assert.throws(()=>validateProject(p),/same Pi pins/);
 const adc=freshProject('pi');adc.selected=['potentiometer','temperature-sensor','ldr'];assert.equal(materials(adc).filter(m=>m.includes('MCP3008')).length,1);assert.ok(materials(adc).includes('1 µF capacitor'));assert.ok(!materials(adc).includes('10 kΩ resistor'));
});
test('camera is a selectable standalone extension, not a fabricated digital input',()=>{
 const p=freshProject('pi');p.selected=['picamera','led'];assert.ok(validateProject(p).selected.includes('picamera'));assert.deepEqual(modeOptions('picamera','pi'),[]);assert.match(testCode('picamera','pi'),/Picamera2/);
 p.rules=[{id:1,input:'picamera',outputs:['led'],mode:'hold',threshold:.5}];assert.throws(()=>validateProject(p),/invalid interactions/);
});
test('all 240 Pi rule combinations and 23 component tests parse as Python',()=>{
 const programs=[];
 for(const input of piCatalogue.filter(c=>c.kind==='detect'&&!c.manualOnly))for(const [mode]of modeOptions(input.id,'pi'))for(const output of piCatalogue.filter(c=>c.kind==='do'))programs.push(generateCode(fixture(input.id,output.id,mode)));
 for(const c of piCatalogue)programs.push(testCode(c.id,'pi'));
 assert.equal(programs.length,263);assert.ok(programs.every(Boolean));
 const result=spawnSync(process.env.PYTHON||'python3',['-c','import ast,json,sys\nfor source in json.load(sys.stdin): ast.parse(source)'],{input:JSON.stringify(programs),encoding:'utf8'});assert.equal(result.status,0,result.stderr);
});
test('Pi output APIs and ranges are not borrowed from picozero',()=>{
 for(const [id,yes,no]of [['led',/PWMLED\(26\)/,/LED\(11\)/],['servo',/servo.value = -0.3 \+ 0.6/,/servo.off\(/],['rgb-led',/rgb.color = \(0.3 \*/,/int\(80/],['passive-buzzer',/Tone\(frequency=int\(220/,/buzzer.freq/],['speaker',/speaker.stop\(/,/speaker.volume/],['motor-driver',/motor.stop\(/,/motor.off/],['robot',/robot.forward\(0.3 \*/,/robot.off/],['stepper',/step_motor\(/,/from gpiozero import Stepper/],['neopixels',/pixels.show\(/,/pixels.write/]]){
  const code=generateCode(fixture('potentiometer',id,'follow'));assert.match(code,yes);assert.doesNotMatch(code,no);
 }
});
