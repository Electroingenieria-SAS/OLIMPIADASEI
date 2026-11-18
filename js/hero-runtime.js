'use strict';
/** Motor ligero de personajes oficiales de OLIMPIADAS EI.
 * Atlas y secuencias siempre provienen de animaciones.json (no de índices supuestos).
 * Una sola instancia por actor; estados temporales no se reinician por repintados.
 */
(() => {
  const ROOT='assets/pixel-heroes/';
  const IDS=['01_jefe','02_coordinador','03_analista','04_auxiliar','05_tecnico','06_operativo'];
  const LEGACY={operaciones:'06_operativo',calidad:'03_analista',logistica:'06_operativo',sst:'05_tecnico',tecnologia:'05_tecnico',auditoria:'03_analista',jefe:'01_jefe',coordinador:'02_coordinador',analista:'03_analista',auxiliar:'04_auxiliar',tecnico:'05_tecnico',operativo:'06_operativo'};
  const DIRS=['down','left','right','up'];
  const ACTIONS=['idle','walk','run','interact','celebrate'];
  const records=new Map();
  let loading=null;
  const roles=[
    {id:'01_jefe',name:'Jefe',role:'Dirección ejecutiva',color:'#f7c65a',desc:'Liderazgo, criterio y decisiones estratégicas.'},
    {id:'02_coordinador',name:'Coordinador',role:'Coordinación y liderazgo',color:'#60bcff',desc:'Organiza recursos, equipos y prioridades.'},
    {id:'03_analista',name:'Analista',role:'Procesos, datos y calidad',color:'#ba95ff',desc:'Convierte información y evidencias en decisiones.'},
    {id:'04_auxiliar',name:'Auxiliar',role:'Apoyo y administración',color:'#5ce1bc',desc:'Ejecuta tareas con precisión y agilidad.'},
    {id:'05_tecnico',name:'Técnico',role:'Mantenimiento e ingeniería',color:'#ffd05c',desc:'Soluciona incidentes y cuida la operación.'},
    {id:'06_operativo',name:'Operativo',role:'Operaciones y logística',color:'#ff9864',desc:'Resuelve desafíos en campo con seguridad.'}
  ];
  function resolve(value){
    let id=typeof value==='string'?value:(value?.preset||value?.characterId||value?.id||IDS[0]);
    if(LEGACY[id])id=LEGACY[id];
    return IDS.includes(id)?id:IDS[0];
  }
  function readJSON(url){return fetch(url).then(async response=>{if(!response.ok)throw Error(`Metadatos faltantes (${response.status}): ${url}`);return response.json()})}
  function readImage(url){return new Promise((resolve,reject)=>{
    const img=new Image();img.decoding='async';img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Atlas no disponible: '+url));img.src=url;
  })}
  function validate(id,meta){
    if(meta.identifier!==id||meta.frameWidth!==64||meta.frameHeight!==80||meta.totalFrames!==128)throw Error('Formato no compatible: '+id);
    if(!meta.actions||Object.keys(meta.actions).length!==20)throw Error('Se requieren 20 animaciones: '+id);
    const counts={idle:4,walk:8,run:8,interact:6,celebrate:6};
    for(const action of ACTIONS)for(const direction of DIRS){
      const seq=meta.actions[`${action}_${direction}`], count=counts[action];
      if(!seq||seq.frameCount!==count||seq.frames?.length!==count)throw Error(`Secuencia inválida: ${id}/${action}_${direction}`);
      for(const f of seq.frames)if(f.w!==64||f.h!==80||f.durationMs<=0||f.x<0||f.y<0||f.x+f.w>512||f.y+f.h>1600)throw Error('Cuadro fuera de atlas: '+id);
    }
  }
  async function load(){
    if(loading)return loading;
    loading=(async()=>{
      const manifest=await readJSON(ROOT+'manifest.json');
      if(manifest.characters?.length!==6||manifest.characters.some((c,i)=>c.id!==IDS[i]))throw Error('Manifiesto de personajes incompleto.');
      await Promise.all(IDS.map(async id=>{
        const base=`${ROOT}personajes/${id}/`;
        const [metadata,atlas]=await Promise.all([readJSON(base+'animaciones.json'),readImage(base+'atlas_completo.png')]);
        validate(id,metadata);
        if(atlas.naturalWidth!==512||atlas.naturalHeight!==1600)throw Error('Dimensiones incorrectas: '+id);
        records.set(id,{metadata,atlas,role:roles.find(x=>x.id===id)});
      }));
      return true;
    })();
    try {return await loading} catch(error){loading=null;throw error}
  }
  function record(input){return records.get(resolve(input))||null}
  class Animator {
    constructor(id){this.id=resolve(id);this.action='idle';this.direction='down';this.index=0;this.elapsed=0;this.once=false;this.onComplete=null;}
    setCharacter(id){id=resolve(id);if(id!==this.id){this.id=id;this.action='idle';this.index=0;this.elapsed=0;this.once=false;}}
    setState(action,direction=this.direction,{once=false,force=false,onComplete=null}={}){
      if(!ACTIONS.includes(action)||!DIRS.includes(direction))return false;
      if(this.once&&!force)return false;
      if(!force&&action===this.action&&direction===this.direction)return false;
      this.action=action;this.direction=direction;this.index=0;this.elapsed=0;this.once=once;this.onComplete=onComplete;return true;
    }
    setMovement(x,y,running=false){
      if(this.once)return;
      const moving=Math.abs(x)+Math.abs(y)>.001;
      let facing=this.direction;
      if(moving){facing=Math.abs(x)>Math.abs(y)?(x>=0?'right':'left'):(y>=0?'down':'up')}
      this.setState(moving?(running?'run':'walk'):'idle',facing);
    }
    trigger(action='interact',onComplete=null){if(this.once)return false;return this.setState(action,this.direction,{once:true,force:true,onComplete})}
    update(ms){
      const entry=record(this.id);if(!entry)return;
      let seq=entry.metadata.actions[`${this.action}_${this.direction}`];if(!seq)return;
      this.elapsed+=Math.max(0,Math.min(250,ms));
      let steps=0;
      while(this.elapsed>=seq.frames[this.index].durationMs&&steps++<32){
        this.elapsed-=seq.frames[this.index].durationMs;
        this.index++;
        if(this.index>=seq.frames.length){
          if(this.once){const finished=this.onComplete;this.once=false;this.onComplete=null;this.setState('idle',this.direction,{force:true});finished?.();return;}
          this.index=0;
        }
      }
    }
    draw(ctx,feetX,feetY,scale=1){
      const entry=record(this.id);if(!entry)return false;
      const frame=entry.metadata.actions[`${this.action}_${this.direction}`]?.frames[this.index];if(!frame)return false;
      const w=frame.w*scale,h=frame.h*scale;
      ctx.save();ctx.imageSmoothingEnabled=false;
      ctx.drawImage(entry.atlas,frame.x,frame.y,frame.w,frame.h,Math.round(feetX-w*.5),Math.round(feetY-h*.94),Math.round(w),Math.round(h));
      ctx.restore();return true;
    }
  }
  class FootMover {
    constructor({x=80,y=320,boxW=18,boxH=10,speed=104,runSpeed=178,solidAt=()=>false}={}){
      Object.assign(this,{x,y,boxW,boxH,speed,runSpeed,solidAt});
    }
    canOccupy(x,y){
      const hw=this.boxW/2,hh=this.boxH/2;
      return !this.solidAt(x-hw,y-hh)&&!this.solidAt(x+hw,y-hh)&&!this.solidAt(x-hw,y+hh)&&!this.solidAt(x+hw,y+hh);
    }
    move(dx,dy,seconds,running=false){
      const len=Math.hypot(dx,dy);if(len<.001||seconds<=0)return {x:0,y:0};
      const distance=Math.min(seconds,.1)*(running?this.runSpeed:this.speed),stepX=dx/len*distance,stepY=dy/len*distance;
      let movedX=0,movedY=0;
      const steps=Math.max(1,Math.ceil(Math.hypot(stepX,stepY)/3));
      for(let i=0;i<steps;i++){
        const sx=stepX/steps,sy=stepY/steps;
        if(this.canOccupy(this.x+sx,this.y)){this.x+=sx;movedX+=sx;}
        if(this.canOccupy(this.x,this.y+sy)){this.y+=sy;movedY+=sy;}
      }
      return {x:movedX,y:movedY};
    }
  }
  function drawAvatar(canvas,id,action='idle',direction='down',frame=0){
    if(!canvas)return false;
    const ctx=canvas.getContext('2d');if(!ctx)return false;
    const entry=record(id);if(!entry)return false;
    const seq=entry.metadata.actions[`${action}_${direction}`];if(!seq)return false;
    const f=seq.frames[frame%seq.frames.length];
    const w=canvas.width,h=canvas.height,scale=Math.min(w/64,h/80);
    ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=false;
    ctx.drawImage(entry.atlas,f.x,f.y,f.w,f.h,Math.round((w-64*scale)/2),Math.round((h-80*scale)/2),Math.round(64*scale),Math.round(80*scale));return true;
  }
  const previews=new WeakMap();
  function animatePreview(canvas,id,action='idle',direction='down'){
    if(!canvas)return ()=>{};
    previews.get(canvas)?.();
    const anim=new Animator(id);anim.setState(action,direction,{force:true});
    let running=true,raf=0,last=0;
    const stop=()=>{running=false;cancelAnimationFrame(raf);if(previews.get(canvas)===stop)previews.delete(canvas)};
    previews.set(canvas,stop);
    const step=timestamp=>{
      if(!running)return;
      if(!canvas.isConnected){stop();return;}
      const delta=last?Math.min(250,timestamp-last):0;last=timestamp;
      anim.update(delta);drawAvatar(canvas,anim.id,anim.action,anim.direction,anim.index);
      raf=requestAnimationFrame(step);
    };
    raf=requestAnimationFrame(step);return stop;
  }
  window.EI_HEROES={IDS,roles,resolve,load,record,Animator,FootMover,drawAvatar,animatePreview,loaded:()=>records.size===6};
})();
