export const platforms = {
  pico:{id:'pico',short:'Pico',name:'Raspberry Pi Pico',language:'MicroPython',library:'picozero',prefix:'GP'},
  pi:{id:'pi',short:'Pi',name:'Raspberry Pi',language:'Python',library:'gpiozero',prefix:'GPIO'}
};
export const platformInfo = p => platforms[typeof p==='string'?p:p?.platform] || platforms.pico;
export const wiringAsset = (id,platform='pico',ext='webp') => `assets/wiring/${platform==='pi'?'pi/':''}${id}.${ext}`;
