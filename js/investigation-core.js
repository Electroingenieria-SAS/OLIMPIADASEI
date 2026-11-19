'use strict';
/* Logic-only investigation engine: browser + Node tests, no DOM dependencies. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.EI_INVESTIGATION_CORE=api;})(typeof window!=='undefined'?window:globalThis,()=>{
  const IDS=['INT-01','INT-02','INT-03','INT-04','INT-05'];
  const MAX=100,SPAWN={x:20,y:26};
  const SOLUTION=['hold','verify','repack','trace','release'];
  function validate(c,e){
    if(c?.tamano_tile_px!==32||c?.tamano_mapa_tiles?.ancho!==40||c?.tamano_mapa_tiles?.alto!==30||
       c?.resolucion_imagen_px?.ancho!==1280||c?.resolucion_imagen_px?.alto!==960||
       !Array.isArray(c.tiles)||c.tiles.length!==30||c.tiles.some(row=>!Array.isArray(row)||row.length!==40||row.some(v=>v!==0&&v!==1)))throw Error('La máscara de colisión no corresponde al mapa de 40 × 30');
    if(e?.tamano_tile_px!==32||e?.resolucion_imagen_px?.ancho!==1280||e?.resolucion_imagen_px?.alto!==960||!Array.isArray(e.eventos)||e.eventos.length!==5)throw Error('Los puntos de interacción son incompatibles');
    const found=e.eventos.map(x=>x.id);
    if(new Set(found).size!==5||IDS.some(id=>!found.includes(id)))throw Error('La biblioteca requiere exactamente INT-01 a INT-05');
    for(const ev of e.eventos){
      const t=ev.activacion_tile,o=ev.objeto_tiles;
      if(!t||!o||!Number.isInteger(t.x)||!Number.isInteger(t.y)||!Number.isInteger(o.x)||!Number.isInteger(o.y)||o.ancho<=0||o.alto<=0||o.x<0||o.y<0||o.x+o.ancho>40||o.y+o.alto>30||blocked(c,t.x,t.y))throw Error('Geometría incorrecta para '+ev.id);
    }
    if(blocked(c,SPAWN.x,SPAWN.y))throw Error('Spawn inaccesible');
    const reachable=flood(c,SPAWN);
    if(e.eventos.some(x=>!reachable.has(`${x.activacion_tile.x},${x.activacion_tile.y}`)))throw Error('Existe un punto de interacción inalcanzable');
    return true;
  }
  function blocked(c,x,y){return x<0||x>=40||y<0||y>=30||c.tiles[y]?.[x]!==0;}
  function flood(c,origin){const seen=new Set(),queue=[origin];for(let i=0;i<queue.length;i++){const p=queue[i],key=`${p.x},${p.y}`;if(seen.has(key)||blocked(c,p.x,p.y))continue;seen.add(key);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])queue.push({x:p.x+dx,y:p.y+dy});}return seen;}
  function path(c,from,to){if(blocked(c,to.x,to.y)||blocked(c,from.x,from.y))return[];const queue=[from],seen=new Set([`${from.x},${from.y}`]),parent=new Map();for(let i=0;i<queue.length;i++){
    const p=queue[i],k=`${p.x},${p.y}`;
    if(p.x===to.x&&p.y===to.y){const out=[];let cur=k;while(cur!==`${from.x},${from.y}`){const [x,y]=cur.split(',').map(Number);out.unshift({x,y});cur=parent.get(cur);}return out;}
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n={x:p.x+dx,y:p.y+dy},nk=`${n.x},${n.y}`;if(!seen.has(nk)&&!blocked(c,n.x,n.y)){seen.add(nk);parent.set(nk,k);queue.push(n);}}
  }return[];}
  function nearby(c,px,py,event){const x=Math.floor(px/32),y=Math.floor(py/32),t=event.activacion_tile;
    return !blocked(c,x,y)&&Math.abs(x-t.x)+Math.abs(y-t.y)<=1&&path(c,{x,y},t).length<=1;}
  function canOccupy(c,x,y,w=18,h=10){const hx=w/2,hy=h/2;for(const sx of [x-hx,x+hx])for(const sy of [y-hy,y+hy])if(blocked(c,Math.floor(sx/32),Math.floor(sy/32)))return false;return true;}
  function initial(){return {version:1,phase:'explore',found:[],attempts:[0,0,0],answered:[false,false,false],hints:0,position:{x:656,y:848},complete:false,points:0};}
  function restore(v,c){const s=initial();if(!v||v.version!==1)return s;
    s.found=IDS.filter(id=>v.found?.includes(id));s.attempts=[0,1,2].map(i=>Math.min(20,Math.max(0,Math.trunc(Number(v.attempts?.[i])||0))));
    s.answered=[0,1,2].map(i=>Boolean(v.answered?.[i]));s.hints=Math.min(5,Math.max(0,Math.trunc(Number(v.hints)||0)));
    if(Number.isFinite(v.position?.x)&&Number.isFinite(v.position?.y)&&canOccupy(c,v.position.x,v.position.y)){s.position={x:v.position.x,y:v.position.y};}
    s.complete=Boolean(v.complete)&&s.found.length===5&&s.answered.every(Boolean);
    s.phase=s.complete?'completed':s.found.length===5?'solve':'explore';
    s.points=score(s);return s;
  }
  function score(s){const evidence=8*new Set((s.found||[]).filter(id=>IDS.includes(id))).size;
    const decisions=[0,1,2].reduce((v,i)=>v+(s.answered?.[i]?Math.max(6,15-3*Math.max(0,Number(s.attempts?.[i])||0)):0),0);
    const bonus=s.complete?(s.hints===0?15:s.hints===1?8:0):0;
    return Math.max(0,Math.min(MAX,evidence+decisions+bonus));
  }
  function addEvidence(s,id){if(!IDS.includes(id)||s.found.includes(id))return false;s.found.push(id);if(s.found.length===5)s.phase='solve';s.points=score(s);return true;}
  function answer(s,index,value){if(s.found.length!==5||index<0||index>2||s.answered[index]||s.answered.slice(0,index).some(x=>!x))return {ok:false,reason:'Primero consulta el expediente y responde en orden.'};
    const correct=index===0?value==='14awgv12':index===1?value==='hold':Array.isArray(value)&&value.join('|')===SOLUTION.join('|');
    if(!correct){s.attempts[index]=Math.min(20,s.attempts[index]+1);return {ok:false,reason:'La decisión no protege la trazabilidad. Revisa las evidencias y vuelve a intentarlo.'};}
    s.answered[index]=true;
    if(s.answered.every(Boolean)){s.complete=true;s.phase='completed';}
    s.points=score(s);return {ok:true,complete:s.complete,points:s.points};
  }
  return {IDS,SPAWN,SOLUTION,MAX,validate,blocked,flood,path,nearby,canOccupy,initial,restore,score,addEvidence,answer};
});
