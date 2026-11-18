'use strict';
(() => {
  const EI=window.EI,D=EI.D,$=EI.$,$$=EI.$$,esc=EI.esc,shuffle=EI.shuffle;
  let g=null,intervals=[],timeouts=[],keys=null,caseCleanup=null;
  const after=(fn,ms)=>{const t=setTimeout(fn,ms);timeouts.push(t);return t};
  const every=(fn,ms)=>{const t=setInterval(fn,ms);intervals.push(t);return t};
  function cleanup(){caseCleanup?.();caseCleanup=null;intervals.forEach(clearInterval);timeouts.forEach(clearTimeout);intervals=[];timeouts=[];if(keys)window.removeEventListener('keydown',keys);keys=null;g=null}
  function now(){return performance.now()}
  function displayScore(){if($('#gamePoints')&&g)$('#gamePoints').textContent=Math.min(1000,Math.round(g.score||0)).toLocaleString('es-CO')}
  function displayTime(s){if($('#gameTime'))$('#gameTime').textContent=`${Math.floor(Math.max(s,0)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(s,0)%60).toString().padStart(2,'0')}`;const meter=$('#arenaTimeMeter');if(meter&&g){const duration=g.mode==='knowledge'?18:(D.modes.find(x=>x.id===g.mode)?.time||100);meter.style.width=Math.max(0,Math.min(100,s/duration*100))+'%';meter.classList.toggle('low',s/duration<.2)}}
  function runCountdown(seconds,onZero){g.endAt=now()+seconds*1000;const tick=()=>{if(!g)return;const remain=Math.max(0,(g.endAt-now())/1000);g.remaining=remain;displayTime(remain);if(remain<=0){clearInterval(timer);onZero()}};const timer=every(tick,150);tick()}
  function finish(details){if(!g||g.ending)return;g.ending=true;const {mode,score}=g;EI.finish(mode,Math.round(score),details)}
  function gameGuide(message){return `<div class="game-guide">🎯 ${message}</div>`}
  function progress(n,max){return `<div class="progress-track"><div style="width:${Math.round(n/max*100)}%"></div></div>`}
  function choiceHTML(item,callbackId='answers',disabled=[]){return `<div class="answers" id="${callbackId}">${item.options.map((x,i)=>`<button class="answer ${disabled.includes(i)?'eliminated':''}" data-answer="${i}" ${disabled.includes(i)?'disabled':''}><span class="answer-key">${'ABCD'[i]}</span><span>${esc(x)}</span></button>`).join('')}</div>`}
  function start(mode){cleanup();g={mode,score:0,remaining:0,ending:false};({agility:startAgility,memory:startMemory,case:startCase,logic:startLogic,knowledge:startKnowledge})[mode]?.()}
  function startAgility(){g.questions=shuffle(D.agility).slice(0,10);g.index=0;g.hits=0;g.locked=false;g.score=0;runCountdown(80,()=>finish(`Acertaste ${g.hits} de ${g.index} decisiones antes de que terminara el tiempo.`));renderAgility()}
  function renderAgility(){if(!g||g.ending)return;if(g.index>=g.questions.length){finish(`¡Respondiste ${g.hits} de 10 decisiones correctamente!`);return}const item=g.questions[g.index];g.openedAt=now();g.locked=false;
    $('#game-content').innerHTML=`${gameGuide('Responde tan rápido como puedas. ¡Los aciertos veloces suman puntos extra!')}
      <div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:14px;color:#aaccf3;font-size:12px"><span>PREGUNTA ${g.index+1} / 10</span><span>${g.hits} aciertos</span></div>${progress(g.index,10)}
      <div class="question-card"><div class="question-topic">⚡ ${esc(item.topic)}</div><h2>${esc(item.q)}</h2>${choiceHTML(item)}<div id="feedback" class="feedback" style="visibility:hidden"></div></div>`;
    $('#answers').onclick=e=>{const b=e.target.closest('[data-answer]');if(!b||g.locked)return;const i=Number(b.dataset.answer),correct=i===item.a;g.locked=true;g.index++;if(correct){g.hits++;g.score+=75+Math.max(0,Math.round(25-(now()-g.openedAt)/550));EI.sound('win')}else{EI.sound('bad')}
      displayScore();$$('#answers .answer').forEach(x=>{x.disabled=true;if(+x.dataset.answer===item.a)x.classList.add('correct');else if(+x.dataset.answer===i)x.classList.add('wrong')});const f=$('#feedback');f.style.visibility='visible';f.className='feedback '+(correct?'success':'error');f.textContent=`${correct?'✓ ¡Excelente!':'✕ No es correcto.'} ${item.why}`;after(renderAgility,980)}
  }
  function startMemory(){const cards=D.memory.flatMap(x=>[x,x]);g.deck=shuffle(cards).map((x,i)=>({...x,serial:i}));g.flipped=[];g.matched=new Set();g.moves=0;g.mistakes=0;g.locked=false;g.score=0;runCountdown(100,()=>finish(`Encontraste ${g.matched.size} de 8 parejas.`));renderMemory()}
  function renderMemory(){if(!g||g.ending)return;$('#game-content').innerHTML=`${gameGuide('Encuentra 8 pares de símbolos relacionados con nuestros procesos. Recuerda sus posiciones.')}
   <div style="display:flex;justify-content:space-between;margin:0 auto 14px;max-width:790px;color:#b2d0ed;font-size:13px"><span>🧠 PAREJAS: <b>${g.matched.size}/8</b></span><span>INTENTOS: <b>${g.moves}</b></span></div>
   <div class="memory-board" id="memoryBoard">${g.deck.map((x,i)=>{const on=g.flipped.includes(i)||g.matched.has(x.id);return `<button class="memory-tile ${on?'revealed':''} ${g.matched.has(x.id)?'matched':''}" data-card="${i}" ${g.matched.has(x.id)?'disabled':''} aria-label="${on?esc(x.name):'Carta oculta'}">${on?`<span>${window.EI_SPRITES?.urlFromFilename(x.sprite)?`<img class="memory-icon" src="${window.EI_SPRITES.urlFromFilename(x.sprite)}" alt="">`:x.icon}<span class="memory-caption">${esc(x.name)}</span></span>`:'<span class="memory-back">EI</span>'}</button>`}).join('')}</div>`;
    $('#memoryBoard').onclick=e=>{const el=e.target.closest('[data-card]');if(!el||g.locked)return;const i=+el.dataset.card;if(g.flipped.includes(i)||g.matched.has(g.deck[i].id))return;g.flipped.push(i);EI.sound();renderMemory();if(g.flipped.length===2){g.locked=true;g.moves++;const [a,b]=g.flipped;const matched=g.deck[a].id===g.deck[b].id;if(!matched)g.mistakes++;after(()=>{if(!g||g.mode!=='memory')return;if(matched){g.matched.add(g.deck[a].id);EI.sound('win')}else EI.sound('bad');g.flipped=[];g.locked=false;g.score=Math.max(0,Math.min(990,g.matched.size*100+Math.round(g.remaining*.9)-g.mistakes*10));displayScore();if(g.matched.size===8){g.score=Math.max(400,Math.min(1000,650+Math.round(g.remaining*3.4)-g.mistakes*24));finish(`¡Memoria completada en ${g.moves} intentos y ${g.mistakes} errores!`)}else renderMemory()},matched?350:820)}};
  }
  // Mapa explorable EI: 640x384 píxeles; físicas en el punto de los pies,
  // animación oficial por cuadros y navegación con teclado, táctil y clic.
  const CW=20,CH=12,TILE=32;
  const obstacles=new Set();for(let y of [2,3,7,8])for(let x of [5,6,7,13,14,15])obstacles.add(`${x},${y}`);
  function blocked(x,y){return x<1||x>=CW-1||y<1||y>=CH-1||obstacles.has(`${x},${y}`)}
  function dist(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)}
  const keyDirections={arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right'};
  function startCase(){
    const character=EI.state.player?.avatar||EI.state.avatar;
    g.p={x:2,y:10};g.resolved=new Set();g.score=0;g.current=null;g.path=[];g.goal=null;g.finishing=false;g.ending=false;
    g.pressed=new Set();g.touched=new Set();g.running=false;g.frameTime=0;
    g.motion=new window.EI_HEROES.FootMover({x:2.5*TILE,y:10.5*TILE,boxW:18,boxH:10,
      speed:96,runSpeed:164,solidAt:(x,y)=>blocked(Math.floor(x/TILE),Math.floor(y/TILE))});
    g.anim=new window.EI_HEROES.Animator(window.EI_HEROES.resolve(character));
    g.caseTiles=new Image();g.caseTiles.onload=()=>drawCase();g.caseTiles.src='assets/pixel/case-tiles.png';
    g.plants=['crops/tomato/icon/tomato_icon_16x16_4frames.png','crops/berry/icon/berry_icon_16x16.png','crops/carrot/icon/carrot_icon_16x16_2frames.png'].map(path=>{
      const im=new Image();im.onload=()=>drawCase();im.src=window.EI_SPRITES?.urlFromFilename(path)||'';return im;
    });
    runCountdown(160,()=>finish(`Recogiste ${g.resolved.size} de 4 evidencias del caso.`));
    renderCase();
    const onKeyDown=e=>{
      if(!g||g.mode!=='case'||g.ending)return;
      const target=e.target;if(target?.closest?.('input,textarea,select'))return;
      const key=e.key.toLowerCase(),direction=keyDirections[key];
      if(direction){e.preventDefault();g.pressed.add(direction);g.path=[];g.goal=null;}
      else if(key==='shift'){g.running=true;}
      else if((key==='e'||key===' ')&&!e.repeat){e.preventDefault();interactCase()}
    };
    const onKeyUp=e=>{if(!g)return;const direction=keyDirections[e.key.toLowerCase()];if(direction)g.pressed.delete(direction);if(e.key==='Shift')g.running=false};
    const onBlur=()=>{g?.pressed?.clear();if(g)g.running=false};
    window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);window.addEventListener('blur',onBlur);
    let raf=0,last=0;
    const loop=stamp=>{
      if(!g||g.mode!=='case'||g.ending)return;
      const elapsed=last?Math.min(.05,(stamp-last)/1000):0;last=stamp;
      const avatar=EI.state.player?.avatar||EI.state.avatar;
      g.anim.setCharacter(window.EI_HEROES.resolve(avatar));
      let dx=0,dy=0,run=g.running;
      if(!g.current){
        if(g.pressed.has('right')||g.touched.has('right'))dx++;
        if(g.pressed.has('left')||g.touched.has('left'))dx--;
        if(g.pressed.has('down')||g.touched.has('down'))dy++;
        if(g.pressed.has('up')||g.touched.has('up'))dy--;
        if(!dx&&!dy&&g.path.length){
          const target=g.path[0],tx=(target.x+.5)*TILE,ty=(target.y+.5)*TILE;
          const vx=tx-g.motion.x,vy=ty-g.motion.y;
          if(Math.hypot(vx,vy)<3){g.motion.x=tx;g.motion.y=ty;g.path.shift();}
          else{dx=vx;dy=vy;}
        }
        const result=g.motion.move(dx,dy,elapsed,run);
        const actuallyMoving=Math.hypot(result.x,result.y)>.01;
        g.anim.setMovement(actuallyMoving?dx:0,actuallyMoving?dy:0,run);
        g.p={x:Math.floor(g.motion.x/TILE),y:Math.floor(g.motion.y/TILE)};
        if(g.goal&&!g.path.length&&nearClue(g.goal)){const clue=g.goal;g.goal=null;interactCase(clue);}
      }else if(!g.anim.once){g.anim.setMovement(0,0,false)}
      g.anim.update(elapsed*1000);
      drawCase();raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);
    caseCleanup=()=>{cancelAnimationFrame(raf);window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);window.removeEventListener('blur',onBlur);};
  }
  function renderCase(){
    if(!g||g.ending)return;
    $('#game-content').innerHTML=`${gameGuide('Explora la bodega EI, encuentra cuatro evidencias y responde correctamente. Usa WASD/flechas, Shift para correr y E para investigar.')}
      <div class="case-layout"><div><div class="case-canvas-wrap" id="caseWrap">
      <canvas width="640" height="384" id="caseCanvas" role="img" aria-label="Bodega interactiva con el personaje EI seleccionado"></canvas><div id="caseModal"></div></div>
      <div class="case-note" style="text-align:center">WASD / FLECHAS · SHIFT: correr · E / ESPACIO: interactuar · CLIC: desplazarse</div></div>
      <aside class="case-sidebar"><h3>📋 Evidencias de auditoría</h3><div id="caseEvidence">${caseEvidence()}</div>
      <p class="case-note">Acércate a un hallazgo y presiona Investigar. Las colisiones se calculan en los pies, sin bloquear toda la silueta del personaje.</p>
      <div class="control-pad case-dpad" aria-label="Controles táctiles">
      <span class="blank"></span><button type="button" data-touch="up" aria-label="Caminar arriba">▲</button><span class="blank"></span>
      <button type="button" data-touch="left" aria-label="Caminar izquierda">◀</button><button type="button" id="caseTouchInteract" aria-label="Investigar">E</button><button type="button" data-touch="right" aria-label="Caminar derecha">▶</button>
      <span class="blank"></span><button type="button" data-touch="down" aria-label="Caminar abajo">▼</button><span class="blank"></span></div>
      <div class="case-touch-actions"><button type="button" id="caseTouchRun" class="btn btn-blue btn-sm">⇧ CORRER (mantener)</button><button type="button" id="caseInspect" class="btn btn-primary btn-sm">🔎 INVESTIGAR</button></div>
      </aside></div>`;
    $$('[data-touch]').forEach(btn=>{
      const direction=btn.dataset.touch;
      btn.addEventListener('pointerdown',e=>{if(g.current)return;e.preventDefault();btn.setPointerCapture(e.pointerId);g.touched.add(direction);g.path=[];g.goal=null;});
      for(const name of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(name,()=>g?.touched?.delete(direction));
    });
    const run=$('#caseTouchRun');run.addEventListener('pointerdown',e=>{e.preventDefault();run.setPointerCapture(e.pointerId);g.running=true});
    for(const name of ['pointerup','pointercancel','lostpointercapture'])run.addEventListener(name,()=>{if(g)g.running=false});
    $('#caseInspect').onclick=()=>interactCase();$('#caseTouchInteract').onclick=()=>interactCase();
    $('#caseCanvas').onclick=e=>{
      if(!g||g.current)return;
      const rect=e.currentTarget.getBoundingClientRect();const x=Math.floor((e.clientX-rect.left)/rect.width*CW),y=Math.floor((e.clientY-rect.top)/rect.height*CH);
      const clue=D.caseClues.find(c=>!g.resolved.has(c.id)&&dist(c,{x,y})<=1);
      g.goal=clue||null;
      const destination=clue?nearestReachable(clue):{x,y};g.path=bfs(g.p,destination);
      if(clue&&nearClue(clue))interactCase(clue);
    };
    drawCase();
  }
  function caseEvidence(){return D.caseClues.map(c=>`<div class="clue-item ${g.resolved.has(c.id)?'done':''}"><span>${g.resolved.has(c.id)?'✅':'🔍'}</span><span>${g.resolved.has(c.id)?esc(c.name):'Pista pendiente'}</span></div>`).join('')}
  function nearClue(clue){return Math.hypot(g.motion.x-(clue.x+.5)*TILE,g.motion.y-(clue.y+.5)*TILE)<=TILE*1.55}
  function nearestReachable(target){const around=[{x:target.x,y:target.y},{x:target.x-1,y:target.y},{x:target.x+1,y:target.y},{x:target.x,y:target.y-1},{x:target.x,y:target.y+1}].filter(p=>!blocked(p.x,p.y));
    around.sort((a,b)=>dist(a,g.p)-dist(b,g.p));return around[0]||g.p;}
  function bfs(start,destination){
    const key=p=>`${p.x},${p.y}`;if(blocked(destination.x,destination.y))return[];
    const queue=[start],seen=new Set([key(start)]),parent={};let head=0;
    while(head<queue.length){const p=queue[head++];if(key(p)===key(destination)){
      const path=[];let pos=key(p);while(pos!==key(start)){const [x,y]=pos.split(',').map(Number);path.unshift({x,y});pos=parent[pos]}return path;
    }
    for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const n={x:p.x+dx,y:p.y+dy};if(!blocked(n.x,n.y)&&!seen.has(key(n))){seen.add(key(n));parent[key(n)]=key(p);queue.push(n)}}}
    return [];
  }
  function drawCase(){
    if(!g||g.mode!=='case')return;const canvas=$('#caseCanvas');if(!canvas)return;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#1b3957';ctx.fillRect(0,0,640,384);
    const ready=g.caseTiles?.complete&&g.caseTiles.naturalWidth>=256;
    const shelfTiles=[];
    for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){
      const px=x*TILE,py=y*TILE,edge=x===0||x===CW-1||y===0||y===CH-1,shelf=obstacles.has(`${x},${y}`);
      const tile=edge?2:shelf?((x+y)%3===0?4:3):((x+y)%7===0?1:0);
      if(ready)ctx.drawImage(g.caseTiles,tile*32,0,32,32,px,py,TILE,TILE);
      else {ctx.fillStyle=edge?'#18314d':shelf?'#855b42':'#31586c';ctx.fillRect(px,py,TILE,TILE)}
      if(shelf)shelfTiles.push({px,py,tile,y:(y+1)*TILE});
      if(!edge&&!shelf&&y===6&&x>1&&x<CW-2){ctx.fillStyle='#d7bb5b';ctx.fillRect(px+9,py+28,13,2)}
    }
    for(let i=0;i<(g.plants||[]).length;i++){const img=g.plants[i];if(img.complete&&img.naturalWidth)ctx.drawImage(img,0,0,16,16,(3+i*6)*TILE+2,8*TILE+4,26,26)}
    const paint=[];
    for(const clue of D.caseClues){if(g.resolved.has(clue.id))continue;
      paint.push({y:(clue.y+.85)*TILE,draw:()=>{const x=clue.x*TILE,y=clue.y*TILE;ctx.fillStyle='#eebc53';ctx.fillRect(x+7,y+5,20,22);ctx.fillStyle='#fff4bc';ctx.fillRect(x+10,y+8,14,15);ctx.fillStyle='#b55b54';ctx.fillRect(x+12,y+14,10,3);ctx.fillStyle='#fff5a6';ctx.fillRect(x+12,y-4,9,7);ctx.fillStyle='#131b3d';ctx.font='bold 10px monospace';ctx.fillText('!',x+13,y+2)}});
    }
    paint.push({y:g.motion.y,draw:()=>{ctx.fillStyle='#10223c77';ctx.beginPath();ctx.ellipse(g.motion.x,g.motion.y-2,13,4,0,0,Math.PI*2);ctx.fill();g.anim.draw(ctx,g.motion.x,g.motion.y,1)}});
    // Oculta al personaje detrás de los obstáculos que están más cerca de la cámara.
    if(ready)for(const shelf of shelfTiles)paint.push({y:shelf.y,draw:()=>ctx.drawImage(g.caseTiles,shelf.tile*32,0,32,32,shelf.px,shelf.py,TILE,TILE)});
    paint.sort((a,b)=>a.y-b.y);paint.forEach(p=>p.draw());
  }
  function interactCase(force){
    if(!g||g.current||g.ending)return;
    const clue=force&&nearClue(force)?force:D.caseClues.find(c=>!g.resolved.has(c.id)&&nearClue(c));
    if(!clue){EI.toast('Acércate a una evidencia para investigar.');return}
    g.path=[];g.goal=null;g.current={id:clue.id,pending:true};g.pressed.clear();g.touched.clear();
    g.anim.trigger('interact',()=>{
      if(!g||g.ending)return;
      g.current=clue;
      $('#caseModal').innerHTML=`<div class="case-popup"><div class="case-popup-inner"><div class="section-kicker">EVIDENCIA ${g.resolved.size+1} DE 4</div><h3>${clue.icon} ${esc(clue.name)}</h3><p>${esc(clue.desc)}</p><p><strong>${esc(clue.q)}</strong></p>${clue.options.map((option,i)=>`<button class="answer" data-clue-answer="${i}"><span class="answer-key">${'ABC'[i]}</span><span>${esc(option)}</span></button>`).join('')}</div></div>`;
      $$('[data-clue-answer]').forEach(b=>b.onclick=()=>{
        const correct=+b.dataset.clueAnswer===clue.a;
        g.score+=correct?175:50;g.resolved.add(clue.id);displayScore();EI.sound(correct?'win':'bad');$('#caseModal').innerHTML='';g.current=null;
        $('#caseEvidence').innerHTML=caseEvidence();if(g.resolved.size===4)after(showCaseFinal,350);
      });
    });
  }
  function showCaseFinal(){
    if(!g||g.ending||g.finishing)return;g.finishing=true;g.current={id:'final'};
    $('#caseModal').innerHTML=`<div class="case-popup"><div class="case-popup-inner"><div class="section-kicker">🎖 MISIÓN FINAL</div><h3>Dictamen de la bodega</h3><p>Revisaste calidad documental, trazabilidad, ciberseguridad y SST.</p><p><strong>${esc(D.caseFinal.q)}</strong></p>${D.caseFinal.options.map((option,i)=>`<button class="answer" data-final="${i}"><span class="answer-key">${'ABCD'[i]}</span><span>${esc(option)}</span></button>`).join('')}</div></div>`;
    $$('[data-final]').forEach(b=>b.onclick=()=>{const correct=+b.dataset.final===D.caseFinal.a;g.score+=correct?220:45;g.score+=Math.min(80,Math.round(g.remaining*.5));EI.sound(correct?'win':'bad');finish(correct?'¡Investigación concluida! Identificaste la acción integral.':'Investigación terminada: registra y verifica antes de liberar procesos.')});
  }
  function startLogic(){g.questions=D.logic;g.index=0;g.score=0;g.picked=[];g.misses=0;g.locked=false;runCountdown(150,()=>finish(`Resolviste ${g.index} desafíos de lógica antes de finalizar el tiempo.`));renderLogic()}
  function renderLogic(){if(!g||g.ending)return;if(g.index>=g.questions.length){finish('¡Completaste los seis desafíos de razonamiento!');return}const item=g.questions[g.index];g.locked=false;g.openedAt=now();g.picked=[];g.shuffled=item.type==='order'?shuffle(item.items):null;
    let inner=item.type==='order'?`<div class="sequence-picked" id="picks">${item.items.map(()=>'<span style="opacity:.28">?</span>').join('')}</div><div class="sequence-picks" id="sequencePicks">${g.shuffled.map((x,i)=>`<button data-pick="${i}">${esc(x)}</button>`).join('')}</div>`:choiceHTML(item);
    $('#game-content').innerHTML=`${gameGuide('Resuelve el razonamiento planteado. Si es una secuencia, pulsa las etapas en orden correcto.')}
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#bdd2ef;margin-bottom:12px"><span>RETO ${g.index+1} DE ${g.questions.length}</span><span>ERRORES: ${g.misses}</span></div>${progress(g.index,g.questions.length)}
      <div class="question-card"><div class="question-topic">🧩 ${esc(item.topic)}</div><h2>${esc(item.q)}</h2>${inner}<div id="feedback" class="feedback" style="visibility:hidden"></div></div>`;
    const done=(success)=>{if(g.locked)return;g.locked=true;if(success){g.score+=130+Math.min(35,Math.round(g.remaining/4));EI.sound('win')}else{g.misses++;EI.sound('bad')}displayScore();const f=$('#feedback');f.style.visibility='visible';f.className='feedback '+(success?'success':'error');f.textContent=(success?'✓ ¡Muy bien! ':'✕ Revisa el razonamiento. ')+item.why;g.index++;after(renderLogic,1100)};
    if(item.type==='choice')$('#answers').onclick=e=>{const b=e.target.closest('[data-answer]');if(!b||g.locked)return;const ok=+b.dataset.answer===item.a;$$('#answers .answer').forEach(x=>{x.disabled=true;if(+x.dataset.answer===item.a)x.classList.add('correct');else if(+x.dataset.answer===+b.dataset.answer)x.classList.add('wrong')});done(ok)};
    else $('#sequencePicks').onclick=e=>{const b=e.target.closest('[data-pick]');if(!b||b.disabled||g.locked)return;const val=g.shuffled[+b.dataset.pick];if(val!==item.items[g.picked.length]){g.misses++;EI.sound('bad');const f=$('#feedback');f.style.visibility='visible';f.className='feedback error';f.textContent='Ese no es el siguiente paso. ¡Vuelve a intentarlo!';return}g.picked.push(val);b.disabled=true;b.style.opacity='.35';EI.sound();$('#picks').innerHTML=g.picked.map((x,i)=>`<span>${i+1}. ${esc(x)}</span>`).join('');if(g.picked.length===item.items.length)done(true)};
  }
  function startKnowledge(){g.questions=shuffle(D.knowledge).slice(0,12);g.index=0;g.hits=0;g.score=0;g.fifty=false;g.skip=false;g.hidden=[];g.answered=false;g.qStart=now();g.qLeft=18;renderKnowledge();every(()=>{if(!g||g.mode!=='knowledge'||g.ending||g.answered)return;g.qLeft=Math.max(0,18-(now()-g.qStart)/1000);displayTime(g.qLeft);const label=$('#questionSeconds');if(label)label.textContent=`${Math.ceil(g.qLeft)} s`;if(g.qLeft<=0)answerKnowledge(-1)},120)}
  function renderKnowledge(){if(!g||g.ending)return;if(g.index>=g.questions.length){finish(`Has acertado ${g.hits} de 12 preguntas del gran concurso.`);return}g.answered=false;g.hidden=[];g.qStart=now();g.qLeft=18;const item=g.questions[g.index];displayTime(18);
    $('#game-content').innerHTML=`${gameGuide('El gran concurso de conocimiento EI: elige A, B, C o D antes de que se agote el tiempo.')}
      <div style="display:flex;justify-content:space-between;gap:10px;color:#afc8ed;font-size:12px;margin-bottom:12px"><span>PREGUNTA ${g.index+1} / 12 · ${g.hits} ACIERTOS</span><span>⏱ <strong id="questionSeconds">18 s</strong></span></div>${progress(g.index,12)}
      <div class="question-card"><div class="question-topic">🏆 ${esc(item.topic)}</div><h2>${esc(item.q)}</h2>${choiceHTML(item)}<div id="feedback" class="feedback" style="visibility:hidden"></div></div>
      <div class="knowledge-tools"><span class="text-muted" style="font-size:12px">💡 Dos comodines disponibles para toda la partida</span><div style="display:flex;gap:9px"><button id="fifty" class="btn btn-blue btn-sm" ${g.fifty?'disabled':''}>50:50 ${g.fifty?'✓':''}</button><button id="skip" class="btn btn-outline btn-sm" ${g.skip?'disabled':''}>⏭ Saltar pregunta</button></div></div>`;
    $('#answers').onclick=e=>{const b=e.target.closest('[data-answer]');if(!b||g.answered)return;answerKnowledge(+b.dataset.answer)};
    $('#fifty').onclick=()=>{if(g.fifty||g.answered)return;g.fifty=true;const bad=item.options.map((_,i)=>i).filter(i=>i!==item.a);g.hidden=shuffle(bad).slice(0,2);$$('#answers .answer').forEach(b=>{if(g.hidden.includes(+b.dataset.answer)){b.disabled=true;b.classList.add('eliminated')}});$('#fifty').disabled=true;EI.sound()};
    $('#skip').onclick=()=>{if(g.skip||g.answered)return;g.skip=true;answerKnowledge(-1,true)};
  }
  function answerKnowledge(selected,skipped=false){if(!g||g.answered||g.ending)return;g.answered=true;const item=g.questions[g.index];const correct=selected===item.a;if(correct){g.hits++;g.score+=65+Math.max(0,Math.round(g.qLeft*1.1));EI.sound('win')}else EI.sound('bad');displayScore();
    $$('[data-answer]').forEach(b=>{b.disabled=true;const i=+b.dataset.answer;if(i===item.a)b.classList.add('correct');else if(i===selected)b.classList.add('wrong')});
    if($('#fifty'))$('#fifty').disabled=true;if($('#skip'))$('#skip').disabled=true;
    const f=$('#feedback');if(f){f.style.visibility='visible';f.className='feedback '+(correct?'success':'error');f.textContent=`${correct?'✓ ¡Respuesta correcta!':skipped?'⏭ Pregunta omitida.':selected<0?'⌛ Tiempo agotado.':'✕ Respuesta incorrecta.'} ${item.why}`}
    g.index++;after(renderKnowledge,1100)
  }
  window.EI_GAMES={start,cleanup};
})();
