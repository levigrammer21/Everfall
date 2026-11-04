import { elements, type Element, type Role } from './content';
export type RNG=()=>number;
export const slots=['Helmet','Chest','Gloves','Boots','Weapon','Offhand','Amulet','Ring 1','Ring 2','Relic'] as const;
export const itemRanks=['Common','Magic','Rare','Epic','Legendary','Mythic'];
export const itemColors=['#bbb7c7','#71e4c1','#77c7ff','#bd87ff','#ffc774','#ff6e9d'];
const names=[
['Iron Cap','Hood','Visor','War Mask','Circlet','Greathelm','Cowl','Crown','Antler Helm','Veil'],
['Chain Shirt','Breastplate','Brigandine','Travel Coat','Vest','Hide Armor','Aegis','Robe','War Plate','Mantle'],
['Gauntlets','Fingerless Gloves','Grips','Claws','Wraps','Mitts','Handguards','Fists','Vambraces','Bracers'],
['Treads','Sabatons','Trail Boots','Greaves','Sandals','Stalkers','Slippers','Iron Boots','Waders','Striders'],
['Sword','Maul','Dagger','Staff','Axe','Bow','Flail','Scythe','Spear','Scepter'],
['Buckler','Grimoire','Lantern','Tower Shield','Focus','Orb','Kite Shield','Parrying Blade','Totem','Tome'],
['Locket','Choker','Talisman','Torque','Charm','Medallion','Pendant','Collar','Fang','Chain'],
['Signet','Band','Seal','Loop','Hoop','Coil','Clasp','Wire Ring','Eye Ring','Stone Ring'],
['Copper Band','Etched Signet','Ivory Loop','Moon Ring','Suncast Ring','Glass Band','Jade Seal','Ruby Clasp','Jet Ring','Silver Coil'],
['Idol','Ember','Feather','Skull','Hourglass','Tablet','Urn','Shell','Bell','Bone']
];
export const bases=names.flatMap((row,slot)=>row.map((name,i)=>({id:slot*10+i,name,slot,two:slot===4&&[1,3,5,7,8].includes(i),role:(slot===4&&i===3?'Caster':slot===5&&i===3?'Guard':slot===5&&i===9?'Support':null) as Role|null,weight:.83+i*.045})));
export const stats=['attack','health','armor','speed','crit','critDamage','leech','healing','skill','fire','ice','storm','venom','holy','void','steel','life','resist','evade','gold','loot','shield','penetration','cooldown','regen'] as const;
export type Stat=typeof stats[number];
export type GearStats=Partial<Record<Stat,number>>;
const prefixes=['Ashen','Feral','Bright','Elder','Hollow','Primal'];
export const affixes=stats.flatMap((stat,i)=>prefixes.map((grade,j)=>({id:i*6+j,stat,name:grade+' '+stat,side:j%2?'suffix':'prefix',scale:1+j*.25})));
export const sets=['Ash Watch','Winter Oath','Night Court','Storm Kin','Bone Choir','Iron Root','Mire Runners','Sun Vault','Crimson Guard','Star Road'];
export const setStats: Stat[]=['fire','ice','void','storm','skill','armor','venom','holy','health','crit'];
export const gemStats:Stat[]=['attack','health','armor','crit','skill','resist'];
export const gemNames=['Ruby','Emerald','Onyx','Topaz','Amethyst','Sapphire'];
const legendaryNames=['Ashmaker','The Long Winter','Forked Sky','Rot Feast','First Light','Nightdrinker','Battle Cry','Green Mercy','Barbed Oath','Kindling','The Undertow','Glass Halo','Crown of Moths','The Last Word','Doom Bell','False Dawn','Buried Star','The Far Shore','Iron Sunday','The Long Tooth','Amber Wake','Hollow Crown','Blood Garden','Pale Lantern','Storm Psalm','River Mirror','Cold Iron','Salt Crown','Gutter Saint','Evernight'];
import type { Effect } from './content';
const powers:Effect[]=['burn','freeze','chain','poison','heal','leech','haste','regen','bleed','burst','pull','shield','blind','execute','fear','reflect','mark','cleanse','guard','crit','summon','weaken','root','evade','chain','reflect','push','shield','heal','execute'];
export const uniques=legendaryNames.map((name,id)=>({id,name,effect:powers[id],condition:(['cast','crit','hurt','kill','low'] as const)[id%5],power:.65+id*.023}));
export type Item={id:string;base:number;rank:number;level:number;rolls:{affix:number;value:number}[];unique:number|null;set:number|null;sockets:(number|null)[];locked:boolean;enchants:number;found:number;exceptional:boolean};
const flatStats:Stat[]=['attack','health','armor'];
export const gearLevel=(stage:number)=>Math.min(1000,Math.max(1,1+Math.floor((stage-1)*.64)));
export function rollAffix(id:number,level:number,rank:number,rng:RNG){
 const def=affixes[id]; const raw=(.7+rng()*.6)*def.scale*(1+rank*.28);
 const scale=flatStats.includes(def.stat)?(def.stat==='health'?11:3)*(1+level*.12):.019*(1+Math.log1p(level)*.22);
 return Math.round(raw*scale*10000)/10000;
}
export function makeItem(stage:number,rng:RNG,id:string,bonus=0):Item{
 const quality=rng()+Math.max(0,bonus);const rank=quality>1.0008?5:quality>.993?4:quality>.953?3:quality>.80?2:quality>.49?1:0;
 const base=Math.min(99,Math.floor(rng()*100));const level=gearLevel(stage);
 const exceptional=rng()<.00015;
 let spike=1;
 if(exceptional)while(rng()<.18&&spike<1e6)spike*=2.5;
 const rolls=Array.from({length:1+Math.min(4,rank)},(_,i)=>{
  const stat=Math.floor(rng()*stats.length),grade=2*Math.floor(rng()*3)+(i%2);
  const affix=stat*6+grade;
  return {affix,value:rollAffix(affix,level,rank,rng)*(exceptional&&i===0?2.5*spike:1)};
 });
 return {id,base,rank,level,rolls,unique:rank>=4?Math.floor(rng()*30):null,set:rank>=2&&rng()<.27?Math.floor(rng()*10):null,sockets:rank>=2&&rng()<.48?Array.from({length:rank>=4?2:1},()=>null):[],locked:false,enchants:0,found:stage,exceptional};
}
export const itemName=(i:Item)=>i.unique===null?(i.rank===0?'':affixes[i.rolls[0].affix].name.split(' ')[0]+' ')+bases[i.base].name:uniques[i.unique].name;
export function gearStats(items:Item[]):GearStats{
 const output:GearStats={},counts:number[]=Array(10).fill(0);
 const add=(stat:Stat,n:number)=>output[stat]=(output[stat]||0)+n;
 for(const item of items){
  const base=bases[item.base]; const quality=(1+item.rank*.28)*(1+item.level*.17)*base.weight;
  if(base.slot===4)add('attack',5*quality*(base.two?1.55:1));
  else if(base.slot<6){add('armor',2.5*quality);add('health',4*quality);}
  else add('skill',.025*quality);
  for(const {affix,value} of item.rolls)add(affixes[affix].stat,value);
  for(const gem of item.sockets)if(gem!==null)add(gemStats[gem],gem<3?(gem===1?13:4)*(1+item.level*.06):.035);
  if(item.set!==null)counts[item.set]++;
 }
 counts.forEach((count,id)=>{if(count>=2)add(setStats[id],setStats[id]==='health'?35:setStats[id]==='armor'?10:.16);if(count>=4)add('skill',.16);});
 return output;
}
export const opposite: Record<Element,Element>={steel:'storm',fire:'ice',ice:'fire',storm:'steel',venom:'life',holy:'void',void:'holy',life:'venom'};
export const elementNames=Object.keys(elements) as Element[];
