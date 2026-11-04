import { heroes, pets, type Effect } from './content';
import { heroProfiles } from './identity';
import { gearStats, uniques, type Item } from './loot';
import { equipRestriction, equippedItems, gearPlacement, levelOf, type Save } from './save';

export function heroSheet(s:Save,id:number,items=equippedItems(s,id)){
 const h=heroes[id],p=s.hero[id],gear=gearStats(items),level=levelOf(p.xp);
 const grow=(1+h.growth*(level-1))*(1+Math.pow(level-1,1.32)*.0048)*(1+p.stars*.085)*(1+Math.min(2,Math.sqrt(s.research)*.016));
 return {gear,health:h.hp*grow+(gear.health??0),attack:(h.atk*grow+(gear.attack??0))*(p.tree.includes(0)?1.08:1),
  armor:h.armor*(1+level*.019)+(gear.armor??0)+(p.tree.includes(4)?12:0),
  speed:Math.max(.21,h.speed/(1+(gear.speed??0))),crit:Math.min(.82,.078+(gear.crit??0))};
}

const damageWeight:Partial<Record<Effect,number>>={strike:1,burst:1.45,chain:1.55,burn:1.55,poison:1.75,bleed:1.45,freeze:.65,fear:.65,weaken:.65,summon:1.55,execute:1.3,leech:.92,reflect:.3,blind:.62,root:.60,push:.95,pull:.95,mark:.72,crit:1.57};
const aidWeight:Partial<Record<Effect,number>>={heal:1.34,regen:.90,leech:.58,revive:.75,cleanse:.55};
const guardWeight:Partial<Record<Effect,number>>={shield:1.45,guard:.9,evade:.8,freeze:.55,fear:.55,blind:.55,root:.35,weaken:.35,reflect:.18};

export function battleScore(s:Save,id:number,items=equippedItems(s,id)){
 const h=heroes[id],p=s.hero[id],stats=heroSheet(s,id,items),g=stats.gear;
 const {health,attack,armor,speed,crit}=stats;
 const elemental=1+(g[h.element]??0),amplify=attack*elemental*(1+(g.skill??0));
 const recovery=(1+(g.cooldown??0)+(p.tree.includes(8)?.15:0))*(p.ai==='Aggressive'?1/.87:1);
 const roleWeights={Guard:[3,1.30,5],Striker:[7,.65,3],Caster:[7,.55,3],Support:[4,.85,9]};
 const [offense,defense,support]=roleWeights[h.role];
 const flows={damage:attack/speed*(1+crit*(.62+(g.critDamage??0)))*elemental,heal:0,protection:0};
 const contribute=(effect:Effect,rate:number,power=amplify)=>{
  flows.damage+=power*rate*(damageWeight[effect]??0);
  flows.heal+=power*rate*(aidWeight[effect]??0);
  flows.protection+=power*rate*(guardWeight[effect]??0);
 };
 h.skills.forEach((skill,i)=>contribute(skill.effect,skill.power/skill.cool*(i<3?recovery:.35)));
 const signature=heroProfiles[id];
 contribute(signature.effect,(p.stars>=3?.83:.65)/signature.cooldown*.65);
 if(p.stars>=6)contribute(signature.starEffect,.42/signature.cooldown);
 if(p.stars>=10)contribute(signature.finalEffect,.52/signature.cooldown);
 for(const item of items)if(item.unique!==null){
  const unique=uniques[item.unique];contribute(unique.effect,unique.power/6*.42);
 }
 if(p.pet!==null&&s.pet[p.pet]){
  const pet=pets[p.pet],progress=s.pet[p.pet];
  const power=attack*.46+pet.attack*(1+levelOf(progress.xp,true)*.021);
  contribute(pet.effect,pet.power*(1+levelOf(progress.xp,true)*.029+progress.stars*.21)/pet.cool,power);
 }
 const dps=flows.damage*(1+Math.min(1,g.penetration??0)*.25);
 const healing=(flows.heal+dps*(g.leech??0)+health*(g.regen??0)*.17)*(1+(g.healing??0)+(p.tree.includes(6)?.2:0));
 const protection=flows.protection*(1+(g.shield??0));
 const durability=health*(1+Math.max(0,armor)/100)/(1-Math.min(.65,g.resist??0))/(1-Math.min(.55,g.evade??0));
 const score=Math.round(dps*offense+(durability*.48+protection*5)*defense+healing*support+p.tree.length*3);
 return {score,health,attack,armor,dps,healing,protection};
}

export function compareGear(s:Save,id:number,item:Item,before=battleScore(s,id)){
 const reason=equipRestriction(s,id,item);
 if(reason)return {reason,before,after:null,removed:[] as Item[]};
 const worn=equippedItems(s,id),placement=gearPlacement(s.hero[id].gear,item);
 const items=new Map(worn.map(old=>[old.id,old]));items.set(item.id,item);
 const next=placement.flatMap(slot=>slot===null||!items.has(slot)?[]:[items.get(slot)!]);
 const removed=worn.filter(old=>!placement.includes(old.id));
 return {reason,before,after:battleScore(s,id,next),removed};
}
