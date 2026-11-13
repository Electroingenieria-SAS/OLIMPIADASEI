'use strict';
/* Seis variantes de vestuario del sprite male_01 de SuperRetroRanch Free Tier.
 * Todos los gráficos base se cargan del paquete existente; no se incluyen sprites premium.
 * La personalización de color se produce en Canvas en tiempo de ejecución.
 */
window.EI_CHARACTERS = (() => {
  const base = 'characters/males/male_01';
  const presets = [
    {id:'operaciones',name:'Explorador',role:'Operaciones',color:'#35c7bb',coat:'#24a99c',hat:true,accent:'⚙',desc:'Siempre listo para entrar en acción.'},
    {id:'calidad',name:'Inspector',role:'Calidad',color:'#a88aff',coat:'#805ad5',hat:false,accent:'✓',desc:'Detecta cada detalle en el proceso.'},
    {id:'logistica',name:'Transportista',role:'Logística',color:'#f7b85d',coat:'#d48728',hat:true,accent:'▣',desc:'Encuentra la ruta más eficiente.'},
    {id:'sst',name:'Vigía',role:'Seguridad y SST',color:'#f17d8d',coat:'#d55264',hat:true,accent:'✚',desc:'Identifica peligros y protege al equipo.'},
    {id:'tecnologia',name:'Tecno',role:'Ciberseguridad',color:'#6cc0ff',coat:'#387dda',hat:false,accent:'⌘',desc:'Resuelve retos de tecnología.'},
    {id:'auditoria',name:'Estratega',role:'Auditoría',color:'#98e28a',coat:'#58a66a',hat:false,accent:'◆',desc:'Orden y criterio en cada decisión.'}
  ];
  const palettes=[
    {skin:'#f4cca1',skinShadow:'#eea160'},
    {skin:'#eac09a',skinShadow:'#bd805f'},
    {skin:'#c98b65',skinShadow:'#9f644a'},
    {skin:'#a96e50',skinShadow:'#754534'},
    {skin:'#80523c',skinShadow:'#5b382e'}
  ];
  const sourceCache = new Map();
  const processedCache = new Map();
  const hexToRgb=h=>h.match(/[\da-f]{2}/gi).map(x=>parseInt(x,16));
  const mix=(a,b,t)=>a.map((x,i)=>Math.round(x*(1-t)+b[i]*t));
  function normalize(opt={}){
    const p=presets.find(x=>x.id===opt.preset)||presets[0];
    return {preset:p.id,skin:Math.max(0,Math.min(4,Number(opt.skin)||0)),hat:opt.hat!==undefined?Boolean(opt.hat):p.hat,role:p};
  }
  function pathFor(hat,action='idle'){
    return `${base}/${action}/male_01_${hat?'hat_':''}${action}_32x32${action==='idle'?'':'_3frames'}.png`;
  }
  function ensureSource(path){
    if(sourceCache.has(path))return sourceCache.get(path);
    const image=new Image();sourceCache.set(path,image);
    const url=window.EI_SPRITES?.urlFromFilename(path);
    if(url)image.src=url;
    return image;
  }
  function getSheet(opt={},action='idle'){
    const a=normalize(opt),src=pathFor(a.hat,action);
    const cacheKey=`${src}#${a.preset}#${a.skin}`;
    if(processedCache.has(cacheKey))return processedCache.get(cacheKey);
    const image=ensureSource(src);
    if(!image.complete || !image.naturalWidth){
      if(image.src&&!image.__waiting){image.__waiting=true;image.addEventListener('load',()=>window.dispatchEvent(new Event('ei-character-ready')),{once:true});}
      return null;
    }
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(image,0,0);
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
    const coat=hexToRgb(a.role.coat),light=hexToRgb(a.role.color),dark=mix(coat,[19,30,51],.55);
    const skin=hexToRgb(palettes[a.skin].skin),shade=hexToRgb(palettes[a.skin].skinShadow);
    const remap={
      '244,126,27': coat, '210,65,41':mix(coat,light,.21), '169,59,59':dark,
      '231,70,42':light, '170,56,56':mix(dark,coat,.33),
      '244,204,161':skin, '238,161,96':shade,'191,121,88':mix(shade,[68,44,44],.18)
    };
    for(let i=0;i<pixels.data.length;i+=4){
      if(!pixels.data[i+3])continue;
      const rgb=`${pixels.data[i]},${pixels.data[i+1]},${pixels.data[i+2]}`;
      const replace=remap[rgb];if(replace){pixels.data[i]=replace[0];pixels.data[i+1]=replace[1];pixels.data[i+2]=replace[2]}
    }
    ctx.putImageData(pixels,0,0);
    processedCache.set(cacheKey,canvas);return canvas;
  }
  function draw(canvas,opt={},action='idle',direction=0,frame=0){
    if(!canvas)return false;
    const ctx=canvas.getContext('2d');if(!ctx)return false;
    ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const sheet=getSheet(opt,action);if(!sheet)return false;
    const step=action==='idle'?0:Math.abs(frame)%3;
    const sx=step*32,sy=(direction%4)*32;
    const size=Math.min(canvas.width*.88,canvas.height*.88);
    const w=Math.floor(size),h=Math.floor(size);
    ctx.drawImage(sheet,sx,sy,32,32,Math.floor((canvas.width-w)/2),Math.floor((canvas.height-h)/2),w,h);
    return true;
  }
  function drawAt(ctx,opt={},x,y,size=32,direction=0,frame=0,action='walk'){
    const sheet=getSheet(opt,action);if(!sheet)return false;
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(sheet,(action==='idle'?0:Math.abs(frame)%3)*32,(direction%4)*32,32,32,x,y,size,size);
    return true;
  }
  function animate(canvas,opt={}){
    let frame=0;let handle=0;
    const tick=()=>{
      if(!canvas.isConnected){clearInterval(handle);return;}
      draw(canvas,opt,'walk',0,frame++);
    };
    tick();handle=setInterval(tick,240);
    return ()=>clearInterval(handle);
  }
  return {presets,palettes,normalize,draw,drawAt,animate,getSheet};
})();
