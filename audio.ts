import type { Cue } from './combat';
export class GameAudio{
 context:AudioContext|null=null;music=.24;sfx=.55;last=0;timer=0;step=0;
 start(){
  this.context??=new AudioContext();void this.context.resume().catch(()=>{});
  if(!this.timer)this.timer=window.setInterval(()=>this.note(),540);
 }
 tone(f:number,t:number,v:number,type:OscillatorType='sine',end=f){
  const c=this.context;if(!c||c.state!=='running'||v<=0)return;
  const osc=c.createOscillator(),gain=c.createGain(),now=c.currentTime;
  osc.type=type;osc.frequency.setValueAtTime(f,now);osc.frequency.exponentialRampToValueAtTime(Math.max(15,end),now+t);
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,v),now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+t);
  osc.connect(gain).connect(c.destination);osc.start();osc.stop(now+t+.01);
 }
 note(){
  if(document.hidden||!this.music)return;
  const chords=[[110,130.81,164.81,196],[98,130.81,155.56,196],[87.31,110,130.81,174.61],[82.41,123.47,146.83,164.81]];
  const chord=chords[Math.floor(this.step/8)%4],tone=chord[[0,2,3,2,1,2,3,1][this.step%8]];
  this.tone(tone*2,1.2,this.music*.043,'sine');if(this.step%4===0)this.tone(chord[0]/2,1.8,this.music*.071,'triangle');this.step++;
 }
 cue(c:Cue){
  if(document.hidden||performance.now()-this.last<72||!this.sfx)return;this.last=performance.now();
  if(c.kind==='death')this.tone(132,.23,this.sfx*.10,'triangle',43);
  if(c.kind==='hit')this.tone(c.critical?440:170,.095,this.sfx*.065,'triangle',58);
  if(c.kind==='heal')this.tone(520,.26,this.sfx*.055,'sine',811);
  if(c.kind==='cast')this.tone(c.element==='storm'?780:c.element==='fire'?120:c.element==='void'?205:365,.2,this.sfx*.05,'triangle',c.element==='storm'?180:550);
 }
 confirm(rare=false){this.tone(rare?525:310,.25,this.sfx*.11,'triangle',rare?1050:410);if(rare)this.tone(780,.43,this.sfx*.073,'sine',1570);}
}
