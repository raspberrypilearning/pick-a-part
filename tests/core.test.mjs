import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {catalogue,testCode} from '../catalogue.js';
import {freshProject,generateCode,validateProject,activeRules,materials,modeOptions,readyToFinish} from '../core.js';
const projectWith=(input,outputs,mode,extra={})=>{const p=freshProject();p.selected=[input,...outputs];p.rules=[{id:1,input,outputs,mode,threshold:.5,direction:'above',...extra}];return p;};
test('pin assignments are unique; PWM outputs do not share a slice',()=>{
 assert.equal(new Set(catalogue.map(c=>c.pin)).size,catalogue.length);
 const pins=catalogue.filter(c=>c.kind==='do').map(c=>Math.floor(c.pin/2)%8);assert.equal(new Set(pins).size,pins.length);
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
 const p=projectWith('button',['led'],'hold');assert.equal(Boolean(readyToFinish(p)),false);Object.assign(p.idea,{when:'Press',will:'Glow',person:'Laugh',looks:'Box',play:'Press nose'});p.code=generateCode(p);p.generated=p.code;p.build={body:'Cardboard',access:true,secure:true,retest:true};p.play={worked:true,observed:'They pressed again',next:'Keep the nose'};assert.equal(readyToFinish(p),false);p.tested.button=true;p.tested.led=true;assert.ok(readyToFinish(p));
});
test('every supported starter and component test is valid Python',()=>{
 const cases=[];for(const input of catalogue.filter(c=>c.kind==='detect'))for(const [mode] of modeOptions(input.id))for(const output of catalogue.filter(c=>c.kind==='do'))cases.push(generateCode(projectWith(input.id,[output.id],mode)));
 cases.push(...catalogue.map(c=>testCode(c.id)));
 const python=process.env.PYTHON||'python3';const result=spawnSync(python,['-c','import ast,json,sys\nfor source in json.load(sys.stdin): ast.parse(source)\nprint("Parsed all generated programs")'],{input:JSON.stringify(cases),encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(cases.length,31);
});
test('generated rules execute correctly with mocked picozero readings',()=>{
 const cases=[];for(const input of catalogue.filter(c=>c.kind==='detect'))for(const [mode] of modeOptions(input.id))cases.push({mode,input:input.id,code:generateCode(projectWith(input.id,['led','passive-buzzer','servo'],mode))});
 const script=`import json,sys,types\ncases=json.load(sys.stdin)\nfor case in cases:\n    records=[]\n    step=[0]\n    devices={}\n    readings=[0,1,1,0,1,0]\n    class Device:\n        def __init__(self,pin,*args):\n            self.pin=pin;self._value=0;self.freq=2000;devices[pin]=self\n        @property\n        def value(self): return readings[step[0]] if self.pin in [10,26,17,27] else self._value\n        @value.setter\n        def value(self,v): self._value=v\n        @property\n        def is_pressed(self): return bool(self.value)\n        @property\n        def is_touched(self): return bool(self.value)\n        def off(self): self._value=0\n    mod=types.ModuleType('picozero')\n    for name in ['Button','Pot','TouchSensor','AnalogInputDevice','LED','PWMBuzzer','Servo']: setattr(mod,name,Device)\n    sys.modules['picozero']=mod\n    timing=types.ModuleType('time')\n    def sleep(_):\n        records.append((devices[11]._value,devices[9]._value,devices[7]._value))\n        step[0]+=1\n        if step[0]>=len(readings): raise StopIteration\n    timing.sleep=sleep;sys.modules['time']=timing\n    try: exec(case['code'],{})\n    except StopIteration: pass\n    expected=[0,1,1,0,1,0] if case['mode']!='toggle' else [0,1,1,1,0,0]\n    assert [r[0] for r in records]==expected,(case,records)\n    assert all(abs(r[2]-(.65 if expected[i] else .35))<.001 for i,r in enumerate(records))\n    assert all(devices[p]._value==0 for p in [11,9,7])\nprint('Executed',len(cases),'rule combinations with mock devices')`;
 const result=spawnSync(process.env.PYTHON||'python3',['-c',script],{input:JSON.stringify(cases),encoding:'utf8',timeout:10000});assert.equal(result.status,0,JSON.stringify({error:result.error?.message,signal:result.signal,stderr:result.stderr,stdout:result.stdout}));
});
