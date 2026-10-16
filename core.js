import {catalogueFor, byIdFor, rangeFor, componentImports, componentSetup, componentStop} from './catalogue.js';
import {platformInfo} from './platform.js';
import {piOutputLines} from './pi-bricks.js';
export const VERSION = 2;
export const STORAGE_KEY = 'toy-workshop-v1';
export function freshProject(platform='pico') {
  return {version:VERSION, platform, drafts:{}, idea:{when:'',will:'',person:'',looks:'',play:'',name:''}, selected:[], have:[], setup:{editor:false,firmware:false,library:false}, tested:{}, rules:[], nextRule:1, code:'', generated:'', backup:'', breadboard:{happy:false}, build:{body:'',access:false,secure:false,retest:false}, play:{observed:'',next:'',worked:false}, completed:false, page:'journey'};
}
export const selectedParts = p => catalogueFor(p.platform).filter(c => p.selected.includes(c.id));
export const ideaReady = p => ['when','will','person','looks','play'].every(k => p.idea[k].trim());
export const ruleEnabled = (p,r) => !byIdFor(p.platform)[r.input]?.manualOnly && p.selected.includes(r.input) && r.outputs.length > 0 && r.outputs.every(id => p.selected.includes(id));
export const activeRules = p => p.rules.filter(r => ruleEnabled(p,r));
// Local, explainable hints, never automatic component choices.
export function suggestedParts(p) {
  const byId=byIdFor(p.platform);
  const patterns=[
    ['picamera',/\b(camera|photo(?:s|graph)?|video|picture)\b/i],
    ['robot',/\b(rover|robot|drive|wheels?)\b/i],
    ['button',/\b(button|press(?:es|ing)?|push(?:es)?|squeez(?:e|es|ing))\b/i],
    ['potentiometer',/\b(potentiometer|trimpot|knob|dial|turn(?:s|ing)?|twist|spin|spins)\b/i],
    ['capacitive-touch',/\b(ttp223|touch(?:es|ing)?|stroke|tap)\b/i],
    ['ldr',/\b(ldr|light|shadow|dark|cover)\b/i],
    ['distance',/\b(hc-sr04p|distance|closer|nearer|near|farther|further|proximity|approach(?:es)?)\b/i],
    ['pir',/\b(hc-sr501|adjustable motion)\b/i],
    ['am312-pir',/\b(am312|pir|motion|movement|walk(?:s|ing)?|pass(?:es|ing)? by)\b/i],
    ['line-sensor',/\b(ky-033|line sensor|line|track|surface)\b/i],
    ['temperature-probe',/\b(ds18b20|probe|water temperature)\b/i],
    ['temperature-sensor',/\b(tmp36|temperature|warm(?:er)?|cool(?:er)?|heat)\b/i],
    ['tilt-switch',/\b(tilt(?:s|ed|ing)?|tip(?:s|ped)?|shake|shakes|roll(?:s)?|pick(?:s)? up)\b/i],
    ['toggle-switch',/\b(toggle|lever|on\/off|on or off|switch position)\b/i],
    ['led',/\b(led|light|lights|glow|flash|bright|eyes)\b/i],
    ['rgb-led',/\b(rgb|colou?rs?|rainbow|mood light)\b/i],
    ['neopixels',/\b(neopixels?|pixels?|light strip|chasing lights)\b/i],
    ['buzzer',/\b(active buzzer|fixed beep|fixed tone)\b/i],
    ['speaker',/\b(speaker|notes?|melody|tune|music)\b/i],
    ['passive-buzzer',/\b(passive buzzer|sound|noise|beep|scream|chirp|pitch|tone|squeak)\b/i],
    ['motor-driver',/\b(motor driver|dc motor|spin(?:s|ning)?|wheels?|fan|drive|rover)\b/i],
    ['stepper',/\b(stepper|steps|precise|precision)\b/i],
    ['servo',/\b(servo|move|wave|wiggle|flap|tail|arm|mouth)\b/i]
  ];
  const hints=patterns.flatMap(([id,pattern])=>{
    if(!byId[id])return [];
    const primary=byId[id].kind==='detect'?'when':'will';
    for(const field of [primary,'play','looks']){
      const match=p.idea[field].match(pattern);
      if(match)return [{id,word:match[0],field}];
    }
    return [];
  });
  // Prefer specific choices to generic alternatives; never offer two parts on one pin.
  const ids=new Set(hints.map(h=>h.id));
  const filtered=hints.filter(h=>!(h.id==='led'&&(ids.has('rgb-led')||ids.has('neopixels'))) && !(h.id==='rgb-led'&&ids.has('neopixels')) && !(h.id==='temperature-sensor'&&ids.has('temperature-probe')) && !(h.id==='motor-driver'&&(ids.has('stepper')||ids.has('robot'))));
  const chosen=[];
  for(const h of filtered)if(!chosen.some(x=>partsSharePins(x.id,h.id,p.platform)))chosen.push(h);
  return chosen;
}
export function partsSharePins(a,b,platform='pico') {
  const byId=byIdFor(platform),left=byId[a],right=byId[b];
  if(!left||!right||a===b||(left.bus&&left.bus===right.bus))return false;
  return left.pins.some(pin=>right.pins.includes(pin));
}
export const conflictsFor = (p,id) => p.selected.filter(other=>partsSharePins(other,id,p.platform));
export const selectionConflicts = p => p.selected.flatMap((id,i)=>p.selected.slice(i+1).filter(other=>partsSharePins(id,other,p.platform)).map(other=>[id,other]));
export function partChoices(p,kind){
  const hints=suggestedParts(p),ids=new Set([...p.selected,...hints.map(h=>h.id)]);
  const parts=catalogueFor(p.platform).filter(c=>c.kind===kind);
  if(!parts.some(c=>ids.has(c.id)))ids.add(kind==='detect'?'button':'led');
  return {featured:parts.filter(c=>ids.has(c.id)),more:parts.filter(c=>!ids.has(c.id)),hints};
}
export function suggestedDraft(p) {
  const inputs=selectedParts(p).filter(c=>c.kind==='detect'&&!c.manualOnly);
  const available=selectedParts(p).filter(c=>c.kind==='do'&&!p.rules.some(r=>r.outputs.includes(c.id)));
  const hints=suggestedParts(p).map(h=>h.id);
  const input=inputs.find(c=>hints.includes(c.id))||inputs[0];
  const follows=/\b(higher|lower|pitch|brighter|dimmer|changes?|changing|gets|follows?)\b/i.test(p.idea.will);
  return {input:input?.id||'',outputs:available.length===1?[available[0].id]:available.filter(c=>hints.includes(c.id)).map(c=>c.id),mode:input?.analogue?(follows?'follow':'threshold'):'hold',threshold:rangeFor(input?.id,p.platform).threshold,direction:input?.id==='distance'?'below':'above'};
}
export function previewResponse(r,value,toggled=false) {
  const active=r.mode==='toggle'?Boolean(toggled):r.mode==='threshold'?(r.direction==='below'?value<r.threshold:value>r.threshold):Boolean(value);
  const range=rangeFor(r.input),normalised=Math.max(0,Math.min(1,(value-range.min)/(range.max-range.min)));
  const level=r.mode==='follow'?normalised:Number(active);
  return {active,level,frequency:r.outputs.some(id=>['passive-buzzer','speaker'].includes(id))&&level>.02?(r.mode==='follow'?Math.trunc(220+880*level):2000):0};
}
export function canTestInteraction(p) {
  const rules=activeRules(p), used=new Set(rules.flatMap(r=>[r.input,...r.outputs]));
  return Boolean(!selectionConflicts(p).length && rules.length && [...used].every(id=>p.tested[id]) && p.code.trim() && p.generated===generateCode(p));
}
export const breadboardReady = p => canTestInteraction(p) && p.breadboard?.happy===true;
export function readyToFinish(p) {
  return Boolean(ideaReady(p) && breadboardReady(p) && p.build.access && p.build.secure && p.build.retest && p.play.worked && p.play.observed.trim() && p.play.next.trim());
}
export function materials(p) { return [...new Set([...(p.platform==='pi'?['Raspberry Pi with 40-pin GPIO header','Raspberry Pi OS and suitable power supply','Screen, keyboard and mouse (or configured remote desktop)','Female-to-male jumper wires']:['Raspberry Pi Pico with headers','USB data cable']),'Breadboard','Jumper wires',...selectedParts(p).flatMap(c=>c.materials),'Cardboard / recycled packaging','Tape / reusable fixings'])]; }
export function modeOptions(input,platform='pico') { const byId=byIdFor(platform); if(byId[input]?.manualOnly)return []; return byId[input]?.analogue ? [['threshold','React at a chosen point'],['follow','Follow the changing value']] : [['hold','Respond while the input is active'],['toggle','Switch on / off each time']]; }
export function ruleSummary(r,platform='pico') {
  const byId=byIdFor(platform), c = byId[r.input];
  const trigger = r.mode==='threshold' ? `${c.name} ${r.direction==='below'?'below':'above'} ${r.threshold}${rangeFor(c.id,platform).unit}` : r.mode==='follow' ? `Follow ${c.name.toLowerCase()}` : r.mode==='toggle' ? `${c.name}: switch each time` : `While ${c.name.toLowerCase()} is active`;
  return `${trigger} → ${r.outputs.map(id=>byId[id].short.toLowerCase()).join(' + ')}`;
}
export function generateCode(p) {
  const byId=byIdFor(p.platform), catalogue=catalogueFor(p.platform), board=platformInfo(p);
  const rules = activeRules(p);
  if (!rules.length || selectionConflicts(p).length) return '';
  const ids = new Set(rules.flatMap(r=>[r.input,...r.outputs]));
  const parts = catalogue.filter(c=>ids.has(c.id));
  const lines = [`# Toy workshop — ${board.language} + ${board.library}`, '# Generated from your interaction choices. Read, change and test it.', p.platform==='pi'?'# Follow the matching Pi Skills Bricks wiring; shut down and disconnect power before rewiring.':'# Follow the matching Pico Skills Bricks wiring; unplug before rewiring.', ...componentImports(parts), '', '# Set up only the components used by your active interactions.', ...parts.flatMap(componentSetup), ''];
  for (const r of rules) if (r.mode==='toggle') lines.push(`state_${r.id} = False`, `previous_${r.id} = False`);
  lines.push('', 'try:', '    while True:');
  for (const r of rules) {
    const c = byId[r.input];
    const v = `value_${r.id}`;
    const a = `active_${r.id}`;
    lines.push(`        # ${ruleSummary(r,p.platform)}`, `        ${v} = ${c.read}`);
    const nullable=c.id==='distance'||c.id.startsWith('temperature-');
    if(nullable)lines.push(`        valid_${r.id} = ${v} is not None`,`        ${v} = ${v} if valid_${r.id} else 0`);
    if (r.mode==='toggle') lines.push(`        if ${v} and not previous_${r.id}:`, `            state_${r.id} = not state_${r.id}`, `        previous_${r.id} = ${v}`, `        ${a} = state_${r.id}`);
    else if (r.mode==='threshold') lines.push(`        ${a} = ${v} ${r.direction==='below'?'<':'>'} ${Number(r.threshold)}`);
    else if (r.mode!=='follow') lines.push(`        ${a} = ${v}`);
    if(nullable&&r.mode!=='follow')lines.push(`        ${a} = valid_${r.id} and ${a}`);
    let level=v;
    if(r.mode==='follow'&&(c.range||nullable)){
      const range=rangeFor(c.id,p.platform);level=`level_${r.id}`;
      lines.push(`        ${level} = ${nullable?`0 if not valid_${r.id} else `:''}max(0, min(1, (${v} - (${range.min})) / ${range.max-range.min}))`);
    }
    for (const id of r.outputs) {
      if(p.platform==='pi'){
        lines.push(...piOutputLines(byId[id],{level,active:a,follow:r.mode==='follow',nullable,ruleId:r.id}).map(l=>'        '+l));
        continue;
      }
      if (id==='led') lines.push(`        led.value = ${r.mode==='follow' ? level : `1 if ${a} else 0`}`);
      if (id==='passive-buzzer') {
        if (r.mode==='follow') lines.push(`        buzzer.freq = int(220 + 880 * ${level})`, `        buzzer.value = 0.2 if ${level} > 0.02 else 0`);
        else lines.push(`        buzzer.value = 0.2 if ${a} else 0`);
      }
      if (id==='servo') lines.push('        # Start with a small travel range; test the linkage unloaded.', `        servo.value = ${nullable?`None if not valid_${r.id} else `:''}${r.mode==='follow' ? `0.35 + 0.30 * ${level}` : `0.65 if ${a} else 0.35`}`);
      const out=byId[id],amount=r.mode==='follow'?level:`(1 if ${a} else 0)`,on=r.mode==='follow'?`${level} > 0.02`:a;
      if(out.effect==='rgb')lines.push(`        rgb.color = (int(80 * ${amount}), 0, int(80 * ${amount}))`);
      if(out.effect==='pixel')lines.push(`        pixels[0] = (int(40 * ${amount}), 0, int(15 * ${amount}))`,'        pixels.write()');
      if(out.effect==='digital')lines.push(`        active_buzzer.value = 1 if ${on} else 0`);
      if(out.effect==='speaker')lines.push(`        speaker.freq = ${r.mode==='follow'?`int(220 + 880 * ${level})`:'2000'}`,`        speaker.volume = 0.1 if ${on} else 0`);
      if(out.effect==='motor')lines.push(`        motor.value = 0.3 * ${amount}`);
      if(out.effect==='stepper')lines.push(`        if ${on}:`,`            stepper.step(max(1, int(4 * ${amount})))`,'        else:','            stepper.off()');
    }
    lines.push('');
  }
  lines.push('        sleep(0.02)', 'finally:', '    # Stop the outputs when you stop the program.');
  for (const c of parts.filter(c=>c.kind==='do')) lines.push(...componentStop(c).map(line=>'    '+line));
  for(const c of parts)for(const line of c.cleanup||[])lines.push('    '+line);
  return lines.join('\n')+'\n';
}
// Accept only our bounded data schema, never imported HTML or executable code.
export function validateProject(raw) {
  if (!raw || ![1,VERSION].includes(raw.version) || !raw.idea || !Array.isArray(raw.selected) || !Array.isArray(raw.rules)) throw new Error('This is not a Toy workshop project file.');
  if(raw.platform!==undefined&&!['pico','pi'].includes(raw.platform))throw new Error('Unknown board in this project.');
  const p = freshProject(raw.platform||'pico'), byId=byIdFor(p.platform), catalogue=catalogueFor(p.platform);
  const str = (v,max=6000) => typeof v==='string' ? v.slice(0,max) : '';
  for (const k of Object.keys(p.idea)) p.idea[k] = str(raw.idea[k]);
  p.selected = [...new Set(raw.selected.filter(id=>byId[id]))];
  if(selectionConflicts(p).length)throw new Error(`This project selects alternative parts on the same ${platformInfo(p).short} pins. Keep one sounder, one PIR and one motor-drive option.`);
  p.have = Array.isArray(raw.have) ? raw.have.filter(x=>typeof x==='string').slice(0,60) : [];
  for (const k of Object.keys(p.setup)) p.setup[k]=raw.setup?.[k]===true;
  p.tested = Object.fromEntries(catalogue.map(c=>[c.id,raw.tested?.[c.id]===true]));
  const ruleIds = new Set(); const outputIds = new Set();
  for (const r of raw.rules.slice(0,20)) {
    if (!r || !Number.isInteger(r.id) || r.id<1 || r.id>10000 || ruleIds.has(r.id) || byId[r.input]?.kind!=='detect' || !Array.isArray(r.outputs)) throw new Error('The project contains an invalid interaction.');
    const outputs = [...new Set(r.outputs)];
    if (!outputs.length || outputs.some(id=>byId[id]?.kind!=='do'||outputIds.has(id)) || !modeOptions(r.input,p.platform).some(([m])=>m===r.mode)) throw new Error('The project has conflicting or invalid interactions.');
    const range=rangeFor(r.input,p.platform);
    if (!Number.isFinite(Number(r.threshold)) || Number(r.threshold)<range.min || Number(r.threshold)>range.max) throw new Error('Invalid threshold.');
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
  p.page=['journey','idea','parts','ready','make','play','finish'].includes(raw.page)?raw.page:p.page;
  p.completed=raw.completed===true && Boolean(readyToFinish(p));
  if(raw.drafts){
    if(typeof raw.drafts!=='object'||Array.isArray(raw.drafts))throw new Error('Invalid board drafts.');
    for(const platform of ['pico','pi'])if(platform!==p.platform&&raw.drafts[platform]){
      const draft=validateProject({...raw.drafts[platform],version:VERSION,platform,idea:p.idea,page:p.page,drafts:undefined});
      p.drafts[platform]=buildSnapshot(draft);
    }
  }
  return p;
}

// The idea is shared; hardware, code and observations belong to one board draft.
const buildFields=['selected','have','setup','tested','rules','nextRule','code','generated','backup','breadboard','build','play','completed'];
function buildSnapshot(p){return structuredClone(Object.fromEntries(buildFields.map(k=>[k,p[k]])));}
export function switchPlatform(p,platform){
  if(!['pico','pi'].includes(platform))throw new Error('Unknown board.');
  if(platform===(p.platform||'pico'))return p;
  const drafts=structuredClone(p.drafts||{});
  drafts[p.platform||'pico']=buildSnapshot(p);
  const target=drafts[platform]||buildSnapshot(freshProject(platform));
  delete drafts[platform];
  return {...p,...target,platform,drafts,version:VERSION};
}
