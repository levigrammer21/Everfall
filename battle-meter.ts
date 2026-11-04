import type { Battle } from './combat';
import { pets } from './content';
import { dur, esc, num, portrait } from './ui';

const columns=[
 ['damage','Damage'],['dps','DPS'],['heal','Healing done'],['taken','Damage taken'],['received','Healing received'],
 ['prevent','Mitigated'],['shield','Shield given'],['absorbed','Shield used'],['overheal','Overheal'],
 ['pet','Pet damage'],['bonus','Bonus damage'],['crits','Crits'],['misses','Misses'],
 ['attacks','Attacks'],['casts','Casts'],['kills','Kills'],['deaths','Deaths'],
] as const;
export function meterMarkup(battle:Battle,chosen:string){
 const units=battle.units.filter(u=>u.hero!==null);
 if(!units.length)return '<p class="meter-empty">Summon a hero to start tracking combat.</p>';
 const rows=units;
 const totalDamage=rows.reduce((total,u)=>total+battle.details[u.id].damage,0);
 const selected=units.find(u=>u.id===chosen);
 const summary='<div class="live-caption"><span>Stage '+num(battle.info.stage)+' · Wave '+(battle.info.wave+1)+'</span><strong data-live-stat="time">'+dur(battle.time)+'</strong></div>';
 const table='<div class="live-table"><table><thead><tr><th scope="col">Hero</th>'+columns.map(([,label])=>'<th scope="col">'+label+'</th>').join('')+'</tr></thead><tbody>'+
 rows.map(u=>{
  const m=battle.details[u.id],share=totalDamage?Math.round(m.damage/totalDamage*100):0;
  return '<tr><th scope="row"><button class="live-hero" data-action="meterHero:'+u.id+'" aria-pressed="'+(u===selected)+'">'+portrait('h'+u.hero)+'<span>'+esc(u.name)+'<small data-live-stat="'+u.id+'-share">'+share+'% of damage</small></span></button></th>'+
   columns.map(([key])=>'<td data-live-stat="'+u.id+'-'+key+'">'+num(key==='dps'?m.damage/Math.max(1,battle.time):m[key]??0)+'</td>').join('')+'</tr>';
 }).join('')+'</tbody></table></div>';
 if(!selected)return summary+table+'<p class="meter-note">Swipe across for every stat. Tap a hero for their ability and damage-source breakdown.</p>';
 const m=battle.details[selected.id];
 const entries=(values:Record<string,number>,duration=false)=>Object.entries(values).sort((a,b)=>b[1]-a[1]).map(([key,value])=>'<div><span>'+esc(key)+'</span><b>'+(duration?dur(value):num(value))+'</b></div>').join('')||'<p>None this wave</p>';
 const breakdown=(title:string,values:Record<string,number>,duration=false)=>'<div class="live-breakdown"><b>'+title+'</b>'+entries(values,duration)+'</div>';
 return summary+table+'<div class="live-detail"><strong>'+esc(selected.name)+(m.petId===undefined?'':' · '+esc(pets[m.petId].name))+'</strong><div>'+
 breakdown('Damage by ability',m.bySkill)+breakdown('Healing by ability',m.healsBySkill??{})+breakdown('Damage taken by source',m.incoming??{})+breakdown('Status uptime',m.uptime,true)+'</div></div>';
}
