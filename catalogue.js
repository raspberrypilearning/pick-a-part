import {makePiCatalogue} from './pi-bricks.js';
import {platformInfo} from './platform.js';
import {extraBricks} from './extra-bricks.js';
export {otherPlatformBricks} from './extra-bricks.js';
// Full Pico catalogue of Skills Bricks, checked 16 October 2026.
// Pin assignments and diagrams are retained from the authoritative source bundle.
export const SOURCE = 'https://raspberrypifoundation.github.io/skills-bricks';
export const SETUP = 'https://picozero.readthedocs.io/en/latest/gettingstarted.html';
export const buttonDesign = {
  title:'A button can be more than a button.',
  principle:'A button is a switch: two conductive contacts touch to close a circuit, and separate to open it. Conductive materials, such as metal foil, let electricity pass. The contacts do not have to be inside a shop-bought button.',
  sequence:'Start with a push button on the breadboard. Get the code and response working the way you want. Then decide how your toy will bring two contacts together.',
  examples:[
    ['Push a flap','Put a foil contact on a folded cardboard flap and another underneath. Pushing the flap brings them together.'],
    ['Squeeze a pad','Keep two foil contacts apart with a foam spacer that has a hole in it. Squeezing the pad brings the contacts together through the hole.'],
    ['Close a lid','Place one foil contact on a lid and one on its rim so they meet when the lid closes.']
  ],
  connection:'Unplug before rewiring. Replace only the push button: connect one contact to GP10 (physical pin 14) and the other to GND (physical pin 13). Button(10) uses an internal pull-up, so touching these contacts is read as pressed. Do not connect them to 3V3, VBUS, a battery, or any other power source.',
  retest:'Make sure the contacts can separate again, then test opening and closing them several times with the same code. Check that loose foil cannot touch other wires. This is a contact switch, not the separate touch-sensor option.'
};
export const catalogue = [
  { id:'button', kind:'detect', action:'Press something', name:'Button', short:'Press', desc:'A press, squeeze or closing lid: two contacts meet.', pin:10, physical:14, cls:'Button', variable:'button', init:'Button(10)', read:'button.is_pressed', analogue:false, materials:['Push button'], wiring:'GP10 (pin 14) → button → GND (pin 13). The four legs are joined in pairs; follow the diagram.', test:'Hold and release the button. The printed value should change between True and False.', fabrication:'Once the breadboard interaction works, keep the push button or replace it with two conductive contacts. Their shape and position can turn a press, squeeze or closing lid into the same input.', safety:'Unplug the Pico before changing any wiring.' },
  { id:'potentiometer', kind:'detect', action:'Turn something', name:'Potentiometer', short:'Turn', desc:'A dial to explore, tune or find the just-right spot.', pin:26, physical:31, cls:'Pot', variable:'pot', init:'Pot(26)', read:'pot.value', analogue:true, materials:['10 kΩ potentiometer'], wiring:'The pictured potentiometer is a small breadboard trimmer, also called a trimpot. Its pin 1 goes to GND (Pico pin 33), its moving-contact pin 2 to GP26 (Pico pin 31), and its pin 3 to 3V3 OUT (Pico pin 36). Check the leg order on your actual part; larger knobs can differ.', test:'Turn gently from one end to the other. The printed value should travel between about 0 and 1.', fabrication:'Leave the knob reachable. A paper pointer can show the setting; do not force the ends.', safety:'Power the potentiometer from 3V3, never 5V.' },
  { id:'capacitive-touch', kind:'detect', action:'Touch something', name:'Touch sensor', short:'Touch', desc:'A touch-sensitive patch, paw or secret spot.', pin:17, physical:22, cls:'TouchSensor', variable:'touch', init:'TouchSensor(17)', read:'touch.is_touched', analogue:false, materials:['TTP223 touch module'], wiring:'GP17 (pin 22) → SIG; 3V3 OUT (pin 36) → VCC; GND (pin 23) → GND.', test:'Touch and release the pad. The printed value should switch between True and False. Use a module in momentary, active-high mode.', fabrication:'Keep the touch pad accessible and test it again with your chosen covering.', safety:'This uses a TTP223 module, not a bare wire connected to a person.' },
  { id:'ldr', kind:'detect', action:'Change the light', name:'Light sensor (LDR)', short:'Light', desc:'Cover a sensor, open a lid or cast a shadow.', pin:27, physical:32, cls:'AnalogInputDevice', variable:'ldr', init:'AnalogInputDevice(27)', read:'ldr.value', analogue:true, materials:['LDR','10 kΩ resistor'], wiring:'3V3 OUT (pin 36) → LDR → GP27 (pin 32) → 10 kΩ resistor → GND (pin 33). The LDR and resistor meet at the signal connection; together they turn changing light into a changing voltage.', test:'Cover and uncover the sensor. With this wiring, the reading should be lower in darkness and higher in light.', fabrication:'Leave a window for light. Check the reading inside the finished toy, not just on your desk.', safety:'Keep the voltage divider on 3V3. Set your threshold using real readings.' },
  { id:'led', kind:'do', action:'Light up', name:'LED', short:'Light', desc:'Glowing eyes, a hidden signal or a light to chase.', pin:11, physical:15, cls:'LED', variable:'led', init:'LED(11)', materials:['LED','220 Ω resistor'], wiring:'GP11 (pin 15) → 220 Ω resistor → LED anode (long leg); LED cathode (short leg, flat side of the rim) → GND (pin 18).', test:'Run the test. The LED should light for one second, then turn off.', fabrication:'A small hole or thin paper can let the light through. Keep the resistor in the circuit.', safety:'Always keep the 220 Ω resistor in the circuit. Check which way round the LED is connected.' },
  { id:'passive-buzzer', kind:'do', action:'Make a sound', name:'Passive buzzer', short:'Sound', desc:'A chirp, a squeak or a sound that changes as you play.', pin:9, physical:12, cls:'PWMBuzzer', variable:'buzzer', init:'PWMBuzzer(9, 2000, 32768)', materials:['Passive piezo buzzer'], wiring:'GP9 (pin 12) → buzzer +; buzzer − → GND (pin 13). Use the small passive piezo type in the brick, not an active buzzer or a loudspeaker.', test:'Run the test. You should hear a short tone, then silence.', fabrication:'Leave a sound opening. Keep the buzzer away from ears and stop if the sound is uncomfortable.', safety:'Use a small passive piezo buzzer. A loudspeaker needs a different circuit.' },
  { id:'servo', kind:'do', action:'Move something', name:'Servo motor', short:'Move', desc:'A waving arm, a wiggling tail or a mouth that opens.', pin:7, physical:10, cls:'Servo', variable:'servo', init:'Servo(7)', materials:['Positional microservo','4 × AA NiMH cells + holder'], wiring:'GP7 (pin 10) → signal; GND (pin 13) → shared ground rail → servo ground and pack −. The 4 × AA NiMH (4.8 V) pack + powers only the servo. USB powers the Pico.', test:'Test without a load. The horn should centre, pause and then stop receiving a signal. Stop if it binds or buzzes.', fabrication:'Attach only a light moving part. Leave clearance for the arm and access to the power switch.', safety:'Use a separate suitable servo supply and join the grounds. Keep battery + off Pico power pins. Do not power the servo from 3V3. Ask an adult to check this circuit.' }
];
catalogue.push(...extraBricks);
for(const c of catalogue){c.pins??=[c.pin];c.analogue??=false;}
export const piCatalogue = makePiCatalogue(catalogue);
export const catalogueFor = platform => platform==='pi'?piCatalogue:catalogue;
export const byIdFor = platform => platform==='pi'?piById:byId;
const piById = Object.fromEntries(piCatalogue.map(c=>[c.id,c]));
export const byId = Object.fromEntries(catalogue.map(c => [c.id,c]));
export const rangeFor = (id,platform='pico') => byIdFor(platform)[id]?.range || {min:0,max:1,step:.05,threshold:.5,unit:''};
export function componentImports(parts){
  const classes=[...new Set(parts.flatMap(c=>c.cls?c.cls.split(', '):[]))];
  return [...(classes.length?[`from ${parts[0]?.platform==='pi'?'gpiozero':'picozero'} import ${classes.join(', ')}`]:[]),'from time import sleep',...new Set(parts.flatMap(c=>c.imports||[]))];
}
export const componentSetup = c => c.setup || [`${c.variable} = ${c.init}  # ${platformInfo(c).prefix}${c.pin}, physical pin ${c.physical}`];
export const componentStop = c => c.stop || [`${c.variable}.off()`];
export function brickUrl(id,platform='pico') { return `${SOURCE}/${id}/${id}-${platform}.html`; }
export function testCode(id,platform='pico') {
  const c = byIdFor(platform)[id];
  if(c.fullTest)return c.fullTest;
  const head = componentImports([c]).join('\n')+'\n\n'+componentSetup(c).join('\n')+'\n\n';
  if(c.testLines)return head+c.testLines.join('\n')+'\n';
  if (c.kind === 'detect') return head + `while True:\n    print(${c.read})\n    sleep(0.1)\n`;
  if (id === 'servo') return head + 'servo.mid()\nsleep(2)\nservo.off()\n';
  return head + `${c.variable}.on()\nsleep(${id === 'led' ? '1' : '0.3'})\n${c.variable}.off()\n`;
}
