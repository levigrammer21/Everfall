import { heroMastery } from './identity';
import { buildKey, buildLabel, isWorldOffer } from './expedition';
import { dungeons, heroes, pets, worldEvents } from './content';
import { Battle, battleSeed, createBattle, nextStage, sampleBattle } from './combat';
import { makeItem } from './loot';
import { collectLoot, gain, random, safe, work, activeRewards, equippedStats, type Save } from './save';
export type Rewards={xp:number;gold:number;crystals:number;keys:number;eggs:number;items:number;kills:number;battles:number;guildGold:number;research:number};
export const emptyRewards=():Rewards=>({xp:0,gold:0,crystals:0,keys:0,eggs:0,items:0,kills:0,battles:0,guildGold:0,research:0});
const combine=(a:Rewards,b:Rewards)=>{for(const key of Object.keys(a) as (keyof Rewards)[])a[key]+=b[key];};
const onParty=(s:Save)=>s.party.filter(id=>!!s.hero[id]);
function credit(s:Save,r:Rewards){
 for(const id of onParty(s))gain(s.hero[id],r.xp);
 for(const id of activeRewards(s))gain(s.pet[id],r.xp*.11,true);
 s.gold=safe(s.gold+r.gold);s.crystals=safe(s.crystals+r.crystals);s.keys=safe(s.keys+r.keys);
 s.totalGold=safe(s.totalGold+r.gold);s.totalXP=safe(s.totalXP+r.xp);s.kills=safe(s.kills+r.kills);
}
function rewards(s:Save,b:Battle,n=1,offline=false){
 const r=emptyRewards(),{info}=b;const level=info.stage;
 const worn=onParty(s).map(id=>equippedStats(s,id));
 const companion=activeRewards(s);
 const goldMult=1+worn.reduce((sum,g)=>sum+(g.gold??0),0)+(companion.includes(0)?.12:0)+(companion.includes(11)?.09:0)+(companion.includes(24)?.22:0);
 const luck=worn.reduce((sum,g)=>sum+(g.loot??0),0)+(companion.includes(0)?.06:0)+(companion.includes(24)?.1:0);
 const boss=info.boss;
 const expected=(p:number)=>{
  const mean=n*p;
  if(n<60){let count=0;for(let i=0;i<n;i++)if(random(s)<p)count++;return count;}
  if(mean<20){const limit=Math.exp(-mean);let product=1,count=0;do{product*=random(s);count++;}while(product>limit);return Math.min(n,count-1);}
  const spread=Math.sqrt(mean*(1-p));
  return Math.max(0,Math.min(n,Math.round(mean+(random(s)+random(s)+random(s)+random(s)-2)*spread*1.73)));
 };
 r.xp=Math.ceil((8+level*1.36)*(boss?2.5:1))*n;
 r.gold=Math.floor((12+Math.sqrt(level)*5)*(boss?3:1)*(info.dungeon?1.4:1)*goldMult)*n;
 r.crystals=expected(info.dungeon&&boss?1:boss?.056:.0025);r.keys=info.dungeon?0:expected(boss?.040:.0012);
 r.kills=n*b.kills.length;r.battles=n;
 const eggs=expected(info.dungeon?(boss?.24:.014):(boss?.023:.00023));
 for(let i=0;i<Math.min(eggs,60);i++){
  const roll=random(s);s.egg[roll<(boss?.07:.016)?2:roll<(boss?.48:.16)?1:0]++;
 }
 if(eggs>60){const remaining=eggs-60,ancient=Math.floor(remaining*(boss?.07:.016)),enchanted=Math.floor(remaining*(boss?.41:.144));s.egg[2]+=ancient;s.egg[1]+=enchanted;s.egg[0]+=remaining-ancient-enchanted;}
 r.eggs=eggs;
 if(n===1&&!offline){
  for(const drop of b.drops)if(collectLoot(s,drop.item,drop.source))r.items++;
 }else{
  const rolls=expected(Math.min(.97,(boss?.97:.51)+luck*.25))+(info.dungeon&&boss?2*n:0);
  const maxRolls=Math.min(75,rolls);
  for(let i=0;i<maxRolls;i++){
   const item=makeItem(level,()=>random(s),'',(boss?.009:0)+(info.dungeon?.007:0)+Math.min(.011,luck*.009));
   if(collectLoot(s,item,'Offline adventure'))r.items++;
  }
  if(rolls>maxRolls){s.loot+=rolls-maxRolls;r.gold+=(rolls-maxRolls)*Math.floor(3+Math.sqrt(level)*1.5);}
 }
 if(random(s)<(boss?.68:.11))s.gems[Math.floor(random(s)*6)]++;
 if(info.event>=0&&n===1){
  s.events[info.event]+=n;
  const queued=isWorldOffer(info.event)&&s.offers.length<5;
  if(queued&&isWorldOffer(info.event))s.offers.push({event:info.event,stage:level});
  switch(info.event){
   case 0:r.gold+=Math.floor(r.gold*3);break;
   case 1:if(!queued)r.crystals+=2;break;
   case 2:break;
   case 3:r.keys+=n;break;
   case 4:if(!queued){r.gold+=40+level;s.gems[0]++;}break;
   case 5:if(!queued)r.xp*=2;break;
   case 6:s.egg[1]+=n;r.eggs+=n;break;
   case 7:s.egg[2]+=n;r.eggs+=n;r.crystals+=8*n;break;
  }
 }
 for(const id of b.kills)s.discover[id]=safe((s.discover[id]??0)+n);
 s.history=s.history.slice(0,40);
 credit(s,r);return r;
}
function recordTrends(s:Save,b:Battle,r:Rewards,n:number,foreground:boolean){
 const key=b.info.dungeon?'d:'+b.info.name+':'+b.info.stage:'a:'+b.info.stage;
 const farm=s.farmHistory[key]??={name:b.info.name,stage:b.info.stage,waves:0,wins:0,time:0,gold:0,xp:0,items:0};
 farm.waves+=n;farm.wins+=b.result===1?n:0;farm.time+=b.time*n;farm.gold+=r.gold;farm.xp+=r.xp;farm.items+=r.items;
 const refresh=<T>(entries:Record<string,T>,id:string,data:T,limit:number)=>{
  delete entries[id];entries[id]=data;
  const keys=Object.keys(entries);
  if(keys.length>limit)delete entries[keys[0]];
 };
 refresh(s.farmHistory,key,farm,30);
 if(!foreground)return;
 for(const u of b.units){
  if(u.hero===null||!s.hero[u.hero])continue;
  const id=u.hero,m=b.details[u.id],build=buildKey(s,id);
  const row=s.buildHistory[build]??={name:buildLabel(id,u.pet),hero:id,pet:u.pet,profile:[u.ai,s.hero[id].gear.filter(Boolean).length+' gear pieces',...u.tree.filter(n=>n%4===3).map(n=>heroMastery(id,n).path)].join(' · '),waves:0,time:0,damage:0,petDamage:0,heal:0,taken:0,mitigated:0};
  row.waves++;row.time+=b.time;row.damage+=m.damage;row.petDamage+=m.pet;row.heal+=m.heal;row.taken+=m.taken??0;row.mitigated+=m.prevent;
  refresh(s.buildHistory,build,row,48);
 }
}
const settled=new WeakSet<Battle>();
export function finish(s:Save,b:Battle,record=true){
 if(!b.result||settled.has(b))return emptyRewards();
 settled.add(b);
 const won=b.result===1,{info}=b;
 const r=won?rewards(s,b):emptyRewards();
 recordTrends(s,b,r,1,record);
 if(s.infirmary>0)s.infirmary--;
 if(won)s.wins++;else{s.losses++;for(const id of b.kills)s.discover[id]=(s.discover[id]??0)+1;s.kills+=b.kills.length;}
 s.seconds=safe(s.seconds+b.time);
 if(info.dungeon&&s.dungeon){
  s.checkpoint=null;
  if(!won)s.dungeon=null;
  else if(s.dungeon.wave===dungeons[s.dungeon.id].waves-1){s.dungeon=null;s.dungeonWins++;}
  else{s.dungeon.wave++;s.dungeon.camp=true;}
 }else if(won){
  if(s.wave===info.waves-1){
   const previous=s.best;s.best=Math.max(s.best,s.stage);s.lastFarm=s.stage;
   if(previous<1&&s.best>=1){s.crystals++;r.crystals++;}
   if(previous<2&&s.best>=2){s.egg[0]++;r.eggs++;s.crystals+=4;r.crystals+=4;}
   if(previous<3&&s.best>=3){s.keys++;r.keys++;}
   if(previous<5&&s.best>=5){s.crystals+=5;r.crystals+=5;}
   if(s.best>previous&&s.best%10===0){s.crystals+=3;r.crystals+=3;}
   if(s.mode==='Push')s.stage=nextStage(s.stage);
   s.wave=0;
  }else s.wave++;
 }else{
  const fallback=Math.max(1,Math.min(s.lastFarm,s.best,s.stage-1));
  s.stage=fallback;s.wave=0;s.mode='Farm';
 }
 if(record){
  const values=Object.values(b.details);
  s.records.unshift({stage:info.stage,name:info.name,seconds:b.time,win:won,xp:r.xp,gold:r.gold,items:r.items,damage:values.reduce((sum,m)=>sum+m.damage,0),healing:values.reduce((sum,m)=>sum+m.heal,0),details:b.details,sources:b.sources,enemyUptime:b.enemyUptime,log:b.log.slice(-32)});
  s.records=s.records.slice(0,18);
 }
 return r;
}
export function effectiveSeconds(seconds:number){
 const h=3600;
 return Math.min(seconds,24*h)+Math.min(Math.max(0,seconds-24*h),48*h)*.75+Math.min(Math.max(0,seconds-72*h),96*h)*.5+Math.max(0,seconds-168*h)*.25;
}
export function offline(s:Save,now:number,minimum=45){
 const elapsed=Math.max(0,(now-s.updated)/1000),r=emptyRewards();
 if(elapsed<minimum)return {elapsed:0,r};
 const prevGold=s.gold,prevResearch=s.research;work(s,elapsed);r.guildGold=s.gold-prevGold;r.research=s.research-prevResearch;
 const effective=effectiveSeconds(elapsed);
 let remaining=effective;
 s.offlineSeconds+=elapsed;
 if(s.party.length&&!s.dungeon){
  for(let k=0;k<12&&remaining>=5;k++){
   const b=sampleBattle(s);const time=Math.max(4,b.time)+2;if(time>remaining)break;
   remaining-=time;combine(r,finish(s,b,false));
  }
  if(remaining>=4){
   // Longer absences repeat proven wins. Sample each encounter using the current party and equipment.
   const backup={stage:s.stage,wave:s.wave};
   s.stage=Math.max(1,Math.min(s.best||1,s.mode==='Farm'?s.stage:s.lastFarm));
   const samples=Array.from({length:3},(_,wave)=>{s.wave=wave;let seed=battleSeed(s);if(seed%100000<1600)seed+=1600;return sampleBattle(s,seed);});
   s.stage=backup.stage;s.wave=backup.wave;
   if(samples.every(b=>b.result===1)){
    const duration=samples.reduce((sum,b)=>sum+Math.max(4,b.time)+2,0),cycles=Math.floor(remaining/duration);
    if(cycles>0){
     for(const b of samples){const earned=rewards(s,b,cycles,true);combine(r,earned);recordTrends(s,b,earned,cycles,false);s.seconds=safe(s.seconds+cycles*b.time);s.wins+=cycles;}
    }
   }
  }
 }
 s.updated=now;return {elapsed,r};
}
export const makeNext=(s:Save)=>createBattle(s,battleSeed(s));
export const compatible=(h:number,p:number)=>{const hero=heroes[h],pet=pets[p];const reasons:string[]=[];
 if(p===23&&hero.speed<1.25)reasons.push('Fast attacks trigger more burning links');
 if(p===17&&hero.skills.some(s=>s.effect==='burn'))reasons.push('Extends burn duration');
 if((p===1||p===18||p===27)&&hero.role==='Guard')reasons.push('Shields protect the frontline');
 if(p===9&&hero.skills.some(s=>s.effect==='crit'))reasons.push('Critical attacks can trigger lightning links');
 if((p===16||p===28)&&hero.skills.some(s=>['mark','weaken','bleed','burn'].includes(s.effect)))reasons.push('Damage and debuffs open execute windows');
 if(p===25)reasons.push('Revives its owner once per encounter');
 if(!reasons.length)reasons.push('Independent '+pet.effect+' skill and '+pet.link+' attack link');
 return reasons;
};
export const encounterLog=worldEvents;
