import { heroes, pets, worldEvents } from './content';
import { makeItem } from './loot';
import { collectLoot, gain, random, safe, type Save } from './save';

export type WorldOffer={event:1|4|5;stage:number};
const offerEvents=[1,4,5];
export function isWorldOffer(event:number):event is WorldOffer['event']{return offerEvents.includes(event);}
export function offerTitle(offer:WorldOffer){return worldEvents[offer.event];}
const cost=(stage:number)=>Math.floor(45+Math.sqrt(stage)*24);
export function offerChoices(s:Save,offer:WorldOffer){
 switch(offer.event){
  case 1:return [{name:'Buy the merchant’s cache',detail:cost(offer.stage)+' gold for one enhanced equipment roll',ready:s.gold>=cost(offer.stage)},{name:'Ask for directions',detail:'Take two summoning crystals',ready:true}];
  case 4:return [{name:'Trade a dungeon key',detail:'Receive an Enchanted Egg',ready:s.keys>0},{name:'Help repair the wagon',detail:'Earn gold and a Ruby',ready:true}];
  case 5:return [{name:'Bless the party',detail:'Active heroes receive a burst of experience',ready:true},{name:'Explore the altar',detail:'Take a dungeon key and a gem',ready:true}];
 }
}
export function resolveOffer(s:Save,choice:number){
 const offer=s.offers[0];
 if(!offer||!offerChoices(s,offer)[choice]?.ready)return false;
 s.offers.shift();
 switch(offer.event){
  case 1:
   if(choice===0){s.gold-=cost(offer.stage);collectLoot(s,makeItem(offer.stage,()=>random(s),'',.024),offerTitle(offer));}
   else s.crystals+=2;
   break;
  case 4:
   if(choice===0){s.keys--;s.egg[1]++;}
   else{s.gold=safe(s.gold+cost(offer.stage));s.gems[0]++;}
   break;
  case 5:
   if(choice===0){
    const xp=25+offer.stage*6;
    for(const id of s.party)gain(s.hero[id],xp);
    s.totalXP=safe(s.totalXP+xp);
   }else{s.keys++;s.gems[Math.floor(random(s)*s.gems.length)]++;}
 }
 return true;
}
export const guildUpgrades=[
 {name:'Training Quarters',description:'Increases hero training and expedition output.',jobs:[0,1],price:95},
 {name:'Library Annex',description:'Improves research, scouting, and infirmary output.',jobs:[2,4,5],price:135},
 {name:'Workshop',description:'Improves forging, recruitment, defense, and sanctuary training.',jobs:[3,6,7,8],price:155}
];
export const upgradeCost=(rank:number,track:number)=>Math.floor(guildUpgrades[track].price*(rank+1)**2.45);
export function upgradeGuild(s:Save,track:number){
 const rank=s.guildRanks[track];
 if(!guildUpgrades[track]||rank>=15||s.gold<upgradeCost(rank,track))return false;
 s.gold-=upgradeCost(rank,track);s.guildRanks[track]++;return true;
}
export function jobFactor(s:Save,job:number,hero?:number){
 const rank=s.guildRanks[guildUpgrades.findIndex(t=>t.jobs.includes(job))]??0;
 const favored=hero!==undefined&&hero%8===job?.2:0;
 return 1+rank*.08+favored;
}
export function grantForgeGems(s:Save,count:number){
 const favored=Math.ceil(count*.55);
 s.gems[0]+=favored;
 for(let i=0;i<Math.min(60,count-favored);i++)s.gems[1+Math.floor(random(s)*(s.gems.length-1))]++;
 const remainder=Math.max(0,count-favored-60);
 for(let i=1;i<s.gems.length;i++)s.gems[i]+=Math.floor(remainder/(s.gems.length-1))+Number(i<=remainder%(s.gems.length-1));
}
export type FarmingStats={name:string;stage:number;waves:number;wins:number;time:number;gold:number;xp:number;items:number};
export type BuildStats={name:string;hero:number;pet:number|null;profile?:string;waves:number;time:number;damage:number;petDamage:number;heal:number;taken:number;mitigated:number};
export function buildKey(s:Save,id:number){
 const h=s.hero[id];
 let hash=2166136261;
 const gear=h.gear.map(id=>{
  const item=s.items.find(i=>i.id===id);
  return item?[item.base,item.rank,item.rolls,item.set,item.unique,item.sockets]:null;
 });
 const input=JSON.stringify([h.pet,h.pet===null?0:s.pet[h.pet]?.stars,h.tree.slice().sort((a,b)=>a-b),h.stars,h.ai,h.priority,gear]);
 for(let n=0;n<input.length;n++)hash=Math.imul(hash^input.charCodeAt(n),16777619);
 return id+'-'+(hash>>>0).toString(36);
}
export const buildLabel=(id:number,pet:number|null)=>heroes[id].name+(pet===null?'':' + '+pets[pet].name);
