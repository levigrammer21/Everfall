import { heroes, pets, type Effect } from './content';

type Trigger = 'cast'|'hit'|'crit'|'hurt'|'kill'|'opening';
type Test = 'always'|'wounded'|'allyLow'|'boss'|'crowd'|'shielded'|'debuffed'|'healthy'|'weakened';
type Identity = [string,Trigger,Test,Effect,Effect,Effect,number];
const heroIdentity:Identity[]=[
 ['Ossuary Tide','kill','always','summon','shield','burst',4.2],
 ['Soul Tithe','kill','always','leech','mark','execute',3.7],
 ['Heartwood','hurt','allyLow','regen','root','shield',6],
 ['Under Your Skin','hit','debuffed','fear','crit','execute',4.8],
 ['Daybreak','hurt','shielded','reflect','burst','cleanse',5.8],
 ['Sewer Court','cast','crowd','summon','poison','chain',5.5],
 ['Aftershock','hurt','crowd','push','guard','burst',5],
 ['Wild Hunt','opening','always','burn','push','burst',11],
 ['Cauldron Spill','cast','debuffed','poison','summon','weaken',5.5],
 ['Harvest Night','kill','always','burn','summon','burst',4],
 ['Whiteout','hurt','always','freeze','guard','shield',5.8],
 ['Runaway Current','crit','always','chain','mark','burst',4.2],
 ['Dragonheart','cast','wounded','burn','shield','burst',5.5],
 ['Curtain Call','hurt','allyLow','summon','shield','revive',7],
 ['Abattoir','hit','weakened','bleed','leech','execute',4.4],
 ['Rookery','cast','crowd','fear','summon','chain',5.1],
 ['Bog Renewal','hurt','wounded','regen','poison','root',6.2],
 ['Outbreak','cast','debuffed','poison','heal','cleanse',5.5],
 ['Wax Seal','hit','debuffed','weaken','burn','chain',5],
 ['Shallow Grave','kill','always','summon','guard','execute',4.4],
 ['Wrong Card','crit','always','blind','chain','crit',3.4],
 ['The Queen’s Guard','hurt','allyLow','shield','summon','poison',5.8],
 ['Catch of the Night','hit','healthy','pull','freeze','leech',5.1],
 ['Iron Oath','hurt','always','guard','reflect','bleed',5.2],
 ['Spore Colony','cast','crowd','poison','regen','summon',5.9],
 ['River Offering','cast','allyLow','heal','cleanse','summon',5.8],
 ['Stone Flight','hurt','shielded','guard','push','reflect',5.8],
 ['Widowmaker','hit','boss','bleed','mark','execute',4.7],
 ['One Last Nail','cast','weakened','root','weaken','execute',5.2],
 ['Pond Ambush','opening','always','pull','poison','evade',10.2],
 ['Crooked Fortune','cast','healthy','weaken','blind','mark',5.2],
 ['Break the Line','hit','crowd','push','bleed','burst',4.8],
 ['Clockwork Drill','opening','always','shield','haste','chain',9.8],
 ['Blood Scent','hit','weakened','haste','bleed','leech',4],
 ['Dust of Ages','hurt','always','root','regen','blind',5.9],
 ['Through the Wall','cast','wounded','evade','fear','leech',5.2],
 ['Bridge Toll','hurt','wounded','regen','guard','push',6],
 ['Borrowed Eyes','crit','always','mark','blind','chain',4.8],
 ['Pressure Valve','hurt','always','burn','shield','chain',5.7],
 ['Rattletrap','hit','wounded','haste','bleed','chain',4.1],
 ['Family of Ooze','hurt','always','summon','root','shield',5.5],
 ['Old Roots','hurt','shielded','root','regen','reflect',5.7],
 ['Live Wire','cast','crowd','chain','blind','mark',4.7],
 ['Purple Comet','cast','healthy','burn','push','burst',5.6],
 ['Double Brine','cast','debuffed','poison','root','burst',4.8],
 ['Bubble Bath','cast','allyLow','heal','shield','cleanse',5.3],
 ['Scrap Counter','hurt','always','reflect','bleed','shield',5.7],
 ['Snack Break','hit','weakened','leech','haste','execute',4.1],
 ['Sand in the Eyes','cast','crowd','blind','weaken','mark',5.2],
 ['Earthquake','opening','always','root','pull','bleed',9.4]
];
const petIdentity:Identity[]=[
 ['Golden Quack','kill','always','mark','heal','shield',5.2],['Rolling Cover','hurt','wounded','shield','guard','reflect',6.3],
 ['Stinger Rush','crit','always','poison','crit','mark',4.2],['Lantern Flash','opening','always','mark','blind','chain',8.1],
 ['Tripwire','hit','healthy','root','poison','pull',4.9],['Mud Pack','hurt','allyLow','heal','guard','regen',6.7],
 ['Night Feeding','hit','weakened','leech','bleed','evade',4.9],['Shell Tuck','hurt','always','guard','root','shield',6.3],
 ['Rime Track','hit','debuffed','freeze','root','mark',5.7],['Static Squeak','crit','always','chain','mark','burst',4.4],
 ['Cold Spot','cast','healthy','weaken','evade','fear',5.6],['False Bottom','kill','always','strike','execute','burst',5.5],
 ['Pond Splash','cast','crowd','poison','burst','root',6.1],['Wind the Spring','cast','always','haste','chain','guard',6.4],
 ['Nine Shadows','hurt','wounded','evade','crit','leech',6.8],['Fairy Ring','cast','allyLow','regen','poison','heal',6.4],
 ['Pocket Funeral','hit','weakened','execute','mark','chain',5.1],['Ember Tail','hit','debuffed','burn','burst','haste',5.2],
 ['Crystal Dome','hurt','allyLow','shield','guard','cleanse',7.1],['Storm Watch','crit','crowd','chain','mark','blind',4.5],
 ['Short Fuse','cast','crowd','burst','burn','push',5.8],['Court Blessing','cast','allyLow','heal','cleanse','shield',6.4],
 ['Fault Line','hit','shielded','weaken','pull','root',5.6],['Dragon Sparks','hit','always','burn','burst','mark',5],
 ['Gilded Nest','opening','always','shield','mark','heal',9.3],['Rise Again','hurt','allyLow','regen','burn','cleanse',7.5],
 ['Bad Dream','cast','debuffed','fear','leech','weaken',6],['Stone Intercept','hurt','allyLow','shield','guard','reflect',6.9],
 ['Last Word','kill','always','chain','execute','mark',4.9],['Unstable Shell','cast','always','burst','cleanse','chain',6.3]
];
const describeTrigger:Record<Trigger,string>={cast:'Casting a skill',hit:'Landing a basic hit',crit:'Landing a critical hit',hurt:'Taking HP damage',kill:'Defeating an enemy',opening:'Entering combat'};
const describeTest:Record<Test,string>={always:'',wounded:' while below 55% HP',allyLow:' while an ally is below 62% HP',boss:' against a boss',crowd:' with multiple enemies alive',shielded:' while a shield is present',debuffed:' against an afflicted foe',healthy:' against a foe above 70% HP',weakened:' against a foe below 42% HP'};
function profile(row:Identity){
 const [name,trigger,test,effect,starEffect,finalEffect,cooldown]=row;
 return {name,trigger,test,effect,starEffect,finalEffect,cooldown,description:describeTrigger[trigger]+describeTest[test]};
}
export const heroProfiles=heroIdentity.map(profile);
export const petProfiles=petIdentity.map(profile);
export type IdentityTrigger=Trigger;
export type IdentityTest=Test;
const rolePaths={Guard:['Ward','Retaliation','Vanguard'],Striker:['Hunt','Evasion','Tempo'],Caster:['Channel','Control','Echo'],Support:['Sanctuary','Remedy','Harmony']} as const;
const legacy=[
 'Gain 8% attack.','Basic hits splash.','Damage over time lasts longer.','Critical hits can trigger your companion.',
 'Gain 12 armor.','Taking damage can trigger a counter.','Gain 20% healing.','Gain a shield at low HP.',
 'Skills recharge faster.','Third skills can echo.','Basic hits restore health.','Recover after a severe hit.'
];
export function heroMastery(id:number,index:number){
 const hero=heroes[id],sig=heroProfiles[id],path=rolePaths[hero.role][Math.floor(index/4)],tier=index%4;
 const actions=hero.skills.map(s=>s.name);
 const titles=[path+' Training',actions[Math.floor(index/4)]+' Link',sig.name+' Focus',sig.name+' · '+path];
 const suffix=tier===1?' The matching active skill recovers 12% faster.':tier===2?' Signature also triggers more often.':tier===3?' Signature adds '+[sig.starEffect,sig.finalEffect,hero.skills[2].effect][Math.floor(index/4)]+'. Choose one new capstone per hero.':'';
 return {title:titles[tier],description:legacy[index]+suffix,path};
}
export function petPair(hero:number,pet:number){
 const a=heroes[hero],b=pets[pet],p=petProfiles[pet];
 if(a.element===b.element)return {power:.23,label:'Matching elements · +23% companion signature power'};
 if(a.skills.some(s=>s.effect===p.effect||s.effect===p.starEffect))return {power:.15,label:'Shared effects · +15% companion signature power'};
 if(a.role==='Guard'&&p.trigger==='hurt'||a.role==='Striker'&&(p.trigger==='crit'||p.trigger==='hit')||a.role==='Caster'&&p.trigger==='cast'||a.role==='Support'&&p.test==='allyLow')
  return {power:.12,label:'Role pairing · +12% companion signature power'};
 return {power:0,label:'Independent pairing'};
}
export const skillCombos=heroProfiles.map((profile,id)=>{
 const hero=heroes[id];
 return [
  {effect:profile.effect,description:'Opens a combo on its target for five seconds.'},
  {effect:profile.starEffect,description:'On a combo target, adds '+profile.starEffect+'.'},
  {effect:profile.finalEffect,description:'Consumes a combo to add '+profile.finalEffect+'.'},
  {effect:profile.effect,description:'On a combo target, adds a smaller '+profile.effect+' effect.'},
  {effect:hero.skills[1].effect,description:'On a combo target, helps the second active skill recover.'}
 ] as const;
});
