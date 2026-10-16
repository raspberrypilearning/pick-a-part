// Setup help stays optional: reading a guide never records a hardware test.
const link=(url,label)=>`<a href="${url}" target="_blank" rel="noopener">${label} ↗</a>`;
const esc=value=>value.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
export const setupHelpButton=(topic,label)=>`<button class="btn setup-help-button" type="button" data-setup-help="${topic}" aria-haspopup="dialog" aria-controls="setup-dialog">${label}</button>`;
const docs={thonny:'https://thonny.org/',connection:'https://github.com/thonny/thonny/wiki/MicroPython',firmware:'https://www.raspberrypi.com/documentation/microcontrollers/micropython.html',library:'https://picozero.readthedocs.io/en/latest/gettingstarted.html'};
const setupFigure=(file,width,height,alt,caption)=>`<figure class="setup-figure"><a href="assets/setup/${file}" target="_blank" rel="noopener"><img src="assets/setup/${file}" width="${width}" height="${height}" alt="${alt}" loading="lazy" decoding="async"><span class="setup-image-link">Open image full size ↗</span></a><figcaption>${caption}</figcaption></figure>`;
const interpreterSteps=`<p>Look at the <strong>bottom-right corner of the Thonny window</strong>, below the editor and Shell. Click the interpreter name there and choose <strong>MicroPython (Raspberry Pi Pico)</strong>, then select the USB port for your board if asked. If several boards are connected, ask your leader which port to use.</p><p>If you cannot find the selector, use <strong>Run → Select interpreter</strong>.</p>${setupFigure('thonny-switch-interpreter.jpg',1230,771,'Thonny with the interpreter menu open in the bottom-right corner and MicroPython (Raspberry Pi Pico) selected.','The interpreter menu opens above the text at the bottom right. Your Thonny window and port name may look different.')}`;
const imageCredits={
 connect:`Images: Raspberry Pi Foundation, ${link('https://projects.raspberrypi.org/en/projects/led-firefly/2','LED firefly')} (${link('https://creativecommons.org/licenses/by-sa/4.0/','CC BY-SA 4.0')}) and ${link(docs.library+'#select-the-micropython-interpreter','picozero setup guide')} (${link('assets/setup/picozero-LICENSE.txt','MIT licence')}).`,
 connection:`Image: Raspberry Pi Foundation, ${link(docs.library+'#select-the-micropython-interpreter','picozero setup guide')} (${link('assets/setup/picozero-LICENSE.txt','MIT licence')}).`,
 library:`Images: Raspberry Pi Foundation, ${link('https://projects.raspberrypi.org/en/projects/led-firefly/2','LED firefly')} (${link('https://creativecommons.org/licenses/by-sa/4.0/','CC BY-SA 4.0')}). These show an earlier Thonny version; colours, port names and version numbers may differ.`
};

export function setupHelpContent(topic,checkCode){
 const guides={
  connect:{title:'Connect your Pico to Thonny',intro:'Thonny is where you write. The Pico is where your code runs.',body:`
   <div class="callout">You need your Pico, a USB data cable and a computer with Thonny. No circuit or extra components are needed for setup.</div>
   <ol class="making-steps">
    <li><h3>Open the editor</h3><p>Open Thonny on your computer. If it is not installed, use ${link(docs.thonny,'Thonny’s official download page')}. On a school or club computer, ask your leader to help with installation.</p></li>
    <li><h3>Plug in normally</h3><p>Connect the Pico with a data-capable USB cable. Leave BOOTSEL alone for an ordinary connection; it is for installing firmware. A cable that only charges devices will not carry your code.</p>${setupFigure('pico-top-plug.png',600,190,'The small end of a USB cable pointing towards the USB socket on a Raspberry Pi Pico.','Plug the small end into the Pico’s USB socket.')}${setupFigure('plug-in-pico.png',600,486,'The other end of a USB cable pointing towards a USB port on a laptop.','Plug the other end into a USB port on your computer. Your computer’s ports may look different.')}</li>
    <li><h3>Tell Thonny where to run code</h3>${interpreterSteps}</li>
    <li><h3>Find the Shell</h3><p>Look for the Shell panel and its <code>&gt;&gt;&gt;</code> prompt. If a program is already running, use Thonny’s red Stop button. Next, try the Hello Pico check.</p></li>
   </ol>
   <div class="actions">${setupHelpButton('firmware','Try the MicroPython check')}${setupHelpButton('connection','My Pico will not connect')}</div>
   <p class="tiny">${link(docs.connection,'Thonny’s MicroPython guide')}</p>`},
  firmware:{title:'Check MicroPython on your Pico',intro:'MicroPython lets your Pico understand and run Python instructions.',body:`
   <h3>Try this before installing anything</h3><p>With the Pico interpreter selected, type this in Thonny’s Shell, then press Enter. Do not type the <code>&gt;&gt;&gt;</code> prompt itself.</p><pre><code>print("Hello Pico")</code></pre>
   <div class="callout"><strong>See “Hello Pico”?</strong> MicroPython is already working. Close this guide, tick that check and move on to picozero. You do not need to reinstall firmware.</div>
   <p>No reply? Check the connection first: ${setupHelpButton('connection','Help with the connection')}</p>
   <h3>Only if MicroPython needs installing</h3>
   <div class="callout warning"><strong>Protect existing work.</strong> Ask before changing a shared Pico. If you can connect, use Thonny’s Files view to copy existing Pico files onto your computer first. If you cannot back them up, stop and ask your club leader before installing firmware.</div>
   <ol class="making-steps">
    <li><h3>Match the board</h3><p>Read the model printed on it: Pico, Pico W, Pico 2 or Pico 2 W. Use ${link(docs.firmware,'Raspberry Pi’s MicroPython downloads')} and choose the UF2 for that exact model. Do not guess from the board’s colour.</p></li>
    <li><h3>Enter installation mode</h3><p>Unplug the Pico. Hold its BOOTSEL button while plugging the USB cable back in. Release it when the drive appears: <strong>RPI-RP2</strong> for Pico-series RP2040 boards, or <strong>RP2350</strong> for Pico 2-series boards.</p></li>
    <li><h3>Copy the firmware</h3><p>Drag the downloaded <code>.uf2</code> file onto that drive. Wait for the copy to finish. The drive disappearing is expected: the Pico restarts.</p></li>
    <li><h3>Reconnect and check</h3><p>Return to Thonny, select the Pico interpreter and try <code>print("Hello Pico")</code> again. Use a normal USB connection from now on; do not hold BOOTSEL each time.</p></li>
   </ol>`},
  library:{title:'Install and try picozero',intro:'picozero gives useful names to parts, so you can concentrate on what your toy does.',body:`
   <h3>Try the check first</h3><p>If this Pico is already set up, run the code below. If it works, skip installation.</p>
   <h3>If picozero is missing</h3><ol class="making-steps">
    <li><h3>Open the package manager</h3><p>Check that <strong>MicroPython (Raspberry Pi Pico)</strong> is selected at the <strong>bottom right of the Thonny window</strong>. Open <strong>Tools → Manage packages</strong>. The package window should say Raspberry Pi Pico, so the library goes onto your board.</p>${setupFigure('thonny-manage-packages.jpg',1101,788,'Thonny with Manage packages highlighted in the Tools menu.','Use the Tools menu at the top of Thonny, then choose Manage packages.')}</li>
    <li><h3>Search for picozero</h3><p>Type <strong>picozero</strong> into the search box and choose <strong>Search on PyPI</strong>.</p>${setupFigure('thonny-packages-picozero.jpg',672,473,'The package manager for Raspberry Pi Pico with picozero in the search box.','Search in the package manager for your Pico. COM4 is an example port, not a port you need to copy.')}</li>
    <li><h3>Install onto your Pico</h3><p>Select <strong>picozero</strong> in the results, then choose <strong>Install</strong>. Wait for installation to finish before closing the package window.</p>${setupFigure('thonny-install-package.jpg',668,470,'The picozero package information in Thonny with the Install button at the bottom.','Choose Install. The version number in this older screenshot may differ from the one you see.')}</li>
   </ol>
   <p>Without the package manager, use the ${link(docs.library+'#manual-install','manual installation guide')}: obtain <code>picozero.py</code>, open <strong>View → Files</strong>, and upload it from your computer to the Pico’s root folder.</p>
   <h3>Run a short check</h3><p>Paste this into a new Thonny editor file. Save your test as <code>check_pico.py</code>, not <code>picozero.py</code>, and press Run. The library file and your test must be separate.</p>
   <pre><code>${esc(checkCode)}</code></pre><div class="actions"><button class="btn" type="button" data-action="copy-setup">Copy setup check</button><button class="btn" type="button" data-action="download-setup">Download setup check</button></div>
   <div class="callout">Expect one second of light from the onboard LED and “Pico and picozero are ready” in the Shell. Then return to Get ready and tick the picozero check.</div>
   <p>Saving this file on your computer is fine; the selected interpreter still runs it on the Pico. Keep your toy program separate and avoid overwriting an existing file.</p>
   <div class="actions">${setupHelpButton('missing-library','Help with a picozero error')}</div><p class="tiny">${link(docs.library,'Full picozero installation guide')}</p>`},
  connection:{title:'My Pico will not connect',intro:'Try these checks one at a time. Stop when the Shell responds.',body:`
   <ol class="making-steps">
    <li><h3>Check the cable</h3><p>Try a known USB data cable and another USB port. A power light alone does not prove that the computer can send data.</p></li>
    <li><h3>Check the interpreter</h3>${interpreterSteps}</li>
    <li><h3>Let Thonny use the connection</h3><p>Close other editors or browser serial connections using this Pico, then try Thonny’s Stop button. If you unplug it, wait for any file transfer to finish first.</p></li>
    <li><h3>Look for installation mode</h3><p>A drive named RPI-RP2 or RP2350 means BOOTSEL mode, not a normal Python connection. If firmware is already installed, unplug and reconnect without holding the button.</p></li>
    <li><h3>Keep the error message</h3><p>If it still fails, show your club leader the last error, the board model and what you tried. Ask them to check computer permissions or missing firmware. Do not erase or reinstall a shared board just to try something.</p></li>
   </ol><div class="actions">${setupHelpButton('connect','Connection steps')}${setupHelpButton('firmware','Check MicroPython')}</div>
   <p class="tiny">${link(docs.connection,'Thonny connection reference')}</p>`},
  'missing-library':{title:'Help with a picozero error',intro:'An import error means Python could not load the helper library.',body:`
   <h3>“No module named picozero”</h3><p>Check the interpreter first. The test must run on your Pico, and that Pico needs its own copy of picozero. Installing it only on the computer is not enough.</p>
   <h3>Check your file names</h3><p>Your test is <code>check_pico.py</code>. The library is <code>picozero.py</code> (or a picozero package folder). If you accidentally saved your test under the library’s name, keep a copy of your test with the right name before reinstalling the library.</p>
   <h3>Check again after installation</h3><p>Stop the previous program and rerun the short check. If the error changes, keep the new message: it may be a different problem. Ask your club leader to help rather than repeatedly replacing files.</p>
   <div class="actions">${setupHelpButton('library','Open picozero installation steps')}${setupHelpButton('connect','Check the interpreter')}</div>
   <p class="tiny">${link(docs.library,'picozero setup reference')}</p>`}
 };
 const guide=Object.hasOwn(guides,topic)?guides[topic]:null;
 if(!guide)return '';
 return `<div class="dialog-head"><div><div class="eyebrow">Pico setup help</div><h2 id="setup-title" tabindex="-1" autofocus>${guide.title}</h2></div><button class="btn" type="button" data-action="close-setup" aria-label="Close setup help">Close ×</button></div><div class="dialog-body"><p class="setup-intro">${guide.intro}</p>${guide.body}${imageCredits[topic]?`<p class="tiny setup-image-credit">${imageCredits[topic]}</p>`:''}<p id="setup-status" role="status" aria-live="polite"></p><div class="setup-return"><button class="btn primary" type="button" data-action="close-setup">Back to Get ready</button><p class="tiny">Your place is kept. Reading help does not tick any checks for you.</p></div></div>`;
}
