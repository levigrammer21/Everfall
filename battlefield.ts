import Phaser from 'phaser';
import { actorAtlas, landscape, rgb } from './art';
import { biomes, elements } from './content';
import { Battle, type Cue, type Unit } from './combat';
import { itemColors, itemName, itemRanks } from './loot';
import forest from './whispering-forest.webp';
type GraphicsSettings={quality:number;shake:number};
type Actor={sprite:Phaser.GameObjects.Sprite;pet?:Phaser.GameObjects.Sprite;last:number;hit:number;wind:number;dead:number};
type Point={x:number;y:number};
type DropFx={sprite:Phaser.GameObjects.Sprite;label:Phaser.GameObjects.Text|null;x:number;y:number;road:number;age:number;rank:number};
type Fx={c:Cue;age:number;life:number;seed:number};
const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));
export class Battlefield extends Phaser.Scene{
 battle:Battle|null=null;interp=0;paused=false;settings:GraphicsSettings={quality:2,shake:1};actors=new Map<string,Actor>();pool:Phaser.GameObjects.Sprite[]=[];numbers:Phaser.GameObjects.Text[]=[];
 effects:Fx[]=[];lines!:Phaser.GameObjects.Graphics;floor!:Phaser.GameObjects.Graphics;air!:Phaser.GameObjects.Graphics;
 background:Phaser.GameObjects.TileSprite[]=[];pictures:Phaser.GameObjects.Image[]=[];biome=-1;clock=0;frameShake=0;intro=0;ready=false;recent:Fx[]=[];onCue:(c:Cue)=>void=()=>{};
 private walkers=new Map<string,Point>();private march=1;private road=0;private roadStart=0;private shift=0;private fromBiome:number|null=null;private visibleDrops:DropFx[]=[];private readDrops=0;private lootInk!:Phaser.GameObjects.Graphics;
 constructor(){super('Everfall');}
 preload(){this.load.image('forest-painted',forest);}
 create(){
  const {canvas,frames}=actorAtlas(),atlas=this.textures.addCanvas('actors',canvas)!;
  for(const [name,{x,y}] of Object.entries(frames))atlas.add(name,0,x,y,32,32);
  atlas.setFilter(Phaser.Textures.FilterMode.NEAREST);
  for(let i=0;i<4;i++)this.background.push(this.add.tileSprite(0,0,1,1,'__DEFAULT').setOrigin(0,0).setDepth(i));
  this.pictures=Array.from({length:3},()=>this.add.image(0,0,'forest-painted').setDepth(5).setOrigin(.5,.5));
  this.lootInk=this.add.graphics().setDepth(61);
  this.floor=this.add.graphics().setDepth(7);this.air=this.add.graphics().setDepth(8);this.lines=this.add.graphics().setDepth(70);
  for(let i=0;i<18;i++)this.numbers.push(this.add.text(0,0,'',{fontFamily:'Arial',fontStyle:'bold',fontSize:'16px',stroke:'#120d22',strokeThickness:3}).setOrigin(.5).setDepth(80).setVisible(false));
  this.ready=true;
 }
 release(a:Actor){
  a.sprite.setVisible(false);this.pool.push(a.sprite);
  if(a.pet){a.pet.setVisible(false);this.pool.push(a.pet);}
 }
 set(b:Battle,walk=false){
  this.walkers.clear();
  this.march=walk?0:1;this.roadStart=this.road;this.shift=0;
  const prior=this.battle;this.fromBiome=walk&&prior&&prior.info.biome!==b.info.biome?prior.info.biome:null;
  if(walk&&prior){
   for(const u of b.units){
    const old=prior.units.find(previous=>previous.id===u.id&&previous.hero!==null&&previous.hp>0);
    if(old){
     this.walkers.set(u.id,{x:old.x,y:old.y});
     this.shift=Math.max(this.shift,old.x-u.x+.12);
    }
   }
  }
  for(const [id,a] of this.actors){
   if(this.walkers.has(id))continue;
   this.release(a);this.actors.delete(id);
  }
  if(!walk)this.clearDrops();
  this.battle=b;this.readDrops=0;this.effects.length=0;this.frameShake=b.info.boss?5:0;this.intro=b.info.boss?1.15:0;this.recent.length=0;
 }
 advance(progress:number){
  this.march=clamp(progress,0,1);
  this.road=this.roadStart+this.shift*this.march;
 }
 ground(b:number,h:number){return h*(b===0?.88:127/154);}
 drawBiome(b:number,w:number,h:number){
  if(this.biome!==b){
   this.biome=b;
   for(let i=0;i<4;i++){
    const key='back'+b+'-'+i;if(!this.textures.exists(key))this.textures.addCanvas(key,landscape(b,i))?.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.background[i].setTexture(key);
   }
  }
  const painted=b===0&&this.textures.exists('forest-painted');
  this.pictures.forEach(picture=>picture.setVisible(painted));
  if(painted){
   const image=this.textures.get('forest-painted').getSourceImage();
   const ground=this.ground(b,h),path=.86;
   const scale=Math.max(w/image.width,ground/(image.height*path),(h-ground)/(image.height*(1-path)));
   const span=image.width*scale;
   const travel=this.road*w;
   const center=Math.floor((travel+span/2)/span);
   this.pictures.forEach((picture,i)=>{
    const tile=center+i-1;
    picture.setPosition(w*.5+tile*span-travel,ground-(path-.5)*image.height*scale).setScale(scale).setFlipX(tile%2!==0);
   });
  }
  this.background.forEach((a,i)=>a.setVisible(!painted).setSize(w,h).setTileScale(h/154,h/154).setTilePosition(this.road*w*(.14+i*.285),0));
 }
 private actorPosition(u:Unit,w:number,h:number):Point{
  const currentX=Phaser.Math.Linear(u.oldX,u.x,this.interp);
  const currentY=Phaser.Math.Linear(u.oldY,u.y,this.interp);
  const start=this.walkers.get(u.id);
  const x=start?Phaser.Math.Linear(start.x,currentX,this.march):currentX+(u.side===1?(1-this.march)*.33:0);
  return this.project(u.id,x,start?Phaser.Math.Linear(start.y,currentY,this.march):currentY,w,h);
 }
 private project(id:string,x:number,y:number,w:number,h:number):Point{
  const heroes=this.battle!.units.filter(u=>u.hero!==null);
  const slot=heroes.findIndex(u=>u.id===id);
  const enemy=/^e(\d+)$/.exec(id);
  const spacing=Math.min(30,w*.052);
  const offset=slot>=0?(Math.min(2,(heroes.length-1)/2)-slot)*spacing:enemy?+enemy[1]*spacing*.57:0;
  return {x:x*w+offset,y:this.ground(this.battle!.info.biome,h)-4-y*Math.min(h*.23,74)};
 }
 private clearDrops(){
  for(const drop of this.visibleDrops){drop.sprite.destroy();drop.label?.destroy();}
  this.visibleDrops=[];
 }
 private addDrop(key:string,label:string,rank:number,p:Point,w:number,h:number){
  const sprite=this.add.sprite(0,0,'actors',key).setDepth(62).setOrigin(.5,.7);
  const caption=rank<3?null:this.add.text(0,0,label,{fontFamily:'Georgia',fontSize:'13px',fontStyle:'bold',color:itemColors[rank],backgroundColor:'#16101ee8',padding:{x:5,y:3},stroke:'#151020',strokeThickness:2}).setDepth(63).setOrigin(.5,1);
  this.visibleDrops.push({sprite,label:caption,rank,x:p.x/w,y:(this.ground(this.battle!.info.biome,h)-p.y)/h,road:this.road,age:0});
 }
 eggDrop(tier:number){
  if(!this.ready||!this.battle)return;
  const foe=[...this.battle.units].reverse().find(u=>u.enemy!==null);
  const w=this.scale.width,h=this.scale.height;
  const p=foe?this.project(foe.id,foe.x,foe.y,w,h):{x:w*.62,y:this.ground(this.battle.info.biome,h)};
  this.addDrop('segg'+(tier+2),['Wild Egg','Enchanted Egg','Ancient Egg'][tier],2+tier,{x:p.x+19,y:p.y},w,h);
 }
 private dropsFrame(b:Battle,w:number,h:number,dt:number){
  for(;this.readDrops<b.drops.length;this.readDrops++){
   const drop=b.drops[this.readDrops],p=this.project(drop.enemy,drop.x,drop.y,w,h);
   this.addDrop('i'+drop.item.base,itemRanks[drop.item.rank]+' · '+itemName(drop.item),drop.item.rank,{x:p.x+(this.readDrops%3-1)*20,y:p.y},w,h);
  }
  const g=this.lootInk;g.clear();
  this.visibleDrops=this.visibleDrops.filter(drop=>{
   drop.age+=dt;
   const lifespan=drop.rank>=4?5.2:drop.rank>=2?3.8:2.7;
   const x=(drop.x-(this.road-drop.road))*w;
   if(drop.age>=lifespan||x< -48){drop.sprite.destroy();drop.label?.destroy();return false;}
   const y=this.ground(b.info.biome,h)-drop.y*h;
   const bounce=drop.age<.38?Math.sin(drop.age/.38*Math.PI)*24:0;
   const alpha=clamp((lifespan-drop.age)/.7,0,1);
   const color=parseInt(itemColors[drop.rank].slice(1),16),beam=[10,18,27,42,76,99][drop.rank];
   const pulse=.82+Math.sin(this.clock*5+x*.07)*.18;
   g.fillStyle(color,.17*alpha*pulse).fillEllipse(x,y,36,9);
   g.lineStyle(1,color,.65*alpha).strokeEllipse(x,y,27,7);
   if(drop.rank>=1){
    g.fillStyle(color,alpha*(drop.rank>=4?.26:.12)).fillTriangle(x-13,y,x+13,y,x,y-beam);
    if(drop.rank>=4){
     g.lineStyle(12,color,alpha*.23*pulse).lineBetween(x,y-3,x,y-beam*.92);
     g.lineStyle(1,0xfff5d2,alpha*.85).lineBetween(x,y-4,x,y-beam*.66);
     for(let i=0;i<4;i++)g.fillStyle(color,alpha*.7).fillRect(x+Math.sin(this.clock*2+i*2)*12,y-((this.clock*23+i*13)%beam),2,2);
    }
    g.lineStyle(drop.rank>=4?4:2,color,alpha*.82*pulse).lineBetween(x,y-2,x,y-beam*.86);
    g.fillStyle(color,alpha*.68).fillRect(x+5,y-beam*(.35+.23*pulse),2,2);
   }
   drop.sprite.setPosition(Math.round(x),Math.round(y-4-bounce)).setScale(drop.rank>=4?1.05:.76).setAlpha(alpha);
   drop.label?.setPosition(clamp(x,105,w-105),y-beam-5).setAlpha(alpha);
   return true;
  });
 }
 image(key:string){
  const object=this.pool.pop()??this.add.sprite(0,0,'actors',key).setOrigin(.5,.93);
  return object.setTexture('actors',key).setVisible(true).setAlpha(1).setScale(1).setAngle(0).clearTint();
 }
 frameFor(u:Unit){
  if(u.hero!==null)return 'h'+u.hero;
  if(!u.boss&&!u.owner&&u.enemy!==null&&this.battle!.info.event<0)return 'e'+u.enemy;
  return 's'+u.shape+(this.battle!.info.biome%10);
 }
 actorsFrame(b:Battle,w:number,h:number){
  this.floor.clear();const step=Math.max(1.25,Math.round(Math.min(h*.25,w*.132)/32)*.7),active=new Set<string>();
  for(const u of b.units){
   active.add(u.id);
   let a=this.actors.get(u.id);
   if(!a){a={sprite:this.image(this.frameFor(u)),pet:u.pet===null?undefined:this.image('p'+u.pet),last:-1,hit:0,wind:0,dead:0};this.actors.set(u.id,a);}
   const {x,y}=this.actorPosition(u,w,h);
   const walking=this.march<1&&u.side===0||Math.abs(u.oldX-u.x)>.0001;
   const bob=Math.sin(this.clock*(walking?21:5)+u.x*19)*(walking?2.1:.55),direction=u.side===0?1:-1;
   const size=step*(u.boss?2.45:u.owner?.65:1)*(u.hero===0?1+u.bone*.017:1);
   if(u.hp<=0)a.dead+=.016;else a.dead=0;
   const slash=a.wind>0?Math.sin(a.wind*11)*6*direction:0;
   const stagger=a.hit>0?a.hit*16*-direction:0;
   const visible=a.dead<.68;
   a.sprite.setPosition(Math.round(x+slash+stagger),Math.round(y-Math.abs(bob)+a.dead*12-(u.boss?Math.max(0,this.intro-.56)*44:0))).setDepth(16+y*.09).setFlipX(u.side===1)
    .setScale(size*(1+Math.abs(bob)*.008),size*(1-Math.abs(bob)*.011)).setAngle(visible?a.dead*60*-direction:0).setAlpha(visible?(1-a.dead*1.35)*(u.boss?1-Math.min(.85,this.intro*.72):1):0);
   if(a.hit>0.09&&u.hp>0)a.sprite.setTintFill(0xfff1d4);else if(u.status.freeze)a.sprite.setTint(0x97dbff);else a.sprite.clearTint();
   if(a.pet){a.pet.setDepth(15+y*.09).setFlipX(u.side===1).setPosition(x-17*direction,y+3-Math.abs(Math.sin(this.clock*7+u.x*8))*2).setScale(step*.52).setAlpha(u.hp>0?1:0);}
   if(u.hp>0){
    const width=u.boss?size*22:size*14;
    const yy=y-size*(u.boss?28:26)-6;
    this.floor.fillStyle(0x080711,.62).fillEllipse(x,y+1,width*1.65,Math.max(5,size*3.6));
    this.floor.fillStyle(u.side===0?0x68d9fd:0xfa6b81,.45).fillEllipse(x,y-1,width*.95,2);
    this.floor.fillStyle(0x160f20,.92).fillRoundedRect(x-width/2,yy,width,4,2);
    this.floor.fillStyle(u.side===0?0x7fe3b3:u.boss?0xf5a762:0xe75878,.95).fillRect(x-width/2,yy,width*clamp(u.hp/u.max,0,1),3);
    if(u.shield>0)this.floor.fillStyle(0x9be9ff,.9).fillRect(x-width/2,yy-2,width*clamp(u.shield/u.max,0,1),1);
   }
  }
  for(const [id,a] of this.actors)if(!active.has(id)){this.release(a);this.actors.delete(id);}
 }
 cue(c:Cue){
  const a=this.actors.get(c.id);if(a&&c.kind==='hit'&&c.value>=2)a.hit=.17;
  if(c.kind==='cast'){const caster=this.actors.get(c.fromId);if(caster)caster.wind=.26;}
  if(c.kind==='hit'&&c.value<2)return;
  if(c.kind==='hit'&&c.critical||c.kind==='death'&&this.battle?.info.boss)this.frameShake=Math.max(this.frameShake,c.kind==='death'?6:2.4);
  this.onCue(c);
  const fx={c,age:0,life:c.kind==='cast'?.65:c.kind==='death'?.69:.52,seed:Math.random()*900};
  if(this.effects.length>=65)this.effects.shift();this.effects.push(fx);
  if((c.kind==='hit'&&c.value>=2||c.kind==='heal')&&(c.critical||c.kind==='heal'||this.clock-(this.recent.at(-1)?.seed??0)>.07)){
   if(this.recent.length>=this.numbers.length)this.recent.shift();
   this.recent.push({c,age:0,life:.65,seed:this.clock});
  }
 }
 effectFrame(w:number,h:number,dt:number){
  const g=this.lines;g.clear();const ground=this.ground(this.battle!.info.biome,h);
  if(this.intro>0){const a=this.intro/1.15,x=w*.76;g.fillStyle(0xefd6ff,.16*a).fillRect(x-7,0,14,ground);g.lineStyle(2,0xdf9bfc,a).strokeEllipse(x,ground,24+102*(1-a),8+21*(1-a));}
  for(const fx of this.effects){
   fx.age+=dt;const t=fx.age/fx.life;if(t>1)continue;
   const {c}=fx,col=elements[c.element],target=this.project(c.id,c.x,c.y,w,h),source=this.project(c.fromId,c.fromX,c.fromY,w,h),lift=Math.min(42,Math.max(17,h*.065));
   const x=target.x,y=target.y-lift,sx=source.x,sy=source.y-lift;
   const alpha=(1-t)**1.3,sign=c.side===0?1:-1;
   const skill=c.kind==='cast',debuff=['poison','freeze','root','burn','blind','fear','mark','bleed','weaken'].includes(c.effect);
   const support=['shield','heal','guard','reflect','regen','cleanse','revive','haste','evade'].includes(c.effect);
   if(skill&&c.effect==='chain'){
    g.lineStyle(9,col,alpha*.13);g.beginPath().moveTo(sx,sy);
    for(let i=1;i<=8;i++)g.lineTo(Phaser.Math.Linear(sx,x,i/8),Phaser.Math.Linear(sy,y,i/8)+(i===8?0:Math.sin(i*72+Math.floor(t*18)+fx.seed)*20));
    g.strokePath();g.lineStyle(2,col,alpha);g.beginPath().moveTo(sx,sy);
    for(let i=1;i<=8;i++)g.lineTo(Phaser.Math.Linear(sx,x,i/8),Phaser.Math.Linear(sy,y,i/8)+(i===8?0:Math.sin(i*72+Math.floor(t*18)+fx.seed)*20));
    g.strokePath();g.lineStyle(1,0xffffff,alpha*.8).lineBetween(sx,sy,x,y);
   }else if(skill&&support){
    g.lineStyle(2,col,alpha).strokeEllipse(x,y+18,24+80*t,8+24*t);g.lineStyle(1,0xfffee2,alpha*.65).strokeEllipse(x,y+18,17+68*t,4+19*t);
    if(c.effect==='shield'||c.effect==='guard')g.lineStyle(3,col,alpha*.7).strokeCircle(x,y+7,14+21*t);
    if(c.effect==='heal'||c.effect==='revive')g.fillStyle(col,alpha*.12).fillRect(x-9,y-28,18,55);
   }else if(skill&&Math.abs(x-sx)>36&&(debuff||c.effect==='burst'||c.effect==='summon')){
    const prog=Math.min(1,t*3.2),px=Phaser.Math.Linear(sx,x,prog),py=Phaser.Math.Linear(sy,y,prog)-Math.sin(prog*Math.PI)*33;
    if(prog<1){
     g.lineStyle(7,col,.2).lineBetween(px-sign*25,py-2,px,py);g.lineStyle(2,col,.7).lineBetween(px-sign*21,py-1,px,py);
     g.fillStyle(col,.27).fillCircle(px,py,12);g.fillStyle(col,.94).fillCircle(px,py,6);g.fillStyle(0xffffef,1).fillCircle(px,py,2.5);
    }else{
     const spread=(t-.31)*74;g.fillStyle(col,alpha*.14).fillCircle(x,y,14+spread);g.lineStyle(3,col,alpha*.88).strokeCircle(x,y,5+spread);g.lineStyle(1,0xfff4d2,alpha).strokeCircle(x,y,3+spread*.85);
    }
   }else if(c.kind==='hit'||skill){
    const rad=(c.critical?26:15)+(skill?18:6);
    g.lineStyle(skill?4:2,col,alpha*.88);
    g.beginPath().arc(x-7*sign,y,rad+t*12,sign===1?-1.32:1.7,sign===1?1.0:4.1,false).strokePath();
    g.lineStyle(1,0xfff3ce,alpha).lineBetween(x-8*sign,y+9,x+18*sign,y-13);
    if(c.critical||skill)g.lineStyle(2,col,alpha*.7).strokeEllipse(x,y+10,19+50*t,7+13*t);
   }else if(c.kind==='death'){
    g.lineStyle(2,col,alpha*.64).strokeEllipse(x,y+20,12+t*65,8+t*18);
   }
   const quantity=this.settings.quality===0?1:this.settings.quality===1?4:skill||c.critical||c.kind==='death'?13:6;
   if(c.kind==='miss')continue;
   for(let i=0;i<quantity;i++){
    const angle=fx.seed+i*2.399,dist=(skill?41:28)*t*(.4+(i%5)*.23),px=x+Math.cos(angle)*dist,py=y+Math.sin(angle)*dist-11*t;
    g.fillStyle(i%4===0?0xfff9d6:col,alpha).fillRect(Math.round(px),Math.round(py),i%3===0?3:2,i%3===0?3:2);
   }
  }
  this.effects=this.effects.filter(f=>f.age<f.life);
  this.recent=this.recent.filter(f=>(f.age+=dt)<f.life);
  this.numbers.forEach((n,i)=>{
   const f=this.recent[i];if(!f){n.setVisible(false);return;}
   const {c}=f;const value=c.value>=100000?c.value.toExponential(1):Math.round(c.value).toString();
   const p=this.project(c.id,c.x,c.y,w,h);
   n.setVisible(true).setPosition(p.x+(i%3-1)*11,p.y-Math.min(67,h*.14)-f.age*30).setAlpha(1-f.age*.99).setFontSize(c.critical?19:14).setColor(c.kind==='heal'?'#9affce':c.critical?'#ffe79a':c.side===0?'#fff1dd':'#ff8d9b').setText((c.kind==='heal'?'+':'')+value);
  });
 }
 update(_time:number,ms:number){
  if(!this.ready)return;const dt=Math.min(.05,ms/1000);this.clock+=dt;const w=this.scale.width,h=this.scale.height;if(w<1||h<1)return;
  if(!this.battle){this.drawBiome(0,w,h);return;}
  const b=this.battle;this.intro=Math.max(0,this.intro-dt);
  this.drawBiome(this.fromBiome!==null&&this.march<.5?this.fromBiome:b.info.biome,w,h);
  this.air.clear();
  if(this.fromBiome!==null&&this.march<1)this.air.fillStyle(0x171123,Math.sin(this.march*Math.PI)*.66).fillRect(0,0,w,h);
  const count=this.settings.quality===0?7:22;
  for(let i=0;i<count;i++){
   const x=(i*151+this.clock*(i%3+3))%(w+20),y=(i*47+Math.sin(this.clock*.35+i)*12)%(h*.8);
   this.air.fillStyle(biomes[b.info.biome][2],.13+(Math.sin(this.clock*1.2+i)+1)*.17).fillRect(x,y,i%6?2:3,i%6?2:3);
  }
  for(const actor of this.actors.values()){actor.hit=Math.max(0,actor.hit-dt);actor.wind=Math.max(0,actor.wind-dt);}
  this.actorsFrame(b,w,h);
  this.dropsFrame(b,w,h,dt);
  for(const c of b.cues.splice(0))this.cue(c);
  this.effectFrame(w,h,dt);
  this.frameShake*=.72;
  const shake=this.settings.shake*this.frameShake;
  this.cameras.main.setScroll(shake>.05?Math.sin(this.clock*147)*shake:0,shake>.05?Math.cos(this.clock*103)*shake*.7:0);
 }
}
export function launchBattlefield(parent:HTMLElement){
 const scene=new Battlefield();
 const game=new Phaser.Game({type:Phaser.AUTO,parent,transparent:false,backgroundColor:'#120f20',pixelArt:true,roundPixels:true,antialias:false,scale:{mode:Phaser.Scale.RESIZE,width:parent.clientWidth||800,height:parent.clientHeight||400},input:{keyboard:false,mouse:false,touch:false},scene});
 return {game,scene};
}
