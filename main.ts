import { bindDrag } from './drag-controls';
import { dragAction } from './drag-actions';
import { resolveOffer, upgradeGuild } from './expedition';
import './style.css';
import { GameAudio } from './audio';
import { launchBattlefield } from './battlefield';
import { meterMarkup } from './battle-meter';
import { STEP, dungeonKey, resumeDungeonBattle, type Battle } from './combat';
import { colors, dungeons, heroes, pets, rarities } from './content';
import { authWatch, emailRegister, emailSignIn, google, loadCloud, logout, resetPassword, SaveConflict, writeCloud } from './firebase-client';
import { bases, itemColors, itemName, itemRanks, slots } from './loot';
import { achievements, ascend, assignJob, assignPet, assignSanctuary, canEquip, claimAchievement, enchant, equip, equipped, hatch, newSave, restore, sell, setParty, startDungeon, summon, train, work, type Save } from './save';
import { finish, makeNext, offline, type Rewards } from './progression';
import { btn, defaultView, dur, esc, icon, num, portrait, renderPanel, rewardList, settings, tabs, type View } from './ui';
import type { User } from 'firebase/auth';
type Local={state:Save;revision:number;dirty:boolean};
const root=document.querySelector<HTMLDivElement>('#app')!,audio=new GameAudio();
const localKey=(uid='guest')=>'everfall-v3-'+uid;
const clientId=sessionStorage.getItem('everfall-client')??crypto.randomUUID();
sessionStorage.setItem('everfall-client',clientId);
let s:Save|null=null,uid='',user:User|null=null,battle:Battle|null=null,view:View=defaultView();
let revision=0,dirty=false,writing=false,conflicted=false,cloudReady=false,sequence=0,mutation=0,loginShown=true;
let visual:ReturnType<typeof launchBattlefield>|null=null,delay=0,acc=0,workAccum=0,lastFrame=performance.now(),lastHud=0,lastSave=0,lastCloud=0,hiddenAt=0,lastSimEpoch=Date.now();
let hudHash='',toastTimer=0;
let travel=0,travelDuration=0,walkNext=false,liveOpen=false,liveLast=false,liveHero='',liveStamp='';
let lastBattle:Battle|null=null,renderedMeter:Battle|null=null,renderedHero='';let dungeonTiers:number[]=[1,1,1,1];
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T|null;
function localRead(id?:string):Local|null{
 try{const raw=localStorage.getItem(localKey(id));if(!raw)return null;const parsed=JSON.parse(raw);return {state:restore(parsed.state??parsed),revision:Number(parsed.revision)||0,dirty:!!parsed.dirty};}
 catch{return null;}
}
function localWrite(stamp=true){
 if(!s)return;
 if(stamp){
  s.updated=Date.now();
  if(s.dungeon&&!s.dungeon.camp&&battle?.save===s&&battle.info.dungeon&&battle.info.wave===s.dungeon.wave&&!battle.result&&battle.time>0){
   const key=dungeonKey(s);
   if(s.checkpoint?.key!==key||s.checkpoint.time!==battle.time){s.checkpoint=battle.checkpoint(key);dirty=true;mutation++;}
  }
 }
 try{localStorage.setItem(localKey(uid||undefined),JSON.stringify({state:s,revision,dirty}));}
 catch{view.sync='Device storage unavailable';toast('Could not write a device save.');}
}
function changed(save=true){
 dirty=true;mutation++;if(save)localWrite();
}
function formatCloudError(e:unknown){return e instanceof Error?e.message.replace(/^Firebase:\s*/,''):'Could not contact Firebase.';}
async function cloudWrite(){
 if(!s||!uid||!dirty||writing||conflicted||!cloudReady||!navigator.onLine)return;
 writing=true;lastCloud=Date.now();
 const active=uid,version=sequence,stamp=mutation,data=structuredClone(s),rev=revision;
 try{
  const next=await writeCloud(active,data,rev,clientId);
  if(sequence!==version)return;
  revision=next;dirty=stamp!==mutation;view.sync='Cloud saved';localWrite(false);
 }catch(e){
  if(sequence!==version)return;
  conflicted=e instanceof SaveConflict;
  view.sync=conflicted?'Newer cloud progress found. Export this device save, or load the cloud copy.':'Cloud unavailable · device save active';
  if(conflicted)toast('A newer cloud save exists. Open Settings to resolve.');
 }finally{if(sequence===version){writing=false;if(view.setting)renderOverlay();}}
}
function showAuth(message=''){
 loginShown=true;
 if(s){renderOverlay();return;}
 root.innerHTML='<main class="auth"><section class="auth-card"><p class="eyebrow">THE ENDLESS ROAD</p><div class="auth-emblem">'+icon('Summon')+'</div><h1>EVERFALL</h1><p class="auth-copy">Gather your war band and venture into the dark.</p><div id="auth-box">'+authForm(message)+'</div><p class="auth-build">BUILD 1.0.2</p></section></main>';
}
function authForm(message=''){
 return '<div class="auth-actions">'+btn('Continue with Google','google','gold')+'<form id="email-form"><label>Email<input name="email" type="email" autocomplete="email" required></label><label>Password<input name="password" type="password" autocomplete="current-password" minlength="6" required></label><div class="controls"><button class="btn bright" type="submit">Sign in</button><button class="btn quiet" type="submit" data-register="yes">Create account</button></div></form>'+btn('Reset password','resetPassword','micro')+
 (!s?btn(localRead()?'Continue local expedition':'Play on this device','guest','quiet'):btn('Return to expedition','closeLogin','quiet'))+'<p id="auth-error" role="status">'+esc(message)+'</p></div>';
}
function offlinePopup(elapsed:number,r:Rewards){
 if(!elapsed)return;
 view.pop={title:'While you were away',body:'<p>'+dur(elapsed)+' elapsed · '+num(r.battles)+' adventure victories</p>'+rewardList([['XP per active hero',r.xp],['Adventure gold',r.gold],['Crystals',r.crystals],['Keys',r.keys],['Eggs',r.eggs],['Gear retained',r.items],['Guild gold',r.guildGold],['Research',r.research]])};
}
function enter(save:Save,account='',rev=0,needsSync=false){
 s=save;uid=account;revision=rev;dirty=needsSync;mutation=0;view=defaultView();view.email=account?(user?.email??'Google account'):'';
 view.sync=account?(cloudReady?'Cloud linked':'Device save · cloud offline'):'Local save';
 loginShown=false;workAccum=0;acc=0;delay=0;lastBattle=null;liveOpen=false;liveLast=false;liveHero='';liveStamp='';hiddenAt=0;lastSimEpoch=Date.now();dungeonTiers=[1,1,1,1];
 const summary=offline(s,Date.now());if(summary.elapsed){changed();offlinePopup(summary.elapsed,summary.r);}else localWrite(false);
 view.hero=s.party[0]??39;view.pet=Number(Object.keys(s.pet)[0]??0);
 if(!visual)mount();
 resetBattle(false,true);
 renderOverlay();hud(true);
}
async function accountChanged(account:User|null){
 user=account;
 if(!account)return;
 const active=++sequence;writing=false;cloudReady=false;conflicted=false;
 if(!s)showAuth('Opening your expedition…');else{const target=el('auth-error');if(target)target.textContent='Opening your expedition…';}
 const local=localRead(account.uid);
 try{
  const cloud=await Promise.race([loadCloud(account.uid),new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('Cloud connection timed out.')),8500))]);
  if(sequence!==active)return;
  cloudReady=true;
  if(local?.dirty&&local.revision===(cloud?.rev??0))enter(local.state,account.uid,local.revision,true);
  else if(local?.dirty&&local.revision!==(cloud?.rev??0)){
   enter(local.state,account.uid,local.revision,true);
   conflicted=true;view.sync='Newer cloud progress found. Open Settings to resolve.';toast(view.sync);
  }else if(cloud)enter(cloud.save,account.uid,cloud.rev);
  else enter(local?.state??newSave(),account.uid,0,true);
  void cloudWrite();
 }catch(e){
  if(sequence!==active)return;
  enter(local?.state??newSave(),account.uid,local?.revision??0,true);
  view.sync='Cloud unavailable · device save active';toast(formatCloudError(e));
 }
}
async function reconnect(force=false){
 if(!uid||!s||writing)return;
 if(!force&&cloudReady){if(conflicted){toast('A newer save exists. Choose Load cloud copy or export this save.');return;}void cloudWrite();return;}
 const active=sequence,account=uid;
 try{
  const cloud=await loadCloud(account);if(active!==sequence||!s)return;
  cloudReady=true;
  if(force&&conflicted&&cloud){conflicted=false;enter(cloud.save,account,cloud.rev);toast('Cloud save loaded.');return;}
  if((cloud?.rev??0)!==revision){conflicted=true;view.sync='Newer cloud progress found. Export this device save, or load the cloud copy.';}
  else{conflicted=false;view.sync='Cloud linked';void cloudWrite();}
 }catch(e){toast(formatCloudError(e));}
 if(view.setting)renderOverlay();
}
function mount(){
 root.innerHTML='<main class="game"><header class="topbar"><button class="brand" data-action="close" aria-label="Return to battle"><span class="crest">'+icon('Summon')+'</span><span>EVERFALL<small>THE ENDLESS ROAD</small></span></button><div class="wallet"><span title="Gold">'+icon('gold')+'<b id="gold"></b></span><span title="Summoning crystals">'+icon('crystal')+'<b id="crystals"></b></span><span title="Dungeon keys">'+icon('key')+'<b id="keys"></b></span></div><button class="icon-btn" data-action="settings" aria-label="Settings">'+icon('gear')+'</button></header>'+
 '<section class="field" aria-label="Animated battlefield"><div id="scene"></div><div class="field-shade"></div><div class="field-label"><p id="field-kicker" class="eyebrow"></p><h1 id="field-name"></h1><p id="field-detail"></p></div><div class="battle-controls"><button class="mode" id="mode" data-action="mode" title="Change push or farm mode"></button><button class="icon-btn" id="pause" data-action="pause" aria-label="Pause combat">'+icon('pause')+'</button><button class="speed" id="speed" data-action="speed" aria-label="Combat speed">1×</button><button class="icon-btn live-toggle" data-action="liveMeter" id="live-toggle" aria-label="Battle meter" aria-expanded="false" title="Battle meter">'+icon('Stats')+'<span>Meter</span></button></div><aside id="live-meter" class="live-meter" aria-label="Battle meter" hidden><div class="live-bar"><strong>'+icon('Stats')+' Battle meter</strong><div><button data-action="liveWave:current" id="meter-current">Current</button><button data-action="liveWave:last" id="meter-last">Last wave</button><button data-action="liveMeter" class="live-close" aria-label="Close battle meter">'+icon('close')+'</button></div></div><div id="meter-body" class="meter-body"></div></aside><div id="field-toast" class="field-toast"></div><button class="btn gold field-offer" data-action="tab:Adventure" id="world-offer" hidden>Encounter waiting</button><div id="camp" class="camp" hidden></div><div class="field-edge"></div></section>'+
 '<section class="party-strip" aria-label="Active party"><span class="party-label">WAR BAND</span><div id="party"></div><span id="party-status"></span></section><nav class="nav" aria-label="Game navigation">'+tabs.map(t=>'<button data-action="tab:'+t+'">'+icon(t)+'<span>'+t+'</span></button>').join('')+'</nav><div class="footer"><span id="save-status">LOCAL SAVE</span><span>EVERFALL · 1.0.2</span></div></main><div id="overlay" class="overlay" hidden></div><div id="modal" class="modal" hidden></div><div id="toast" class="toast" role="status" hidden></div>';
 visual=launchBattlefield(el('scene')!);visual.scene.onCue=c=>audio.cue(c);
 hudHash='';
}
function resetBattle(walk=false,resume=false){
 if(!s||!visual)return;
 if(!resume)s.checkpoint=null;
 battle=resume?resumeDungeonBattle(s):makeNext(s);visual.scene.set(battle,walk);visual.scene.settings=s.settings;delay=0;acc=0;walkNext=false;
 travelDuration=walk?Math.max(.7,1.05/Math.sqrt(s.settings.speed)):0;travel=travelDuration;
 audio.music=s.settings.music;audio.sfx=s.settings.sfx;
 if(battle.info.boss&&battle.time===0)audio.boss();
}
function toast(msg:string){const node=el('toast')??el('auth-error');if(!node)return;node.textContent=msg;node.hidden=false;clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>{if(node.id==='toast')node.hidden=true;},3400);}
function fieldToast(message:string,rank=0){
 const node=el('field-toast');if(!node)return;
 node.innerHTML=icon('Summon')+'<span>'+esc(message)+'</span>';node.style.setProperty('--tone',itemColors[rank]);node.classList.remove('show');void node.offsetWidth;node.classList.add('show');
}
const setText=(id:string,text:string)=>{const x=el(id);if(x&&x.textContent!==text)x.textContent=text;};
function liveHud(){
 const panel=el('live-meter'),toggle=el('live-toggle'),body=el('meter-body');
 if(!panel||!toggle||!body||!battle)return;
 panel.hidden=!liveOpen;toggle.setAttribute('aria-expanded',String(liveOpen));
 if(!liveOpen)return;
 const tracked=(liveLast?lastBattle:battle)??battle;
 el<HTMLButtonElement>('meter-last')!.disabled=!lastBattle;
 el('meter-current')?.setAttribute('aria-pressed',String(!liveLast));
 el('meter-last')?.setAttribute('aria-pressed',String(liveLast));
 const stamp=[tracked.info.stage,tracked.info.wave,tracked.time,tracked.result,liveHero,liveLast].join('|');
 if(stamp===liveStamp&&renderedMeter===tracked)return;
 liveStamp=stamp;
 const markup=meterMarkup(tracked,liveHero);
 if(renderedMeter===tracked&&renderedHero===liveHero&&body.querySelector('.live-table')){
  const buffer=document.createElement('template');buffer.innerHTML=markup;
  const values=buffer.content.querySelectorAll('[data-live-stat]');
  body.querySelectorAll('[data-live-stat]').forEach((cell,i)=>{if(cell.textContent!==values[i]?.textContent)cell.textContent=values[i].textContent;});
  const detail=body.querySelector('.live-detail'),next=buffer.content.querySelector('.live-detail');
  if(detail&&next&&detail.innerHTML!==next.innerHTML)detail.innerHTML=next.innerHTML;
  return;
 }
 const scroll=body.querySelector('.live-table')?.scrollLeft??0;
 const focus=document.activeElement instanceof HTMLElement&&document.activeElement.classList.contains('live-hero')?document.activeElement.dataset.action:null;
 body.innerHTML=markup;renderedMeter=tracked;renderedHero=liveHero;
 const table=body.querySelector('.live-table');if(table)table.scrollLeft=scroll;
 if(focus)for(const button of body.querySelectorAll<HTMLButtonElement>('.live-hero'))if(button.dataset.action===focus)button.focus({preventScroll:true});
}
function hud(force=false){
 if(!s||!battle)return;
 setText('gold',num(s.gold));setText('crystals',num(s.crystals));setText('keys',num(s.keys));
 setText('field-kicker',(s.dungeon?'DUNGEON · TIER '+s.dungeon.tier:'STAGE '+num(battle.info.stage))+'  /  WAVE '+(battle.info.wave+1)+' OF '+battle.info.waves);
 setText('field-name',battle.info.name);
 const foe=battle.units.find(u=>u.side===1&&u.hp>0);setText('field-detail',!s.party.length?'Your expedition begins with one summon':travel>0?'On the road':foe?(foe.mod?foe.mod+' ':'')+foe.name:s.dungeon?.camp?'Party at camp':battle.result===1?'Encounter cleared':battle.result===-1?'Regrouping':'On the road');
 const offer=el('world-offer');if(offer){offer.hidden=!s.offers.length;setText('world-offer','Encounter waiting'+(s.offers.length>1?' · '+s.offers.length:''));}
 setText('mode',s.dungeon?'Dungeon':s.mode);el('mode')?.classList.toggle('farm',s.mode==='Farm'&&!s.dungeon);setText('speed',s.settings.speed+'×');
 setText('save-status',uid?view.sync.toUpperCase():'DEVICE SAVE');
 const pause=el<HTMLButtonElement>('pause');if(pause){pause.innerHTML=icon(view.pause?'play':'pause');pause.setAttribute('aria-label',view.pause?'Resume combat':'Pause combat');}
 const camp=el('camp')!;camp.hidden=!s.dungeon?.camp;if(s.dungeon?.camp&&!camp.innerHTML)camp.innerHTML='<p>Camp between waves</p>'+btn('Enter next wave','resumeDungeon','gold')+btn('Retreat','retreatDungeon','quiet');
 if(!s.dungeon?.camp&&camp.innerHTML)camp.innerHTML='';
 const actors=battle.units.filter(u=>u.hero!==null),party=actors.map(u=>u.hero).join(',');
 if(force||party!==hudHash){hudHash=party;el('party')!.innerHTML=actors.map(u=>'<button class="party-unit" data-action="hero:'+u.hero+'" title="'+esc(u.name)+'">'+portrait('h'+u.hero)+'<span><b>'+esc(u.name)+'</b><i class="meter"><em id="hp-'+u.hero+'"></em></i></span></button>').join('');}
 for(const u of actors){const hp=el('hp-'+u.hero);if(hp)hp.style.width=Math.floor(u.hp/u.max*100)+'%';}
 const total=actors.reduce((a,u)=>a+u.hp,0),max=actors.reduce((a,u)=>a+u.max,0);
 setText('party-status',max?Math.round(total/max*100)+'% HP':'');liveHud();
}
const dragging=bindDrag(root,(source,target)=>!!s&&!!dragAction(s,source,target),(source,target)=>{
 if(!s)return;
 const result=dragAction(s,source,target,true);if(!result)return;
 if(result.rebuild&&!s.dungeon?.camp)resetBattle();
 changed();audio.confirm();renderOverlay();hud();toast(result.message);
});
function renderOverlay(keep=true){
 if(!s||dragging())return;
 const over=el('overlay')!,modal=el('modal')!;
 const old=over.querySelector<HTMLElement>('.panel-content'),scroll=keep?old?.scrollTop??0:0;
 over.hidden=!(view.tab||view.setting||loginShown);
 if(!over.hidden){
  over.innerHTML='<div class="panel" role="region" aria-label="'+esc(view.setting?'Settings':view.tab??'Account')+'"><div class="panel-bar"><strong>'+esc(view.setting?'Settings':view.tab??'Account')+'</strong><button class="icon-btn" data-action="close" aria-label="Close panel">'+icon('close')+'</button></div><div class="panel-content">'+(loginShown?'<p class="eyebrow">CLOUD PROFILE</p><h2>Sign in</h2>'+authForm():view.setting?settings(s,view)+(conflicted?'<p>'+btn('Load cloud copy','loadCloud','gold')+'</p>':''):renderPanel(s,view))+'</div></div>';
  over.querySelector<HTMLElement>('.panel-content')!.scrollTop=scroll;
  for(let i=0;i<4;i++){const tier=over.querySelector<HTMLSelectElement>('[data-change="tier:'+i+'"]');if(tier)tier.value=String(dungeonTiers[i]);}
 }
 const opening=!s.party.length;
 modal.hidden=!(view.pop||opening);
 if(opening)modal.innerHTML='<section class="pop opening" role="dialog" aria-modal="true"><div class="pop-sigil">'+icon('Summon')+'</div><p class="eyebrow">THE FIRST CALL</p><h2>One crystal. One hero.</h2><p>Summon your first hero to lead the expedition. You can recruit the rest of your party as you go.</p>'+btn('Make your first summon','summon:1','gold')+'</section>';
 else if(view.pop)modal.innerHTML='<section class="pop '+(view.pop.style??'')+'" role="dialog" aria-modal="true"><div class="pop-sigil">'+icon('Summon')+'</div><h2>'+esc(view.pop.title)+'</h2>'+view.pop.body+btn('Continue','dismiss','gold')+'</section>';
 root.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('selected',x.getAttribute('data-action')==='tab:'+view.tab));
}
function open(tab:View['tab']){
 view.tab=tab;view.setting=false;loginShown=false;view.search='';view.filter=tab==='Heroes'?'Owned':tab==='Pets'&&s&&Object.keys(s.pet).length?'Owned':'All';view.sort='Rarity';view.page=0;view.heroFocus=false;if(tab==='Inventory'){view.inventory='Gear';view.itemFocus=false;view.gearPicker=false;view.gearSearch='';view.gearFromHero=false;}renderOverlay(false);
}
function inventoryFilter(){
 if(!s)return [];
 return s.items.filter(i=>(itemName(i)+' '+bases[i.base].name).toLowerCase().includes(view.search.trim().toLowerCase())&&(view.filter==='All'||view.filter===slots[bases[i.base].slot]||view.filter===itemRanks[i.rank]||view.filter==='Equipped'&&equipped(s!,i.id)||view.filter==='Locked'&&i.locked));
}
function goFarm(stage:number){
 if(!s||s.dungeon||!s.best||!Number.isFinite(stage))return false;
 s.stage=Math.max(1,Math.min(s.best,Math.floor(stage)));s.mode='Farm';s.wave=0;resetBattle();return true;
}
function goPush(){
 if(!s||s.dungeon||s.mode==='Push')return false;
 s.stage=Math.min(1_000_000_000,s.best+1);s.mode='Push';s.wave=0;resetBattle();return true;
}
function lootPop(title:string,entries:{id:number;dupe:boolean}[],isPet=false){
 const defs=isPet?pets:heroes,best=Math.max(...entries.map(x=>defs[x.id].rarity));
 view.pop={title,style:'reveal',body:'<div class="pull-results">'+entries.map((x,i)=>{
  const d=defs[x.id];return '<div class="pull" style="--tone:'+colors[d.rarity]+';--index:'+i+'">'+portrait((isPet?'p':'h')+x.id)+'<strong>'+esc(d.name)+'</strong><small>'+rarities[d.rarity]+' · '+(x.dupe?'Essence':isPet?'New companion':'New hero')+'</small></div>';
 }).join('')+'</div>'};audio.ritual(isPet,best>=2);
}
const authMessage=(text:string)=>{const x=el('auth-error');if(x)x.textContent=text;};
async function accountAction(action:string){
 try{
  if(action==='google'){authMessage('Opening Google sign-in…');await google();}
  else if(action==='resetPassword'){const email=root.querySelector<HTMLInputElement>('[name=email]')?.value.trim();if(!email){authMessage('Enter your email first.');return;}await resetPassword(email);authMessage('Password reset email requested.');}
 }catch(e){authMessage(formatCloudError(e));}
}
root.addEventListener('submit',async e=>{
 const form=e.target;if(!(form instanceof HTMLFormElement)||form.id!=='email-form')return;
 e.preventDefault();
 const email=String(new FormData(form).get('email')??'').trim(),password=String(new FormData(form).get('password')??'');
 const submit=(e as SubmitEvent).submitter as HTMLButtonElement|null;
 authMessage('Connecting to Firebase…');
 try{if(submit?.dataset.register)await emailRegister(email,password);else await emailSignIn(email,password);}
 catch(e){authMessage(formatCloudError(e));}
});
root.addEventListener('click',async e=>{
 const target=(e.target as Element).closest<HTMLElement>('[data-action]');if(!target)return;
 const [action,a,b]=target.dataset.action!.split(':');const n=+a,k=+b;
 try{audio.start();}catch{}
 if(action==='google'||action==='resetPassword'){void accountAction(action);return;}
 if(action==='guest'){if(user)await logout();sequence++;cloudReady=false;conflicted=false;const local=localRead();enter(local?.state??newSave());return;}
 if(!s)return;
 let modified=false,rebuild=false,render=true;
 switch(action){
  case 'close':view.tab=null;view.setting=false;loginShown=false;break;
  case 'closeLogin':loginShown=false;break;
  case 'settings':view.setting=true;view.tab=null;break;
  case 'login':loginShown=true;break;
  case 'logout':
   localWrite();await cloudWrite();await logout();sequence++;s=null;user=null;uid='';cloudReady=false;conflicted=false;visual?.game.destroy(true);visual=null;battle=null;showAuth();return;
  case 'sync':void reconnect();return;
  case 'loadCloud':if(confirm('Replace the current device progress with the newer cloud save?'))void reconnect(true);return;
  case 'export':{
   const url=URL.createObjectURL(new Blob([JSON.stringify(s,null,2)],{type:'application/json'})),link=document.createElement('a');
   link.href=url;link.download='everfall-save.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);return;
  }
  case 'tab':open(a as View['tab']);return;
  case 'page':view.page=Math.max(0,view.page+n);break;
  case 'stat':view.stat=a;view.page=0;view.search='';break;
  case 'encyclopedia':view.stat='Encyclopedia';open('Stats');return;
  case 'hero':
   if(!heroes[n])return;
   if(view.tab!=='Heroes')open('Heroes');
   view.hero=n;view.heroFocus=true;renderOverlay(false);return;
  case 'heroList':view.heroFocus=false;renderOverlay(false);return;
  case 'pet':view.pet=n;break;
  case 'item':
   if(view.tab!=='Inventory')open('Inventory');
   view.inventory='Gear';view.itemFocus=true;view.item=a;view.gearPicker=false;view.gearSearch='';renderOverlay(false);return;
  case 'inventory':view.inventory=a as View['inventory'];view.itemFocus=false;renderOverlay(false);return;
  case 'itemList':view.itemFocus=false;view.gearPicker=false;renderOverlay(false);return;
  case 'gearPicker':view.gearPicker=!view.gearPicker;view.gearSearch='';renderOverlay();return;
  case 'gearTarget':
   if(s.hero[n]){view.gearHero=n;view.gearPicker=false;view.gearSearch='';view.page=0;renderOverlay();}
   return;
  case 'liveMeter':liveOpen=!liveOpen;liveStamp='';liveHud();return;
  case 'liveWave':liveLast=a==='last'&&!!lastBattle;liveHero='';liveStamp='';liveHud();return;
  case 'meterHero':liveHero=liveHero===a?'':a;liveStamp='';liveHud();return;
  case 'slot':
   open('Inventory');view.gearHero=view.hero;view.gearFromHero=true;view.filter=slots[n];view.sort='Upgrade';view.item='';view.itemFocus=false;renderOverlay(false);return;
  case 'dismiss':view.pop=null;break;
  case 'pause':view.pause=!view.pause;break;
  case 'speed':s.settings.speed=s.settings.speed===1?2:s.settings.speed===2?4:1;modified=true;render=false;break;
  case 'mode':modified=s.mode==='Push'?goFarm(s.lastFarm):goPush();if(!modified)open('Adventure');break;
  case 'push':modified=goPush();if(modified)view.tab=null;break;
  case 'farm':modified=goFarm(Number(el<HTMLInputElement>('farm-stage')?.value));if(modified)view.tab=null;break;
  case 'worldOffer':modified=resolveOffer(s,n);break;
  case 'guildUpgrade':modified=upgradeGuild(s,n);break;
  case 'benchHero':modified=rebuild=!!dragAction(s,'hero:'+n,'reserve',true);break;
  case 'partyAdd':modified=rebuild=setParty(s,n,s.party.length);break;
  case 'priority':{
   const order=s.hero[n].priority,j=(k+1)%order.length;[order[k],order[j]]=[order[j],order[k]];modified=rebuild=true;break;
  }
  case 'ascendH':modified=rebuild=ascend(s,n);break;
  case 'ascendP':modified=rebuild=ascend(s,n,true);break;
  case 'convert':if(s.hero[n]?.stars===10&&s.hero[n].essence>=5){s.hero[n].essence-=5;s.universal++;modified=true;toast('Converted to Universal Essence · '+s.universal);}break;
  case 'master':modified=rebuild=train(s,n,k);break;
  case 'respec':if(s.hero[n]?.tree.length&&s.gold>=60){s.gold-=60;s.hero[n].tree=[];modified=rebuild=true;}break;
  case 'hatch':{const result=hatch(s,n);if(result){modified=true;view.pet=result.id;lootPop('An egg has hatched',[result],true);}break;}
  case 'sanctuary':modified=assignSanctuary(s,n);break;
  case 'equip':modified=rebuild=equip(s,n,b);if(modified)toast('Gear equipped on '+heroes[n].name);break;
  case 'unequip':if(s.hero[n]?.gear[k]){s.hero[n].gear[k]=null;modified=rebuild=true;}break;
  case 'lock':{const i=s.items.find(x=>x.id===a);if(i){i.locked=!i.locked;modified=true;}break;}
  case 'sell':modified=!!sell(s,[a]);if(modified){view.item='';view.itemFocus=false;}break;
  case 'bulk':{
   const ids=inventoryFilter().filter(i=>!i.locked&&!equipped(s!,i.id)).map(i=>i.id);
   if(ids.length&&confirm('Sell '+ids.length+' filtered unlocked, unworn items?')){modified=!!sell(s,ids);view.item='';view.page=0;}break;
  }
  case 'enchant':modified=rebuild=enchant(s,a,k);if(!modified)toast('More gold is needed to reroll this affix.');break;
  case 'saveLoadout':if(s.loadouts.length<12&&s.hero[n]){s.loadouts.push({name:heroes[n].name+' · '+(s.loadouts.length+1),hero:n,gear:[...s.hero[n].gear]});modified=true;toast('Loadout saved.');}break;
  case 'deleteLoadout':if(s.loadouts[n]){s.loadouts.splice(n,1);modified=true;}break;
  case 'loadout':{
   const l=s.loadouts[n];if(!l)break;
   if(l.gear.some(id=>id!==null&&!s!.items.some(i=>i.id===id))){toast('This loadout includes an item you no longer own.');break;}
   const candidate=structuredClone(s);candidate.hero[l.hero].gear=Array(10).fill(null);
   if(l.gear.every(id=>id===null||equip(candidate,l.hero,id))){s.hero=candidate.hero;modified=rebuild=true;toast('Loadout applied.');}
   else toast('This loadout contains incompatible equipment.');
   break;
  }
  case 'summon':{
   const first=!s.party.length,results=summon(s,n===10?10:1);
   if(results.length){
    modified=true;if(first){view.hero=results[0].id;resetBattle();}
    lootPop(first?'Your expedition begins':'The circle answers',results);
   }
   break;
  }
  case 'dungeon':
   if(startDungeon(s,n,dungeonTiers[n])){modified=true;view.tab=null;resetBattle();fieldToast('Dungeon entered: '+dungeons[n].name,2);}
   else toast('This tier is locked or you need a key.');break;
  case 'resumeDungeon':if(s.dungeon?.camp){s.dungeon.camp=false;modified=true;view.tab=null;resetBattle();}break;
  case 'retreatDungeon':if(s.dungeon?.camp){s.dungeon=null;modified=true;view.tab=null;resetBattle();toast('Dungeon expedition ended.');}break;
  case 'claim':modified=claimAchievement(s,a);if(modified)toast('Achievement earned.');break;
  case 'title':{const title=achievements.find(t=>t.id===a);if(title&&s.claimed.includes(a)){s.title=title.name;modified=true;}break;}
 }
 if(rebuild&&!s.dungeon?.camp)resetBattle();
 if(modified){changed();audio.confirm();}
 if(render)renderOverlay();hud();
});
root.addEventListener('input',e=>{
 const input=e.target as HTMLInputElement;if(!s)return;
 if(input.dataset.setting){const k=input.dataset.setting as 'shake'|'music'|'sfx';s.settings[k]=+input.value;audio.music=s.settings.music;audio.sfx=s.settings.sfx;changed(false);}
 const field=input.dataset.input;
 if(field==='search'||field==='gearSearch'){
  view[field]=input.value;if(field==='search')view.page=0;const cursor=input.selectionStart;renderOverlay();
  const replacement=root.querySelector<HTMLInputElement>('[data-input='+field+']');replacement?.focus({preventScroll:true});if(cursor!==null)replacement?.setSelectionRange(cursor,cursor);
 }
});
root.addEventListener('change',async e=>{
 const input=e.target as HTMLInputElement;if(!s)return;
 if(input.id==='import-save'&&input.files?.[0]){
  try{
   const file=input.files[0];if(file.size>950000)throw new Error('This save is too large.');
   const raw=JSON.parse(await file.text());if(!raw?.hero||!raw?.party||!raw?.version)throw new Error('This file is not an Everfall save.');
   if(!confirm('Replace progress in this profile with the imported save?'))return;
   enter(restore({...raw,updated:Date.now()}),uid,revision,true);changed();toast('Save imported.');
  }catch(e){toast(formatCloudError(e));}
  return;
 }
 if(input.dataset.setting){localWrite();return;}
 if(!input.dataset.change)return;
 const [action,a,b]=input.dataset.change.split(':'),n=+a,k=+b,value=+input.value;let modified=false,rebuild=false;
 switch(action){
  case 'filter':view.filter=input.value;view.page=0;if(view.tab==='Inventory')view.item='';break;
  case 'sort':view.sort=input.value;view.page=0;break;
  case 'quality':s.settings.quality=value;modified=true;break;
  case 'party':if(value>=0)modified=rebuild=setParty(s,n,value);break;
  case 'ai':if(['Balanced','Aggressive','Conserve'].includes(input.value)){s.hero[n].ai=input.value as Save['hero'][number]['ai'];modified=rebuild=true;}break;
  case 'petFor':modified=rebuild=assignPet(s,n,value<0?null:value);break;
  case 'owner':{
   if(value>=0)modified=rebuild=assignPet(s,value,n);
   else{const old=Object.keys(s.hero).find(id=>s!.hero[+id].pet===n);if(old)modified=rebuild=assignPet(s,+old,null);}break;
  }
  case 'autoSell':s.autoSell=value;modified=true;break;
  case 'gem':{
   const i=s.items.find(x=>x.id===a);if(!i||k>=i.sockets.length||value>=0&&!s.gems[value])break;
   const previous=i.sockets[k];if(previous!==null)s.gems[previous]++;if(value>=0)s.gems[value]--;
   i.sockets[k]=value<0?null:value;modified=rebuild=true;break;
  }
  case 'tier':dungeonTiers[n]=value;return;
  case 'job':modified=assignJob(s,n,value<0?null:value);break;
  case 'battleIndex':view.statIndex=value;break;
  case 'compareIndex':view.compareIndex=value;break;
 }
 if(rebuild&&!s.dungeon?.camp)resetBattle();
 if(modified)changed();renderOverlay();hud();
});
window.addEventListener('online',()=>void reconnect());
window.addEventListener('pagehide',()=>{localWrite(!document.hidden||!!s?.dungeon);});
document.addEventListener('visibilitychange',()=>{
 if(!s)return;
 if(document.hidden){if(!hiddenAt){hiddenAt=Date.now();if(workAccum){work(s,workAccum);workAccum=0;}localWrite();void cloudWrite();}}
 else if(hiddenAt){
  const summary=offline(s,Date.now(),20);hiddenAt=0;lastFrame=performance.now();lastSimEpoch=Date.now();
  if(summary.elapsed){changed();resetBattle(false,true);offlinePopup(summary.elapsed,summary.r);renderOverlay();}
 }
});
function loop(now:number){
 requestAnimationFrame(loop);
 const dt=Math.min(.12,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
 if(!s||!battle||!visual||document.hidden)return;
 if(Date.now()-lastSimEpoch>90000){
  const summary=offline(s,Date.now());if(summary.elapsed){changed();resetBattle(false,true);offlinePopup(summary.elapsed,summary.r);renderOverlay();}
 }
 lastSimEpoch=Date.now();
 workAccum+=dt;if(workAccum>=5){work(s,workAccum);workAccum=0;changed(false);}
 if(s.party.length&&!view.pause&&!s.dungeon?.camp&&!(view.pop&&s.wins===0&&s.losses===0&&s.summons===1)){
  if(delay>0){delay-=dt;if(delay<=0)resetBattle(walkNext);}
  else if(travel>0){travel=Math.max(0,travel-dt);visual.scene.advance(1-travel/travelDuration);}
  else{
   acc=Math.min(.45,acc+dt*s.settings.speed);
   while(acc>=STEP&&!battle.result){battle.step();acc-=STEP;}
   visual.scene.interp=Math.min(1,acc/STEP);
   if(battle.result&&delay<=0){
    const last=s.serial,stage=s.stage,won=battle.result===1,wasDungeon=!!s.dungeon,previousMode=s.mode;
    const beforeEggs=[...s.egg];
    const r=finish(s,battle);lastBattle=battle;
    for(let tier=0;tier<3;tier++)if(s.egg[tier]>beforeEggs[tier])visual.scene.eggDrop(tier);
    const items=s.items.filter(i=>+i.id>last).sort((a,b)=>b.rank-a.rank);
    if(r.eggs)fieldToast('A pet egg dropped · visit Pets',3);
    else if(items[0]){fieldToast(itemName(items[0])+' acquired',items[0].rank);if(items[0].rank>=4)audio.confirm(true);}
    else if(wasDungeon&&!s.dungeon)fieldToast(won?'Dungeon cleared':'Dungeon failed',won?4:1);
    else if(!won&&previousMode==='Push')fieldToast('Regrouping at stage '+s.stage+' · Farm Mode',2);
    else if(stage!==s.stage)fieldToast('Stage '+stage+' cleared',0);
    changed();
    if(!s.dungeon?.camp){
     walkNext=won&&!wasDungeon;
     delay=(won?(battle.drops.some(d=>d.item.rank>=4)?1.55:.8):1.6)/Math.sqrt(s.settings.speed);
    }
    if((view.tab==='Inventory'&&view.inventory==='Loot log'&&battle.drops.length&&won&&!root.querySelector('.panel-content')?.contains(document.activeElement))||(s.dungeon?.camp&&view.tab==='Dungeons')||((r.eggs&&view.tab==='Pets')||(r.crystals&&view.tab==='Summon')||(r.keys&&view.tab==='Dungeons'))&&!root.querySelector('.panel-content')?.contains(document.activeElement))renderOverlay();
   }
  }
 }
 if(now-lastHud>210){hud();lastHud=now;}
 if(now-lastSave>12000){localWrite();lastSave=now;}
 if(Date.now()-lastCloud>35000&&uid&&cloudReady&&!conflicted)void cloudWrite();
}
showAuth();
authWatch(account=>void accountChanged(account));
requestAnimationFrame(loop);
