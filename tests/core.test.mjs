import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {catalogue,testCode,rangeFor} from '../catalogue.js';
import {freshProject,generateCode,validateProject,activeRules,materials,modeOptions,canTestInteraction,breadboardReady,readyToFinish,suggestedParts,suggestedDraft,previewResponse,partsSharePins,selectionConflicts,partChoices} from '../core.js';
import {picoPins,picoConnections,pages} from '../guidance.js';
import {SoundPreview} from '../sound.js';
const projectWith=(input,outputs,mode,extra={})=>{const p=freshProject();p.selected=[input,...outputs];p.rules=[{id:1,input,outputs,mode,threshold:.5,direction:'above',...extra}];return p;};
test('new projects open on the journey overview and saved pages are preserved',()=>{
 assert.equal(freshProject().page,'journey');
 for(const page of ['journey','idea','parts','ready','make','play','finish']){
  assert.equal(validateProject({...freshProject(),page}).page,page);
 }
 assert.equal(validateProject({...freshProject(),page:'unknown'}).page,'journey');
});
test('only source-approved alternatives share pins; independent PWM outputs have separate slices',()=>{
 assert.equal(catalogue.length,21);
 const groups=[['buzzer','passive-buzzer','speaker'],['pir','am312-pir'],['motor-driver','stepper']];
 for(const a of catalogue)for(const b of catalogue)if(a!==b)assert.equal(partsSharePins(a.id,b.id),groups.some(g=>g.includes(a.id)&&g.includes(b.id)),`${a.id} / ${b.id}`);
 const pwm=catalogue.filter(c=>['led','passive-buzzer','servo','rgb-led','speaker','motor-driver'].includes(c.id));
 for(const a of pwm)for(const b of pwm)if(a!==b&&!partsSharePins(a.id,b.id))assert.ok(!a.pins.some(pin=>b.pins.some(other=>Math.floor(pin/2)%8===Math.floor(other/2)%8)),`${a.id} / ${b.id} share a PWM slice`);
});
test('conflicting imported selections cannot generate code or imply readiness',()=>{
 for(const pair of [['pir','am312-pir'],['buzzer','speaker'],['passive-buzzer','speaker'],['motor-driver','stepper']]){
  const p=projectWith('button',['led'],'hold');p.selected.push(...pair);
  assert.equal(selectionConflicts(p).length,1);assert.equal(generateCode(p),'');assert.equal(canTestInteraction(p),false);assert.throws(()=>validateProject(p),/same Pico pins/);
 }
});
test('likely matches and selected extras stay foregrounded without changing the kit',()=>{
 const p=freshProject();p.idea.when='tilts the toy';p.idea.will='show rainbow colours';
 assert.deepEqual(suggestedParts(p).map(h=>h.id),['tilt-switch','rgb-led']);
 assert.deepEqual(partChoices(p,'detect').featured.map(c=>c.id),['tilt-switch']);
 assert.equal(partChoices(p,'detect').more.length,11);assert.deepEqual(p.selected,[]);
 p.selected.push('line-sensor');assert.deepEqual(partChoices(p,'detect').featured.map(c=>c.id),['line-sensor','tilt-switch']);
 p.idea.when='';p.idea.will='';assert.deepEqual(partChoices(p,'detect').featured.map(c=>c.id),['line-sensor']);
});
test('specific matches, secondary text and alternatives stay explainable',()=>{
 const p=freshProject();p.idea.when='HC-SR501 motion';p.idea.will='fixed beep';
 assert.deepEqual(suggestedParts(p).map(h=>h.id),['pir','buzzer']);
 p.idea.when='';p.idea.will='';p.idea.play='Tilt it to play a note';
 assert.deepEqual(suggestedParts(p).map(h=>h.id),['tilt-switch','speaker']);
 assert.ok(suggestedParts(p).every(h=>h.field==='play'));
 p.idea.play='';p.idea.will='spin in precise steps';assert.deepEqual(suggestedParts(p).map(h=>h.id),['stepper']);
});
test('setup migrates without inventing completion and round-trips observations',()=>{
 const p=freshProject();delete p.setup;assert.deepEqual(validateProject(p).setup,{editor:false,firmware:false,library:false});
 p.setup={editor:true,firmware:true,library:true};assert.deepEqual(validateProject(p).setup,p.setup);
});
test('idea hints stay optional and a sole available output is suggested once',()=>{
 const p=freshProject();p.idea.when='spins the knob';p.idea.will='make a noise that gets higher';
 assert.deepEqual(suggestedParts(p).map(h=>h.id),['potentiometer','passive-buzzer']);assert.deepEqual(p.selected,[]);
 p.selected=['potentiometer','passive-buzzer'];assert.deepEqual(suggestedDraft(p),{input:'potentiometer',outputs:['passive-buzzer'],mode:'follow',threshold:.5,direction:'above'});
 p.rules=[{id:1,input:'potentiometer',outputs:['passive-buzzer'],mode:'follow',threshold:.5,direction:'above'}];assert.deepEqual(suggestedDraft(p).outputs,[]);
});
test('pin reference uses GPIO names and the shared journey has no extra numbered overview',()=>{
 assert.equal(picoPins.length,40);for(const c of catalogue)assert.equal(picoPins[c.physical-1],`GP${c.pin}`);
 assert.equal(picoPins[32],'AGND');assert.equal(picoPins[35],'3V3 OUT');assert.equal(picoPins[39],'VBUS');
 assert.deepEqual(picoConnections.potentiometer,[31,33,36],'component leg numbers must not be mistaken for Pico pins');
 for(const c of catalogue){assert.ok(picoConnections[c.id].includes(c.physical));assert.ok(picoConnections[c.id].every(n=>n>=1&&n<=40));}
 assert.deepEqual(pages.map(([id])=>id),['journey','idea','parts','ready','make','play','finish']);
});
test('sound preview pitches match the starter and rest below its minimum',()=>{
 const r={input:'potentiometer',outputs:['passive-buzzer'],mode:'follow'};
 assert.equal(previewResponse(r,0).frequency,0);assert.equal(previewResponse(r,.5).frequency,660);assert.equal(previewResponse(r,1).frequency,1100);
 assert.equal(previewResponse({...r,mode:'toggle'},0,true).frequency,2000);
 assert.equal(previewResponse({...r,outputs:['led']},1).frequency,0);
});
test('audio starts only on request, stays quiet, and stops or handles unavailable audio',async()=>{
 const calls=[];let contexts=0;
 class Context {constructor(){contexts++;this.currentTime=0;this.destination={};}resume(){return Promise.resolve();}createOscillator(){return{frequency:{value:0,setTargetAtTime:v=>calls.push(['pitch',v])},connect(){},start(){calls.push('start');},stop(){calls.push('stop');},disconnect(){}};}createGain(){const gain={gain:{value:0},connect(){calls.push(['gain',gain.gain.value]);},disconnect(){}};return gain;}}
 const sound=new SoundPreview(t=>calls.push(t),Context);assert.equal(contexts,0);await sound.play(0);assert.equal(contexts,0);
 await sound.play(660);assert.equal(contexts,1);assert.ok(calls.some(c=>Array.isArray(c)&&c[0]==='gain'&&c[1]===.015));
 sound.tune(1100);assert.ok(calls.some(c=>Array.isArray(c)&&c[0]==='pitch'&&c[1]===1100));sound.stop();assert.equal(sound.voice,null);assert.ok(calls.includes('stop'));
 const missing=new SoundPreview(t=>calls.push(t),null);await missing.play(660);assert.match(calls.at(-1),/unavailable/);
});
test('leaving while the audio context resumes cannot start a late sound',async()=>{
 let resume;let started=false;class Context{resume(){return new Promise(resolve=>resume=resolve);}createOscillator(){started=true;throw Error('Must not start');}}
 const sound=new SoundPreview(()=>{},Context),pending=sound.play(660);sound.stop();resume();await pending;assert.equal(started,false);
});
test('materials include shared supplies once and servo-specific power',()=>{
 const p=freshProject();p.selected=catalogue.map(c=>c.id);const items=materials(p);assert.equal(new Set(items).size,items.length);assert.ok(items.includes('4 × AA NiMH cells + holder'));
});
test('unused parts never appear in generated code',()=>{
 const p=projectWith('button',['led'],'hold');p.selected.push('potentiometer','servo');const code=generateCode(p);assert.match(code,/Button\(10\)/);assert.match(code,/LED\(11\)/);assert.doesNotMatch(code,/Pot\(|Servo\(/);
});
test('removing a component suspends its rule without deleting it',()=>{
 const p=projectWith('button',['led','passive-buzzer'],'toggle');p.selected=p.selected.filter(x=>x!=='led');assert.equal(activeRules(p).length,0);assert.equal(p.rules.length,1);assert.equal(generateCode(p),'');p.selected.push('led');assert.equal(activeRules(p).length,1);
});
test('combined rules deduplicate imports and component setup',()=>{
 const p=projectWith('button',['led'],'hold');p.selected.push('passive-buzzer');p.rules.push({id:2,input:'button',outputs:['passive-buzzer'],mode:'toggle',threshold:.5,direction:'above'});const code=generateCode(p);assert.equal((code.match(/button = Button/g)||[]).length,1);assert.match(code,/buzzer = PWMBuzzer\(9/);assert.match(code,/state_2/);
});
test('project round-trip preserves code, tests, descriptions and rules',()=>{
 const p=projectWith('potentiometer',['led'],'follow');p.idea.when='<script>not executable</script>';p.tested.led=true;p.code='my edited code';const saved=validateProject(JSON.parse(JSON.stringify(p)));assert.equal(saved.idea.when,p.idea.when);assert.equal(saved.code,p.code);assert.equal(saved.tested.led,true);assert.deepEqual(saved.rules,p.rules);
});
test('invalid imports and conflicting outputs are rejected',()=>{
 assert.throws(()=>validateProject({version:4}));const p=projectWith('button',['led'],'hold');p.rules.push({...p.rules[0],id:2});assert.throws(()=>validateProject(p),/conflicting/);p.rules=[{...p.rules[0],input:'bad'}];assert.throws(()=>validateProject(p));
});
test('finishing needs concept, real testing and play observations',()=>{
 const p=projectWith('button',['led'],'hold');assert.equal(Boolean(readyToFinish(p)),false);Object.assign(p.idea,{when:'Press',will:'Glow',person:'Laugh',looks:'Box',play:'Press nose'});p.code=generateCode(p);p.generated=p.code;p.build={body:'Cardboard',access:true,secure:true,retest:true};p.play={worked:true,observed:'They pressed again',next:'Keep the nose'};assert.equal(readyToFinish(p),false);p.tested.button=true;p.tested.led=true;assert.equal(readyToFinish(p),false);p.breadboard.happy=true;assert.ok(readyToFinish(p));
});
test('breadboard checkpoint is distinct from individual component tests',()=>{
 const p=projectWith('button',['led'],'hold');p.code=p.generated=generateCode(p);p.tested.button=p.tested.led=true;
 assert.equal(canTestInteraction(p),true);assert.equal(breadboardReady(p),false);
 p.breadboard.happy=true;assert.equal(breadboardReady(p),true);
 p.selected.push('servo');assert.equal(breadboardReady(p),true,'unused parts do not need a component test');
 p.tested.led=false;assert.equal(breadboardReady(p),false);
 p.tested.led=true;p.rules[0].mode='toggle';assert.equal(breadboardReady(p),false,'stale code must not count');
});
test('legacy projects preserve work without inventing a breadboard test',()=>{
 const p=projectWith('button',['led'],'hold');p.code=p.generated=generateCode(p);p.tested.button=p.tested.led=true;p.build.body='My foil flap';p.play.observed='They squeezed it';p.completed=true;delete p.breadboard;
 const restored=validateProject(p);assert.equal(restored.breadboard.happy,false);assert.equal(restored.completed,false);assert.equal(restored.build.body,p.build.body);assert.equal(restored.code,p.code);assert.equal(restored.play.observed,p.play.observed);
});
test('new projects round-trip their valid breadboard checkpoint',()=>{
 const p=projectWith('button',['led'],'hold');p.code=p.generated=generateCode(p);p.tested.button=p.tested.led=true;p.breadboard.happy=true;
 assert.equal(breadboardReady(validateProject(p)),true);
 p.tested.button=false;assert.equal(validateProject(p).breadboard.happy,false);
});
test('every supported starter and component test is valid Python',()=>{
 const cases=[];for(const input of catalogue.filter(c=>c.kind==='detect'))for(const [mode] of modeOptions(input.id))for(const output of catalogue.filter(c=>c.kind==='do'))cases.push(generateCode(projectWith(input.id,[output.id],mode)));
 cases.push(...catalogue.map(c=>testCode(c.id)));
 const python=process.env.PYTHON||'python3';const result=spawnSync(python,['-c','import ast,json,sys\nfor source in json.load(sys.stdin): ast.parse(source)\nprint("Parsed all generated programs")'],{input:JSON.stringify(cases),encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(cases.length,237);
});
test('generated rules execute correctly with mocked picozero readings',()=>{
 const cases=[];for(const input of catalogue.filter(c=>['button','potentiometer','capacitive-touch','ldr'].includes(c.id)))for(const [mode] of modeOptions(input.id))cases.push({mode,input:input.id,code:generateCode(projectWith(input.id,['led','passive-buzzer','servo'],mode))});
 const script=`import json,sys,types\ncases=json.load(sys.stdin)\nfor case in cases:\n    records=[]\n    step=[0]\n    devices={}\n    readings=[0,1,1,0,1,0]\n    class Device:\n        def __init__(self,pin,*args):\n            self.pin=pin;self._value=0;self.freq=2000;devices[pin]=self\n        @property\n        def value(self): return readings[step[0]] if self.pin in [10,26,17,27] else self._value\n        @value.setter\n        def value(self,v): self._value=v\n        @property\n        def is_pressed(self): return bool(self.value)\n        @property\n        def is_touched(self): return bool(self.value)\n        def off(self): self._value=0\n    mod=types.ModuleType('picozero')\n    for name in ['Button','Pot','TouchSensor','AnalogInputDevice','LED','PWMBuzzer','Servo']: setattr(mod,name,Device)\n    sys.modules['picozero']=mod\n    timing=types.ModuleType('time')\n    def sleep(_):\n        records.append((devices[11]._value,devices[9]._value,devices[7]._value))\n        step[0]+=1\n        if step[0]>=len(readings): raise StopIteration\n    timing.sleep=sleep;sys.modules['time']=timing\n    try: exec(case['code'],{})\n    except StopIteration: pass\n    expected=[0,1,1,0,1,0] if case['mode']!='toggle' else [0,1,1,1,0,0]\n    assert [r[0] for r in records]==expected,(case,records)\n    assert all(abs(r[2]-(.65 if expected[i] else .35))<.001 for i,r in enumerate(records))\n    assert all(devices[p]._value==0 for p in [11,9,7])\nprint('Executed',len(cases),'rule combinations with mock devices')`;
 const result=spawnSync(process.env.PYTHON||'python3',['-c',script],{input:JSON.stringify(cases),encoding:'utf8',timeout:10000});assert.equal(result.status,0,JSON.stringify({error:result.error?.message,signal:result.signal,stderr:result.stderr,stdout:result.stdout}));
});
test('all 216 expanded input/output/mode combinations execute with mock devices',()=>{
 const cases=[];
 for(const input of catalogue.filter(c=>c.kind==='detect'))for(const [mode] of modeOptions(input.id))for(const output of catalogue.filter(c=>c.kind==='do')){
  const range=rangeFor(input.id),p=projectWith(input.id,[output.id],mode,{threshold:range.threshold});
  cases.push({input:input.id,inputVariable:input.variable,output:output.id,outputVariable:output.variable,mode,min:range.min,max:range.max,code:generateCode(p)});
 }
 assert.equal(cases.length,216);
 const result=spawnSync(process.env.PYTHON||'python3',['tests/expanded-code.py'],{input:JSON.stringify(cases),encoding:'utf8',timeout:10000});
 assert.equal(result.status,0,result.stderr||result.error?.message);
});
test('temperature units round-trip and preview matches normalised generated values',()=>{
 for(const id of ['temperature-sensor','temperature-probe']){
  const p=projectWith(id,['led'],'threshold',{threshold:25});assert.equal(validateProject(p).rules[0].threshold,25);
  p.rules[0].threshold=70;assert.throws(()=>validateProject(p),/threshold/);
  const r={input:id,outputs:['passive-buzzer'],mode:'follow'};
  assert.equal(previewResponse(r,20).frequency,660);assert.equal(previewResponse(r,-20).level,0);assert.equal(previewResponse(r,70).level,1);
 }
 assert.match(generateCode(projectWith('distance',['led'],'threshold',{direction:'below'})),/valid_1 and active_1/);
});
