'use strict';
/* Biblioteca EI-2048: integrated sixth / bonus activity; geometry comes exclusively from JSON. */
(()=>{
  const Core=window.EI_INVESTIGATION_CORE,Story=window.EI_INVESTIGATION_CONTENT;
  const ROOT='assets/library/',SIZE=32,W=1280,H=960,VW=640,VH=480;
  let g=null,raf=0,then=0,saveAt=0,timeout=0;
  const el=(s)=>document.querySelector(s);
  const safe=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const format=n=>Number(n).toLocaleString('es-CO');
  const getKey=id=>'ei_lib_ei2048_v1_'+id;
  const record=()=>{
    if(!g)return;
    g.session.position={x:g.mover.x,y:g.mover.y};g.session.points=Core.score(g.session);
    try{localStorage.setItem(g.storageKey,JSON.stringify(g.session));}catch(_error){}
  };
  const showError=text=>{const root=el('#view');if(!root)return;root.innerHTML=`<section class="lib-shell"><h1>No se pudo cargar la biblioteca</h1><p>${safe(text)}</p><div class="lib-actions"><button id="libRetry" class="btn btn-primary">Reintentar</button><button id="libExit" class="btn btn-outline">Volver al tablero</button></div></section>`;el('#libRetry').onclick=()=>{const opt=g?.options;cleanup();if(opt)start(opt)};el('#libExit').onclick=()=>g?.options.onExit()};
  async function fetchJSON(path){const response=await fetch(ROOT+path);if(!response.ok)throw Error('No se pudo leer '+path);return response.json()}
  async function fetchImage(path){const img=new Image();img.decoding='async';img.src=ROOT+path;await img.decode();if(img.naturalWidth!==W||img.naturalHeight!==H)throw Error('Tamaño del mapa incompatible');return img;}
  function cleanup(){if(g)record();cancelAnimationFrame(raf);clearTimeout(timeout);raf=0;then=0;saveAt=0;window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',resetInput);g=null;}
  async function start(options){cleanup();
    const root=el('#view');root.innerHTML='<section class="lib-shell"><div class="lib-loading">📚 Preparando el expediente EI-2048…</div></section>';
    const session={options,storageKey:getKey(options.playerId),ui:'intro',pressed:new Set(),touch:new Set(),running:false,modal:false,path:[],goal:null,dirty:false,finalized:false,cameraX:0,cameraY:0,debug:new URLSearchParams(location.search).get('ei_debug')==='1'};
    g=session;
    try{
      const [collisions,geometry,map]=await Promise.all([fetchJSON('colisiones.json'),fetchJSON('interacciones.json'),fetchImage('01_biblioteca_mapa.png'),window.EI_HEROES.load()]);
      if(g!==session)return;
      Core.validate(collisions,geometry);
      Object.assign(session,{collisions,geometry,map,events:geometry.eventos});
      let stored=null;try{stored=JSON.parse(localStorage.getItem(session.storageKey)||'null')}catch(_){}
      session.session=Core.restore(stored,collisions);
      session.mover=new window.EI_HEROES.FootMover({x:session.session.position.x,y:session.session.position.y,boxW:18,boxH:10,speed:132,runSpeed:216,solidAt:(x,y)=>Core.blocked(collisions,Math.floor(x/SIZE),Math.floor(y/SIZE))});
      session.anim=new window.EI_HEROES.Animator(window.EI_HEROES.resolve(options.avatar));
      window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',resetInput);
      showIntro();
    }catch(error){if(g===session)showError(error.message);}
  }
  function showIntro(){if(!g)return;g.ui='intro';g.modal=false;
    el('#view').innerHTML=`<section class="lib-shell lib-intro"><div class="lib-intro-cover"><img src="${ROOT}01_biblioteca_mapa.png" alt="Mapa pixel art oficial de la biblioteca de evidencias"><span>SIMULACIÓN FORMATIVA · CASO EI-2048</span></div>
      <div class="lib-intro-copy"><span class="lib-eyebrow">MISIÓN ADICIONAL · INVESTIGACIÓN CORPORATIVA</span><h1>${safe(Story.title)}</h1><p>${safe(Story.intro)}</p><div class="lib-metrics"><span>📂 Cinco evidencias</span><span>🧩 Tres decisiones</span><span>⭐ Máximo 100 puntos</span></div>
      <p class="lib-note">Flechas o WASD: caminar · Shift: correr · E o Espacio: investigar · Esc: cerrar ventana. En móvil puedes usar los controles táctiles.</p>
      ${g.session.found.length?`<div class="lib-continue">Expediente guardado: ${g.session.found.length}/5 evidencias · ${g.session.points} puntos</div>`:''}
      <div class="lib-actions"><button class="btn btn-primary" id="libBegin">${g.session.complete?'🔎 REVISAR CASO RESUELTO':g.session.found.length?'▶ CONTINUAR INVESTIGACIÓN':'▶ COMENZAR INVESTIGACIÓN'}</button><button id="libBack" class="btn btn-outline">← VOLVER A OLIMPIADAS EI</button></div></div></section>`;
    el('#libBegin').onclick=()=>{if(g.session.complete)showSolved();else if(g.session.phase==='solve')renderSolve();else renderExplore();};
    el('#libBack').onclick=()=>g?.options.onExit();
  }
  function resetInput(){if(!g)return;g.pressed.clear();g.touch.clear();g.running=false;}
  const arrows={arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right'};
  function keyDown(e){if(!g||g.ui!=='explore')return;
    if(e.target?.closest?.('input,select,textarea,button')&&!['Escape'].includes(e.key))return;
    if(e.key==='Escape'){if(g.modal){e.preventDefault();closeModal();}return;}
    if(g.modal)return;
    const key=e.key.toLowerCase(),dir=arrows[key];
    if(dir){e.preventDefault();g.pressed.add(dir);g.path=[];g.goal=null;}else if(key==='shift'){g.running=true;}else if((key==='e'||key===' ')&&!e.repeat){e.preventDefault();interact();}
  }
  function keyUp(e){if(!g)return;const dir=arrows[e.key.toLowerCase()];if(dir)g.pressed.delete(dir);if(e.key==='Shift')g.running=false;}
  function position(){return {x:Math.floor(g.mover.x/SIZE),y:Math.floor(g.mover.y/SIZE)};}
  function nearest(){if(!g)return null;return g.events.filter(ev=>Core.nearby(g.collisions,g.mover.x,g.mover.y,ev)).sort((a,b)=>Math.hypot(g.mover.x-(a.activacion_tile.x+.5)*SIZE,g.mover.y-(a.activacion_tile.y+.5)*SIZE)-Math.hypot(g.mover.x-(b.activacion_tile.x+.5)*SIZE,g.mover.y-(b.activacion_tile.y+.5)*SIZE))[0]||null;}
  function renderExplore(){if(!g)return;g.ui='explore';g.modal=false;g.pressed.clear();g.touch.clear();
    el('#view').innerHTML=`<section class="lib-shell lib-explore">
     <header class="lib-header"><div><span class="lib-eyebrow">INVESTIGACIÓN EI-2048 · ETAPA BONUS</span><h1>${safe(Story.title)}</h1><p>Recorre la biblioteca y reúne las cinco pruebas del expediente.</p></div><div class="lib-status"><span>EXPEDIENTE <strong id="libFound">${g.session.found.length}/5</strong></span><span>PUNTOS <strong id="libPoints">${g.session.points}/100</strong></span><button id="libBack" class="btn btn-outline btn-sm">SALIR</button></div></header>
     <div class="lib-grid"><div class="lib-map-wrap"><div class="lib-map-frame" id="libMapFrame"><canvas id="libCanvas" width="640" height="480" aria-label="Mapa navegable de la biblioteca con el personaje elegido" tabindex="0"></canvas><div id="libDialog" class="lib-dialog" hidden></div></div>
       <div class="lib-map-bottom"><span id="libNearby">Busca los cinco puntos de investigación</span><span>WASD · SHIFT · E</span></div>
     </div><aside class="lib-sidebar"><div class="lib-sidebar-top"><span class="lib-eyebrow">CARPETA DE EVIDENCIAS</span><h2>Expediente EI-2048</h2><p>Los documentos pueden consultarse en cualquier orden. Solo se puntúan una vez.</p></div>
      <div class="lib-evidence-list" id="libEvidence"></div>
      <button id="libResolve" class="btn btn-primary lib-resolve" ${g.session.found.length===5?'':'disabled'}>🧩 RESOLVER EL CASO</button>
      <div class="lib-controls"><div class="lib-dpad" aria-label="Desplazamiento táctil"><span></span><button data-lib-dir="up" aria-label="Arriba">▲</button><span></span><button data-lib-dir="left" aria-label="Izquierda">◀</button><button id="libTouchInteract" aria-label="Investigar evidencia">E</button><button data-lib-dir="right" aria-label="Derecha">▶</button><span></span><button data-lib-dir="down" aria-label="Abajo">▼</button><span></span></div>
       <div class="lib-touch-actions"><button id="libRun" class="btn btn-blue btn-sm">⇧ CORRER</button><button id="libInvestigate" class="btn btn-primary btn-sm">🔎 INVESTIGAR</button></div></div>
       <p class="lib-hint-note">También puedes tocar un objeto en el mapa: el personaje caminará hasta su punto de activación.</p>
      </aside></div></section>`;
    el('#libBack').onclick=()=>{record();g.options.onExit()};el('#libResolve').onclick=()=>{record();renderSolve()};
    for(const button of document.querySelectorAll('[data-lib-dir]')){
      const dir=button.dataset.libDir;
      button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);g?.touch.add(dir);if(g){g.path=[];g.goal=null;}};
      for(const ev of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(ev,()=>g?.touch.delete(dir));
    }
    const run=el('#libRun');run.onpointerdown=e=>{e.preventDefault();run.setPointerCapture(e.pointerId);g.running=true};
    for(const ev of ['pointerup','pointercancel','lostpointercapture'])run.addEventListener(ev,()=>{if(g)g.running=false});
    el('#libInvestigate').onclick=()=>interact();el('#libTouchInteract').onclick=()=>interact();
    el('#libCanvas').onclick=e=>{
      if(!g||g.modal)return;const r=e.currentTarget.getBoundingClientRect();
      const wx=g.cameraX+(e.clientX-r.left)/r.width*VW,wy=g.cameraY+(e.clientY-r.top)/r.height*VH;
      const selected=g.events.find(ev=>{const o=ev.objeto_tiles;return wx>=o.x*SIZE&&wx<(o.x+o.ancho)*SIZE&&wy>=o.y*SIZE&&wy<(o.y+o.alto)*SIZE})||g.events.find(ev=>Math.hypot(wx-(ev.activacion_tile.x+.5)*SIZE,wy-(ev.activacion_tile.y+.5)*SIZE)<SIZE*1.6);
      const dest=selected?.activacion_tile||{x:Math.floor(wx/SIZE),y:Math.floor(wy/SIZE)};
      const route=Core.path(g.collisions,position(),dest);
      if(route.length){g.path=route;g.goal=selected||null;g.pressed.clear();}
      else if(selected)window.EI?.toast('No se encontró una ruta hasta ese objeto. Prueba con las flechas.');
    };
    refreshEvidence();then=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
  }
  function refreshEvidence(){if(!g||g.ui!=='explore')return;
    const found=new Set(g.session.found);
    el('#libFound').textContent=`${found.size}/5`;el('#libPoints').textContent=`${Core.score(g.session)}/100`;
    el('#libResolve').disabled=found.size!==5;
    el('#libEvidence').innerHTML=g.events.map(ev=>{const clue=Story.evidence[ev.id],has=found.has(ev.id);return `<button class="lib-evidence-row ${has?'is-found':''}" data-lib-event="${ev.id}"><span>${has?'✓':clue.icon}</span><span><strong>${safe(clue.label)}</strong><small>${has?safe(clue.title):'Pendiente · localizar en el mapa'}</small></span><em>${has?'LEER':'IR'}</em></button>`}).join('');
    document.querySelectorAll('[data-lib-event]').forEach(button=>button.onclick=()=>{const ev=g.events.find(x=>x.id===button.dataset.libEvent);if(found.has(ev.id))openEvidence(ev,true);else navigate(ev);});
  }
  function navigate(ev){if(!g||g.ui!=='explore'||g.modal)return;const route=Core.path(g.collisions,position(),ev.activacion_tile);if(!route.length){if(Core.nearby(g.collisions,g.mover.x,g.mover.y,ev))interact(ev);else window.EI?.toast('No se pudo trazar una ruta a este objeto');return;}g.path=route;g.goal=ev;g.pressed.clear();g.touch.clear();}
  function loop(timestamp){if(!g||g.ui!=='explore')return;
    const delta=then?Math.min(.045,(timestamp-then)/1000):0;then=timestamp;
    let dx=0,dy=0,run=g.running;
    if(!g.modal){
      if(g.pressed.has('right')||g.touch.has('right'))dx++;
      if(g.pressed.has('left')||g.touch.has('left'))dx--;
      if(g.pressed.has('down')||g.touch.has('down'))dy++;
      if(g.pressed.has('up')||g.touch.has('up'))dy--;
      if(!dx&&!dy&&g.path.length){const tile=g.path[0],tx=(tile.x+.5)*SIZE,ty=(tile.y+.5)*SIZE,vx=tx-g.mover.x,vy=ty-g.mover.y;
        if(Math.hypot(vx,vy)<3){g.mover.x=tx;g.mover.y=ty;g.path.shift();if(!g.path.length&&g.goal){const target=g.goal;g.goal=null;interact(target);}}
        else{dx=vx;dy=vy;run=false;}
      }
      const actual=g.mover.move(dx,dy,delta,run);
      g.anim.setMovement(Math.abs(actual.x)>0.01?dx:0,Math.abs(actual.y)>0.01?dy:0,run);
    }else if(!g.anim.once)g.anim.setMovement(0,0,false);
    g.anim.update(delta*1000);
    g.cameraX=Math.max(0,Math.min(W-VW,Math.round(g.mover.x-VW/2)));
    g.cameraY=Math.max(0,Math.min(H-VH,Math.round(g.mover.y-VH/2)));
    const nearby=nearest();const nearLabel=el('#libNearby');if(nearLabel)nearLabel.textContent=nearby?`E · ${Story.evidence[nearby.id].label} · INVESTIGAR`:'Explora y acércate a los objetos señalados';
    draw();if(timestamp-saveAt>2500){record();saveAt=timestamp;}
    raf=requestAnimationFrame(loop);
  }
  function draw(){const canvas=el('#libCanvas');if(!canvas||!g)return;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,VW,VH);ctx.drawImage(g.map,g.cameraX,g.cameraY,VW,VH,0,0,VW,VH);
    for(const ev of g.events){const t=ev.activacion_tile,x=(t.x+.5)*SIZE-g.cameraX,y=(t.y+.5)*SIZE-g.cameraY;
      if(x<0||x>VW||y<0||y>VH)continue;
      ctx.fillStyle=g.session.found.includes(ev.id)?'#65e6b5':'#fbd168';ctx.fillRect(Math.round(x)-8,Math.round(y)-33,16,14);ctx.fillStyle='#0b2747';ctx.font='bold 11px monospace';ctx.fillText(g.session.found.includes(ev.id)?'✓':'!',Math.round(x)-4,Math.round(y)-22);
    }
    const fx=g.mover.x-g.cameraX,fy=g.mover.y-g.cameraY;
    ctx.fillStyle='#081a3280';ctx.beginPath();ctx.ellipse(fx,fy-2,13,4,0,0,Math.PI*2);ctx.fill();
    g.anim.draw(ctx,fx,fy,1);
    if(g.debug){ctx.globalAlpha=.33;ctx.strokeStyle='#c0f';for(let x=0;x<=VW;x+=SIZE){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,VH);ctx.stroke()}for(let y=0;y<=VH;y+=SIZE){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(VW,y);ctx.stroke()}ctx.globalAlpha=1;}
  }
  function interact(preferred=null){if(!g||g.ui!=='explore'||g.modal)return;
    const ev=preferred&&Core.nearby(g.collisions,g.mover.x,g.mover.y,preferred)?preferred:nearest();
    if(!ev){window.EI?.toast('Acércate a un punto de evidencia para investigar');return;}
    g.path=[];g.goal=null;g.anim.trigger('interact');openEvidence(ev,false);
  }
  function openEvidence(ev,fromExpedition=false){if(!g||g.ui!=='explore'||g.modal)return;if(!fromExpedition&&!Core.nearby(g.collisions,g.mover.x,g.mover.y,ev))return;
    g.modal=true;resetInput();const clue=Story.evidence[ev.id],existing=g.session.found.includes(ev.id);
    const card=el('#libDialog');card.hidden=false;
    card.innerHTML=`<div class="lib-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="libDialogTitle"><div class="lib-dialog-top"><span>ARCHIVO ${ev.id} · ${safe(clue.label)}</span><button id="libModalClose" aria-label="Cerrar expediente">✕</button></div>
      <div class="lib-paper"><small>${safe(clue.document)}</small><h2 id="libDialogTitle">${clue.icon} ${safe(clue.title)}</h2><p>${safe(clue.body)}</p>${ev.id==='INT-04'?'<div class="lib-photo-tag">THHN NEGRO · <strong>14 AWG</strong><br>LOTE <strong>L-314</strong></div>':''}<div class="lib-evidence-key">DATO CLAVE · ${safe(clue.key)}</div></div>
      <div class="lib-actions"><button class="btn btn-primary" id="libAdd">${existing?'✓ YA ESTÁ EN EL EXPEDIENTE':'✦ AGREGAR AL EXPEDIENTE'}</button><button class="btn btn-outline" id="libDismiss">Cerrar</button></div></div>`;
    el('#libModalClose').onclick=closeModal;el('#libDismiss').onclick=closeModal;
    el('#libAdd').onclick=()=>{if(Core.addEvidence(g.session,ev.id))window.EI?.sound('win');record();closeModal();refreshEvidence();if(g.session.found.length===5)window.EI?.toast('¡Expediente completo! Ya puedes resolver el caso.');};
    el('#libModalClose').focus();
  }
  function closeModal(){if(!g||!g.modal)return;g.modal=false;const node=el('#libDialog');if(node){node.hidden=true;node.innerHTML='';}el('#libCanvas')?.focus({preventScroll:true});}
  function renderSolve(){if(!g)return;if(g.session.found.length!==5){renderExplore();return;}g.ui='solve';g.modal=false;record();
    const i=g.session.answered.findIndex(x=>!x);if(i<0){showSolved();return;}
    const item=Story.questions[i];g.pick=[];
    const content=i<2?`<div class="lib-answer-grid">${item.options.map(([label,value],k)=>`<button data-choice="${safe(value)}" class="lib-answer"><span>${'ABC'[k]}</span>${safe(label)}</button>`).join('')}</div>`:
    `<p class="lib-small">Pulsa cada acción en el orden correcto. Si te equivocas, revisa la explicación y vuelve a ordenar.</p><div id="libOrdered" class="lib-ordered"></div><div id="libSteps" class="lib-answer-grid">${[2,4,0,3,1].map(k=>`<button data-step="${safe(item.steps[k][1])}" class="lib-answer">${safe(item.steps[k][0])}</button>`).join('')}</div>`;
    el('#view').innerHTML=`<section class="lib-shell lib-solve"><div class="lib-solve-head"><div><span class="lib-eyebrow">EXPEDIENTE EI-2048 · FASE DE RESOLUCIÓN</span><h1>Decide con evidencia</h1><p>Tus decisiones deben proteger la trazabilidad y prevenir una entrega incorrecta.</p></div><span class="lib-score-pill">${Core.score(g.session)} / 100 PT</span></div>
      <div class="lib-solve-grid"><div class="lib-solve-paper"><div class="lib-step-number">DECISIÓN ${i+1} DE 3 · INTENTOS INCORRECTOS: ${g.session.attempts[i]}</div><h2>${safe(item.title)}</h2><p class="lib-question">${safe(item.prompt)}</p>${content}<div id="libFeedback" class="lib-feedback" role="status" aria-live="polite"></div>
      <div class="lib-actions"><button id="libHint" class="btn btn-outline">💡 USAR UNA PISTA (AFECTA BONUS)</button><button id="libBackExplore" class="btn btn-blue">← REVISAR LA BIBLIOTECA</button></div></div>
      <aside class="lib-solve-exp"><span class="lib-eyebrow">DOCUMENTACIÓN REUNIDA · 5/5</span><h3>Expediente</h3>${g.events.map(ev=>{const e=Story.evidence[ev.id];return `<div class="lib-compact-evidence"><small>${ev.id} · ${safe(e.label)}</small><strong>${safe(e.title)}</strong><p>${safe(e.body)}</p></div>`}).join('')}<p>Las pruebas corresponden a un caso ficticio de formación.</p></aside></div></section>`;
    el('#libBackExplore').onclick=renderExplore;
    el('#libHint').onclick=()=>{g.session.hints=Math.min(5,g.session.hints+1);record();el('#libFeedback').className='lib-feedback visible';el('#libFeedback').textContent='PISTA: '+Story.hints[i]+' · Bono por no usar ayudas: '+(g.session.hints===0?'15':g.session.hints===1?'8':'0')+' puntos.';};
    if(i<2){document.querySelectorAll('[data-choice]').forEach(btn=>btn.onclick=()=>handleAnswer(i,btn.dataset.choice));}
    else document.querySelectorAll('[data-step]').forEach(btn=>btn.onclick=()=>{
      const expected=Core.SOLUTION[g.pick.length],v=btn.dataset.step;
      if(v!==expected){g.session.attempts[2]=Math.min(20,g.session.attempts[2]+1);record();g.pick=[];document.querySelectorAll('[data-step]').forEach(b=>b.disabled=false);el('#libOrdered').innerHTML='';const f=el('#libFeedback');f.className='lib-feedback visible wrong';f.textContent='Ese paso no corresponde al siguiente control. '+item.why+' Penalización: −3 puntos en esta decisión (mínimo 6).';window.EI?.sound('bad');return;}
      g.pick.push(v);btn.disabled=true;const label=item.steps.find(s=>s[1]===v)[0];const seq=el('#libOrdered');seq.innerHTML+=`<span>${g.pick.length}. ${safe(label)}</span>`;
      if(g.pick.length===5)handleAnswer(2,[...g.pick]);
    });
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function handleAnswer(i,v){if(!g||g.ui!=='solve')return;const item=Story.questions[i],result=Core.answer(g.session,i,v);
    record();const f=el('#libFeedback');f.className='lib-feedback visible '+(result.ok?'correct':'wrong');f.textContent=(result.ok?'✓ Decisión correcta. ':'✕ Revisa tu respuesta. ')+item.why+(result.ok?'':' Penalización: −3 puntos en esta decisión (mínimo 6).');
    if(result.ok){window.EI?.sound('win');document.querySelectorAll('[data-choice],[data-step]').forEach(b=>b.disabled=true);timeout=setTimeout(()=>{if(g?.ui==='solve'){if(result.complete)showSolved();else renderSolve();}},1400);}
    else window.EI?.sound('bad');
  }
  function showSolved(){if(!g||!g.session.complete)return;g.ui='completed';record();const s=g.session;
    el('#view').innerHTML=`<section class="lib-shell lib-end"><div class="lib-end-hero"><span class="lib-eyebrow">MISIÓN FINALIZADA · PEDIDO EI-2048</span><h1>CASO RESUELTO: DESPACHO PREVENIDO</h1><p>${safe(Story.lesson)}</p><div class="lib-end-score">${s.points} <small>/ 100 PUNTOS</small></div><div class="lib-score-details"><span>📂 Evidencias: 40 / 40</span><span>🧩 Decisiones: ${s.answered.reduce((v,yes,i)=>v+(yes?Math.max(6,15-3*s.attempts[i]):0),0)} / 45</span><span>💡 Bono sin ayudas: ${s.hints===0?15:s.hints===1?8:0} / 15</span></div></div>
      <div class="lib-end-recap"><h2>Las cinco pruebas revisadas</h2>${g.events.map(ev=>{const c=Story.evidence[ev.id];return `<div><strong>${ev.id} · ${safe(c.title)}</strong><p>${safe(c.key)}</p></div>`}).join('')}<p><strong>Aprendizaje:</strong> validar descripción, calibre, cantidad y lote contra el pedido; no liberar mercancía que no cumpla o sin autorización; conservar la evidencia de la corrección.</p></div>
      <div class="lib-actions"><button id="libDone" class="btn btn-primary">✓ GUARDAR RESULTADO Y VOLVER A OLIMPIADAS EI</button><button id="libRedo" class="btn btn-outline">↻ REINTENTAR EN PRÁCTICA</button></div></section>`;
    el('#libDone').onclick=()=>{if(g.finalized)return;g.finalized=true;g.options.onComplete(s.points,Story.lesson);};
    el('#libRedo').onclick=()=>{g.session=Core.initial();g.mover.x=g.session.position.x;g.mover.y=g.session.position.y;record();renderExplore();};
    window.scrollTo({top:0,behavior:'smooth'});
  }
  window.EI_INVESTIGATION={start,cleanup};
})();
