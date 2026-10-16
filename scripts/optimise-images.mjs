// Reproducible, size-only derivatives. Original Skills Bricks PNGs remain unchanged.
const {default:sharp}=await import(process.env.SHARP_MODULE||'sharp');
import {stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {catalogue,otherPlatformBricks,piCatalogue} from '../catalogue.js';
let before=0,after=0;
for(const c of [...catalogue,...otherPlatformBricks])for(const kind of catalogue.includes(c)?['components','wiring']:['components']){
 const source=new URL(`../assets/${kind}/${c.id}.png`,import.meta.url);
 const output=new URL(`../assets/${kind}/${c.id}.webp`,import.meta.url);
 const image=sharp(fileURLToPath(source));
 await image.resize({width:kind==='components'?256:1400,withoutEnlargement:true}).webp({quality:kind==='components'?80:88}).toFile(fileURLToPath(output));
 before+=(await stat(source)).size;after+=(await stat(output)).size;
}
for(const c of piCatalogue){
 const source=new URL(`../assets/wiring/pi/${c.id}.png`,import.meta.url),output=new URL(`../assets/wiring/pi/${c.id}.webp`,import.meta.url);
 await sharp(fileURLToPath(source)).resize({width:1400,withoutEnlargement:true}).webp({quality:88}).toFile(fileURLToPath(output));
 before+=(await stat(source)).size;after+=(await stat(output)).size;
}
console.log(JSON.stringify({before,after,reduction:((1-after/before)*100).toFixed(1)+'%'}));
