import { lootHistory, achievements, activeRewards, ascensionCost, canEquip, equipped, equippedItems, levelOf, masteryDescriptions, masteryNames, masteryPoints, needXP, sellValue, wornBy, type Save } from './save';
import { biomes, bonds, colors, dungeons, eggNames, eliteMods, elements, enemies, guildJobs, heroLore, heroes, pets, rarities, worldEvents } from './content';
import { affixes, bases, gemNames, itemColors, itemName, itemRanks, opposite, sets, slots, uniques, type Item } from './loot';
import { actorAtlas, rgb } from './art';
import { compatible } from './progression';
export const tabs=['Adventure','Heroes','Pets','Inventory','Summon','Dungeons','Guild','Stats'] as const;
const icons:Record<string,string>={
 Adventure:'<path d="m4 19 6-7 4 4 6-8M4 19h16M16 8h4v4"/>',Heroes:'<path d="M12 3 20 7v6c0 4-4 7-8 9-4-2-8-5-8-9V7l8-4Zm-3 9 2 2 4-5"/>',
 Pets:'<path d="M8 11c-1.5 0-3-2-3-4s1-3 2-3 3 2 3 4-1 3-2 3Zm8 0c-1 0-2-1-2-3s2-4 3-4 2 1 2 3-1.5 4-3 4Zm-4 1c3 0 7 4 7 6s-2 3-4 2l-3-1-3 1c-2 1-4 0-4-2s4-6 7-6Z"/>',
 Inventory:'<path d="M3 8h18v12H3zM4 8l3-4h10l3 4M3 12h18m-11-2h4v5h-4z"/>',Summon:'<path d="m12 2 2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2ZM19 17v5m-2.5-2.5h5"/>',
 Dungeons:'<path d="M4 20V9l8-6 8 6v11M8 20v-8l4-3 4 3v8M2 20h20"/>',Guild:'<path d="M3 20h18M5 20V9l7-5 7 5v11m-9 0v-6h4v6M8 10h8"/>',
 Stats:'<path d="M3 20h18M6 17v-4m4 4V8m4 9v-6m4 6V4"/>',gear:'<path d="m9 3 1 3h4l1-3 3 2-1 3 2 2 3-1v4l-3 1-2 3 1 2-3 2-1-3h-4l-1 3-3-2 1-2-2-3-3-1V9l3 1 2-2-1-3 3-2Z"/><circle cx="12" cy="12" r="3"/>',
 gold:'<path d="M3 8v8c0 2 4 4 9 4s9-2 9-4V8M3 12c0 2 4 4 9 4s9-2 9-4"/><ellipse cx="12" cy="8" rx="9" ry="4"/>',crystal:'<path d="m12 2 7 6-1 8-6 6-6-6-1-8 7-6Zm0 0v20M5 8h14"/>',
 key:'<path d="M14 5a5 5 0 1 1-3.7 8.4L4 20H2v-3l6.6-6.2A5 5 0 0 1 14 5Zm0 4h1"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',sword:'<path d="m5 20 5-5m-5-3 7 7m-5-5L17 4l4-1-1 4-10 10"/>',pause:'<path d="M9 5v14m6-14v14"/>',play:'<path d="m8 5 12 7-12 7z"/>'
};
export const icon=(name:string)=>'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(icons[name]??icons.sword)+'</svg>';
export const esc=(value:string|number)=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export const num=(n:number)=>n>=1e15?n.toExponential(2):new Intl.NumberFormat('en',{notation:n>=10000?'compact':'standard',maximumFractionDigits:n>=100?.0:1}).format(n);
export const dur=(n:number)=>n>=3600?Math.floor(n/3600)+'h '+Math.floor(n/60%60)+'m':n>=60?Math.floor(n/60)+'m '+Math.floor(n%60)+'s':n.toFixed(1)+'s';
let portraitSheet:ReturnType<typeof actorAtlas>|null=null;
export function portrait(key:string){
 if(!portraitSheet){portraitSheet=actorAtlas();document.documentElement.style.setProperty('--portraits','url('+portraitSheet.canvas.toDataURL()+')');}
 const f=portraitSheet.frames[key];
 return f?'<i class="portrait" aria-hidden="true" style="--px:'+(-f.x*1.5)+'px;--py:'+(-f.y*1.5)+'px;--ph:'+(portraitSheet.canvas.height*1.5)+'px"></i>':'';
}
export type View={tab:typeof tabs[number]|null;hero:number;pet:number;item:string;search:string;filter:string;sort:string;page:number;stat:string;statIndex:number;compareIndex:number;setting:boolean;pop:{title:string;body:string;style?:string}|null;sync:string;email:string;pause:boolean;inventory:'Gear'|'Loot log'|'Loadouts';itemFocus:boolean};
export const defaultView=():View=>({tab:null,hero:39,pet:0,item:'',search:'',filter:'All',sort:'Rarity',page:0,stat:'Battle report',statIndex:0,compareIndex:1,setting:false,pop:null,sync:'Local save',email:'',pause:false,inventory:'Gear',itemFocus:false});
export const btn=(label:string,action:string,cls='',disabled=false)=>'<button class="btn '+cls+'" data-action="'+esc(action)+'"'+(disabled?' disabled':'')+'>'+label+'</button>';
const pill=(label:string,col='')=>'<span class="pill"'+(col?' style="--tone:'+col+'"':'')+'>'+esc(label)+'</span>';
const message=(body:string)=>'<div class="empty">'+body+'</div>';
const hgroup=(eyebrow:string,title:string,sub:string)=>'<header class="section-head"><p class="eyebrow">'+eyebrow+'</p><h2>'+title+'</h2><p>'+sub+'</p></header>';
const select=(key:string,items:[string|number,string][],active:string|number,aria:string)=>'<select aria-label="'+esc(aria)+'" data-change="'+esc(key)+'">'+items.map(([value,label])=>'<option value="'+esc(value)+'"'+(value===active?' selected':'')+'>'+esc(label)+'</option>').join('')+'</select>';
const sortValues:[string,string][]=[['Rarity','Rarity'],['Name','Name'],['Level','Level'],['Recent','Recent']];
const heroPill=(id:number)=>pill(rarities[heroes[id].rarity],colors[heroes[id].rarity]);
const petPill=(id:number)=>pill(rarities[pets[id].rarity],colors[pets[id].rarity]);
function filters(v:View,options:string[],sort=true){
 return '<div class="tools"><input data-input="search" aria-label="Search collection" placeholder="Search…" value="'+esc(v.search)+'">'+select('filter',['All',...options].map(k=>[k,k]),v.filter,'Filter')+(sort?select('sort',sortValues,v.sort,'Sort'):'')+'</div>';
}
const match=(name:string,q:string)=>name.toLowerCase().includes(q.trim().toLowerCase());
function sortList<T extends {id:number;name:string;rarity:number}>(list:T[],s:Save,v:View,isPet=false){
 const p=isPet?s.pet:s.hero;
 return list.sort((a,b)=>v.sort==='Name'?a.name.localeCompare(b.name):v.sort==='Level'?(p[b.id]?.xp??-1)-(p[a.id]?.xp??-1):v.sort==='Recent'?b.id-a.id:b.rarity-a.rarity);
}
const itemPortrait=(base:number,rank:number)=>'<i class="item-art" style="--tone:'+itemColors[rank]+'">'+portrait('i'+base)+'</i>';
const slotIcon=(slot:number)=>icon(slot===4?'sword':slot===8||slot===7||slot===6?'crystal':slot===9?'Summon':slot===5?'Heroes':'Inventory');
function skillText(effect:string){return ({
 strike:'Deals direct damage.',burst:'Hits a primary target and splashes onto nearby enemies.',chain:'Jumps between enemies.',burn:'Burns the target over time.',poison:'Poisons multiple targets over time.',bleed:'Inflicts ongoing physical damage.',freeze:'Stops enemy actions briefly.',fear:'Prevents enemy actions briefly.',weaken:'Reduces enemy damage and makes it easier to hurt.',heal:'Restores health to injured allies.',shield:'Absorbs damage for vulnerable allies.',guard:'Reduces damage taken.',summon:'Summons a temporary ally.',execute:'Deals heavy damage to weakened enemies.',haste:'Speeds up basic attacks and skill recovery.',leech:'Deals damage and restores health.',reflect:'Returns part of incoming damage.',blind:'Makes the target miss more often.',root:'Prevents movement briefly.',push:'Knocks a target away.',pull:'Drags a target closer.',mark:'Increases damage taken by the target.',regen:'Restores health over time.',revive:'Revives a fallen ally once per encounter.',evade:'Dodges a portion of incoming attacks.',cleanse:'Removes harmful effects and restores health.',crit:'Delivers a guaranteed critical strike.'
 } as Record<string,string>)[effect]??effect;}
const skills=(list:{name:string;effect:string;cool:number;trigger?:string}[])=>list.map(k=>'<div class="skill"><strong>'+esc(k.name)+'</strong><small>'+esc(k.trigger?'On '+k.trigger:k.cool.toFixed(1)+'s cooldown')+'</small><p>'+skillText(k.effect)+'</p></div>').join('');
const heroLv=(s:Save,id:number)=>s.hero[id]?levelOf(s.hero[id].xp):1;
const petLv=(s:Save,id:number)=>s.pet[id]?levelOf(s.pet[id].xp,true):1;
const levels=(xp:number,pet=false)=>{
 const l=levelOf(xp,pet),cap=pet?100:1000,base=needXP(l,pet),next=needXP(l+1,pet),percent=l===cap?100:Math.floor((xp-base)/(next-base)*100);
 return '<div class="xp"><span>Level '+l+' / '+cap+'</span><span>'+ (l===cap?'Max level':num(xp-base)+' / '+num(next-base)+' XP')+'</span><div class="meter"><i style="width:'+percent+'%"></i></div></div>';
};
const char=(key:string,name:string,sub:string,action:string,selected:boolean,rarity:number,locked=false)=>'<button class="char'+(selected?' selected':'')+(locked?' locked':'')+'" data-action="'+action+'" style="--tone:'+colors[rarity]+'">'+portrait(key)+'<span><strong>'+esc(name)+'</strong><small>'+esc(sub)+'</small></span></button>';
const section=(title:string,html:string)=>'<section class="box"><h3>'+title+'</h3>'+html+'</section>';
const listPage=(v:View,count:number,size:number)=>count<=size?'':'<div class="pages">'+btn('Previous','page:-1','quiet',v.page<=0)+'<small>Page '+(v.page+1)+' of '+Math.ceil(count/size)+'</small>'+btn('Next','page:1','quiet',(v.page+1)*size>=count)+'</div>';
function heroPanel(s:Save,v:View){
 const h=heroes[v.hero],p=s.hero[h.id],slot=s.party.indexOf(h.id),items=p?equippedItems(s,h.id):[];
 const list=sortList(heroes.filter(x=>match(x.name,v.search)&&(v.filter==='All'||(v.filter==='Owned'?s.hero[x.id]:v.filter==='Active'?s.party.includes(x.id):rarities[x.rarity]===v.filter))),s,v);
 const detail='<div class="subject" style="--tone:'+colors[h.rarity]+'">'+portrait('h'+h.id)+'<div><div class="tagrow">'+heroPill(h.id)+pill(h.role)+pill(h.element,rgb(elements[h.element]))+'</div><h3>'+esc(h.name)+'</h3><p>'+[h.hp+' base HP',h.atk.toFixed(0)+' base attack',h.armor.toFixed(0)+' base armor'].join(' · ')+'</p><p>'+esc(heroLore[h.id])+'</p></div></div>';
 const activeBonds=bonds.filter(b=>b.a===h.id||b.b===h.id);
 return hgroup('THE WAR BAND','Heroes',Object.keys(s.hero).length+' / 50 collected · arrange five active heroes')+filters(v,['Owned','Active',...rarities])+
 '<div class="split"><div><div class="collection">'+(list.slice(v.page*12,v.page*12+12).map(x=>char('h'+x.id,x.name,s.hero[x.id]?'Lv. '+heroLv(s,x.id)+' · '+x.role:rarities[x.rarity]+' · Undiscovered','hero:'+x.id,x.id===h.id,x.rarity,!s.hero[x.id])).join('')||message('No heroes match.'))+'</div>'+listPage(v,list.length,12)+'</div><div class="details">'+detail+
 (p?levels(p.xp)+section('Formation & behavior','<div class="controls">'+select('party:'+h.id,[[-1,'Choose formation slot'],...[0,1,2,3,4].map((i):[number,string]=>[i,(i+1)+'. '+(s.party[i]!==undefined?heroes[s.party[i]].name:'Empty')])],slot,'Formation slot')+(slot<0&&s.party.length<5?btn('Add to party','partyAdd:'+h.id,'gold'):'')+
 select('ai:'+h.id,['Balanced','Aggressive','Conserve'].map(x=>[x,x]),p.ai,'Combat AI')+'</div><p class="muted">Skill priority</p><div class="controls">'+p.priority.map((n,i)=>btn((i+1)+'. '+esc(h.skills[n].name),'priority:'+h.id+':'+i,'quiet')).join('')+'</div>')+
 section('Equipment & companion','<div class="gear-grid">'+slots.map((name,i)=>{const item=items.find(g=>g.id===p.gear[i]);return btn((item?itemPortrait(item.base,item.rank):slotIcon(i))+'<span>'+name+'<small>'+(item?esc(itemName(item)):'Empty')+'</small></span>',item?'item:'+item.id:'slot:'+i,'gear-slot');}).join('')+'</div><div class="controls"><label>Companion '+select('petFor:'+h.id,[[-1,'No pet'],...Object.keys(s.pet).map((id):[number,string]=>[+id,pets[+id].name])],p.pet??-1,'Hero companion')+'</label>'+
 btn('Save equipment loadout','saveLoadout:'+h.id,'quiet',s.loadouts.length>=12)+'</div>')+
 section('Ascension','<p>'+p.stars+' / 10 stars · '+p.essence+' '+esc(h.name)+' Essence</p><div class="controls">'+btn('Ascend · '+ascensionCost(p.stars)+' essence','ascendH:'+h.id,'gold',p.stars>=10||p.essence<ascensionCost(p.stars))+btn('Convert 5 spare essence','convert:'+h.id,'quiet',p.stars<10||p.essence<5)+'</div>')+
 section('Mastery · '+masteryPoints(p)+' points','<div class="tree">'+masteryNames.map((n,i)=>btn('<strong>'+n+'</strong><small>'+masteryDescriptions[i]+'</small>','master:'+h.id+':'+i,p.tree.includes(i)?'mastery on':'mastery',p.tree.includes(i)||masteryPoints(p)<=0||(i%4!==0&&!p.tree.includes(i-1)))).join('')+'</div>'+btn('Respec · 60 gold','respec:'+h.id,'quiet',!p.tree.length||s.gold<60)):'<p class="muted">Unlock through the summoning circle. You can inspect abilities before collecting this hero.</p>')+
 section('Abilities',skills(h.skills))+section('Character bonds',activeBonds.map(b=>'<div class="skill"><strong>'+esc(b.name)+'</strong><small>'+(s.party.includes(b.a)&&s.party.includes(b.b)?'Active':'Inactive')+'</small><p>With '+esc(heroes[b.a===h.id?b.b:b.a].name)+'. '+skillText(b.effect)+'</p></div>').join('')||'<p class="muted">No recorded bonds.</p>')+'</div></div>';
}
function petPanel(s:Save,v:View){
 const pet=pets[v.pet],p=s.pet[pet.id],list=sortList(pets.filter(x=>match(x.name,v.search)&&(v.filter==='All'||(v.filter==='Owned'?s.pet[x.id]:rarities[x.rarity]===v.filter))),s,v,true);
 const owner=Object.keys(s.hero).find(id=>s.hero[+id].pet===pet.id);
 return hgroup('THE SANCTUARY','Pets',Object.keys(s.pet).length+' / 30 collected · one companion per hero')+
 '<div class="egg-row">'+eggNames.map((e,i)=>'<div class="egg-card" style="--tone:'+colors[i+1]+'">'+portrait('segg'+(i+2))+'<span><strong>'+e+'</strong><small>'+num(s.egg[i])+' available</small></span>'+btn('Hatch','hatch:'+i,'quiet',!s.egg[i])+'</div>').join('')+'</div>'+
 eggDisclosure()+filters(v,['Owned',...rarities])+'<div class="split"><div><div class="collection">'+(list.slice(v.page*12,v.page*12+12).map(x=>char('p'+x.id,x.name,s.pet[x.id]?'Lv. '+petLv(s,x.id)+' · '+x.effect:rarities[x.rarity]+' · Undiscovered','pet:'+x.id,x.id===pet.id,x.rarity,!s.pet[x.id])).join('')||message('No pets match.'))+'</div>'+listPage(v,list.length,12)+'</div>'+
 '<div class="details"><div class="subject" style="--tone:'+colors[pet.rarity]+'">'+portrait('p'+pet.id)+'<div><div class="tagrow">'+petPill(pet.id)+pill(pet.element,rgb(elements[pet.element]))+'</div><h3>'+esc(pet.name)+'</h3></div></div>'+
 (p?levels(p.xp,true)+section('Companion assignment',select('owner:'+pet.id,[[-1,'Unassigned'],...Object.keys(s.hero).map((h):[number,string]=>[+h,heroes[+h].name])],owner===undefined?-1:+owner,'Companion owner')+
 '<p class="muted">'+(owner===undefined?'Transfer this pet freely between heroes.':compatible(+owner,pet.id).join('. '))+'</p>'+btn(s.sanctuary.includes(pet.id)?'Remove from training':'Train in sanctuary','sanctuary:'+pet.id,'quiet',owner!==undefined||(!s.sanctuary.includes(pet.id)&&s.sanctuary.length>=3)))+
 section('Ascension','<p>'+p.stars+' / 5 stars · '+p.essence+' '+esc(pet.name)+' Essence</p>'+btn('Ascend · '+ascensionCost(p.stars)+' essence','ascendP:'+pet.id,'gold',p.stars>=5||p.essence<ascensionCost(p.stars))):'<p class="muted">Hatch eggs from combat, dungeons, and achievements.</p>')+
 section('Companion ability',skills([{name:pet.name,effect:pet.effect,cool:pet.cool},{name:'Attack link',effect:pet.link,cool:2.7,trigger:'attack or critical hit'}]))+
 section('Party compatibility',s.party.map(h=>'<p><strong>'+esc(heroes[h].name)+'</strong><br><span class="muted">'+esc(compatible(h,pet.id).join('. '))+'</span></p>').join(''))+
 section('Hatch history',s.hatchLog.slice(0,8).map(x=>'<p>'+esc(pets[x.id].name)+(x.dupe?' · essence':' · new companion')+'</p>').join('')||'<p class="muted">No eggs hatched yet.</p>')+'</div></div>';
}
function rolls(i:Item){
 return i.rolls.map((r,k)=>'<div class="skill"><strong>'+esc(affixes[r.affix].name)+'</strong><small>+'+num(r.value*(['attack','health','armor'].includes(affixes[r.affix].stat)?1:100))+(['attack','health','armor'].includes(affixes[r.affix].stat)?'':'%')+'</small><p>'+esc(affixes[r.affix].side)+' '+btn('Reroll','enchant:'+i.id+':'+k,'micro')+'</p></div>').join('');
}
function itemPanel(s:Save,v:View){
 const log=lootHistory(s),counts=Array(6).fill(0);for(const drop of log)counts[drop.rank]++;
 const header=hgroup('THE ARMORY','Inventory',num(s.items.length)+' / 400 slots · '+num(s.loot)+' lifetime drops')+
 '<div class="inventory-switch">'+(['Gear','Loot log','Loadouts'] as const).map(key=>btn(key+(key==='Loot log'&&log.length?' <span>'+log.length+'</span>':''),'inventory:'+key,key===v.inventory?'gold':'quiet')).join('')+'</div>';
 if(v.inventory==='Loot log'){
  return header+'<div class="loot-intro"><strong>Recent drops</strong><span>Loot is collected on victory</span></div><div class="loot-ranks">'+itemRanks.flatMap((name,i)=>counts[i]?[pill(name+' '+counts[i],itemColors[i])]:[]).join('')+'</div>'+
   '<div class="loot-feed">'+(log.map(drop=>{
    const item=s.items.find(i=>i.id===drop.id);
    const tag=drop.kept?(item?'In inventory':'Removed'):'Auto-sold';
    const copy=itemPortrait(drop.base,drop.rank)+'<span class="drop-copy"><small>'+itemRanks[drop.rank]+' · '+slots[bases[drop.base].slot]+' · Lv. '+drop.level+'</small><strong>'+esc(drop.name)+'</strong><span>Stage '+num(drop.stage)+(drop.source?' · '+esc(drop.source):'')+'</span></span><span class="drop-state">'+tag+(item?' ›':'')+'</span>';
    return item?'<button class="loot-card" style="--tone:'+itemColors[drop.rank]+'" data-action="item:'+esc(drop.id)+'">'+copy+'</button>':'<div class="loot-card" style="--tone:'+itemColors[drop.rank]+'">'+copy+'</div>';
   }).join('')||message('Win encounters to collect gear. Your latest drops will appear here.'))+'</div>';
 }
 if(v.inventory==='Loadouts')return header+section('Saved loadouts',s.loadouts.map((l,index)=>'<div class="controls"><strong>'+esc(l.name)+'</strong>'+btn('Apply','loadout:'+index,'quiet')+btn('Remove','deleteLoadout:'+index,'micro')+'</div>').join('')||'<p class="muted">Save a hero’s current equipment from the Heroes panel.</p>');
 const visible=s.items.filter(i=>match(itemName(i)+' '+bases[i.base].name,v.search)&&(v.filter==='All'||v.filter===slots[bases[i.base].slot]||v.filter===itemRanks[i.rank]||(v.filter==='Equipped'&&equipped(s,i.id))||(v.filter==='Locked'&&i.locked))).sort((a,b)=>v.sort==='Name'?itemName(a).localeCompare(itemName(b)):v.sort==='Level'?b.level-a.level:v.sort==='Recent'?+b.id-+a.id:b.rank-a.rank||b.level-a.level);
 const i=s.items.find(x=>x.id===v.item)??visible[0],hero=s.hero[v.hero]?v.hero:s.party[0],base=i?bases[i.base]:null;
 const compare=base?s.items.find(x=>s.hero[hero].gear[base.slot]===x.id):undefined,owner=i?wornBy(s,i.id):undefined;
 return header+'<div class="inventory-tools'+(v.itemFocus?' inspecting':'')+'">'+filters(v,['Equipped','Locked',...itemRanks,...slots])+
 '<div class="controls toolbar">'+select('autoSell',[[-1,'Auto-sell off'],...[0,1,2,3].map((n):[number,string]=>[n,'Sell '+itemRanks[n]+' and lower'])],s.autoSell,'Auto-sell threshold')+btn('Sell filtered unlocked gear','bulk','quiet',!visible.some(i=>!i.locked&&!equipped(s,i.id)))+'</div></div>'+
 '<div class="split inventory-layout'+(v.itemFocus?' inspecting':'')+'"><div class="gear-list"><div class="collection">'+(visible.slice(v.page*12,v.page*12+12).map(j=>'<button class="char item '+(i?.id===j.id?'selected':'')+'" data-action="item:'+j.id+'" style="--tone:'+itemColors[j.rank]+'">'+itemPortrait(j.base,j.rank)+'<span><strong>'+esc(itemName(j))+'</strong><small>'+slots[bases[j.base].slot]+' · Lv. '+j.level+(j.locked?' · Locked':'')+(equipped(s,j.id)?' · Worn':'')+'</small></span></button>').join('')||message('No gear matches. Equipment drops during adventure.'))+'</div>'+listPage(v,visible.length,12)+'</div><div class="details inventory-detail">'+
 btn('‹ Back to gear','itemList','quiet item-back')+(i&&base?'<div class="subject" style="--tone:'+itemColors[i.rank]+'">'+itemPortrait(i.base,i.rank)+'<div><div class="tagrow">'+pill(itemRanks[i.rank],itemColors[i.rank])+pill(slots[base.slot])+'</div><h3>'+esc(itemName(i))+'</h3><p>Level '+i.level+(base.role?' · '+base.role:'')+(base.two?' · Two-handed':'')+' · Found at stage '+num(i.found)+(i.exceptional?' · Exceptional roll':'')+'</p></div></div>'+
 '<div class="controls">'+select('gearHero',Object.keys(s.hero).map(id=>[+id,heroes[+id].name]),hero,'Equipment recipient')+btn(owner===String(hero)?'Unequip':'Equip / transfer',owner===String(hero)?'unequip:'+hero+':'+base.slot:'equip:'+hero+':'+i.id,'gold',owner!==String(hero)&&!canEquip(s,hero,i))+btn(i.locked?'Unlock':'Lock','lock:'+i.id,'quiet')+btn('Sell · '+sellValue(i),'sell:'+i.id,'quiet',i.locked||!!owner)+'</div>'+
 (owner?'<p class="muted">Worn by '+esc(heroes[+owner].name)+'</p>':'')+
 section('Rolled properties',rolls(i)+(i.set===null?'':'<p>'+esc(sets[i.set])+' · set bonuses at 2 and 4 pieces</p>')+(i.unique===null?'':'<p><strong>'+esc(uniques[i.unique].name)+'</strong> · On '+uniques[i.unique].condition+'. '+skillText(uniques[i.unique].effect)+'</p>'))+
 (i.sockets.length?section('Sockets',i.sockets.map((gem,n)=>'<div class="controls"><span>Socket '+(n+1)+'</span>'+select('gem:'+i.id+':'+n,[[-1,'Empty'],...gemNames.map((g,id):[number,string]=>[id,g+' · '+s.gems[id]+' in bag'])],gem??-1,'Socket gem')+'</div>').join('')):'')+
 (compare&&compare.id!==i.id?section('Currently worn · '+esc(itemName(compare)),rolls(compare)):''):message('Select an item to compare its properties.'))+
 '</div></div>';
}
function summonPanel(s:Save){
 return hgroup('THE ASTRAL CIRCLE','Summon','Spend crystals earned in combat, through achievements, and from guild assignments.')+
 '<div class="summon-art"><div class="sigil"><i></i><i></i><i></i>'+icon('Summon')+'</div><div class="tagrow">'+pill(num(s.crystals)+' crystals','#9fe5ff')+pill(Object.keys(s.hero).length+' / 50 collected')+pill(num(s.summons)+' lifetime draws')+'</div><div class="controls">'+btn('Summon one · 1','summon:1','gold',s.crystals<1)+btn('Summon ten · 10','summon:10','bright',s.crystals<10)+'</div></div>'+
 '<div class="columns">'+section('Base rates & pity','<div class="tagrow">'+rarities.map((r,i)=>pill(r+' '+[45,30,18,6,1][i]+'%',colors[i])).join('')+'</div><p>Ten draws guarantee Rare or better. Pity resets when you pull the qualifying rarity or higher.</p>'+[20,100,300].map((n,i)=>'<p>'+rarities[i+2]+' pity · '+s.pity[i]+' / '+n+'</p>').join(''))+
 section('Recent summons',s.summonLog.slice(0,8).map(x=>'<p>'+esc(heroes[x.id].name)+(x.dupe?' · essence':' · new hero')+'</p>').join('')||'<p class="muted">No summons yet.</p>')+'</div>';
}
function dungeonPanel(s:Save){
 const run=s.dungeon;
 return hgroup('BELOW THE ROAD','Dungeons',num(s.keys)+' keys · '+num(s.dungeonWins)+' clears · 20 difficulty tiers')+
 (run?section('Active expedition','<p>'+esc(dungeons[run.id].name)+' · Tier '+run.tier+' · Wave '+(run.wave+1)+' / '+dungeons[run.id].waves+'</p><div class="controls">'+btn('Enter next wave','resumeDungeon','gold',!run.camp)+btn('Retreat','retreatDungeon','quiet',!run.camp)+'</div>'):'')+
 '<div class="columns">'+dungeons.map((d,i)=>section(d.name,'<p>'+esc(d.detail)+'</p><p class="muted">'+d.waves+' waves · Requires cleared stage '+Math.max(3,d.level)+'</p><div class="controls"><label>Tier '+select('tier:'+i,Array.from({length:20},(_,t)=>[t+1,String(t+1)]),1,'Dungeon tier')+'</label>'+btn('Enter · 1 key','dungeon:'+i,'gold',!!run||s.keys<1||s.best<Math.max(3,d.level))+'</div>')).join('')+'</div>';
}
const jobDetail=['Slow, steady XP for the assigned hero.','Explorers bring home gold.','Research increases the party’s base power.','Forge workers make rubies for equipment.','Stockpiles bonus health for future battles.','Scouts unlock hidden encyclopedia entries.','Recruiters collect summoning crystals.','Defenders earn gold and dungeon keys.','Up to three unassigned pets earn XP while you’re away.'];
function guildPanel(s:Save){
 const inactive=Object.keys(s.hero).map(Number).filter(id=>!s.party.includes(id));
 return hgroup('THE WAYSTATION','Guild Headquarters','Inactive heroes and pets can work while the party adventures, including while you are offline.')+
 '<div class="tagrow">'+pill('Research '+num(s.research))+pill('Infirmary '+num(s.infirmary))+pill('Scouting '+num(s.scout))+pill('Guild rank '+(1+Math.floor(Math.sqrt(s.guildXp/900))))+'</div>'+
 section('Hero assignments',inactive.map(id=>'<div class="job-row">'+portrait('h'+id)+'<strong>'+esc(heroes[id].name)+'</strong><small>'+heroes[id].role+' · Lv. '+heroLv(s,id)+'</small>'+select('job:'+id,[[-1,'Unassigned'],...guildJobs.slice(0,8).map((name,i):[number,string]=>[i,name])],s.hero[id].job??-1,'Guild assignment')+'</div>').join('')||'<p class="muted">Summon another hero to begin guild work.</p>')+
 '<div class="columns">'+guildJobs.map((name,i)=>section(name,'<p>'+jobDetail[i]+'</p><p class="muted">'+(i===8?s.sanctuary.length+' / 3 in training':inactive.filter(id=>s.hero[id].job===i).length+' assigned')+'</p>'+(i===8?btn('Open pets','tab:Pets','quiet'):'')+(i===5?btn('Monster encyclopedia','encyclopedia','quiet'):'')+(i===3?btn('Open equipment','tab:Inventory','quiet'):'') )).join('')+'</div>';
}
const statViews=['Battle report','Compare','Farming','Encyclopedia','Achievements','Rare encounters'];
function statsPanel(s:Save,v:View){
 const report=s.records[v.statIndex]??s.records[0];
 const recent=s.records.slice(0,12),seconds=recent.reduce((a,b)=>a+b.seconds,0),sum=(key:'xp'|'gold'|'items'|'damage')=>recent.reduce((a,b)=>a+b[key],0);
 const metrics=Object.entries(report?.details??{}).sort((a,b)=>b[1].damage-a[1].damage);
 const chart=metrics.map(([id,m])=>'<div class="chart-row"><span>'+esc(heroes[+id.slice(1)].name)+'</span><div class="meter"><i style="width:'+(m.damage/(metrics[0][1].damage||1)*100)+'%"></i><em style="width:'+(m.pet/(metrics[0][1].damage||1)*100)+'%"></em></div><strong>'+num(m.damage)+'</strong></div>').join('');
 let body='';
 if(v.stat==='Battle report')body=report?section('Damage by hero · includes pets',select('battleIndex',s.records.map((r,i)=>[i,'Stage '+r.stage+' · '+r.name+' · '+(r.win?'Victory':'Defeat')]),v.statIndex,'Battle sample')+'<p>'+dur(report.seconds)+' · '+num(report.damage/report.seconds)+' party DPS · '+num(report.healing)+' healing</p>'+chart+'<p class="muted">Blue bars show pet damage within each hero’s total.</p>')+
 section('Detailed combat','<div class="columns">'+metrics.map(([id,m])=>'<details class="box"><summary>'+esc(heroes[+id.slice(1)].name)+' · '+num(m.damage/report.seconds)+' DPS</summary><p>'+esc(m.petId===undefined?'Pet':pets[m.petId]?.name??'Pet')+' '+num(m.pet)+' · Attack links '+num(m.bonus)+' · Healing '+num(m.heal)+' · Overhealing '+num(m.overheal)+' · Shields '+num(m.shield)+' · Prevented '+num(m.prevent)+'</p><p>'+m.attacks+' attacks · '+m.crits+' criticals · '+m.misses+' misses · '+m.casts+' skill activations · '+m.deaths+' deaths</p><p>'+Object.entries(m.uptime).map(([k,n])=>esc(k)+' '+dur(n)).join(' · ')+'</p>'+Object.entries(m.bySkill).sort((a,b)=>b[1]-a[1]).map(([k,n])=>'<div class="record"><span>'+esc(k)+'</span><strong>'+num(n)+'</strong></div>').join('')+'</details>').join('')+'</div>')+
 section('Enemy damage sources',Object.entries(report.sources).sort((a,b)=>b[1]-a[1]).map(([k,n])=>'<div class="record"><span>'+esc(k)+'</span><strong>'+num(n)+'</strong></div>').join('')||'<p class="muted">No enemy damage recorded.</p>')+
 section('Enemy status uptime','<p class="muted">Seconds summed across enemy targets.</p>'+Object.entries(report.enemyUptime??{}).map(([k,n])=>'<div class="record"><span>'+esc(k)+'</span><strong>'+dur(n)+'</strong></div>').join(''))+
 section('Recent battle events',report.log.map(x=>'<p>'+esc(x)+'</p>').join('')):message('Finish an encounter to see a battle report.');
 if(v.stat==='Compare'){
  const a=s.records[v.statIndex],b=s.records[v.compareIndex],options=s.records.map((r,i):[number,string]=>[i,'#'+(i+1)+' · Stage '+r.stage+' · '+r.name]);
  body=s.records.length<2?message('Complete two encounters to compare battle reports.'):section('Compare two recorded encounters','<div class="controls">'+select('battleIndex',options,v.statIndex,'First encounter')+select('compareIndex',options,v.compareIndex,'Second encounter')+'</div><p class="muted">Each column uses one encounter. Stage, target count, and encounter length can affect DPS.</p>')+
  (a&&b?section('Hero and pet DPS','<div class="comparison"><span>Hero</span><strong>First</strong><strong>Second</strong>'+[...new Set([...Object.keys(a.details),...Object.keys(b.details)])].map(id=>{
   const first=a.details[id],second=b.details[id];const stat=(m:typeof first,sec:number)=>m?num(m.damage/sec)+' DPS<small>'+num(m.pet/sec)+' '+esc(m.petId===undefined?'pet':pets[m.petId]?.name??'pet')+' DPS · '+num(m.heal/sec)+' HPS</small>':'—';
   return '<span>'+esc(heroes[+id.slice(1)].name)+'</span><span>'+stat(first,a.seconds)+'</span><span>'+stat(second,b.seconds)+'</span>';
  }).join('')+'</div>'):'');
 }
 if(v.stat==='Farming')body=section('Recent rates · '+recent.length+' encounters / '+dur(seconds),'<p>XP per active hero/min <strong>'+num(seconds?sum('xp')/seconds*60:0)+'</strong></p><p>Gold/min <strong>'+num(seconds?sum('gold')/seconds*60:0)+'</strong></p><p>Retained gear/hour <strong>'+num(seconds?sum('items')/seconds*3600:0)+'</strong></p><p>Victory rate <strong>'+num(recent.length?recent.filter(r=>r.win).length/recent.length*100:0)+'%</strong></p><p class="muted">Measured in simulated combat time. Offline rewards are excluded from this sample.</p>')+
 section('Lifetime progression','<p>Highest stage '+num(s.best)+' · '+num(s.wins)+' wins · '+num(s.losses)+' losses · '+num(s.kills)+' kills</p><p>'+num(s.totalGold)+' adventure gold · '+num(s.totalXP)+' XP credited per active hero at time of reward · '+num(s.loot)+' total drops</p><p>'+dur(s.seconds)+' combat time · '+dur(s.offlineSeconds)+' offline elapsed</p>');
 if(v.stat==='Encyclopedia'){
  const all=enemies.filter(e=>match(e.name,v.search));body=filters(v,[],false)+'<div class="columns">'+all.slice(v.page*16,v.page*16+16).map(e=>{
   const count=s.discover[e.id]??0,known=count>0||s.scout>e.id;
   return '<div class="box codex">'+portrait('e'+e.id)+'<div><h3>'+(known?esc(e.name):'Undiscovered')+'</h3><p>'+esc(biomes[e.biome][0])+' · '+e.family+'</p>'+(known?'<p>'+num(count)+' defeated · '+e.element+' · weak to '+opposite[e.element]+' · base HP ×'+e.hp.toFixed(2)+' / attack ×'+e.atk.toFixed(2)+'</p><p>'+skillText(e.effect)+' Possible drops include gold, gear, crystals, keys, and eggs.</p>':'')+'</div></div>';
  }).join('')+'</div>'+listPage(v,all.length,16)+section('Elite variants','<p>'+eliteMods.join(' · ')+'</p>');
 }
 if(v.stat==='Achievements'){
  const all=achievements.filter(a=>match(a.name,v.search)).sort((a,b)=>Number(s.claimed.includes(a.id))-Number(s.claimed.includes(b.id))||Number(b.value(s)>=b.target)-Number(a.value(s)>=a.target));
  body=filters(v,[],false)+'<p>'+s.claimed.length+' / 150 earned · Current title '+esc(s.title)+'</p><div class="columns">'+all.slice(v.page*16,v.page*16+16).map(a=>section(esc(a.name),'<p>'+esc(a.category)+' · '+num(a.value(s))+' / '+num(a.target)+'</p>'+
  (s.claimed.includes(a.id)?btn('Equip title','title:'+a.id,'quiet',s.title===a.name):btn('Claim · '+a.reward+' crystals','claim:'+a.id,'gold',a.value(s)<a.target)))).join('')+'</div>'+listPage(v,all.length,16);
 }
 if(v.stat==='Rare encounters')body='<div class="columns">'+worldEvents.map((e,i)=>section(e,'<p>'+num(s.events[i])+' discovered</p>')).join('')+'</div>';
 return hgroup('THE CHRONICLE','Stats','Inspect recent encounters, farming rates, rare discoveries, and achievements.')+'<div class="subtabs">'+statViews.map(x=>btn(x,'stat:'+x,x===v.stat?'gold':'quiet')).join('')+'</div>'+body;
}
function adventurePanel(s:Save){
 return hgroup('THE ENDLESS ROAD','Adventure','Your party advances automatically. Push new stages or repeat a proven stage in Farm.')+
 section('Stage selection','<div class="controls">'+btn('Push stage '+num(s.best+1),'push','gold',s.mode==='Push')+
 '<label>Farm completed stage <input type="number" inputmode="numeric" min="1" max="'+Math.max(1,s.best)+'" value="'+(s.mode==='Farm'?s.stage:s.lastFarm)+'" id="farm-stage"></label>'+btn('Start farm','farm','quiet',!s.best)+'</div>')+
 section('Active bonds',bonds.filter(b=>s.party.includes(b.a)&&s.party.includes(b.b)).map(b=>'<p><strong>'+esc(b.name)+'</strong> · '+esc(heroes[b.a].name)+' and '+esc(heroes[b.b].name)+'. '+skillText(b.effect)+'</p>').join('')||'<p class="muted">Build a party with linked heroes to activate additional combat abilities.</p>')+
 section('First steps','<p>Clear stage 2 for a Wild Egg and four summoning crystals. Clear stage 3 for your first dungeon key. Use the eight destinations along the bottom to manage your collection.</p>');
}
export function renderPanel(s:Save,v:View){
 if(!v.tab)return '';
 return ({Adventure:adventurePanel,Heroes:heroPanel,Pets:petPanel,Inventory:itemPanel,Summon:summonPanel,Dungeons:dungeonPanel,Guild:guildPanel,Stats:statsPanel}[v.tab])(s,v);
}
export function settings(s:Save,v:View){
 const range=(key:'shake'|'music'|'sfx',name:string)=>'<label class="slider"><span>'+name+'</span><input type="range" min="0" max="1" step=".05" value="'+s.settings[key]+'" data-setting="'+key+'"></label>';
 return hgroup('EVERFALL','Settings','Game build 0.9.1 · specification 3.0')+
 section('Display & sound','<div class="controls"><label>Effects density '+select('quality',[[0,'Low'],[1,'Medium'],[2,'High']],s.settings.quality,'Effects quality')+'</label></div>'+range('shake','Screen shake')+range('music','Music volume')+range('sfx','Effects volume'))+
 section('Save profile','<p>'+esc(v.email||'Local expedition')+'</p><p class="muted">'+esc(v.sync)+'</p><div class="controls">'+(v.email?btn('Sign out','logout','quiet')+btn('Retry cloud sync','sync','quiet'):btn('Open cloud sign-in','login','gold'))+btn('Export save','export','quiet')+'</div><label class="import">Import save into this profile <input type="file" accept=".json,application/json" id="import-save"></label>');
}
export function eggDisclosure(){return '<p class="muted">Wild Egg 60 / 29 / 9 / 1.8 / 0.2%. Enchanted Egg 24 / 44 / 24 / 7 / 1%. Ancient Egg 4 / 23 / 42 / 25 / 6%. Rates are Common through Mythic.</p>';}
export function rewardList(values:[string,number][]) {return '<div class="reward-grid">'+values.filter(([,n])=>n>0).map(([label,n])=>'<div><strong>+'+num(n)+'</strong><span>'+esc(label)+'</span></div>').join('')+'</div>';}
