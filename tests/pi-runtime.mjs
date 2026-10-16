import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {piCatalogue} from '../catalogue.js';
import {freshProject,generateCode,modeOptions} from '../core.js';
const cases=[];
for(const input of ['button','potentiometer'])for(const [mode]of modeOptions(input,'pi'))for(const output of piCatalogue.filter(c=>c.kind==='do'&&c.id!=='neopixels')){
 const p=freshProject('pi');p.selected=[input,output.id];p.rules=[{id:1,input,outputs:[output.id],mode,threshold:.5,direction:'above'}];
 cases.push({input,output:output.id,variable:output.variable,mode,code:generateCode(p)});
}
const result=spawnSync(process.env.PI_TEST_PYTHON||'python3',['tests/pi-runtime.py'],{input:JSON.stringify(cases),encoding:'utf8',timeout:30000});
assert.equal(result.status,0,JSON.stringify({stderr:result.stderr,error:result.error?.message,signal:result.signal,stdout:result.stdout}));console.log(result.stdout.trim());
