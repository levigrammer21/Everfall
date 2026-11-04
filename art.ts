import { biomes, elements, enemies, heroes, pets } from './content';
import { prng } from './combat';
const shade=(h:number,s:number,l:number)=>'hsl('+h+' '+s+'% '+l+'%)';
export const rgb=(n:number)=>'#'+n.toString(16).padStart(6,'0');
const shapeAliases:Record<string,string>={skull:'skeleton',spider:'spider',egg:'egg',ghost:'ghost'};
type Design={shape:string;hue:number;id:number;element:keyof typeof elements};
function sprite(c:CanvasRenderingContext2D,d:Design,key:string){
 const shape=shapeAliases[d.shape]??d.shape,h=d.hue,ink='#161222',dark=shade(h,35,26),mid=shade(h,48,46),light=shade(h,66,68),glow=rgb(elements[d.element]),pale='#f5dcc1';
 const p=(col:string,x:number,y:number,w:number,ht:number)=>{c.fillStyle=col;c.fillRect(x,y,w,ht);};
 const poly=(col:string,...v:number[])=>{c.fillStyle=col;c.beginPath();c.moveTo(v[0],v[1]);for(let i=2;i<v.length;i+=2)c.lineTo(v[i],v[i+1]);c.closePath();c.fill();};
 const block=(col:string,x:number,y:number,w:number,ht:number)=>{p(ink,x-1,y-1,w+2,ht+2);p(col,x,y,w,ht);p(light,x+1,y+1,w-2,1);};
 const eye=(x:number,y:number)=>{p('#151125',x-1,y-1,4,3);p(glow,x,y,2,1);p('#fff4cd',x+1,y,1,1);};
 const feet=(x=10,y=26)=>{p(ink,x-1,y,6,4);p(ink,x+8,y,6,4);p(dark,x,y,5,3);p(mid,x+8,y,5,3);p(light,x+11,y,2,1);};
 const robe=()=>{poly(ink,11,14,22,13,24,21,25,28,20,30,7,29,8,23);poly(dark,12,15,21,15,22,23,24,27,19,28,8,28);poly(mid,11,16,16,16,14,26,10,27);p(light,10,21,2,5);p(glow,14,19,8,1);p(dark,19,22,2,5);};
 const wand=()=>{p(ink,27,10,2,20);p('#ab775d',27,13,1,15);poly(ink,25,7,28,5,31,7,30,12,26,12);p(glow,27,7,3,3);p(pale,28,7,1,1);};
 const horns=()=>{poly(ink,10,10,5,8,4,3,8,5,11,7,19,7,24,3,24,9,21,12);poly(pale,6,5,9,8,9,9,6,8);poly(pale,22,6,23,5,23,9,20,10);};
 switch(shape){
 case 'slime':{
  poly(ink,4,27,5,21,8,19,9,14,13,11,20,12,24,16,25,21,29,24,28,28,22,30,10,30);
  poly(mid,6,26,8,21,11,18,11,15,15,13,20,14,23,17,23,21,27,25,26,27,21,29,9,28);
  poly(dark,7,26,14,26,16,24,24,24,27,25,25,28,9,28);
  p(light,12,15,6,2);p(light,10,18,2,3);p(glow,23,24,2,1);eye(17,20);eye(22,20);p(ink,20,24,3,1);break;
 }
 case 'tree':{
  poly(ink,7,29,10,22,8,18,3,14,4,10,8,14,10,13,9,9,10,5,14,4,17,1,20,5,24,3,23,9,21,12,23,15,27,12,29,9,29,15,25,21,22,21,24,27,28,29,22,30,7,30);
  poly(dark,9,28,12,22,10,17,5,13,6,13,10,15,12,12,10,9,11,6,15,6,17,3,19,6,23,5,21,10,19,12,22,18,27,14,28,13,27,17,23,20,20,20,22,27,25,29);
  p(mid,13,8,4,17);p(light,13,8,2,10);p(mid,16,22,3,5);eye(17,13);eye(22,14);p(glow,15,22,2,3);p(light,8,17,4,1);break;
 }
 case 'skeleton':{
  feet();p(ink,11,18,12,9);p(pale,12,18,2,8);p(pale,20,18,2,8);p(pale,14,18,6,2);p(pale,14,22,6,1);p(light,14,25,5,2);
  block(pale,11,6,12,9);p(pale,15,15,7,3);p(ink,17,15,1,2);p(ink,20,15,1,2);eye(15,10);eye(20,10);
  p(ink,7,17,4,8);p(pale,8,17,2,6);p(ink,22,17,6,4);p(pale,23,18,5,2);poly(light,25,16,30,9,30,14,27,20);break;
 }
 case 'goblin':case 'frog':case 'rat':case 'brute':{
  const rat=shape==='rat',frog=shape==='frog',brute=shape==='brute';
  if(rat){poly(ink,4,25,1,22,1,17,4,16,5,18,3,20,7,24,11,25);p(mid,3,20,2,4);}
  if(brute)horns();
  feet(rat?9:10,26);
  poly(ink,10,14,22,14,26,19,25,26,22,28,9,28,7,24,7,18);poly(dark,10,17,22,16,24,19,23,25,20,27,10,27,8,23);p(mid,11,19,10,6);p(light,12,20,6,1);p(ink,10,25,13,2);p(glow,15,25,3,1);
  if(frog){block(mid,9,9,16,8);block(mid,10,7,4,4);block(mid,20,7,4,4);p(light,13,14,11,3);eye(11,9);eye(21,9);p(ink,16,14,8,1);}
  else{
   poly(ink,6,8,12,9,12,6,21,5,24,8,26,11,29,13,26,17,15,18,11,15,8,14);
   poly(mid,8,9,13,10,13,7,20,6,23,9,24,12,27,13,25,15,16,17,12,14,10,13);
   p(light,14,8,5,2);eye(19,10);p(ink,23,14,4,1);p(pale,24,15,1,2);p(dark,9,11,3,2);
   if(rat){block(dark,10,4,5,5);p(light,12,5,2,2);}
  }
  if(d.id===44||d.id===20&&shape==='goblin'){block('#8af0ab',23,18,6,7);p('#e8ffb4',24,21,4,2);p('#754d69',24,17,4,1);}
  else if(brute){p(mid,5,18,5,7);p(light,6,19,2,2);block(dark,23,17,5,7);}
  break;
 }
 case 'witch':case 'wizard':case 'reaper':case 'jester':case 'bird':{
  robe();
  if(shape==='bird'){
   block(mid,12,9,11,8);poly(ink,20,10,30,13,29,16,20,17);poly(pale,21,11,28,13,27,15,22,15);eye(20,11);p(light,14,10,3,2);
   poly(dark,10,17,14,17,13,22,7,25);p(light,9,23,2,1);
  }else if(shape==='reaper'){
   poly(ink,9,15,9,9,13,5,20,5,24,9,24,16,18,18);poly(mid,10,13,10,10,14,6,19,6,22,9,23,14,17,17);poly(dark,13,15,13,10,17,8,22,11,22,15,17,17);eye(17,12);eye(21,12);
   p(ink,26,7,2,23);p(pale,26,9,1,18);poly(ink,20,5,24,2,29,2,32,6,32,11,29,8,27,6,23,7);poly(light,21,5,25,3,29,3,31,6,31,8,28,6,25,5);
  }else{
   block(shape==='jester'?pale:shade(h,29,72),12,10,10,8);eye(18,13);
   if(shape==='wizard'){poly(pale,14,14,17,15,22,14,22,19,19,23,16,19);p('#ae9aa5',17,17,1,4);}
   if(shape==='jester'){poly(ink,9,12,6,4,12,4,15,8,20,4,24,3,27,8,24,8,21,12);poly(mid,10,11,8,5,12,5,15,9,21,5,24,4,26,7,23,7,20,11);p(glow,7,4,2,2);p(glow,25,7,2,2);}
   else{poly(ink,7,11,11,8,13,4,17,2,20,3,19,6,22,8,25,9,25,12,8,13);poly(mid,8,11,12,9,14,5,17,3,19,4,18,6,21,9,24,10,24,11);p(light,12,9,9,1);}
   wand();
  }
  break;
 }
 case 'knight':{
  feet();block(dark,11,16,12,11);p(mid,13,16,8,8);p(light,14,17,6,1);p(glow,16,21,3,2);p(ink,12,24,10,1);
  poly(ink,10,13,10,8,13,5,20,5,24,8,25,13,22,17,13,17);poly(mid,11,12,11,9,14,6,20,6,23,9,24,13,21,16,14,16);
  p(light,14,7,5,2);p(ink,15,11,9,3);p(glow,18,12,5,1);p(light,14,14,2,2);p(dark,21,14,2,2);
  if(d.id%3===0){poly(glow,14,6,15,2,22,2,20,4,18,4,18,6);}
  poly(ink,6,16,10,14,13,16,13,23,10,27,7,25,5,22);poly(dark,7,17,10,15,12,17,12,23,10,25,7,24,6,21);p(light,8,17,2,5);
  poly(ink,23,22,26,16,29,10,31,8,31,14,27,22,26,26);poly(pale,24,22,27,16,30,10,30,14,26,23);break;
 }
 case 'dragon':case 'bat':case 'bee':case 'spider':case 'horse':{
  const dragon=shape==='dragon',horse=shape==='horse',bat=shape==='bat',bee=shape==='bee';
  if(dragon||bat||bee){
   poly(ink,17,17,6,14,1,9,2,5,8,8,13,5,18,8,19,3,27,5,30,9,28,16,22,13);
   poly(dark,15,15,6,13,2,8,3,6,8,10,13,6,18,10,20,4,26,6,29,9,27,14,22,11);
   p(light,8,10,2,2);p(light,22,6,2,2);
  }
  if(dragon||horse){poly(ink,16,15,8,17,3,14,3,11,6,13,9,13,12,11,19,10,23,4,27,6,27,10,31,13,30,17,25,18,23,23,22,28,18,29,18,25,16,24,12,27,8,27,10,23);poly(mid,9,17,13,13,19,12,23,6,26,7,26,11,30,14,29,16,24,17,22,23,21,27,19,27,19,24,15,22,11,26,10,26,12,22);p(light,15,16,7,2);eye(25,12);p(ink,27,15,3,1);if(dragon)p(glow,29,16,2,1);}
  else{
   if(shape==='spider'){for(let i=0;i<4;i++){poly(ink,12,15+i,7-i,14+2*i,3-i,19+2*i,4-i,20+2*i,8-i,17+2*i,14,20+i);poly(mid,20,15+i,25+i,14+2*i,29+i,19+2*i,28+i,20+2*i,24+i,17+2*i,18,20+i);}}
   poly(ink,9,21,8,16,11,12,22,11,26,16,26,22,22,25,14,26);poly(mid,10,20,9,16,12,13,21,12,25,16,25,21,21,24,14,25);p(light,12,14,7,2);p(dark,12,21,9,3);eye(21,17);eye(24,18);if(bee){p(ink,12,16,2,8);p('#efbd48',14,16,2,7);p(ink,16,16,2,7);}if(bat){p(pale,21,21,1,2);p(pale,24,21,1,2);}
  }break;
 }
 case 'ghost':case 'spark':case 'candle':{
  poly(ink,5,28,8,21,8,13,11,8,16,6,23,8,27,12,27,18,24,24,27,27,22,27,18,30,15,27,12,30);
  poly(dark,7,27,9,21,9,13,12,9,16,7,22,9,26,12,26,18,23,24,25,26,21,26,18,28,15,25,12,29);
  poly(mid,10,23,10,14,13,10,17,8,23,10,25,13,24,19,21,22,17,21,14,24);p(light,12,12,2,6);eye(17,14);eye(22,14);p(glow,19,18,2,3);
  if(shape==='spark'||shape==='candle'){poly(mid,13,9,11,5,15,6,16,1,18,4,21,2,22,6,25,8,20,12);poly(glow,15,8,17,3,18,7,21,6,20,10,16,11);p(pale,17,8,2,2);}break;
 }
 case 'pumpkin':case 'mushroom':case 'snail':case 'rock':case 'snow':case 'egg':case 'chest':case 'worm':{
  if(shape==='worm'){poly(ink,3,28,5,21,11,21,15,24,19,21,19,12,23,7,28,8,30,12,29,20,26,27,18,30,10,27);poly(mid,5,26,7,22,11,22,16,25,20,22,20,13,24,8,28,9,29,13,28,20,25,26,18,29,11,26);p(dark,22,16,5,2);p(light,20,21,5,2);eye(26,11);p(pale,28,16,1,2);break;}
  if(shape==='chest'){block(dark,7,15,21,12);block(mid,7,12,21,6);p(light,9,13,15,2);p(ink,7,18,21,4);p(pale,12,18,2,2);p(pale,22,19,2,2);p(glow,16,20,4,4);break;}
  if(shape==='mushroom'||shape==='pumpkin'||shape==='snow')feet();
  const pumpkin=shape==='pumpkin',snow=shape==='snow',mush=shape==='mushroom',rock=shape==='rock';
  const main=snow?'#cde4fa':pumpkin?'#d57040':mid;
  if(mush){block(pale,13,15,9,12);poly(ink,4,17,8,10,14,6,22,6,26,10,29,17,23,20,9,19);poly(main,6,16,9,11,14,7,21,7,25,11,27,16,23,18,9,18);p(pale,13,10,4,2);p(pale,21,13,3,2);eye(18,21);}
  else if(rock){poly(ink,5,24,6,15,12,8,20,9,26,13,29,24,25,29,8,29);poly(dark,6,24,7,16,12,9,20,10,25,14,28,24,24,28,9,28);poly(light,8,16,13,10,19,11,23,15,18,18,13,18);p(glow,19,19,4,2);p(mid,10,23,8,3);}
  else{
   poly(ink,5,25,6,17,10,11,14,8,21,8,26,13,29,22,27,28,21,30,10,29);
   poly(main,6,24,7,18,11,12,15,9,21,9,25,13,28,22,26,27,21,29,10,28);
   poly(dark,7,24,10,26,20,27,26,23,26,27,20,29,11,28);p(light,11,13,5,3);
   if(pumpkin){p('#6d6840',15,5,5,5);p(dark,12,15,1,9);p(dark,23,14,1,11);eye(17,17);eye(22,17);p(ink,17,22,8,2);p(glow,19,22,5,1);}
   else if(snow){p(ink,11,7,14,3);p(ink,14,3,8,4);eye(19,13);p('#ff9347',21,16,6,2);p(ink,16,21,2,2);p(ink,18,25,2,2);}
   else if(shape==='snail'){p(dark,8,16,10,8);p(light,10,17,7,4);p(mid,13,19,3,3);p(glow,24,16,1,4);p(glow,27,17,1,4);eye(25,22);}
   else{p(light,14,12,4,2);p(glow,12,20,2,3);p(glow,20,16,3,3);p(glow,21,24,4,2);}
  }break;
 }
 default:block(mid,11,12,12,14);eye(20,16);
 }
 // A small accent changes with each character's identity and palette.
 if(d.id%5===0&&['knight','witch','wizard','brute','skeleton'].includes(shape))p(glow,13,21,2,2);
 if(key.startsWith('h')){
  switch(d.id){
   case 0:for(const [x,y] of [[7,4],[3,13],[27,2],[28,19],[5,21]]){p(ink,x,y,4,4);p(pale,x+1,y+1,2,2);}p(glow,16,5,5,1);break;
   case 1:p(glow,28,3,3,1);p(light,22,27,4,2);break;
   case 2:for(const [x,y] of [[8,3],[13,1],[21,2],[25,6]]){p(dark,x,y,5,4);p('#83b489',x+1,y,3,2);}break;
   case 3:p(ink,8,3,5,9);p(ink,20,1,5,11);p(glow,20,13,4,1);p(dark,5,24,4,5);break;
   case 4:p('#efc97f',11,4,13,1);p(glow,14,3,7,1);p('#e6b07d',5,17,2,6);break;
   case 5:poly('#e2b464',11,7,10,2,14,4,16,1,19,4,22,2,21,7);p('#f7e5a5',15,5,2,1);break;
   case 6:p(dark,3,17,6,6);p(light,6,18,2,2);p(dark,24,18,6,7);p(light,26,18,2,2);break;
   case 7:block(dark,12,7,7,10);p(ink,14,2,2,7);p(glow,14,3,2,3);p(mid,10,8,8,1);break;
   case 8:poly('#476b57',3,28,8,20,12,22,14,27,11,29);p(glow,9,24,1,1);break;
   case 11:block('#5b93a3',17,10,7,5);p('#bffbfe',18,11,3,1);p(glow,27,5,2,1);break;
   case 12:p(pale,23,4,2,3);p(glow,13,17,2,2);p(light,4,9,2,2);break;
   case 13:for(const x of [4,8,11])p('#bdb9b5',x,4,1,14);block(light,5,17,5,6);break;
   case 14:poly('#bbc4d0',23,16,31,14,31,21,25,22);p('#c95358',26,20,4,1);break;
   case 15:p('#8d754c',14,3,3,9);p('#e4c795',13,15,4,1);p('#e4c795',12,17,5,1);break;
   case 16:p('#668366',5,14,6,4);p('#86a06e',7,13,3,2);p('#64876f',21,8,3,5);break;
   case 17:p(pale,24,15,6,1);p('#d7c5ac',21,12,4,2);p('#94744f',12,5,7,2);break;
   case 21:p('#eccb73',12,8,9,6);for(const x of [13,16,19])p('#827047',x,10,1,4);break;
   case 22:p('#c5a68a',26,6,1,13);p(pale,26,16,4,1);p(pale,29,14,1,2);break;
   case 23:p('#2f2338',7,7,3,11);p('#231826',12,6,9,2);p('#ee8d9b',20,12,3,1);break;
   case 25:p(glow,9,9,2,5);p('#e1b989',8,7,3,2);p(pale,13,6,1,2);break;
   case 27:p('#b9b5bd',26,10,5,5);p('#f6c590',27,9,1,12);break;
   case 28:poly('#74505b',3,11,6,8,11,8,14,11,12,26,5,26);p(pale,8,13,1,7);p(pale,6,15,5,1);break;
   case 29:p('#f8d46e',11,5,11,2);p('#f8d46e',12,3,2,2);p('#f8d46e',19,3,2,2);break;
   case 31:p(pale,4,3,2,5);p(pale,23,3,3,6);p(mid,25,7,2,4);break;
   case 32:p('#eebcb6',11,3,9,2);p('#f6dc9c',14,2,3,3);p('#a05d7e',12,16,8,3);break;
   case 33:p(mid,12,4,3,4);p(mid,17,3,3,4);p(pale,25,16,2,2);break;
   case 34:for(const y of [8,12,15,22,25])p('#c8b38d',12,y,9,1);break;
   case 36:p('#9c8876',25,8,5,13);p(light,25,8,4,3);break;
   case 38:p('#a1b8c1',15,3,4,5);p(glow,9,17,3,4);p('#d2b4a0',23,19,3,4);break;
   case 43:p('#ded2dc',16,17,4,4);p('#d2b7cd',17,20,2,2);p('#f5b0fd',25,7,5,1);break;
   case 45:p('#cbfff2',13,15,2,5);p('#b0fff9',26,16,3,3);p('#8deee4',28,11,3,3);break;
   case 46:p('#bd715f',12,8,3,2);p('#ca795d',13,18,2,3);p('#dd9174',6,21,2,3);break;
  }
 }
 if(key.startsWith('p')){
  if(d.id===0||d.id===24){poly(d.id===0?'#ffcb68':'#ffe99a',18,11,23,11,30,13,29,15,22,15,19,14);p('#fff0c2',17,9,2,2);}
  if(d.id===9){poly('#f3f2a1',4,23,8,19,12,18,9,22,13,21,8,25);p(glow,16,5,2,3);}
  if(d.id===14){poly(dark,10,8,12,2,16,7,19,6,22,3,23,10);p(glow,20,11,1,1);}
  if(d.id===18){poly('#80cfff',8,17,12,8,17,11,18,17,14,21);p('#c5f6fd',13,10,2,7);}
  if(d.id===21){poly('#d5ffd7',5,12,4,8,10,9,13,13,11,19,7,19);p('#fff6d8',23,8,4,2);}
  if(d.id===25){poly('#ff9d4d',7,23,2,27,4,20,7,19,8,12,12,16,11,22);p('#ffd67f',7,19,2,4);}
 }

}
export const allShapes=[...new Set([...heroes,...pets,...enemies].map(x=>x.shape).concat(['ghost','tree','rock','knight','reaper','dragon','spider','frog','skeleton','brute','goblin','horse','chest','candle','egg','wizard','rat']))];
export function actorAtlas(){
 const list=[...heroes.map(d=>({...d,key:'h'+d.id})),...pets.map(d=>({...d,key:'p'+d.id})),...enemies.map(d=>({...d,key:'e'+d.id})),...allShapes.flatMap((shape,i)=>Array.from({length:10},(_,n)=>({shape,id:i,hue:(n*36+i*11)%360,element:(['steel','fire','ice','storm','venom','holy','void','life'] as const)[n%8],key:'s'+shape+n})))];
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=Math.ceil(list.length/16)*32;const ctx=canvas.getContext('2d')!;
 const frames:Record<string,{x:number;y:number}>={};
 list.forEach((d,i)=>{const x=i%16*32,y=Math.floor(i/16)*32;frames[d.key]={x,y};ctx.save();ctx.translate(x,y);sprite(ctx,d,d.key);ctx.restore();});
 return {canvas,frames};
}
const terrains=['forest','ridge','ice','dunes','marsh','crypt','ridge','wastes','castle','astral'];
export function landscape(biome:number,layer:number){
 const canvas=document.createElement('canvas');canvas.width=384;canvas.height=154;
 const c=canvas.getContext('2d')!,r=prng(1234+biome*981+layer*783),theme=terrains[biome],h=[251,352,212,24,137,266,223,338,218,274][biome];
 const p=(color:string,x:number,y:number,w:number,ht:number)=>{c.fillStyle=color;c.fillRect(Math.floor(x),Math.floor(y),Math.ceil(w),Math.ceil(ht));};
 const poly=(color:string,v:number[])=>{c.fillStyle=color;c.beginPath();c.moveTo(v[0],v[1]);for(let i=2;i<v.length;i+=2)c.lineTo(Math.floor(v[i]),Math.floor(v[i+1]));c.closePath();c.fill();};
 if(layer===0){
  for(let y=0;y<154;y++)p(shade(h,30,10+y/9),0,y,384,1);
  const sunX=239,sunY=52,R=theme==='dunes'?27:22;
  for(let y=-R-12;y<=R+12;y++){const w=Math.sqrt((R+12)**2-y*y);p(shade(h,36,22),sunX-w,sunY+y,w*2,1);}
  for(let y=-R;y<=R;y++){const w=Math.sqrt(R**2-y*y);p(y>R*.5?shade(h,47,58):rgb(biomes[biome][2]),sunX-w,sunY+y,w*2,1);}
  for(let i=0;i<150;i++)p(shade(h+19,39,25+r()*38),r()*384,r()*108,1,r()<.06?2:1);
  for(let i=0;i<35;i++){const y=20+r()*91,x=r()*384;p(shade(h,27,17+y/13),x,y,15+r()*76,1+r()*3);}
 }else if(layer===1||layer===2){
  const base=layer===1?107:120,dark=layer===1?24:15;
  for(let i=-2;i<16;i++){
   const x=i*32+Math.floor(r()*14),height=13+r()*(layer===1?46:68),w=12+r()*28,top=base-height;
   if(theme==='castle'||theme==='crypt'){
    p(shade(h,27,dark),x,top,w,height+40);p(shade(h+8,24,dark+5),x,top,2,height);
    for(let k=0;k<3;k++)p(shade(h,30,dark),x+k*w/3,top-4,w/5,4);
    for(let y=top+6;y<base-7;y+=12){p('#151322',x+5,y,3,7);if(r()<.26)p(shade(h+32,45,47),x+6,y+3,1,2);}
   }else if(theme==='forest'||theme==='marsh'){
    p(shade(h,30,dark),x,top,3+r()*5,base-top+34);
    for(let j=0;j<4;j++){
     const y=top+j*height/6,span=7+j*3+r()*10;poly(shade(h+4,29,dark+1),[x+2,y-7,x+span,y+10,x+span/2,y+11,x+3,y+16,x-span,y+13,x-span*.57,y+7]);
    }
   }else{
    poly(shade(h,29,dark),[x-29,154,x-15,base-11,x+3,top,x+w*.4,top+height*.25,x+w*.65,top+height*.32,x+w+19,154]);
    poly(shade(h+6,30,dark+5),[x-15,base-11,x+3,top,x+w*.4,top+height*.25,x+w*.29,top+height*.36,x-3,base-5]);
    if(theme==='ice'||theme==='astral')poly(shade(h+11,42,dark+18),[x+3,top,x+w*.4,top+height*.25,x+4,top+height*.24,x-7,top+height*.37]);
   }
  }
  const bottom=layer===1?122:133;p(shade(h,25,dark-2),0,bottom,384,154-bottom);
 }else{
  for(let x=0;x<384;){const w=3+Math.floor(r()*15),y=126+Math.floor(r()*4);p(shade(h,29,13),x,y,w,154-y);p(shade(h+12,23,24),x,y,w,2);p(shade(h+15,28,31),x+1,y,w*.45,1);x+=w;}
  for(let i=0;i<300;i++)p(shade(h,26,10+r()*11),r()*384,132+r()*22,1+r()*9,1+r()*2);
  for(let i=0;i<45;i++){const x=r()*384,y=124+r()*5;p(shade(h+30,30,30),x,y,1,3);p(shade(h+15,38,41),x-1,y,1,1);}
 }
 return canvas;
}
