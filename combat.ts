import { heroProfiles, petProfiles, petPair, skillCombos, type IdentityTrigger, type IdentityTest } from './identity';
import { biomes, bonds, dungeons, eliteMods, enemies, heroes, pets, worldEvents, type Effect, type Element, type Skill } from './content';
import { makeItem, opposite, uniques, type GearStats, type Item } from './loot';
import { capStage, dungeonStage, equippedItems, equippedStats, levelOf, type Metric, type Save } from './save';
export const STEP=.05;
type Status={left:number;power:number;owner:Unit;name:string;pet:boolean};
export type Unit={
 id:string;hero:number|null;enemy:number|null;pet:number|null;side:0|1;name:string;shape:string;element:Element;hue:number;role:string;
 x:number;y:number;oldX:number;oldY:number;hp:number;max:number;atk:number;armor:number;speed:number;reach:number;crit:number;shield:number;
 status:Partial<Record<Effect,Status>>;cd:number;skills:Skill[];timers:number[];gear:GearStats;tree:number[];stars:number;ai:string;priority:number[];
 boss:boolean;mod:string;owner:Unit|null;life:number;fallen:boolean;special:number;passives:Skill[];passTimers:number[];bone:number;
};
export type Cue={kind:'hit'|'cast'|'heal'|'death'|'spawn'|'miss';x:number;y:number;fromX:number;fromY:number;element:Element;name:string;effect:Effect;value:number;critical:boolean;side:0|1;id:string;fromId:string};
export type Encounter={stage:number;biome:number;wave:number;waves:number;dungeon:boolean;dungeonId?:number;boss:boolean;event:number;name:string};
export type GroundDrop={item:Item;x:number;y:number;enemy:string;source:string};
const emptyMetric=():Metric=>({taken:0,received:0,absorbed:0,kills:0,incoming:{},healsBySkill:{},damage:0,pet:0,bonus:0,heal:0,overheal:0,shield:0,prevent:0,crits:0,misses:0,attacks:0,casts:0,deaths:0,bySkill:{},uptime:{}});
const biomeEffects:Effect[]=['root','burn','freeze','blind','poison','summon','chain','bleed','reflect','fear'];
const bossShapes=['tree','dragon','spider','reaper','frog','skeleton','brute','rock','knight','dragon'];
const beneficial:Effect[]=['heal','shield','guard','haste','regen','reflect','revive','evade','cleanse','summon'];
const harmful:Effect[]=['burn','poison','bleed','freeze','fear','weaken','blind','root','mark'];
export const biomeFor=(stage:number)=>Math.floor((stage-1)/10)%10;
export const stageScale=(stage:number)=>Math.exp(Math.min(105,Math.log1p(stage*.079)*1.87+Math.log1p(stage/36)*1.23));
export function encounter(s:Save,seed:number):Encounter{
 if(s.dungeon){const d=dungeons[s.dungeon.id];const boss=s.dungeon.wave===d.waves-1;
 return {stage:dungeonStage(s.dungeon.id,s.dungeon.tier),biome:d.biome,wave:s.dungeon.wave,waves:d.waves,dungeon:true,dungeonId:s.dungeon.id,boss,event:-1,name:boss?d.boss:d.name};}
 const biome=biomeFor(s.stage),waves=3,boss=s.stage%10===0&&s.wave===waves-1;
 const chance=((seed>>>0)%100000)/100000;
 const detected=s.party.some(id=>s.hero[id].pet===3);
 const event=!boss&&s.wave===2&&s.stage>=4&&chance<(detected?.019:.016)?(chance<.00005?7:chance<.00015?6:Math.floor(chance/.00264)%6):-1;
 return {stage:s.stage,biome,wave:s.wave,waves,dungeon:false,boss:boss||event===7,event,name:event>=0?worldEvents[event]:boss?biomes[biome][3]:biomes[biome][0]};
}
function unit(data:Partial<Unit>):Unit{return {id:'',hero:null,enemy:null,pet:null,side:0,name:'',shape:'',element:'steel',hue:0,role:'',x:0,y:0,oldX:0,oldY:0,hp:1,max:1,atk:1,armor:0,speed:1,reach:.08,crit:.07,shield:0,status:{},cd:.2,skills:[],timers:[],gear:{},tree:[],stars:0,ai:'Balanced',priority:[0,1,2],boss:false,mod:'',owner:null,life:0,fallen:false,special:0,passives:[],passTimers:[],bone:0,...data};}
export function createBattle(s:Save,seed:number){
 const info=encounter(s,seed),rng=prng(seed);
 const players=s.party.map((id,slot)=>{
  const h=heroes[id],p=s.hero[id],g=equippedStats(s,id),level=levelOf(p.xp);
  const grow=(1+h.growth*(level-1))*(1+Math.pow(level-1,1.32)*.0048)*(1+p.stars*.085)*(1+Math.min(2,Math.sqrt(s.research)*.016));
  const max=h.hp*grow+(g.health??0)+(s.infirmary>0?8:0);
  const passives=[...h.skills.slice(3),...equippedItems(s,id).flatMap(i=>i.unique===null?[]:[{name:uniques[i.unique].name,effect:uniques[i.unique].effect,power:uniques[i.unique].power,cool:6,trigger:uniques[i.unique].condition}])];
  const x=.18-slot*.025,y=(slot%2)*.16+Math.floor(slot/2)*.046;
  return unit({id:'h'+id,hero:id,pet:p.pet,name:h.name,shape:h.shape,hue:h.hue,element:h.element,role:h.role,x,y,oldX:x,oldY:y,hp:max,max,
   atk:(h.atk*grow+(g.attack??0))*(p.tree.includes(0)?1.08:1),armor:h.armor*(1+level*.019)+(g.armor??0)+(p.tree.includes(4)?12:0),
   speed:Math.max(.21,h.speed/(1+(g.speed??0))),reach:(h.role==='Guard'||h.role==='Striker'?.092:.245)-(p.ai==='Aggressive'?.017:0),crit:Math.min(.82,.078+(g.crit??0)),skills:h.skills.slice(0,3),timers:[1.1+slot*.23,3+slot*.45,6+slot*.47],
   gear:g,tree:p.tree,stars:p.stars,ai:p.ai,priority:p.priority,passives,passTimers:passives.map(()=>0)});
 });
 const training=s.party.length===1&&!info.dungeon&&info.stage<=3;
 const count=training?1:info.boss?(info.dungeon?3:2):info.stage===1?2:Math.min(5,2+Math.floor((info.wave+info.stage%4)/2));
 const scale=stageScale(info.stage)*(info.dungeon?1.16:1);
 const foes=Array.from({length:count},(_,i)=>{
  const local=info.stage===1?i:(info.stage*3+info.wave*3+i*2+Math.floor(rng()*3))%10;
  const e=enemies[info.biome*10+local],boss=info.boss&&i===0,rare=info.event>=0&&i===0;
  const modifierRoll=rng();
  const mod=boss||info.stage<3?'':info.dungeon||modifierRoll<.13?eliteMods[Math.floor(rng()*eliteMods.length)]:modifierRoll<.15?'Rare':modifierRoll<.23?'Champion':'';
  const max=(boss?545:rare?190:training?29+info.stage*10:info.stage===1?112:139)*scale*e.hp*(mod?1.23:1);
  const d=info.dungeon&&s.dungeon?dungeons[s.dungeon.id]:null;
  const x=.76+i*.055,y=(i%3)*.102;
  const fx=boss?(d?.effect??biomeEffects[info.biome]):e.effect;
  return unit({id:'e'+i,enemy:e.id,name:boss?info.name:rare?worldEvents[info.event]:e.name,shape:boss?(d?.shape??bossShapes[info.biome]):rare?['goblin','wizard','chest','knight','horse','candle','dragon'][info.event]??e.shape:e.shape,hue:e.hue,element:e.element,x,y,oldX:x,oldY:y,side:1,hp:max,max,
   atk:(boss?32:training?3+info.stage:info.stage===1?10:16)*scale*e.atk*(mod?1.13:1),armor:(boss?16:5)+(mod==='Armored'?26:0)+Math.log1p(info.stage)*3,speed:mod==='Frenzied'?1:1.68+i*.11,reach:i%3===2?.165:.078,
   boss,mod,shield:mod==='Shielded'?max*.28:0,skills:[{name:boss?'Cataclysm':mod==='Summoning'?'Call Reinforcements':e.name+' Assault',effect:mod==='Summoning'?'summon':mod==='Elemental'?'chain':fx,power:boss?1.25:.87,cool:boss?6.2:7.2}],timers:[boss?3.8:4.5+i*.82]});
 });
 return new Battle(s,info,[...players,...foes],rng,prng(seed^0xa5207ec5));
}
export type RandomStream=(()=>number)&{state:number};
export function prng(seed:number):RandomStream{
 const draw=(()=>{
  draw.state=(draw.state+0x6d2b79f5)>>>0;
  let t=draw.state;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);
  return ((t^t>>>14)>>>0)/4294967296;
 }) as RandomStream;
 draw.state=seed>>>0;return draw;
}
type FrozenUnit=Omit<Unit,'owner'|'status'>&{owner:string|null;status:Partial<Record<Effect,Omit<Status,'owner'>&{owner:string}>>};
export type DungeonCheckpoint={
 key:string;time:number;serial:number;rng:number;lootRng:number;units:FrozenUnit[];drops:GroundDrop[];
 details:Record<string,Metric>;sources:Record<string,number>;enemyUptime:Record<string,number>;
 kills:number[];log:string[];revived:string[];
 pets:[number,number][];links:[number,number][];bonds:[string,number][];identities:[string,number][];dropTarget:string|null;
};
export function dungeonKey(s:Save){
 const d=s.dungeon;return d&&!d.camp?[d.id,d.tier,d.wave].join('/'):'';
}

export const matchup=(element:Element,target:Element)=>opposite[target]===element?1.23:element===target?.83:1;
export const armorFactor=(armor:number)=>100/(100+Math.max(0,armor));
const alive=(u:Unit)=>u.hp>0;
const dist=(a:Unit,b:Unit)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y)*.18;
export class Battle{
 time=0;result:0|1|-1=0;kills:number[]=[];details:Record<string,Metric>={};sources:Record<string,number>={};enemyUptime:Record<string,number>={};cues:Cue[]=[];log:string[]=[];
 drops:GroundDrop[]=[];private lootLuck:number;private dropTarget:string|null=null;
 identityTimers=new Map<string,number>();
 petTimers=new Map<number,number>();linkTimers=new Map<number,number>();bondTimers=new Map<string,number>();serial=0;revived=new Set<string>();units:Unit[];
 constructor(readonly save:Save,readonly info:Encounter,units:Unit[],readonly rng:RandomStream,readonly lootRng:RandomStream){
  this.units=units;
  this.lootLuck=units.reduce((sum,u)=>sum+(u.gear.loot??0)+(u.pet===0?.06:u.pet===24?.1:0),0);
  const foes=units.filter(u=>u.enemy!==null);
  const chance=Math.min(.97,(info.boss?.97:.51)+this.lootLuck*.25);
  if(foes.length&&this.lootRng()<chance)this.dropTarget=(foes.find(u=>u.boss)??foes[Math.floor(this.lootRng()*foes.length)]).id;
  for(const u of units)if(u.hero!==null){this.details[u.id]=emptyMetric();if(u.pet!==null)this.details[u.id].petId=u.pet;}
 }
 checkpoint(key:string):DungeonCheckpoint{
  const units=this.units.map(({owner,status,...data}):FrozenUnit=>({
   ...data,owner:owner?.id??null,
   status:Object.fromEntries(Object.entries(status).map(([effect,st])=>[effect,{...st,owner:st.owner.id}]))
  }));
  return structuredClone({key,time:this.time,serial:this.serial,rng:this.rng.state,lootRng:this.lootRng.state,units,drops:this.drops,
   details:this.details,sources:this.sources,enemyUptime:this.enemyUptime,kills:this.kills,log:this.log,revived:[...this.revived],
   pets:[...this.petTimers],links:[...this.linkTimers],bonds:[...this.bondTimers],identities:[...this.identityTimers],dropTarget:this.dropTarget});
 }
 resume(point:DungeonCheckpoint){
  const p=structuredClone(point);
  const units=p.units.map(({owner:_owner,status:_status,...data})=>unit(data));
  const byId=new Map(units.map(u=>[u.id,u]));
  p.units.forEach(({owner,status},index)=>{
   const u=units[index];u.owner=owner?byId.get(owner)??null:null;
   for(const [effect,st] of Object.entries(status) as [Effect,Omit<Status,'owner'>&{owner:string}][]){
    const source=byId.get(st.owner);
    if(source)u.status[effect]={...st,owner:source};
   }
  });
  this.units=units;this.time=p.time;this.serial=p.serial;
  this.rng.state=p.rng;this.lootRng.state=p.lootRng;this.dropTarget=p.dropTarget;
  this.drops=p.drops;this.details=p.details;this.sources=p.sources;this.enemyUptime=p.enemyUptime;
  this.kills=p.kills;this.log=p.log;this.revived=new Set(p.revived);
  this.petTimers=new Map(p.pets);this.linkTimers=new Map(p.links);this.bondTimers=new Map(p.bonds);this.identityTimers=new Map(p.identities);
 }
 private bossPattern(u:Unit,target:Unit){
  if(!u.boss||this.info.dungeonId===undefined)return;
  const id=this.info.dungeonId,key='boss:'+id,threshold=u.hp/u.max;
  const intervals=[5.9,6.7,7.3,8.4];
  if(this.time<(this.identityTimers.get(key)??4.5))return;
  this.identityTimers.set(key,this.time+intervals[id]);
  const phase=threshold<.45;
  const moves=[
   {name:'Tomb Formation',first:'shield',second:'summon'},
   {name:'Pyre Judgment',first:'mark',second:'burn'},
   {name:'Glacier Break',first:'freeze',second:'push'},
   {name:'Gate Unsealed',first:'fear',second:'summon'}
  ] as const;
  const move=moves[id];
  this.apply(u,target,move.name,move.first,.89);
  this.apply(u,target,move.name+' · Follow-through',move.second,phase?1.27:.72,false,false);
  if(phase)this.apply(u,target,move.name+' · Desperation',(['guard','burst','bleed','leech'] as const)[id],.83,false,false);
 }
 drop(v:Unit){
  const count=Number(v.id===this.dropTarget)+(v.boss&&this.info.dungeon?2:0)+(this.info.event===2&&v.id==='e0'?1:0);
  for(let i=0;i<count;i++){
   const bonus=(this.info.boss?.009:0)+(this.info.dungeon?.007:0)+Math.min(.011,this.lootLuck*.009)+(this.info.event===2&&v.id==='e0'?.014:0);
   const item=makeItem(this.info.stage,this.lootRng,'',bonus);
   if(v.boss&&this.info.dungeonId!==undefined&&i===count-1&&item.rank>=2)item.set=[4,0,1,9][this.info.dungeonId];
   this.drops.push({item,x:v.x,y:v.y,enemy:v.id,source:v.name});
  }
 }
 allies(u:Unit){return this.units.filter(v=>v.side===u.side&&alive(v));}
 foes(u:Unit){return this.units.filter(v=>v.side!==u.side&&alive(v)).sort((a,b)=>dist(u,a)-dist(u,b));}
 metric(u:Unit){return this.details[(u.owner??u).id];}
 say(s:string){if(this.log.length===60)this.log.shift();this.log.push(s);}
 emit(kind:Cue['kind'],u:Unit,v:Unit,name:string,effect:Effect,value=0,critical=false,element=u.element){
  if(this.cues.length>110)this.cues.shift();
  this.cues.push({kind,x:v.x,y:v.y,fromX:u.x,fromY:u.y,element,name,effect,value,critical,side:u.side,id:v.id,fromId:u.id});
 }
 trigger(u:Unit,event:Skill['trigger'],target?:Unit){
  if(!alive(u))return;
  u.passives.forEach((s,i)=>{
   if(s.trigger!==event||u.passTimers[i]>0)return;
   u.passTimers[i]=s.cool;
   this.useSkill(u,target??this.foes(u)[0],s,i<2?i+3:null,false);
  });
 }
 private useSkill(u:Unit,v:Unit|undefined,skill:Skill,slot:number|null,cast=true){
  this.apply(u,v,skill.name,skill.effect,skill.power,false,cast);
  if(u.hero===null||slot===null)return;
  const target=v&&alive(v)?v:this.foes(u)[0];
  if(!target)return;
  const key='combo:'+u.id+':'+target.id;
  if(slot===0){this.identityTimers.set(key,this.time+5);return;}
  if((this.identityTimers.get(key)??0)<=this.time)return;
  const combo=skillCombos[u.hero][slot];
  if(slot===4){u.timers[1]=Math.max(0,u.timers[1]-.62);return;}
  if(slot===2)this.identityTimers.delete(key);
  this.apply(u,target,skill.name+' · Combo',combo.effect,slot===2?.52:slot===3?.21:.31,false,false);
 }
 private passes(test:IdentityTest,u:Unit,v:Unit|undefined){
  switch(test){
   case 'always':return true;
   case 'wounded':return u.hp/u.max<.55;
   case 'allyLow':return this.allies(u).some(a=>!a.owner&&a.hp/a.max<.62);
   case 'boss':return !!v?.boss;
   case 'crowd':return this.foes(u).length>=2;
   case 'shielded':return u.shield>0||!!v?.shield;
   case 'debuffed':return !!v&&harmful.some(f=>!!v.status[f]);
   case 'healthy':return !!v&&v.hp/v.max>.7;
   case 'weakened':return !!v&&v.hp/v.max<.42;
  }
 }
 identity(u:Unit,event:IdentityTrigger,target?:Unit){
  if(u.hero===null||!alive(u))return;
  const hero=heroProfiles[u.hero],pet=u.pet===null?null:petProfiles[u.pet];
  const v=target?.side!==u.side&&target&&alive(target)?target:this.foes(u)[0];
  for(const [companion,profile] of [[false,hero],[true,pet]] as const){
   if(!profile||profile.trigger!==event||!this.passes(profile.test,u,v))continue;
   const key=u.id+(companion?'p':'h');
   if((this.identityTimers.get(key)??0)>this.time)continue;
   const focus=companion?0:[2,6,10].filter(n=>u.tree.includes(n)).length;
   this.identityTimers.set(key,this.time+profile.cooldown*(1-focus*.08));
   const petId=u.pet!,stars=companion?this.save.pet[petId].stars:u.stars;
   const pair=companion?petPair(u.hero,petId).power:0;
   const scale=companion?(.52+levelOf(this.save.pet[petId].xp,true)*.012+stars*.055)*(1+pair):.65+(stars>=3?.18:0);
   const element=companion?pets[petId].element:u.element;
   const tag=companion?pets[petId].name+' · '+profile.name:profile.name;
   this.apply(u,v,tag,profile.effect,scale,companion,true,element,companion);
   if(stars>=(companion?3:6))this.apply(u,v,tag+' · Ascended',profile.starEffect,scale*.70,companion,false,element,companion);
   if(stars>=(companion?5:10))this.apply(u,v,tag+' · Apex',profile.finalEffect,scale*.86,companion,false,element,companion);
   if(!companion){
    const capstones=[3,7,11].filter(n=>u.tree.includes(n));
    for(const cap of capstones)this.apply(u,v,tag+' · Mastery',[profile.starEffect,profile.finalEffect,u.skills[2].effect][(cap-3)/4],scale*.55,false,false);
   }
  }
 }
 damage(u:Unit,v:Unit,value:number,name:string,effect:Effect,pet=false,crit=false,react=true,element=u.element,bonus=false){
  if(!alive(v))return 0;
  const pre=value;
  value*=armorFactor(v.armor*(1-(u.gear.penetration??0)))*matchup(element,v.element);
  if(v.status.mark)value*=1+v.status.mark.power;
  if(v.status.weaken)value*=1+v.status.weaken.power*.45;
  if(u.status.weaken)value*=1-u.status.weaken.power*.36;
  if(v.status.guard)value*=1-v.status.guard.power;
  value*=1-Math.min(.65,v.gear.resist??0);
  const used=Math.min(value,v.shield);v.shield-=used;value-=used;
  const vm=v.owner?undefined:this.metric(v);if(vm)vm.prevent+=Math.max(0,pre-value);
  const actual=Math.min(v.hp,value);v.hp-=actual;
  if(vm){vm.taken=(vm.taken??0)+actual;vm.absorbed=(vm.absorbed??0)+used;
   const incoming=vm.incoming??={};const label=u.name+' · '+name;incoming[label]=(incoming[label]??0)+actual;
  }
  if(v.side===0)this.sources[u.name+' · '+name]=(this.sources[u.name+' · '+name]??0)+actual;
  const m=this.metric(u);if(m){m.damage+=actual;if(pet)m.pet+=actual;if(bonus)m.bonus+=actual;m.bySkill[name]=(m.bySkill[name]??0)+actual;if(crit)m.crits++;}
  this.emit('hit',u,v,name,effect,actual,crit,element);
  if(v.hp<=0){
   const phoenix=v.pet===25&&!this.revived.has(v.id);
   if(phoenix){this.revived.add(v.id);v.hp=v.max*.38;if(vm){vm.received=(vm.received??0)+v.hp;vm.heal+=v.hp;}this.emit('heal',v,v,'Phoenix Rebirth','revive',v.hp,false,'fire');return actual;}
   v.fallen=true;this.emit('death',u,v,name,effect,actual,crit,element);this.say(v.name+' fell.');
   if(vm)vm.deaths++;if(v.enemy!==null){this.kills.push(v.enemy);this.drop(v);if(m)m.kills=(m.kills??0)+1;}
   if(react&&v.mod==='Explosive')for(const foe of this.foes(v).slice(0,3))this.damage(v,foe,v.atk*.7,'Death burst','burst',false,false,false);
   if(u.hero===0||u.hero===1){u.bone=Math.min(16,u.bone+1);u.atk*=1+(u.hero===0?.028:.034);if(u.hero===0){u.max*=1.035;u.hp=Math.min(u.max,u.hp+u.max*.09);}}
   this.identity(u.owner??u,'kill',this.foes(u)[0]);
   if(react){this.trigger(u,'kill',this.foes(u)[0]);if(u.pet===28)this.apply(u,this.foes(u)[0],'Little Death · Soul Chain','chain',.42,true,false,'void',true);}
  }else if(actual>0){
   this.identity(v,'hurt',u);
   if(!react)return actual;
   this.trigger(v,'hurt',u);
   if(v.hp/v.max<.36)this.trigger(v,'low',u);
   if(v.hero===40&&actual>v.max*.13&&(this.linkTimers.get(400)??0)<=this.time){this.linkTimers.set(400,this.time+9);this.apply(v,u,'Slime Split','summon',.65,false,false);}
   if(v.status.reflect&&alive(u))this.damage(v,u,actual*v.status.reflect.power,'Reflection','reflect',false,false,false);
   if(v.tree.includes(5)&&this.rng()<.14)this.damage(v,u,v.atk*.65,'Mastery Counter','strike',false,false,false);
   if(v.hp/v.max<.3&&v.special===0&&(v.tree.includes(7)||v.tree.includes(11))){v.special=1;if(v.tree.includes(7)){v.shield+=v.max*.23;if(vm)vm.shield+=v.max*.23;}if(v.tree.includes(11))this.heal(v,v,v.max*.25,'Second Wind');}
  }
  return actual;
 }
 heal(u:Unit,v:Unit,value:number,name:string,pet=false){
  if(!alive(v))return;
  const delta=Math.min(value,v.max-v.hp);v.hp+=delta;const target=this.metric(v);if(target)target.received=(target.received??0)+delta;
  const m=this.metric(u);if(m){m.heal+=delta;m.overheal+=value-delta;const skills=m.healsBySkill??={};if(delta>0){const label=pet?name+' · pet':name;skills[label]=(skills[label]??0)+delta;}}
  if(delta>.05)this.emit('heal',u,v,name,'heal',delta,false,'life');
 }
 status(u:Unit,v:Unit,effect:Effect,power:number,left:number,name:string,pet:boolean){
  if(!alive(v))return;
  if(v.boss&&['freeze','fear','root'].includes(effect))left*=.46;
  const previous=v.status[effect];
  if(previous&&previous.power>power){previous.left=Math.max(previous.left,left);return;}
  v.status[effect]={left,power,owner:u,name,pet};
 }
 apply(u:Unit,v:Unit|undefined,name:string,fx:Effect,power:number,pet=false,cast=true,element=u.element,bonus=false){
  const allies=this.allies(u).sort((a,b)=>a.hp/a.max-b.hp/b.max),foes=this.foes(u);
  if(!v||!alive(v)||v.side===u.side)v=foes[0];
  if(!v&&!beneficial.includes(fx))return;
  const petData=pet&&u.pet!==null?pets[u.pet]:null;
  const base=petData?u.atk*.46+petData.attack*(1+levelOf(this.save.pet[petData.id].xp,true)*.021):u.atk;
  const amp=base*power*(1+(u.gear.skill??0)+(u.gear[element]??0))*(1+(u.stars>=3?.11:0)+(u.stars>=6?.15:0)+(u.stars>=10?.22:0));
  const m=this.metric(u);
  if(cast&&m)m.casts++;
  const ally=allies[0]??u, focus=beneficial.includes(fx)?ally:v!;
  this.emit('cast',u,focus,name,fx,0,false,element);
  if(cast&&!pet)this.say(u.name+' used '+name+'.');
  const hurt=(target:Unit,mult:number,crit=false)=>this.damage(u,target,amp*mult,name,fx,pet,crit,false,element,bonus);
  const debuff=(target:Unit,status:Effect,n:number,t:number)=>this.status(u,target,status,n,t,name,pet);
  const healing=(t:Unit,n:number)=>this.heal(u,t,n*(1+(u.gear.healing??0)+(u.tree.includes(6)?.2:0)),name,pet);
  switch(fx){
   case 'heal':healing(ally,amp*1.34);if(power>1.35&&allies[1])healing(allies[1],amp*.46);break;
   case 'shield':for(const t of (u.boss?[u]:allies.slice(0,power>1.3?3:2))){const n=Math.min(t.max*.48,amp*1.08*(1+(u.gear.shield??0)));const before=t.shield;t.shield=Math.min(t.max*.68,t.shield+n);if(m)m.shield+=t.shield-before;}break;
   case 'guard':debuff(u,'guard',Math.min(.7,.2+power*.15),4.2);break;
   case 'regen':debuff(ally,'regen',amp*.18,5);break;
   case 'revive':{const t=this.units.find(a=>a.side===u.side&&!a.owner&&!alive(a)&&!this.revived.has(a.id));if(t){this.revived.add(t.id);t.hp=t.max*.31;t.fallen=false;const target=this.metric(t);if(target)target.received=(target.received??0)+t.hp;if(m)m.heal+=t.hp;this.emit('heal',u,t,name,'revive',t.hp,false,element);}else healing(ally,amp*.5);break;}
   case 'haste':debuff(u,'haste',Math.min(.62,.22+power*.13),4);if(pet)u.timers=u.timers.map(t=>Math.max(0,t-.42*power));break;
   case 'evade':debuff(u,'evade',Math.min(.72,.21+power*.18),4);break;
   case 'reflect':debuff(u,'reflect',Math.min(1,.24+power*.25),4.5);break;
   case 'cleanse':for(const t of allies.slice(0,3)){for(const f of harmful)delete t.status[f];healing(t,amp*.32);}break;
   case 'summon':{
    if(this.units.filter(a=>a.side===u.side&&a.owner&&alive(a)).length>=5)break;
    const max=Math.min(u.max*.4,amp*2.2);
    this.units.push(unit({id:'s'+this.serial++,name:name+' minion',shape:u.hero===5?'rat':u.hero===40?'slime':u.hero===24?'mushroom':u.hero===8?'frog':u.hero===9?'pumpkin':'ghost',hue:u.hue,element,side:u.side,owner:u,x:u.x,y:u.y+.045,oldX:u.x,oldY:u.y+.045,hp:max,max,atk:amp*.49,armor:u.armor*.4,life:7+(u.stars>=6?3:0),speed:1.01}));break;
   }
   case 'burst':{const ordered=[v!,...foes.filter(t=>t!==v)];ordered.slice(0,u.boss?5:4).forEach((t,i)=>hurt(t,i===0?1:.61));break;}
   case 'chain':{const ordered=[v!,...foes.filter(t=>t!==v)];ordered.slice(0,u.boss?5:3).forEach((t,i)=>hurt(t,.92**i));break;}
   case 'burn':case 'poison':case 'bleed':{
    const targets=fx==='poison'||u.boss?[v!,...foes.filter(t=>t!==v)].slice(0,u.boss?4:2):[v!];
    for(const t of targets){hurt(t,t===v?.59:.36);debuff(t,fx,amp*(fx==='bleed'?.32:.26),4+(u.tree.includes(2)?1:0)+(u.pet===17&&fx==='burn'?1:0));}break;
   }
   case 'freeze':case 'fear':case 'blind':case 'root':case 'weaken':case 'mark':{
    const targets=u.boss?[v!,...foes.filter(t=>t!==v)].slice(0,4):[v!];
    for(const t of targets){hurt(t,.56);debuff(t,fx,fx==='blind'?.28:Math.min(.63,.14+power*.13),['freeze','fear','root'].includes(fx)?1.15+power*.53:4.2);}break;
   }
   case 'push':case 'pull':{hurt(v!,.95);const direction=Math.sign(v!.x-u.x)||1;v!.x=Math.max(.07,Math.min(.96,v!.x+direction*(fx==='push'?.07:-.065)*(v!.boss?.33:1)));break;}
   case 'execute':{const threshold=(pet?.15:.22)+(u.hero===1&&v!.status.mark?.1:0)+(u.stars>=10?.05:0);hurt(v!,v!.hp/v!.max<threshold?Math.min((v!.boss?4:9),v!.hp/(amp||1)*1.7+.6):1.04);break;}
   case 'leech':{const n=hurt(v!,.92);healing(u,n*.63);break;}
   case 'crit':hurt(v!,1.57+(u.gear.critDamage??0),true);break;
   default:hurt(v!,1);
  }
 }
 step(){
  if(this.result)return;
  this.time+=STEP;
  if(this.time===STEP)for(const u of this.units.slice())this.identity(u,'opening');
  for(const u of this.units){u.oldX=u.x;u.oldY=u.y;}
  for(const u of [...this.units]){
   if(!alive(u))continue;
   if(u.owner){u.life-=STEP;if(u.life<=0){u.hp=0;u.fallen=true;continue;}}
   for(const [key,st] of Object.entries(u.status) as [Effect,Status][]){
    const m=this.metric(u);if(m)m.uptime[key]=(m.uptime[key]??0)+STEP;
    if(u.side===1)this.enemyUptime[key]=(this.enemyUptime[key]??0)+STEP;
    if(key==='burn'||key==='poison'||key==='bleed')this.damage(st.owner,u,st.power*STEP,st.name,key,st.pet,false,false);
    if(key==='regen')this.heal(st.owner,u,st.power*STEP,st.name,st.pet);
    st.left-=STEP;if(st.left<=0)delete u.status[key];
   }
   if(!alive(u))continue;
   if(u.mod==='Regenerating'||u.gear.regen)this.heal(u,u,u.max*(u.mod==='Regenerating'?.023:u.gear.regen!*.17)*STEP,'Regeneration');
   u.passTimers=u.passTimers.map(t=>Math.max(0,t-STEP));
   const haste=u.status.haste?.power??0;
   u.cd-=STEP*(1+haste);
   const recovery=1+(u.gear.cooldown??0)+(u.tree.includes(8)?.15:0);
   u.timers=u.timers.map(t=>t-STEP*recovery*(1+haste*.35));
   const foe=this.foes(u)[0];if(!foe)continue;
   if(u.status.freeze)continue;
   if(u.status.fear){u.x=Math.max(.07,Math.min(.94,u.x+(u.side===0?-.042:.042)*STEP));continue;}
   this.bossPattern(u,foe);
   if(!alive(u))continue;
   const delta=foe.x-u.x;
   if(Math.abs(delta)>u.reach&&!u.status.root){u.x+=Math.sign(delta)*(u.role==='Guard'?.145:.11)*STEP;u.y+=(foe.y-u.y)*STEP*.13;}
   if(Math.abs(delta)<=u.reach+.012&&u.cd<=0){
    u.cd=u.speed*(u.hero===39&&u.hp/u.max<.45?.69:1);
    const m=this.metric(u);if(m)m.attacks++;
    if(this.rng()<(u.status.blind?.power??0)+(foe.status.evade?.power??0)+Math.min(.55,foe.gear.evade??0)+.025){if(m)m.misses++;this.emit('miss',u,foe,'Miss','strike');}
    else{
     const crit=this.rng()<u.crit+(u.hero===3&&foe.status.fear?.25:0);
     const dealt=this.damage(u,foe,u.atk*(u.hero===27&&foe.boss?1.32:1)*(crit?1.62+(u.gear.critDamage??0):1)*(1+(u.gear[u.element]??0)),'Basic attack','strike',false,crit);
     if(u.gear.leech||u.tree.includes(10)||u.mod==='Vampiric')this.heal(u,u,dealt*((u.gear.leech??0)+(u.tree.includes(10)?.05:0)+(u.mod==='Vampiric'?.4:0)),'Lifesteal');
     if(u.tree.includes(1)){const extra=this.foes(u).find(t=>t!==foe);if(extra)this.damage(u,extra,u.atk*.35,'Mastery Volley','burst',false,false,false);}
     this.identity(u,'hit',foe);
     if(crit){this.trigger(u,'crit',foe);this.identity(u,'crit',foe);}
     if(u.hero===20&&this.rng()<.09)this.apply(u,foe,'Jester’s Wild Card',(['chain','blind','bleed','crit'] as Effect[])[Math.floor(this.rng()*4)],.55,false,false);
     if(u.pet!==null){const p=pets[u.pet];const linkReady=(this.linkTimers.get(u.pet)??0)<=this.time;
      if(linkReady&&(crit||(p.id!==9&&this.rng()<(p.id===23?.39:.18)))){this.linkTimers.set(u.pet,this.time+2.7);this.apply(u,foe,p.name+' · Link',p.id===9?'chain':p.id===23?'burn':p.link,p.power*.51,true,false,p.element,true);
       if(crit&&u.tree.includes(3))this.apply(u,foe,p.name+' · Mastery',p.effect,p.power*.45,true,false,p.element,true);}}
    }
   }
   if(!alive(u))continue;
   for(const i of u.priority){
    const s=u.skills[i];if(!s||u.timers[i]>0)continue;
    const helpful=beneficial.includes(s.effect);
    if(!helpful&&Math.abs(delta)>(u.boss?.8:u.reach+.105))continue;
    if(u.ai==='Conserve'&&(s.effect==='heal'||s.effect==='shield')&&this.allies(u).every(a=>a.hp/a.max>.65))continue;
    u.timers[i]=s.cool*(u.ai==='Aggressive'?.87:1)*(u.tree.includes(i*4+1)?.88:1);
    this.useSkill(u,foe,s,i);this.trigger(u,'cast',foe);this.identity(u,'cast',foe);
    if(i===2&&u.tree.includes(9)&&this.rng()<.24)this.apply(u,foe,s.name+' · Echo',s.effect,s.power*.48,false,false);
    break;
   }
   if(u.pet!==null&&this.time>=(this.petTimers.get(u.pet)??2.45)){
    const p=pets[u.pet],progress=this.save.pet[u.pet],level=levelOf(progress.xp,true);
    this.petTimers.set(u.pet,this.time+p.cool/(1+progress.stars*.04));
    const fx=p.id===29?(['burst','freeze','heal','poison','shield','chain'] as Effect[])[Math.floor(this.rng()*6)]:p.effect;
    this.apply(u,foe,p.name,fx,p.power*(1+level*.029+progress.stars*.21),true,true,p.element);
   }
  }
  for(const b of bonds){
   if(this.time<(this.bondTimers.get(b.name)??5.5))continue;
   const a=this.units.find(u=>u.hero===b.a&&alive(u)),c=this.units.find(u=>u.hero===b.b&&alive(u));
   if(a&&c){this.bondTimers.set(b.name,this.time+9.8);this.apply(a,this.foes(a)[0],b.name,b.effect,.89,false,true,c.element);}
  }
  this.units=this.units.filter(u=>!u.owner||alive(u));
  if(!this.units.some(u=>u.side===1&&alive(u)))this.result=1;
  else if(!this.units.some(u=>u.side===0&&alive(u))||this.time>=80)this.result=-1;
 }
}
export function battleSeed(s:Save){return (Math.imul(s.stage,7919)^Math.imul(s.wave+1,15733)^Math.imul(s.wins+s.losses+1,32452843)^s.seed)>>>0;}
export function resumeDungeonBattle(s:Save,seed=battleSeed(s)){
 const b=createBattle(s,seed),point=s.checkpoint;
 if(!point||!b.info.dungeon||point.key!==dungeonKey(s)||!Array.isArray(point.units)||point.units.length>32||!(point.time>0&&point.time<80))return b;
 const party=point.units.filter(u=>u.hero!==null).map(u=>u.hero);
 if(party.length!==s.party.length||!party.every((id,index)=>id===s.party[index]))return b;
 if(![point.drops,point.kills,point.log,point.revived,point.pets,point.links,point.bonds,point.identities].every(Array.isArray))return b;
 if(!point.units.every(u=>typeof u.id==='string'&&Number.isFinite(u.hp)&&Number.isFinite(u.x)&&u.status&&Array.isArray(u.timers)))return b;
 try{b.resume(point);return b;}
 catch{return createBattle(s,seed);}
}
export function sampleBattle(s:Save,seed=battleSeed(s)){
 const b=createBattle(s,seed);while(!b.result){b.step();b.cues=[];}return b;
}
export const nextStage=(s:number)=>Math.min(capStage,s+1);
