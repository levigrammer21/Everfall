import { heroes, pets, guildJobs } from './content';
import { itemName } from './loot';
import { assignJob, assignPet, assignSanctuary, canEquip, equip, setParty, type Save } from './save';

export function dragAction(s:Save,source:string,target:string,apply=false){
 const [kind,id,index]=source.split(':'),[to,key,slot]=target.split(':');
 const h=Number(id),n=Number(key);
 const action=(message:string,change:()=>unknown,rebuild=true)=>{
  if(apply)change();
  return {message,rebuild};
 };
 if(kind==='hero'&&s.hero[h]){
  const prev=s.party.indexOf(h);
  if(to==='formation'&&Number.isInteger(n)&&n>=0&&n<5&&n<=s.party.length&&prev!==n&&(prev<0||n<s.party.length))
   return action(heroes[h].name+' moved to slot '+(n+1),()=>setParty(s,h,n));
  if(to==='reserve'&&prev>=0&&s.party.length>1)
   return action(heroes[h].name+' moved to reserves',()=>s.party.splice(prev,1));
 }
 if(kind==='item'){
  const item=s.items.find(i=>i.id===id);
  if(item&&to==='equip'&&s.hero[n]&&!s.hero[n].gear.includes(id)&&canEquip(s,n,item))
   return action(itemName(item)+' equipped on '+heroes[n].name,()=>equip(s,n,id));
  if(item&&to==='unequip'&&s.hero[n]?.gear.includes(id))
   return action(itemName(item)+' returned to inventory',()=>{const gear=s.hero[n].gear;gear[gear.indexOf(id)]=null;});
 }
 if(kind==='pet'&&s.pet[h]){
  const owner=Object.keys(s.hero).map(Number).find(hero=>s.hero[hero].pet===h);
  if(to==='petOwner'&&s.hero[n]&&owner!==n)
   return action(pets[h].name+' assigned to '+heroes[n].name,()=>assignPet(s,n,h));
  if(to==='petFree'&&(owner!==undefined||s.sanctuary.includes(h)))
   return action(pets[h].name+' unassigned',()=>{
    if(owner!==undefined)assignPet(s,owner,null);
    if(s.sanctuary.includes(h))assignSanctuary(s,h);
   });
  if(to==='sanctuary'&&s.sanctuary.length<3&&!s.sanctuary.includes(h))
   return action(pets[h].name+' moved to sanctuary training',()=>{
    if(owner!==undefined)assignPet(s,owner,null);
    assignSanctuary(s,h);
   });
 }
 if(kind==='skill'&&to==='priority'&&h===n&&s.hero[h]){
  const order=s.hero[h].priority,from=Number(index),dest=Number(slot);
  if(Number.isInteger(from)&&Number.isInteger(dest)&&from>=0&&dest>=0&&from<order.length&&dest<order.length&&from!==dest)
   return action('Skill priority updated',()=>{order.splice(dest,0,order.splice(from,1)[0]);});
 }
 if(kind==='guildHero'&&to==='guild'&&s.hero[h]&&!s.party.includes(h)&&(n===-1||n>=0&&n<8&&Number.isInteger(n))){
  const job=n===-1?null:n;
  if(s.hero[h].job!==job)return action(job===null?heroes[h].name+' unassigned':heroes[h].name+' assigned to '+guildJobs[n],()=>assignJob(s,h,job),false);
 }
 return null;
}
