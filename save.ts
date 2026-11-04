import { heroes,pets,starters,dungeons,guildJobs,worldEvents } from './content';
import { bases, makeItem, rollAffix, gearStats, slots, type Item, type RNG } from './loot';
export const MAX=1e100;
export const safe=(n:number)=>Math.max(0,Math.min(MAX,Number.isNaN(n)?0:n));
export const capStage=1_000_000_000;
export type Progress={xp:number;essence:number;stars:number};
export type HeroProgress=Progress&{pet:number|null;gear:(string|null)[];job:number|null;tree:number[];ai:'Balanced'|'Aggressive'|'Conserve';priority:number[]};
export type Metric={petId?:number;damage:number;pet:number;bonus:number;heal:number;overheal:number;shield:number;prevent:number;crits:number;misses:number;attacks:number;casts:number;deaths:number;bySkill:Record<string,number>;uptime:Record<string,number>};
export type BattleRecord={stage:number;name:string;seconds:number;win:boolean;xp:number;gold:number;items:number;damage:number;healing:number;details:Record<string,Metric>;sources:Record<string,number>;enemyUptime?:Record<string,number>;log:string[]};
export type Save={
 version:number;updated:number;stage:number;best:number;mode:'Push'|'Farm';wave:number;lastFarm:number;
 gold:number;crystals:number;keys:number;universal:number;serial:number;seed:number;egg:number[];gems:number[];hero:Record<number,HeroProgress>;pet:Record<number,Progress>;party:number[];sanctuary:number[];
 items:Item[];pity:number[];summons:number;hatches:number;summonLog:{id:number;dupe:boolean}[];hatchLog:{id:number;dupe:boolean;tier:number}[];history:string[];
 research:number;guildXp:number;guildBank:number[];jobTime:number;infirmary:number;discover:Record<string,number>;scout:number;events:number[];
 dungeon:{id:number;tier:number;wave:number;camp:boolean}|null; dungeonWins:number; loot:number;kills:number;wins:number;losses:number;seconds:number;totalGold:number;totalXP:number;
 offlineSeconds:number; records:BattleRecord[]; claimed:string[];title:string;
 loadouts:{name:string;hero:number;gear:(string|null)[]}[]; autoSell:number;settings:{speed:number;quality:number;shake:number;music:number;sfx:number};
};
const progress=():Progress=>({xp:0,essence:0,stars:0});
const heroProgress=():HeroProgress=>({...progress(),pet:null,gear:Array(10).fill(null),job:null,tree:[],ai:'Balanced',priority:[0,1,2]});
export const newSave=(now=Date.now(),seed=Math.floor(Math.random()*2**32)):Save=>({
 version:3,updated:now,stage:1,best:0,mode:'Push',wave:0,lastFarm:1,gold:40,crystals:0,keys:0,universal:0,serial:0,seed:seed>>>0,egg:[0,0,0],gems:[0,0,0,0,0,0],
 hero:Object.fromEntries(starters.map(id=>[id,heroProgress()])),pet:{},party:[...starters],sanctuary:[],items:[],pity:[0,0,0],summons:0,hatches:0,summonLog:[],hatchLog:[],history:[],research:0,guildXp:0,guildBank:Array(9).fill(0),jobTime:0,infirmary:0,discover:{},scout:0,events:Array(8).fill(0),
 dungeon:null,dungeonWins:0,loot:0,kills:0,wins:0,losses:0,seconds:0,totalGold:0,totalXP:0,offlineSeconds:0,records:[],claimed:[],title:'Wanderer',loadouts:[],autoSell:-1,settings:{speed:1,quality:2,shake:1,music:.24,sfx:.55}
});
export function restore(raw:unknown):Save{
 if(!raw||typeof raw!=='object')return newSave();
 const data=raw as Partial<Save>;
 if((data.version??1)>3)throw new Error('This save was written by a newer release.');
 const s={...newSave(),...data,version:3};
 s.settings={...newSave().settings,...data.settings};
 s.hero=Object.fromEntries(Object.entries(s.hero).filter(([id])=>heroes[+id]).map(([id,p])=>[id,{...heroProgress(),...p}]));
 s.pet=Object.fromEntries(Object.entries(s.pet).filter(([id])=>pets[+id]).map(([id,p])=>[id,{...progress(),...p}]));
 s.party=[...new Set(s.party)].filter(id=>s.hero[id]).slice(0,5);
 if(!s.party.length){for(const id of starters)s.hero[id]??=heroProgress();s.party=[...starters];}
 const reserved=new Set<number>(),worn=new Set<string>();
 for(const id of s.party)s.hero[id].job=null;
 for(const [id,h] of Object.entries(s.hero)){
  if(h.pet!==null){if(!s.pet[h.pet]||reserved.has(h.pet))h.pet=null;else reserved.add(h.pet);}
  h.gear=slots.map((_,slot)=>{
   const i=s.items.find(item=>item.id===h.gear[slot]);const base=i&&bases[i.base];
   if(!i||!base||base.slot!==slot||worn.has(i.id)||(base.role&&base.role!==heroes[+id].role))return null;
   worn.add(i.id);return i.id;
  });
  const weapon=s.items.find(i=>i.id===h.gear[4]);if(weapon&&bases[weapon.base]?.two)h.gear[5]=null;
 }
 s.sanctuary=[...new Set(s.sanctuary)].filter(id=>s.pet[id]&&!reserved.has(id)).slice(0,3);
 if(s.dungeon&&!dungeons[s.dungeon.id])s.dungeon=null;
 s.stage=Math.min(capStage,Math.max(1,s.stage));return s;
}
export function random(s:Save):number{
 s.seed=(s.seed+0x6d2b79f5)>>>0;
 let t=s.seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);
 return ((t^t>>>14)>>>0)/4294967296;
}
export const needXP=(level:number,pet=false)=>Math.floor((pet?28:34)*(level-1)**(pet?2.27:2.52)*Math.exp((level-1)/(pet?115:240)));
export function levelOf(xp:number,pet=false){let lo=1,hi=pet?100:1000;while(lo<hi){const m=Math.ceil((lo+hi)/2);if(needXP(m,pet)<=xp)lo=m;else hi=m-1;}return lo;}
export function gain(p:Progress,xp:number,pet=false){p.xp=Math.min(needXP(pet?100:1000,pet),safe(p.xp+xp));}
export const ascensionCost=(stars:number)=>2+stars*2+Math.floor(stars*stars*.32);
export function ascend(s:Save,id:number,pet=false){const p=(pet?s.pet:s.hero)[id];if(!p||p.stars>=(pet?5:10)||p.essence<ascensionCost(p.stars))return false;p.essence-=ascensionCost(p.stars);p.stars++;return true;}
export function dist(rng:RNG,weights:number[]){let x=rng()*weights.reduce((a,b)=>a+b,0);for(let i=0;i<weights.length;i++){x-=weights[i];if(x<0)return i;}return weights.length-1;}
export function summon(s:Save,count:1|10,rng:RNG=()=>random(s)){
 if(s.crystals<count)return [];s.crystals-=count;const results:Save['summonLog']=[];
 for(let i=0;i<count;i++){
  const floor=s.pity[2]>=299?4:s.pity[1]>=99?3:s.pity[0]>=19?2:count===10&&i===9&&results.every(r=>heroes[r.id].rarity===0)?1:0;
  const rarity=dist(rng,[45,30,18,6,1].map((w,i)=>i<floor?0:w));const pool=heroes.filter(h=>h.rarity===rarity);
  const id=pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))].id,dupe=!!s.hero[id];
  if(dupe)s.hero[id].essence+=1;else s.hero[id]=heroProgress();
  s.pity=s.pity.map((p,i)=>rarity>=i+2?0:p+1);s.summons++;results.push({id,dupe});
 }
 s.summonLog=[...results,...s.summonLog].slice(0,40);return results;
}
export const eggOdds=[[60,29,9,1.8,.2],[24,44,24,7,1],[4,23,42,25,6]];
export function hatch(s:Save,tier:number,rng:RNG=()=>random(s)){
 if(!eggOdds[tier]||!s.egg[tier])return null;s.egg[tier]--;
 const rarity=dist(rng,eggOdds[tier]);const pool=pets.filter(p=>p.rarity===rarity),id=pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))].id;
 const dupe=!!s.pet[id];if(dupe)s.pet[id].essence++;else s.pet[id]=progress();s.hatches++;
 const entry={id,dupe,tier};s.hatchLog.unshift(entry);s.hatchLog=s.hatchLog.slice(0,30);return entry;
}
export function assignPet(s:Save,h:number,p:number|null){
 if(!s.hero[h]||(p!==null&&!s.pet[p]))return false;
 if(p!==null){for(const hero of Object.values(s.hero))if(hero.pet===p)hero.pet=null;s.sanctuary=s.sanctuary.filter(id=>id!==p);}
 s.hero[h].pet=p;return true;
}
export function assignJob(s:Save,id:number,job:number|null){
 if(!s.hero[id]||s.party.includes(id)||(job!==null&&(!guildJobs[job]||job===8)))return false;s.hero[id].job=job;return true;
}
export function setParty(s:Save,id:number,slot:number){
 if(!s.hero[id]||slot<0||slot>s.party.length||slot>4)return false;
 const prev=s.party.indexOf(id);
 if(prev!==-1&&slot===s.party.length)return false;
 if(prev!==-1&&prev!==slot)s.party[prev]=s.party[slot];
 s.party[slot]=id;s.hero[id].job=null;return true;
}
export const equipped=(s:Save,id:string)=>Object.values(s.hero).some(h=>h.gear.includes(id));
export const wornBy=(s:Save,id:string)=>Object.keys(s.hero).find(h=>s.hero[+h].gear.includes(id));
export function canEquip(s:Save,h:number,i:Item){
 const hero=s.hero[h],b=bases[i.base];if(!hero||!b||i.level>levelOf(hero.xp)||(b.role!==null&&b.role!==heroes[h].role))return false;
 const main=s.items.find(i=>i.id===hero.gear[4]);return b.slot!==5||!main||!bases[main.base].two;
}
export function equip(s:Save,h:number,id:string){
 const i=s.items.find(i=>i.id===id);if(!i||!canEquip(s,h,i))return false;
 const slot=bases[i.base].slot;
 for(const p of Object.values(s.hero))p.gear=p.gear.map(x=>x===id?null:x);
 if(bases[i.base].two)s.hero[h].gear[5]=null;
 s.hero[h].gear[slot]=id;return true;
}
export const sellValue=(i:Item)=>5+Math.floor(i.level*(1+i.rank*.7))+i.rank*9;
export function sell(s:Save,ids:string[]){
 const selection=new Set(ids),allowed=new Set(s.items.filter(i=>selection.has(i.id)&&!i.locked&&!equipped(s,i.id)).map(i=>i.id));
 s.items=s.items.filter(i=>{if(!allowed.has(i.id))return true;s.gold=safe(s.gold+sellValue(i));return false;});
 return allowed.size;
}
export function addLoot(s:Save,stage:number,bonus=0){
 const i=makeItem(stage,()=>random(s),String(++s.serial),bonus);s.loot++;
 if(i.rank<=s.autoSell){s.gold=safe(s.gold+sellValue(i));return null;}
 if(s.items.length>=400){const discard=s.items.find(x=>!x.locked&&!equipped(s,x.id)&&x.rank<i.rank);
  if(discard)sell(s,[discard.id]);else{s.gold=safe(s.gold+sellValue(i));return null;}}
 s.items.push(i);return i;
}
export function enchant(s:Save,id:string,roll:number){
 const i=s.items.find(x=>x.id===id),cost=i?30+Math.ceil((i.level+1)**1.34)*(6+2*i.rank)+18*i.enchants**2:0;
 if(!i||!i.rolls[roll]||s.gold<cost)return false;
 s.gold-=cost;i.enchants++;i.rolls[roll].value=rollAffix(i.rolls[roll].affix,i.level,i.rank,()=>random(s));return true;
}
export const dungeonStage=(id:number,tier:number)=>Math.max(3,dungeons[id].level)+Math.floor((tier-1)**1.7*3.2);
export function startDungeon(s:Save,id:number,tier:number){
 if(s.dungeon||!dungeons[id]||!Number.isInteger(tier)||tier<1||tier>20||s.keys<1||s.best<dungeonStage(id,tier))return false;
 s.keys--;s.dungeon={id,tier,wave:0,camp:false};return true;
}
export function assignSanctuary(s:Save,p:number){
 if(s.sanctuary.includes(p)){s.sanctuary=s.sanctuary.filter(id=>id!==p);return true;}
 if(!s.pet[p]||s.sanctuary.length>=3||Object.values(s.hero).some(h=>h.pet===p))return false;
 s.sanctuary.push(p);return true;
}
export function work(s:Save,seconds:number){
 if(seconds<=0)return;
 for(const [id,h] of Object.entries(s.hero)){
  if(h.job===null||s.party.includes(+id))continue;
  const role=heroes[+id].role;const mult=1+levelOf(h.xp)*.015+([0,3,1,2,2,1,2,0][h.job]===['Guard','Striker','Caster','Support'].indexOf(role)?.35:0);
  s.guildBank[h.job]+=seconds*mult;
  if(h.job===0)gain(h,seconds*.23*mult);
 }
 for(const id of s.sanctuary)gain(s.pet[id],seconds*.18,true);
 const claim=(job:number,period:number)=>{const n=Math.floor(s.guildBank[job]/period);s.guildBank[job]-=n*period;return n;};
 const defense=claim(7,6200);s.keys+=defense;s.gold=safe(s.gold+8*claim(1,55)+60*defense);s.crystals+=claim(6,12200);
 s.research+=claim(2,145);s.gems[0]+=claim(3,1200);s.infirmary+=claim(4,180);s.scout+=claim(5,110);
 s.guildXp+=seconds*Object.values(s.hero).filter(h=>h.job!==null).length;s.jobTime+=seconds;
}
export const equippedItems=(s:Save,id:number)=>s.hero[id].gear.flatMap(id=>{const i=s.items.find(x=>x.id===id);return i?[i]:[];});
export const equippedStats=(s:Save,id:number)=>gearStats(equippedItems(s,id));
export const masteryPoints=(h:HeroProgress)=>Math.floor(levelOf(h.xp)/3)+h.stars*2-h.tree.length;
export const masteryNames=['Force','Volley','Catalyst','Pet Link','Resolve','Counter','Mend','Last Stand','Tempo','Echo','Siphon','Second Wind'];
export const masteryDescriptions=['Deal 8% more attack damage.','Strikes splash onto a second enemy.','Damage-over-time effects last one extra second.','Pets fire an extra link effect on critical hits.','Gain 12 armor.','Taking damage can trigger a counterstrike.','Healing restores 20% more health.','Gain a shield once per fight at low health.','Skills recover 13% faster.','Third skills have a chance to cast twice.','Basic attacks restore 5% of damage as health.','Heal once per fight after taking a severe hit.'];
export function train(s:Save,id:number,n:number){
 const h=s.hero[id];if(!h||n<0||n>=masteryNames.length||h.tree.includes(n)||masteryPoints(h)<=0||(n%4!==0&&!h.tree.includes(n-1)))return false;
 h.tree.push(n);return true;
}
export const achievements=Array.from({length:15},(_,group)=>{
 const groups=[
 ['Roadfinder','Highest stage',(s:Save)=>s.best,3],['Monster Hunter','Enemies defeated',(s:Save)=>s.kills,20],['Circle Keeper','Heroes collected',(s:Save)=>Object.keys(s.hero).length,3],
 ['Beast Friend','Pets collected',(s:Save)=>Object.keys(s.pet).length,2],['Star Caller','Summons',(s:Save)=>s.summons,5],['Starbound','Hero stars',(s:Save)=>Object.values(s.hero).reduce((a,h)=>a+h.stars,0),1],
 ['Hoarder','Equipment discovered',(s:Save)=>s.loot,8],['Vault Breaker','Dungeons cleared',(s:Save)=>s.dungeonWins,1],['Guild Patron','Guild work minutes',(s:Save)=>Math.floor(s.guildXp/60),5],
 ['Naturalist','Monsters discovered',(s:Save)=>Object.keys(s.discover).length,3],['Fortune Hunter','Rare encounters defeated',(s:Save)=>s.events.reduce((a,b)=>a+b,0),1],['Hatchling','Eggs hatched',(s:Save)=>s.hatches,1],
 ['War Veteran','Battles won',(s:Save)=>s.wins,8],['Blood and Gold','Adventure gold earned',(s:Save)=>s.totalGold,150],['Dreamwalker','Offline minutes earned',(s:Save)=>Math.floor(s.offlineSeconds/60),5]
 ] as const;
 const [name,category,value,base]=groups[group];
 return Array.from({length:10},(_,i)=>({id:group+'-'+i,name:name+' '+(i+1),category,value,target:[2,3,5,7,9,11,14].includes(group)?base*(i+1):Math.ceil(base*1.85**i),reward:2+Math.floor(i/2),tier:i}));
}).flat();
export function claimAchievement(s:Save,id:string){const a=achievements.find(a=>a.id===id);if(!a||s.claimed.includes(id)||a.value(s)<a.target)return false;s.claimed.push(id);s.crystals+=a.reward;if(a.tier===4||a.tier===9)s.egg[a.tier===9?2:1]++;return true;}
export const activeRewards=(s:Save)=>s.party.flatMap(h=>s.hero[h].pet===null?[]:[s.hero[h].pet!]);
export const eventLabel=(n:number)=>worldEvents[n]??'';
