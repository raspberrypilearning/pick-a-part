// Copy maintained, already-rendered artwork. Never redraw or rewire a brick here.
// Usage: node scripts/import-brick-assets.mjs /path/to/skills-bricks
import {copyFile,access,mkdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve,join} from 'node:path';
import {extraBricks,otherPlatformBricks} from '../extra-bricks.js';
import {piSource} from '../pi-source.js';
if(!process.argv[2])throw new Error('Pass the authoritative Skills Bricks source directory.');
const source=resolve(process.argv[2]);
const diagramNames={distance:'pico-srf05',buzzer:'pico-buzzer'};
let copied=0;
for(const c of [...extraBricks,...otherPlatformBricks]){
 const assets=[['components',`component-${c.id}.png`]];
 if(extraBricks.includes(c))assets.push(['wiring',`${diagramNames[c.id]||'pico-'+c.id}.png`]);
 for(const [kind,name]of assets){
  const from=join(source,'dist',c.id,'images',name),to=new URL(`../assets/${kind}/${c.id}.png`,import.meta.url);
  await access(from);
  try{await copyFile(from,to,constants.COPYFILE_EXCL);copied++;}
  catch(error){if(error.code!=='EEXIST')throw error;}
 }
}
await mkdir(new URL('../assets/wiring/pi/',import.meta.url),{recursive:true});
for(const [id,c]of Object.entries(piSource)){
 const from=join(source,'dist',id,'images',c.image||`${c.diagram}.png`);
 try{await copyFile(from,new URL(`../assets/wiring/pi/${id}.png`,import.meta.url),constants.COPYFILE_EXCL);copied++;}
 catch(error){if(error.code!=='EEXIST')throw error;}
}
console.log(`Copied ${copied} missing source assets; existing originals were preserved.`);
