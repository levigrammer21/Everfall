export function bindDrag(root:HTMLElement,accept:(source:string,target:string)=>boolean,drop:(source:string,target:string)=>void){
 let state:{pointer:number;source:HTMLElement;key:string;x:number;y:number;ghost:HTMLElement|null;target:HTMLElement|null}|null=null;
 let frame=0,suppressClick=false;
 const zoneAt=(x:number,y:number)=>document.elementFromPoint(x,y)?.closest<HTMLElement>('[data-drop]')??null;
 function paint(){
  if(!state?.ghost)return;
  const {x,y,ghost,key}=state;
  ghost.style.transform='translate3d('+Math.round(x+12)+'px,'+Math.round(y-42)+'px,0)';
  const candidate=zoneAt(x,y),valid=candidate&&accept(key,candidate.dataset.drop!);
  const target=valid?candidate:null;
  if(target!==state.target){
   state.target?.classList.remove('drop-hot');
   target?.classList.add('drop-hot');state.target=target;
  }
 }
 function scroll(){
  if(!state?.ghost)return;
  const panel=root.querySelector<HTMLElement>('.panel-content');
  if(panel){
   const rect=panel.getBoundingClientRect(),edge=Math.min(55,rect.height*.22),y=state.y;
   if(y>=rect.top-35&&y<rect.top+edge)panel.scrollTop-=Math.min(18,Math.ceil((rect.top+edge-y)/4));
   if(y<=rect.bottom+35&&y>rect.bottom-edge)panel.scrollTop+=Math.min(18,Math.ceil((y-rect.bottom+edge)/4));
  }
  paint();frame=requestAnimationFrame(scroll);
 }
 function clear(){
  if(!state)return;
  const active=!!state.ghost;state.ghost?.remove();
  state.source.classList.remove('drag-source');state.target?.classList.remove('drop-hot');
  for(const zone of root.querySelectorAll('.drop-ready'))zone.classList.remove('drop-ready');
  root.classList.remove('dragging');
  cancelAnimationFrame(frame);state=null;
  return active;
 }
 root.addEventListener('pointerdown',event=>{
  if(state||!event.isPrimary||event.button!==0)return;
  suppressClick=false;
  const grip=(event.target as Element).closest<HTMLElement>('[data-grip]');
  const source=grip?.closest<HTMLElement>('[data-drag]');
  if(!source||!grip||!source.dataset.drag)return;
  state={pointer:event.pointerId,source,key:source.dataset.drag,x:event.clientX,y:event.clientY,ghost:null,target:null};
  grip.setPointerCapture(event.pointerId);
 });
 root.addEventListener('pointermove',event=>{
  if(!state||event.pointerId!==state.pointer)return;
  if(!state.source.isConnected){clear();return;}
  if(!state.ghost){
   if(Math.hypot(event.clientX-state.x,event.clientY-state.y)<7)return;
   const ghost=document.createElement('div');
   ghost.className='drag-ghost';ghost.setAttribute('aria-hidden','true');
   const art=state.source.querySelector('.portrait');if(art)ghost.append(art.cloneNode(true));
   const name=document.createElement('span');name.textContent=state.source.dataset.dragLabel??'Move';ghost.append(name);
   root.append(ghost);state.ghost=ghost;state.source.classList.add('drag-source');root.classList.add('dragging');
   for(const zone of root.querySelectorAll<HTMLElement>('[data-drop]'))if(accept(state.key,zone.dataset.drop!))zone.classList.add('drop-ready');
   frame=requestAnimationFrame(scroll);
  }
  state.x=event.clientX;state.y=event.clientY;paint();
 });
 root.addEventListener('pointerup',event=>{
  if(!state||event.pointerId!==state.pointer)return;
  const key=state.key,zone=state.ghost&&zoneAt(event.clientX,event.clientY);
  suppressClick=!!clear();
  if(zone&&accept(key,zone.dataset.drop!))drop(key,zone.dataset.drop!);
 });
 root.addEventListener('pointercancel',event=>{if(event.pointerId===state?.pointer){suppressClick=!!clear();}});
 root.addEventListener('lostpointercapture',event=>{if((event as PointerEvent).pointerId===state?.pointer){suppressClick=!!clear();}});
 root.addEventListener('click',event=>{
  if(suppressClick&&event.detail){suppressClick=false;event.stopImmediatePropagation();event.preventDefault();}
 },true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&state?.ghost){suppressClick=!!clear();event.preventDefault();}});
 return ()=>!!state;
}
