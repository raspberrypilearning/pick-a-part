import assert from 'node:assert/strict';

// Check rendered solid-colour text pairings. This is not a full accessibility audit.
export async function checkTextContrast(page) {
 const results=await page.evaluate(()=>{
  const rgb=value=>value.match(/[\d.]+/g).map(Number);
  const luminance=colour=>colour.slice(0,3).map(c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((s,c,i)=>s+c*[.2126,.7152,.0722][i],0);
  const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  const background=element=>{for(let p=element;p;p=p.parentElement){const c=rgb(getComputedStyle(p).backgroundColor);if(c.length===3||c[3]===1)return c;}return[255,255,255];};
  const selectors='.coding-option,.coding-option strong,.coding-option span,.component-script pre,.navitem,.brand,.brand-mark,.number,.btn,.tiny,.intro,.strand,.status,.brick-link,.pin,.component-name,.component-card p,.field label,.field small,textarea,select,.field input:not([type=checkbox]),.chip,.code-caption,.code-toolbar,.check,.check small,.contact-guide,.contact-states span,.callout,.footer-note,.save-status,.sidebar-label,.sidebar-note,.sidebar-bottom,.step-tag,.details,.quote,.preview-state';
  return [...document.querySelectorAll(selectors)].filter(el=>el.getClientRects().length&&!el.closest('[disabled]')).map(el=>{
   const style=getComputedStyle(el),fg=rgb(style.color),bg=background(el);
   return{element:el.id||el.className||el.tagName,ratio:contrast(fg,bg)};
  });
 });
 const failures=results.filter(r=>r.ratio<4.5);
 assert.deepEqual(failures,[],`Text contrast below 4.5:1: ${JSON.stringify(failures)}`);
 return results.length;
}

export async function checkBrandPalette(page) {
 const expected={green:'#41b653',raspberry:'#da315f',lemon:'#f8f294',blue:'#46499e',orange:'#f26a45',yellow:'#fedf00',pink:'#ef60a3',cyan:'#31a9e0','support-green':'#4aba7a','off-white':'#f7f3ed',slate:'#37384d','dark-green':'#061719',burgundy:'#632341'};
 const actual=await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,getComputedStyle(document.documentElement).getPropertyValue('--cc-'+k).trim()])),Object.keys(expected));
 assert.deepEqual(actual,expected,'brand colours match pages 24–25 of the supplied guide');
 assert.equal(await page.locator('.navitem.active').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(65, 182, 83)');
 assert.equal(await page.locator('.btn.primary').first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(70, 73, 158)');
}
