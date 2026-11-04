import { heroes, pets } from './content';
import { sampleBattle } from './combat';
import { bases } from './loot';
import { finish, offline } from './progression';
import { activeRewards, ascend, assignJob, assignPet, canEquip, equip, equipped, hatch, levelOf, masteryPoints, newSave, setParty, summon, train, work, type Save } from './save';
const DAY=86400000;
function manage(s:Save){
 if(s.party.length<5&&s.crystals&&s.crystals<10)summon(s,1);
 for(let n=0;n<Math.min(40,Math.floor(s.crystals/10));n++)summon(s,10);
 for(const id of Object.keys(s.hero).map(Number))if(s.party.length<5&&!s.party.includes(id))setParty(s,id,s.party.length);
 for(let tier=0;tier<3;tier++)for(let n=Math.min(30,s.egg[tier]);n>0;n--)hatch(s,tier);
 const collection=Object.keys(s.pet).map(Number).sort((a,b)=>pets[b].rarity-pets[a].rarity||s.pet[b].xp-s.pet[a].xp);
 for(const [slot,h] of s.party.entries()){
  if(collection[slot]!==undefined)assignPet(s,h,collection[slot]);
  for(let n=0;n<10;n++)ascend(s,h);
  if(s.hero[h].pet!==null)for(let n=0;n<5;n++)ascend(s,s.hero[h].pet!,true);
  for(let n=0;n<12&&masteryPoints(s.hero[h])>0;n++)train(s,h,n);
  const options=s.items.filter(i=>canEquip(s,h,i)&&!equipped(s,i.id)).sort((a,b)=>b.level+b.rank*4-a.level-a.rank*4);
  for(const i of options){
   const slot=bases[i.base].slot,old=s.items.find(it=>it.id===s.hero[h].gear[slot]);
   if(!old||i.level+i.rank*4>old.level+old.rank*4)equip(s,h,i.id);
  }
 }
 Object.keys(s.hero).map(Number).filter(id=>!s.party.includes(id)).slice(0,12).forEach((h,i)=>assignJob(s,h,i%8));
}
function online(s:Save,seconds:number){
 let remaining=seconds;
 while(remaining>=3){
  const battle=sampleBattle(s);if(battle.time>remaining)break;
  remaining-=battle.time;finish(s,battle,false);
  if(s.wins%12===0)manage(s);
 }
 work(s,seconds);s.updated+=seconds*1000;
}
const s=newSave(0,31415);summon(s,1);
function report(label:string){
 console.log(JSON.stringify({period:label,stage:s.stage,best:s.best,mode:s.mode,levels:s.party.map(h=>levelOf(s.hero[h].xp)),
  stars:s.party.map(h=>s.hero[h].stars),heroCount:Object.keys(s.hero).length,petCount:Object.keys(s.pet).length,
  petLevels:activeRewards(s).map(p=>levelOf(s.pet[p].xp,true)),wins:s.wins,losses:s.losses,crystals:s.crystals,keys:s.keys,gold:s.gold,loot:s.loot,retained:s.items.length}));
 if(!Number.isFinite(s.gold)||!Number.isFinite(s.totalXP)||s.items.length>400||s.party.some(id=>!heroes[id]))throw new Error('Progression invariant failed');
}
online(s,600);offline(s,3600000);manage(s);report('one hour');
for(let day=1;day<=90;day++){
 manage(s);if(s.mode==='Farm'){s.mode='Push';s.stage=s.best+1;s.wave=0;}
 online(s,180);offline(s,day*DAY);manage(s);
 if([1,7,30,90].includes(day))report(({1:'one day',7:'one week',30:'one month',90:'three months'} as Record<number,string>)[day]);
}
