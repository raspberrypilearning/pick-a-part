import {catalogue, byId} from './catalogue.js';
export const VERSION = 1;
export const STORAGE_KEY = 'toy-workshop-v1';
export function freshProject() {
  return {version:VERSION, idea:{when:'',will:'',person:'',looks:'',play:'',name:''}, selected:[], have:[], tested:{}, rules:[], nextRule:1, code:'', generated:'', backup:'', breadboard:{happy:false}, build:{body:'',access:false,secure:false,retest:false}, play:{observed:'',next:'',worked:false}, completed:false, page:'idea'};
}
export const selectedParts = p => catalogue.filter(c => p.selected.includes(c.id));
export const ideaReady = p => ['when','will','person','looks','play'].every(k => p.idea[k].trim());
export const ruleEnabled = (p,r) => p.selected.includes(r.input) && r.outputs.length > 0 && r.outputs.every(id => p.selected.includes(id));
export const activeRules = p => p.rules.filter(r => ruleEnabled(p,r));
export function canTestInteraction(p) {
  const rules=activeRules(p), used=new Set(rules.flatMap(r=>[r.input,...r.outputs]));
  return Boolean(rules.length && [...used].every(id=>p.tested[id]) && p.code.trim() && p.generated===generateCode(p));
}
export const breadboardReady = p => canTestInteraction(p) && p.breadboard?.happy===true;
export function readyToFinish(p) {
  return Boolean(ideaReady(p) && breadboardReady(p) && p.build.access && p.build.secure && p.build.retest && p.play.worked && p.play.observed.trim() && p.play.next.trim());
}
export function materials(p) { return [...new Set(['Raspberry Pi Pico with headers','USB data cable','Breadboard','Jumper wires',...selectedParts(p).flatMap(c=>c.materials),'Cardboard / recycled packaging','Tape / reusable fixings'])]; }
export function modeOptions(input) { return byId[input]?.analogue ? [['threshold','React at a chosen point'],['follow','Follow the changing value']] : [['hold','Respond while held'],['toggle','Switch on / off each time']]; }
export function ruleSummary(r) {
  const c = byId[r.input];
  const trigger = r.mode==='threshold' ? `${c.name} ${r.direction==='below'?'below':'above'} ${r.threshold}` : r.mode==='follow' ? `Follow ${c.name.toLowerCase()}` : r.mode==='toggle' ? `${c.name}: switch each time` : `While ${c.name.toLowerCase()} is held`;
  return `${trigger} → ${r.outputs.map(id=>byId[id].short.toLowerCase()).join(' + ')}`;
}
export function generateCode(p) {
  const rules = activeRules(p);
  if (!rules.length) return '';
  const ids = new Set(rules.flatMap(r=>[r.input,...r.outputs]));
  const parts = catalogue.filter(c=>ids.has(c.id));
  const imports = [...new Set(parts.map(c=>c.cls))].join(', ');
  const lines = ['# Toy workshop — MicroPython + picozero', '# Generated from your interaction choices. Read, change and test it.', '# Follow the matching Pico Skills Bricks wiring; unplug before rewiring.', `from picozero import ${imports}`, 'from time import sleep', '', '# Set up only the components used by your active interactions.', ...parts.map(c=>`${c.variable} = ${c.init}  # GP${c.pin}, physical pin ${c.physical}`), ''];
  for (const r of rules) if (r.mode==='toggle') lines.push(`state_${r.id} = False`, `previous_${r.id} = False`);
  lines.push('', 'try:', '    while True:');
  for (const r of rules) {
    const c = byId[r.input];
    const v = `value_${r.id}`;
    const a = `active_${r.id}`;
    lines.push(`        # ${ruleSummary(r)}`, `        ${v} = ${c.read}`);
    if (r.mode==='toggle') lines.push(`        if ${v} and not previous_${r.id}:`, `            state_${r.id} = not state_${r.id}`, `        previous_${r.id} = ${v}`, `        ${a} = state_${r.id}`);
    else if (r.mode==='threshold') lines.push(`        ${a} = ${v} ${r.direction==='below'?'<':'>'} ${Number(r.threshold)}`);
    else if (r.mode!=='follow') lines.push(`        ${a} = ${v}`);
    for (const id of r.outputs) {
      if (id==='led') lines.push(`        led.value = ${r.mode==='follow' ? v : `1 if ${a} else 0`}`);
      if (id==='passive-buzzer') {
        if (r.mode==='follow') lines.push(`        buzzer.freq = int(220 + 880 * ${v})`, `        buzzer.value = 0.2 if ${v} > 0.02 else 0`);
        else lines.push(`        buzzer.value = 0.2 if ${a} else 0`);
      }
      if (id==='servo') lines.push('        # Start with a small travel range; test the linkage unloaded.', `        servo.value = ${r.mode==='follow' ? `0.35 + 0.30 * ${v}` : `0.65 if ${a} else 0.35`}`);
    }
    lines.push('');
  }
  lines.push('        sleep(0.02)', 'finally:', '    # Stop the outputs when you stop the program.');
  for (const c of parts.filter(c=>c.kind==='do')) lines.push(`    ${c.variable}.off()`);
  return lines.join('\n')+'\n';
}
// Accept only our bounded data schema, never imported HTML or executable code.
export function validateProject(raw) {
  if (!raw || raw.version!==VERSION || !raw.idea || !Array.isArray(raw.selected) || !Array.isArray(raw.rules)) throw new Error('This is not a Toy workshop project file.');
  const p = freshProject();
  const str = (v,max=6000) => typeof v==='string' ? v.slice(0,max) : '';
  for (const k of Object.keys(p.idea)) p.idea[k] = str(raw.idea[k]);
  p.selected = [...new Set(raw.selected.filter(id=>byId[id]))];
  p.have = Array.isArray(raw.have) ? raw.have.filter(x=>typeof x==='string').slice(0,60) : [];
  p.tested = Object.fromEntries(catalogue.map(c=>[c.id,raw.tested?.[c.id]===true]));
  const ruleIds = new Set(); const outputIds = new Set();
  for (const r of raw.rules.slice(0,20)) {
    if (!r || !Number.isInteger(r.id) || r.id<1 || r.id>10000 || ruleIds.has(r.id) || byId[r.input]?.kind!=='detect' || !Array.isArray(r.outputs)) throw new Error('The project contains an invalid interaction.');
    const outputs = [...new Set(r.outputs)];
    if (!outputs.length || outputs.some(id=>byId[id]?.kind!=='do'||outputIds.has(id)) || !modeOptions(r.input).some(([m])=>m===r.mode)) throw new Error('The project has conflicting or invalid interactions.');
    if (!Number.isFinite(Number(r.threshold)) || Number(r.threshold)<0 || Number(r.threshold)>1) throw new Error('Invalid threshold.');
    outputs.forEach(id=>outputIds.add(id)); ruleIds.add(r.id);
    p.rules.push({id:r.id,input:r.input,outputs,mode:r.mode,threshold:Number(r.threshold),direction:r.direction==='below'?'below':'above'});
  }
  p.nextRule = Math.max(0,...ruleIds)+1;
  for (const k of ['code','generated','backup']) p[k]=str(raw[k],100000);
  // Older project files keep their work, but do not imply this new test was done.
  p.breadboard.happy=raw.breadboard?.happy===true && canTestInteraction(p);
  p.build.body=str(raw.build?.body);
  for (const k of ['access','secure','retest']) p.build[k]=raw.build?.[k]===true;
  for (const k of ['observed','next']) p.play[k]=str(raw.play?.[k]);
  p.play.worked=raw.play?.worked===true;
  p.page=['idea','parts','journey','make','play','finish'].includes(raw.page)?raw.page:'idea';
  p.completed=raw.completed===true && Boolean(readyToFinish(p));
  return p;
}
