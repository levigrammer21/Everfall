import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heroes, pets, starters, enemies, biomes, bonds, dungeons, type Effect } from './content';
import { armorFactor, battleSeed, createBattle, matchup, prng, sampleBattle, stageScale } from './combat';
import { achievements, ascend, ascensionCost, assignJob, assignPet, assignSanctuary, canEquip, claimAchievement, enchant, equip, gain, hatch, levelOf, lootHistory, needXP, newSave, restore, safe, sell, setParty, startDungeon, summon, train, work } from './save';
import { affixes, bases, gearStats, makeItem, sets, uniques } from './loot';
import { effectiveSeconds, finish, offline } from './progression';
const seed=31415;
const legacySave=(now:number,seed:number)=>restore({...newSave(now,seed),crystals:0,party:starters,hero:Object.fromEntries(starters.map(id=>[id,{}]))});
const names=<T extends {name:string}>(a:T[])=>new Set(a.map(x=>x.name));
test('launch content sizes, rarity distributions, unique names and valid references',()=>{
 assert.equal(heroes.length,50);assert.equal(pets.length,30);assert.equal(enemies.length,100);assert.equal(biomes.length,10);assert.equal(achievements.length,150);
 assert.deepEqual([0,1,2,3,4].map(r=>heroes.filter(h=>h.rarity===r).length),[11,12,13,9,5]);
 assert.deepEqual([0,1,2,3,4].map(r=>pets.filter(p=>p.rarity===r).length),[8,8,7,5,2]);
 assert.equal(names(heroes.flatMap(h=>h.skills)).size,250);
 assert.equal(names(heroes).size,50);assert.equal(names(pets).size,30);assert.equal(names(enemies).size,100);
 assert.equal(bonds.length,30);assert.ok(bonds.every(b=>b.a!==b.b&&heroes[b.a]&&heroes[b.b]));
 assert.deepEqual(starters.map(i=>heroes[i].name),['Bones','Pickles','Gramps','Rusty','Bubbles']);
 assert.ok(heroes.every(h=>h.skills.slice(0,3).every(s=>!s.trigger)&&h.skills.slice(3).every(s=>s.trigger)));
});
test('combat formulas and deterministic replay',()=>{
 assert.equal(armorFactor(0),1);assert.equal(armorFactor(100),.5);assert.equal(matchup('fire','ice'),1.23);assert.equal(matchup('fire','fire'),.83);
 const s=legacySave(0,seed),a=sampleBattle(s),b=sampleBattle(s,battleSeed(s));
 assert.equal(a.result,1);assert.equal(a.time,b.time);assert.deepEqual(a.details,b.details);
 assert.ok(Object.values(a.details).some(x=>x.damage>0));
});
test('all hero abilities invoke their registered combat behavior without producing nonfinite values',()=>{
 for(const h of heroes){
  const s=legacySave(0,seed);s.hero[h.id]??=structuredClone(s.hero[39]);s.party=[h.id];const b=createBattle(s,seed),u=b.units[0],target=b.units[1];
  u.hp*=.5;
  for(const skill of h.skills){target.hp=target.max;target.fallen=false;b.apply(u,target,skill.name,skill.effect,skill.power);assert.ok(b.cues.some(c=>c.name===skill.name));assert.ok(Number.isFinite(u.hp)&&Number.isFinite(target.hp));}
 }
});
test('named effects apply status, periodic damage, shielding, summons, healing and crowd control',()=>{
 const s=legacySave(0,seed),b=createBattle(s,seed),u=b.units[0],v=b.units[5];
 const apply=(e:Effect)=>b.apply(u,v,e,e,1.2);
 apply('poison');const start=v.hp;for(let i=0;i<8;i++)b.step();assert.ok(v.hp<start);assert.ok(v.status.poison);
 apply('freeze');assert.ok(v.status.freeze);
 const x=v.x;apply('push');assert.notEqual(v.x,x);
 u.hp*=.5;const low=u.hp;apply('heal');assert.ok(u.hp>low);
 apply('shield');assert.ok(u.shield>0);
 apply('summon');assert.ok(b.units.some(t=>t.owner===u));
});
test('equipped pets run as engine actors and passive effects resolve',()=>{
 for(const pet of pets){
  const s=legacySave(0,seed);s.pet[pet.id]={xp:0,stars:0,essence:0};assignPet(s,39,pet.id);
  const b=createBattle(s,seed);for(let i=0;i<53&&!b.result;i++)b.step();
  assert.ok(b.cues.some(c=>c.name===pet.name),pet.name);
  assert.equal(b.units[0].pet,pet.id);
 }
});
test('hero and pet XP curves are monotone, exact at boundaries and capped',()=>{
 for(const pet of [true,false]){
  const cap=pet?100:1000;
  for(let l=2;l<=cap;l++){const xp=needXP(l,pet);assert.ok(xp>needXP(l-1,pet));assert.equal(levelOf(xp-1,pet),l-1);assert.equal(levelOf(xp,pet),l);}
  const p={xp:0,essence:0,stars:0};gain(p,Infinity,pet);assert.equal(levelOf(p.xp,pet),cap);
 }
});
test('summon ten guarantee, independent pity floors, duplicate essence, and persistence',()=>{
 const s=legacySave(0,seed);s.crystals=50;
 const ten=summon(s,10,()=>0);assert.equal(ten.length,10);assert.equal(heroes[ten[9].id].rarity,1);
 assert.equal(s.hero[39].essence,9);
 for(const [i,n] of [19,99,299].entries()){
  s.pity=[0,0,0];s.pity[i]=n;
  const reloaded=restore(JSON.parse(JSON.stringify(s)));
  const result=summon(reloaded,1,()=>0);assert.equal(heroes[result[0].id].rarity,i+2);assert.equal(reloaded.pity[i],0);
 }
 assert.equal(s.crystals,40);
});
test('egg odds, duplicates and hero/pet ascension',()=>{
 const s=legacySave(0,seed);s.egg=[2,0,1];const a=hatch(s,0,()=>0)!;assert.ok(!a.dupe);assert.equal(hatch(s,0,()=>0)?.dupe,true);assert.equal(s.pet[a.id].essence,1);
 assert.equal(hatch(s,1),null);assert.equal(pets[hatch(s,2,()=>.999)!.id].rarity,4);
 s.hero[39].essence=999;s.pet[a.id].essence=999;
 for(let i=0;i<10;i++){const previous=s.hero[39].essence;assert.ok(ascend(s,39));assert.equal(s.hero[39].essence,previous-ascensionCost(i));}
 for(let i=0;i<5;i++)assert.ok(ascend(s,a.id,true));
 assert.equal(ascend(s,39),false);assert.equal(ascend(s,a.id,true),false);
});
test('loot counts, rarities, large rolls, equipment compatibility and selling protection',()=>{
 assert.deepEqual([bases.length,affixes.length,sets.length,uniques.length],[100,150,10,30]);
 const s=legacySave(0,seed),rng=prng(seed);
 const counts=Array(6).fill(0);
 for(let i=0;i<10000;i++){const item=makeItem(1,rng,String(i));counts[item.rank]++;assert.ok(item.rolls.every(r=>Number.isFinite(r.value)));}
 assert.ok(counts[0]>counts[1]&&counts[1]>counts[2]&&counts[2]>counts[3]&&counts[3]>counts[4]);
 const weapon={...makeItem(1,rng,'w'),base:41},offhand={...makeItem(1,rng,'o'),base:50},staff={...makeItem(1,rng,'s'),base:43},locked={...makeItem(1,rng,'l'),locked:true};
 s.items=[weapon,offhand,staff,locked];
 assert.ok(equip(s,39,'o'));assert.ok(equip(s,39,'w'));assert.equal(s.hero[39].gear[5],null);assert.equal(equip(s,39,'o'),false);
 assert.equal(canEquip(s,39,staff),false);assert.ok(equip(s,43,'s'));assert.ok(equip(s,46,'w'));assert.equal(s.hero[39].gear[4],null);
 assert.equal(sell(s,['w','s','l','o']),1);assert.ok(gearStats([weapon]).attack!>0);
 s.gold=1e4;assert.ok(enchant(s,'l',0));assert.equal(locked.enchants,1);
});
test('party, mastery, sanctuary, assignments and guild rewards preserve exclusions',()=>{
 const s=legacySave(0,seed);s.pet[0]={xp:0,stars:0,essence:0};assert.ok(assignSanctuary(s,0));
 assert.ok(assignPet(s,39,0));assert.deepEqual(s.sanctuary,[]);assert.ok(assignPet(s,44,0));assert.equal(s.hero[39].pet,null);
 assert.equal(assignJob(s,39,0),false);s.hero[0]=structuredClone(s.hero[39]);
 assert.ok(assignJob(s,0,7));work(s,6200);assert.ok(s.keys>=1);assert.ok(setParty(s,0,1));assert.equal(s.hero[0].job,null);
 assert.equal(train(s,0,1),false);s.hero[0].xp=needXP(7);assert.ok(train(s,0,0));assert.ok(train(s,0,1));
});
test('dungeon state round trips, clears can be credited only once, and failed runs consume keys',()=>{
 let s=legacySave(0,seed);s.best=3;s.keys=2;assert.ok(startDungeon(s,0,1));assert.equal(s.keys,1);
 let b=createBattle(s,seed);b.result=1;const first=finish(s,b);assert.equal(first.battles,1);
 assert.equal(finish(s,b).battles,0);assert.equal(s.dungeon!.wave,1);assert.equal(s.dungeon!.camp,true);
 s=restore(JSON.parse(JSON.stringify(s)));assert.equal(s.dungeon!.wave,1);s.dungeon!.camp=false;
 b=createBattle(s,seed);b.result=-1;finish(s,b);assert.equal(s.dungeon,null);assert.equal(s.keys,1);
 assert.ok(startDungeon(s,0,1));for(let i=0;i<dungeons[0].waves;i++){const next=createBattle(s,seed);next.result=1;finish(s,next);}
 assert.equal(s.dungeonWins,1);assert.equal(s.keys,0);
});
test('offline tiers, deterministic resume, equal speed settings and no repeated offline claim',()=>{
 assert.equal(effectiveSeconds(24*3600),24*3600);assert.equal(effectiveSeconds(72*3600),60*3600);assert.equal(effectiveSeconds(168*3600),108*3600);
 assert.equal(effectiveSeconds(172*3600),109*3600);
 const a=legacySave(0,seed),b=legacySave(0,seed);b.settings.speed=4;
 const ma=offline(a,3600000),mb=offline(b,3600000);assert.deepEqual(ma,mb);assert.ok(ma.r.battles>0&&ma.r.xp>0);
 assert.equal(offline(a,3600000).elapsed,0);assert.equal(a.updated,3600000);
 const weak=legacySave(0,seed);weak.stage=1e9;weak.best=1e9;weak.lastFarm=1e9;weak.mode='Farm';const result=offline(weak,3600000);assert.equal(result.r.xp,0);
});
test('save migration, limits and achievements',()=>{
 const s=legacySave(1,seed);s.pet[1]={xp:0,stars:0,essence:0};assignPet(s,39,1);s.hero[44].pet=1;
 const r=restore({...s,version:2});assert.equal(r.version,3);assert.equal(Object.values(r.hero).filter(h=>h.pet===1).length,1);
 assert.throws(()=>restore({version:4}));assert.ok(Number.isFinite(stageScale(1e9)));assert.ok(Number.isFinite(safe(Infinity)));
 r.best=5;assert.ok(claimAchievement(r,'0-0'));assert.equal(claimAchievement(r,'0-0'),false);
});


test('a new expedition waits for one summon and fields the exact draw',()=>{
 const fresh=newSave(0,seed);
 assert.deepEqual(fresh.party,[]);assert.equal(fresh.crystals,1);assert.equal(Object.keys(fresh.hero).length,0);
 assert.deepEqual(offline(fresh,3600000).r.battles,0);
 const pending=restore(JSON.parse(JSON.stringify(fresh)));assert.deepEqual(pending.party,[]);
 const [draw]=summon(pending,1,()=>.999);
 assert.deepEqual(pending.party,[draw.id]);assert.equal(pending.crystals,0);assert.equal(Object.keys(pending.hero).length,1);
 assert.equal(summon(pending,1).length,0);
 assert.deepEqual(restore(pending).party,[draw.id]);
 assert.deepEqual(restore(legacySave(0,seed)).party,starters);
});
test('any of the fifty possible starters can clear the solo opening',()=>{
 for(const hero of heroes){
  const fresh=restore({...newSave(0,seed),party:[hero.id],hero:{[hero.id]:{}}});
  for(let wave=0;wave<3;wave++){
   const battle=sampleBattle(fresh);assert.equal(battle.result,1,hero.name+' wave '+(wave+1));finish(fresh,battle);
  }
  assert.equal(fresh.best,1);assert.equal(fresh.party.length,1);
 }
});
test('ground loot is generated at a death, committed once on victory, and named in history',()=>{
 const s=legacySave(0,seed);s.stage=10;s.wave=2;
 const b=createBattle(s,seed),hero=b.units[0],foe=b.units.find(u=>u.boss)!;
 b.damage(hero,foe,1e5,'Finisher','strike');
 assert.equal(b.drops.length>=1,true);assert.equal(b.drops[0].x,foe.x);assert.equal(b.drops[0].enemy,foe.id);
 assert.equal(s.items.length,0);
 const drop=b.drops[0].item;drop.rank=4;drop.unique=0;
 b.result=1;finish(s,b);finish(s,b);
 const entry=lootHistory(s).find(i=>i.id===drop.id)!;
 assert.equal(entry.name,'Ashmaker');assert.equal(entry.rank,4);assert.equal(entry.source,foe.name);
 assert.equal(s.items.filter(i=>i.id===drop.id).length,1);
 const legacy=restore({...s,history:['Found gear #'+drop.id+' at stage 10']});
 assert.equal(lootHistory(legacy)[0].name,entry.name);
 const lost=createBattle(s,seed);lost.drops.push({...b.drops[0],item:{...drop,id:''}});lost.result=-1;
 const count=s.loot;finish(s,lost);assert.equal(s.loot,count);
});
test('combat meter separates HP damage, shields consumed, healing and sources',()=>{
 const s=legacySave(0,seed),b=createBattle(s,seed),h=b.units[0],foe=b.units.find(u=>u.enemy!==null)!;
 h.shield=3;const hit=b.damage(foe,h,15,'Claw','strike',false,false,false);
 const m=b.details[h.id];assert.equal(m.taken,hit);assert.equal(m.absorbed,3);assert.equal(m.incoming?.[foe.name+' · Claw'],hit);
 b.heal(h,h,hit/2,'Bandage');assert.ok(Math.abs(m.received!-hit/2)<1e-8);assert.equal(m.heal,m.healsBySkill?.Bandage);
 b.damage(h,foe,1e5,'Finisher','strike');assert.equal(m.kills,1);
});
