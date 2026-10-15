// A short, opt-in approximation of pitch; never runs learner Python or tests hardware.
export class SoundPreview {
  constructor(onStatus=()=>{},Context=globalThis.AudioContext||globalThis.webkitAudioContext){this.Context=Context;this.onStatus=onStatus;this.context=null;this.voice=null;this.timer=null;this.generation=0;}
  async play(frequency){
    this.stop();
    if(!frequency){this.onStatus('The buzzer is resting. Change the preview input, then try a sound.');return;}
    if(!this.Context){this.onStatus('Sound preview is unavailable in this browser. The visual preview still works.');return;}
    const generation=this.generation;
    try{
      this.context ||= new this.Context();
      await this.context.resume();
      if(generation!==this.generation)return;
      const oscillator=this.context.createOscillator(),gain=this.context.createGain();
      oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.value=.015;
      oscillator.connect(gain);gain.connect(this.context.destination);oscillator.start();
      this.voice={oscillator,gain};this.onStatus('Playing a quiet, two-second pitch sample.');
      this.timer=setTimeout(()=>this.stop('Sample finished. Change the input and try again.'),2000);
    }catch{this.stop('Sound could not start. You can keep using the visual preview.');}
  }
  tune(frequency){if(!this.voice)return;if(!frequency){this.stop('The buzzer is resting.');return;}this.voice.oscillator.frequency.setTargetAtTime(frequency,this.context.currentTime,.02);}
  stop(message='Sound stopped.'){
    this.generation++;clearTimeout(this.timer);this.timer=null;
    if(this.voice){this.voice.oscillator.stop();this.voice.oscillator.disconnect();this.voice.gain.disconnect();this.voice=null;}
    this.onStatus(message);
  }
}
