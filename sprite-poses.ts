import { elements, enemies, heroes, pets, type Element } from './content';

const quadrupeds=new Set(['rat','horse','frog','dragon','spider','worm']);
const airborne=new Set(['ghost','spark','bat','bee','bird']);
const planted=new Set(['tree','rock','mushroom','slime','snail','chest','egg']);
export const poses=['idle0','idle1','walk0','walk1','walk2','attack0','attack1','attack2','special0','special1','hit','death0','death1','death2'] as const;
export type Pose=typeof poses[number];
function appearance(key:string){
 const data=key.startsWith('h')?heroes[+key.slice(1)]:key.startsWith('p')?pets[+key.slice(1)]:key.startsWith('e')?enemies[+key.slice(1)]:null;
 const element:Element=data?.element??'void';
 const boss=key.startsWith('b')?['tree','dragon','spider','reaper','frog','skeleton','brute','rock','knight','dragon','rock','witch','dragon','reaper','dragon'][+key.slice(1)]:undefined;
 return {shape:data?.shape??boss??key.slice(1,-1),glow:'#'+elements[element].toString(16).padStart(6,'0')};
}
export function poseSheet(atlas:HTMLCanvasElement,x:number,y:number,key:string){
 const {shape,glow}=appearance(key),fly=airborne.has(shape),legs=quadrupeds.has(shape),rooted=planted.has(shape);
 const canvas=document.createElement('canvas');canvas.width=40*poses.length;canvas.height=40;
 const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
 const piece=(sx:number,sy:number,w:number,h:number,dx:number,dy:number,dw=w,dh=h)=>ctx.drawImage(atlas,x+sx,y+sy,w,h,4+dx,4+dy,dw,dh);
 const speck=(px:number,py:number,w:number,h:number,color=glow)=>{ctx.fillStyle=color;ctx.fillRect(4+px,4+py,w,h);};
 poses.forEach((pose,i)=>{
  ctx.save();ctx.translate(i*40,0);ctx.beginPath();ctx.rect(0,0,40,40);ctx.clip();
  if(pose==='idle0')piece(0,0,32,32,0,0);
  else if(pose==='idle1'){
   const lift=fly?2:1;
   piece(0,0,32,23,0,-lift);piece(0,23,32,9,0,fly?-lift+23:23);
  }else if(pose.startsWith('walk')){
   const step=Number(pose.at(-1)),swing=[-2,0,2][step];
   if(fly){piece(0,0,32,32,step===1?1:0,step===1?-2:0);speck(1,20+step*2,3,1);}
   else if(rooted){piece(0,0,32,32,-1,step===1?2:0,34,step===1?29:32);}
   else{
    const cut=legs?20:23;
    piece(0,0,32,cut,step===1?1:0,step===1?-1:0);
    piece(0,cut,16,32-cut,swing,cut-(swing>0?1:0));
    piece(16,cut,16,32-cut,16-swing,cut-(swing<0?1:0));
   }
  }else if(pose.startsWith('attack')||pose.startsWith('special')){
   const special=pose.startsWith('special'),phase=Number(pose.at(-1)),lunge=phase===0?-2:phase===1?3:1;
   piece(0,22,32,10,rooted?0:lunge*.5,22);
   piece(0,0,32,22,lunge,special?-2:phase===1?1:0,32,phase===1?23:22);
   if(phase===1||special){
    speck(29,10,4,2);speck(31,13,4,1);speck(27,9,2,1,'#fff6d5');
    if(special){speck(5,6,1,3);speck(31,4,2,2);speck(21,1,3,1);}
   }
  }else if(pose==='hit'){
   piece(0,0,32,21,-2,2,32,19);piece(0,21,32,11,-1,21);
   speck(3,12,2,2,'#fff2c1');speck(7,8,1,1);
  }else{
   const phase=Number(pose.at(-1));
   if(phase===0)piece(0,0,32,32,-1,3,32,29);
   else{
    piece(0,7,32,25,-2,14+phase*3,35,18-phase*4);
    for(let n=0;n<5;n++)speck(3+n*6,17+((n*7+phase*3)%12),n%2+1,1);
   }
  }
  ctx.restore();
 });
 return canvas;
}
