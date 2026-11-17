'use strict';
(() => {
  const D = window.EI_DATA;
  const state = {
    remote:false,config:{lock_by_day:false},player:null,scores:{},run:null,
    sound:false,avatar:{skin:1,hair:0,hairColor:0,shirt:0,accessory:'helmet',style:'retro'},
    ranking:null,areaFilter:'Todos',busy:false
  };
  const $ = (s,p=document)=>p.querySelector(s);
  const $$ = (s,p=document)=>Array.from(p.querySelectorAll(s));
  const esc = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shuffle = a => [...a].sort(()=>Math.random()-.5);
  let toastTimer;
  function toast(message){const e=$('#toast');e.textContent=message;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),3200)}
  function sound(type='tap'){
    if(!state.sound)return;
    try{const ctx= new(window.AudioContext||window.webkitAudioContext)();const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='square';osc.frequency.value=type==='win'?880:type==='bad'?190:520;gain.gain.setValueAtTime(.045,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.12);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.13);osc.onended=()=>ctx.close()}catch(_e){}
  }
  async function api(action,data){const o={method:data?'POST':'GET',headers:{'Accept':'application/json'}};if(data){o.headers['Content-Type']='application/json';o.body=JSON.stringify(data)}const response=await fetch('api.php?action='+encodeURIComponent(action),o);const contentType=response.headers.get('content-type')||'';if(!contentType.includes('application/json'))throw Error('El servidor PHP no está activo');const result=await response.json();if(!response.ok||!result.ok)throw Error(result.error||'Error del servidor');return result}
  const credsKey='olimpiadas_ei_credentials_v1';const demoKey='olimpiadas_ei_demo_v1';
  const credentials=()=>{try{return JSON.parse(localStorage.getItem(credsKey)||'null')||{}}catch(_){return {}}};
  const demoData=()=>{try{return JSON.parse(localStorage.getItem(demoKey))||{players:[],current:null}}catch(_){return {players:[],current:null}}};
  const saveDemo=x=>localStorage.setItem(demoKey,JSON.stringify(x));
  const rankFromDemo=()=>{let p=demoData().players.filter(x=>Object.keys(x.scores||{}).length>0).map(x=>({...x,total:Object.values(x.scores).reduce((a,b)=>a+b,0)}));p.sort((a,b)=>b.total-a.total);return p.map(x=>({id:x.id,alias:x.alias,area:x.area,total:x.total,completed:Object.keys(x.scores).length,scores:x.scores}))};
  async function initialize(){
    // GitHub Pages no ejecuta PHP: modo demostración local, sin puntajes compartidos.
    const staticPages = /\.github\.io$/i.test(location.hostname);
    try{if(staticPages)throw Error('GitHub Pages: cliente estático');const r=await api('status');state.remote=true;state.config=r.config||{};$('#serverLabel').textContent='COMPETENCIA EN LÍNEA';$('#footerStatus').textContent='Resultados compartidos';const credentials=JSON.parse(localStorage.getItem(credsKey)||'null');if(credentials){try{const x=await api('resume',credentials);state.player=x.player;state.avatar={...state.avatar,...(x.player.avatar||{})};state.scores=x.scores||{}}catch(_){localStorage.removeItem(credsKey)}}}catch(_){state.remote=false;$('#serverLabel').textContent='MODO DEMO LOCAL';$('#footerStatus').textContent='Los puntos se guardan en este navegador';const v=demoData();const p=v.players.find(x=>x.id===v.current);if(p){state.player=p;state.scores={...p.scores}}}
    await window.EI_SPRITES?.load();
    renderHeader();renderTitleScreen();
  }
  function renderHeader(){const e=$('#userChip');if(!state.player){e.hidden=true;e.innerHTML='';return}e.hidden=false;e.innerHTML=`<canvas id="userAvatar" class="mini-head" width="24" height="28"></canvas><span>${esc(state.player.alias)}<small>${esc(state.player.area)}</small></span>`;avatarOnCanvas($('#userAvatar'),state.player.avatar||state.avatar)}
  function total(){return Object.values(state.scores).reduce((a,b)=>a+Number(b||0),0)}
  const briefs={
    agility:{icon:'⚡',tag:'DECISIÓN RÁPIDA',duration:'80 s',controls:'Selecciona una de cuatro respuestas.',goal:'Resuelve 10 situaciones breves de calidad, SST, auditoría y logística.'},
    memory:{icon:'🧠',tag:'MEMORIA VISUAL',duration:'100 s',controls:'Destapa dos cartas por turno.',goal:'Encuentra 8 parejas relacionadas con símbolos y conceptos de la compañía.'},
    case:{icon:'🔎',tag:'AVENTURA EXPLORABLE',duration:'160 s',controls:'Flechas / WASD para caminar y E para investigar; también puedes tocar el mapa.',goal:'Investiga cuatro hallazgos de una bodega y emite un dictamen final.'},
    logic:{icon:'🧩',tag:'PUZLES DE PROCESO',duration:'150 s',controls:'Selecciona respuestas o pulsa los pasos en el orden correcto.',goal:'Completa seis retos de inventario, secuencias y mejora continua.'},
    knowledge:{icon:'🏆',tag:'GRAN CONCURSO',duration:'12 preguntas',controls:'Elige A, B, C o D; dispones de 50:50 y salto, una vez cada uno.',goal:'Responde sobre EI, documentación, SST, ciberseguridad y operaciones.'}
  };
  function medalFor(points){return points>=850?{name:'ORO',icon:'🥇',color:'gold'}:points>=650?{name:'PLATA',icon:'🥈',color:'silver'}:points>=400?{name:'BRONCE',icon:'🥉',color:'bronze'}:{name:'PARTICIPACIÓN',icon:'⭐',color:'entry'};}
  function medalCount(){return Object.values(state.scores).filter(v=>Number(v)>=400).length;}
  function coverScene(canvas){if(!canvas)return;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;const img=new Image();img.onload=()=>{if(canvas.isConnected)ctx.drawImage(img,0,0,canvas.width,canvas.height)};img.src='assets/pixel/campus-ei.png'}
  function renderTitleScreen(){
    window.EI_GAMES?.cleanup();state.run=null;$('#modalRoot').innerHTML='';
    const avatar=state.player?.avatar||state.avatar;const role=window.EI_CHARACTERS?.normalize(avatar).role;
    $('#view').innerHTML=`<div class="party-title-view"><section class="party-title-stage">
      <canvas id="titleScene" width="800" height="450" aria-hidden="true"></canvas>
      <div class="title-particle one">★</div><div class="title-particle two">✦</div><div class="title-particle three">◆</div>
      <div class="party-title-content"><span class="party-season">★ ELECTROINGENIERÍA PRESENTA · TEMPORADA 2026 ★</span>
        <h1><span>OLIMPIADAS</span><strong>EI PIXEL <em>PARTY</em></strong></h1>
        <p>Cinco días. Cinco minijuegos. Una gran competencia interna de conocimiento, agilidad y trabajo en equipo.</p>
        <div class="title-role-chip"><canvas id="titleAvatar" width="90" height="90"></canvas><span><small>PARTICIPANTE</small><b>${esc(state.player?.alias||'Aún sin registrar')}</b><small>${esc(role?.name||'Elige tu rol')}</small></span></div>
        <div class="title-primary-actions"><button class="btn btn-primary" id="titleStart">▶ ${state.player?'CONTINUAR PARTIDA':'COMENZAR A JUGAR'}</button><button class="btn btn-blue" id="titleCharacters">👤 ${state.player?'EDITAR PERSONAJE':'ELEGIR PERSONAJE'}</button></div>
        <div class="title-secondary-actions"><button id="titleBoard">🗺 TABLERO SEMANAL</button><button id="titleRules">📖 CÓMO JUGAR</button><button id="titleRanking">🏆 CLASIFICACIÓN</button></div>
      </div><span class="title-stamp">PRESS START · EI ARCADE</span></section>
      <div class="title-chapter-strip">${D.modes.map((m,i)=>`<div class="chapter-icon" style="--level:${m.color}"><span>${m.icon}</span><small>DÍA ${i+1}</small></div>`).join('')}</div>
      <p class="title-hint">${state.remote?'Resultados compartidos habilitados.':'MODO DEMOSTRACIÓN · Tus resultados se guardan solo en este navegador.'}</p>
    </div>`;
    coverScene($('#titleScene'));
    const chars=window.EI_CHARACTERS; if(chars){if(!chars.draw($('#titleAvatar'),avatar))window.addEventListener('ei-character-ready',()=>{if($('#titleAvatar'))chars.draw($('#titleAvatar'),avatar)},{once:true});}
    $('#titleStart').onclick=()=>state.player?renderHub():openRegistration();
    $('#titleCharacters').onclick=()=>state.player?openWardrobe():openRegistration();
    $('#titleBoard').onclick=renderBoard;
    $('#titleRules').onclick=renderHowTo;
    $('#titleRanking').onclick=renderRanking;
    window.scrollTo({top:0,behavior:'instant'});
  }
  function renderHowTo(){
    window.EI_GAMES?.cleanup();state.run=null;
    $('#view').innerHTML=`<section class="party-rules-page"><nav class="game-breadcrumb"><button id="rulesBack">← MENÚ PRINCIPAL</button><span>/</span><span>MANUAL DEL JUGADOR</span></nav>
    <header class="rules-hero"><span class="section-kicker">★ MANUAL ARCADE EI</span><h1>¿Cómo se juega?</h1><p>Selecciona un rol, completa los cinco minijuegos y acumula puntos. Cada prueba otorga hasta 1.000 puntos y una medalla según el resultado.</p></header>
    <div class="rules-summary"><div>🎮 <b>5</b><small>Minijuegos</small></div><div>⭐ <b>5.000</b><small>Puntos máximos</small></div><div>🏅 <b>4</b><small>Niveles de medalla</small></div></div>
    <div class="rules-grid">${D.modes.map(m=>{const b=briefs[m.id];return `<article class="rule-card" style="--accent:${m.color}"><img src="assets/pixel/mode-${m.id}.png" alt=""><div><span>DÍA ${m.day} · ${b.duration}</span><h2>${b.icon} ${esc(m.title)}</h2><p>${esc(b.goal)}</p><small>${esc(b.controls)}</small></div></article>`}).join('')}</div>
    <div class="rules-prizes"><h2>Escala de recompensas</h2><div class="rules-medals"><span>🥇 ORO · 850–1.000 PT</span><span>🥈 PLATA · 650–849 PT</span><span>🥉 BRONCE · 400–649 PT</span><span>⭐ PARTICIPACIÓN · 0–399 PT</span></div><p>Para premios oficiales, la organización debe validar resultados y utilizar un ranking compartido con controles contra manipulación. GitHub Pages por sí solo conserva partidas de demostración local.</p></div>
    <button id="rulesStart" class="btn btn-primary">▶ IR AL TABLERO</button></section>`;
    $('#rulesBack').onclick=renderTitleScreen;$('#rulesStart').onclick=renderBoard;
  }
  function renderBoard(){
    window.EI_GAMES?.cleanup();state.run=null;const done=Object.keys(state.scores).length;
    const coords=[[9,65],[28,27],[50,67],[72,23],[91,61]];
    $('#view').innerHTML=`<section class="party-board-view"><nav class="game-breadcrumb"><button id="boardBack">← MENÚ PRINCIPAL</button><span>/</span><span>TABLERO SEMANAL</span></nav>
      <div class="board-heading"><div><span class="section-kicker">◆ UNA SEMANA, CINCO MUNDOS</span><h1>El tablero de las olimpiadas</h1><p>Visita cada estación, descubre su desafío y consigue la mayor puntuación de tu área.</p></div><div class="board-score"><span>MI MARCADOR</span><strong>${total().toLocaleString('es-CO')} <small>PT</small></strong><span>${done}/5 PRUEBAS JUGADAS</span></div></div>
      <div class="board-land"><div class="board-land-sky"></div><svg class="board-journey-path" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true"><path d="M90 260 Q150 50 280 110 T500 260 T720 90 T910 250"/></svg>
      ${D.modes.map((m,i)=>{const completed=state.scores[m.id]!==undefined,locked=!unlocked(m);return `<button class="board-stop ${completed?'completed':''} ${locked?'locked':''}" style="--accent:${m.color};left:${coords[i][0]}%;top:${coords[i][1]}%" data-board-mode="${m.id}" ${locked?'disabled':''} aria-label="Día ${m.day}: ${esc(m.title)}">
        <span class="board-stop-ring"><span class="board-stop-icon">${m.icon}</span></span><span class="board-stop-label"><small>ESTACIÓN ${m.day}</small><b>${esc(m.title)}</b><em>${completed?'✓ '+state.scores[m.id]+' PT':locked?'BLOQUEADA':'JUGAR'}</em></span></button>`}).join('')}
      <div class="board-ground"></div></div>
      <div class="board-legend"><span><i class="legend-gold"></i> Disponible</span><span><i class="legend-green"></i> Completado</span><span><i class="legend-grey"></i> Cerrado por calendario</span></div>
      <div class="board-bottom"><button id="boardRoster" class="btn btn-outline">👤 ${state.player?'EDITAR ROL':'ELEGIR ROL'}</button><button id="boardRules" class="btn btn-outline">📖 REGLAS</button><button id="boardRanking" class="btn btn-primary">🏆 CLASIFICACIÓN</button></div>
    </section>`;
    $$('.board-stop').forEach(b=>b.onclick=()=>openGameBriefing(b.dataset.boardMode));
    $('#boardBack').onclick=renderTitleScreen;$('#boardRoster').onclick=()=>state.player?openWardrobe():openRegistration();$('#boardRules').onclick=renderHowTo;$('#boardRanking').onclick=renderRanking;
  }
  function openGameBriefing(mode){
    const m=D.modes.find(x=>x.id===mode);if(!m)return;
    if(!unlocked(m)){toast('Este reto todavía no está habilitado por calendario.');return;}
    const b=briefs[mode],prior=state.scores[mode];const medal=prior!==undefined?medalFor(prior):null;
    $('#modalRoot').innerHTML=`<div class="modal-backdrop" role="presentation"><div class="modal briefing-modal" role="dialog" aria-modal="true" aria-labelledby="briefTitle">
    <button class="brief-close" id="briefClose" aria-label="Cerrar">✕</button><div class="brief-visual"><img src="assets/pixel/mode-${mode}.png" alt="Escenario de ${esc(m.title)}"><div class="brief-day">DÍA ${m.day} / 5</div></div>
    <div class="brief-copy"><span class="section-kicker">${b.icon} ${b.tag}</span><h2 id="briefTitle">${esc(m.title)}</h2><p>${esc(b.goal)}</p>
    <div class="brief-facts"><span>⏱ <strong>${b.duration}</strong><small>DURACIÓN</small></span><span>⭐ <strong>1.000 PT</strong><small>MÁXIMO</small></span><span>🏅 <strong>${medal?medal.name:'SIN MEDALLA'}</strong><small>MEJOR RESULTADO</small></span></div>
    <div class="brief-control"><strong>¿Cómo jugar?</strong><p>${esc(b.controls)}</p></div>
    <div class="brief-footer"><button id="briefBack" class="btn btn-outline">VOLVER</button><button id="briefStart" class="btn btn-primary">▶ ${state.player?'INICIAR RETO':'CREAR PARTICIPANTE'}</button></div>
    </div></div></div>`;
    const close=()=>$('#modalRoot').innerHTML='';$('#briefClose').onclick=close;$('#briefBack').onclick=close;
    $('#briefStart').onclick=()=>{close();state.player?startMode(mode):openRegistration()};
    $('#modalRoot').querySelector('.modal-backdrop').addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))close()});
    $('#briefClose').focus();
  }

  const spriteUrl=(path)=>window.EI_SPRITES?.urlFromFilename(path)||'';
  const spriteRibbon=()=>D.memory.map(m=>`<span class="pixel-chip" title="${esc(m.name)}"><img src="${spriteUrl(m.sprite)}" alt="" loading="lazy"></span>`).join('');
  function showSpriteGallery(){
    const pack=window.EI_SPRITES;
    if(!pack?.ready){toast('No se pudo abrir el paquete de sprites: '+(pack?.getError()||'no cargado'));return;}
    const items=pack.list(), groups=['Todos',...new Set(items.map(x=>x.group))];
    $('#view').innerHTML=`<section class="sprite-gallery-page"><nav class="game-breadcrumb"><button id="galleryBack">← Volver a Olimpiadas</button><span>/</span><span>Galería retro</span></nav>
      <div class="section-kicker">SUPER RETRO RANCH · ASSETS GRATUITOS</div><h1>Galería de sprites originales</h1>
      <p>Los ${items.length} PNG del paquete Free Tier están incorporados en el videojuego como recursos empaquetados. Aquí puedes comprobar sus personajes, animaciones, cultivos, objetos y escenarios.</p>
      <div class="asset-filters">${groups.map((x,i)=>`<button data-group="${i}" class="area-btn ${i===0?'active':''}">${esc(x)}</button>`).join('')}</div>
      <div class="sprites-gallery" id="spritesGallery"></div>
      <p class="license-note">Crédito: Gif · SuperRetroRanch Free Tier. Uso interno no comercial. Los sprites no se ofrecen como archivos independientes.</p>
    </section>`;
    const gallery=$('#spritesGallery');
    const render=(grp)=>{gallery.innerHTML=items.filter(x=>grp==='Todos'||x.group===grp).map(x=>`<article class="sprite-gallery-item"><div class="sprite-gallery-image"><img loading="lazy" src="${pack.url(x.id)}" alt="${esc(x.filename)}"></div><strong>${esc(x.filename.split('/').slice(-1)[0])}</strong><span>${esc(x.group)}</span></article>`).join('');};
    render('Todos');
    $$('.asset-filters button').forEach(btn=>btn.onclick=()=>{$$('.asset-filters button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');render(groups[Number(btn.dataset.group)])});
    $('#galleryBack').onclick=renderHub;
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function unlocked(mode){if(!state.remote||!state.config.lock_by_day)return true;let start=state.config.start_date;if(!start)return true;const target=new Date(start+'T00:00:00-05:00').getTime()+(mode.day-1)*86400000;return Date.now()>=target}
  function renderHub(){
    if(window.EI_GAMES)window.EI_GAMES.cleanup();state.run=null;
    const done=Object.keys(state.scores).length, next=D.modes.find(m=>state.scores[m.id]===undefined)||D.modes[0],
      avatar=state.player?.avatar||state.avatar;
    const selected=window.EI_CHARACTERS?.normalize(avatar).role||{name:'Operativo',role:'Ejecución en campo',color:'#f183c9'};
    const modeTags={
      agility:['Calidad documental','SST','Cálculo'],
      memory:['Conceptos EI','Símbolos','Agilidad'],
      case:['Bodega','Hallazgos','Decisiones'],
      logic:['Secuencias','Inventario','Proceso'],
      knowledge:['Empresa','Auditoría','Cultura EI']
    };
    $('#view').innerHTML=`<div class="arcade-lobby hub party-shell">
      <div class="party-marquee"><span class="marquee-star">★</span> OLIMPIADAS EI · SEMANA DE RETOS · FORMATO PARTY GAME CORPORATIVO <span class="marquee-star">★</span></div>
      <div class="game-path"><span class="path-dot"></span> CAMPAMENTO EI <span class="path-arrow">/</span> TEMPORADA 2026 <span class="path-arrow">/</span> CINCO JUEGOS DEL DÍA</div>
      <section class="arcade-hero party-hero">
        <div class="arcade-hero-copy">
          <div class="arcade-eyebrow"><span class="online-star">✦</span> ESTILO PARTY ARCADE · COMPETENCIA INTERNA</div>
          <h1>OLIMPIADAS <strong>EI <span>PIXEL PARTY</span></strong></h1>
          <p>Vive una competencia de una semana al estilo de un juego de fiesta: turnos rápidos, desafíos cortos, estética arcade premium y contenido 100% enfocado en Electroingeniería.</p>
          <div class="arcade-actions">
            <button type="button" class="btn btn-primary arcade-primary" id="heroAction">${state.player?'▶ CONTINUAR PARTIDA':'▶ CREAR PARTICIPANTE'}</button>
            <button type="button" class="btn btn-outline" id="heroRanking">🏆 VER CLASIFICACIÓN</button>
            <button type="button" class="btn btn-outline" id="heroProfile">👤 ${state.player?'MI PERSONAJE':'ELEGIR ROL'}</button>
          </div>
          <div class="arcade-hero-meta"><span>★ 5 JUEGOS DEL DÍA</span><span>◷ RETOS CORTOS Y ÁGILES</span><span>◆ PREMIACIÓN POR ÁREA</span></div>
          <div class="party-summary-bar">
            <div><small>PROGRESO</small><strong>${done}/5</strong></div>
            <div><small>PUNTAJE TOTAL</small><strong>${total().toLocaleString('es-CO')} PT</strong></div>
            <div><small>PRÓXIMO RETO</small><strong>${esc(next.title)}</strong></div>
          </div>
        </div>
        <div class="arcade-hero-world">
          <canvas id="heroCanvas" width="400" height="260" aria-label="Escenario pixel art del campus EI"></canvas>
          <div class="world-hud"><span>⚔ TABLERO PRINCIPAL</span><span>SEMANA 01</span></div>
          <div class="stage-avatar"><canvas id="mainAvatarCanvas" width="112" height="112" aria-label="Personaje elegido"></canvas><div class="avatar-nameplate">${esc(state.player?.alias||selected.name)}<small>${esc(selected.name)} · ${esc(selected.role)}</small></div></div>
        </div>
      </section>

      <div class="arcade-overview party-overview">
        <button class="arcade-profile" id="heroProfileMini" type="button" aria-label="Elegir o modificar personaje">
          <span class="profile-pixel"><canvas id="profileCanvas" width="60" height="60"></canvas></span>
          <span class="profile-copy"><small>PARTICIPANTE ACTIVO</small><strong>${esc(state.player?.alias||'Selecciona tu rol')}</strong><span>${state.player?esc(selected.name)+' · '+esc(selected.role):'Jefe, Coordinador, Analista, Auxiliar, Técnico u Operativo'}</span></span><span class="profile-arrow">›</span>
        </button>
        <div class="arcade-stat"><span class="stat-emoji">✦</span><span><small>MI PUNTAJE</small><strong>${total().toLocaleString('es-CO')} <em>PT</em></strong></span></div>
        <div class="arcade-stat"><span class="stat-emoji">◈</span><span><small>JUEGOS SUPERADOS</small><strong>${done} <em>/ 5</em></strong></span></div>
        <button class="arcade-mini-action" type="button" id="arcadeGallery"><span>▦</span><span>VER ASSETS DEL PAQUETE<small>Sprites y recursos pixel</small></span></button>
      </div>

      <section class="party-map-teaser"><div><span class="section-kicker">★ CAMINO A LA VICTORIA</span><h2>Explora el tablero de la semana</h2><p>Cinco estaciones conectadas, un reto diferente por jornada y una meta: alcanzar el podio de tu área.</p></div><button type="button" class="btn btn-primary" id="openWeeklyBoard">🗺 ABRIR TABLERO SEMANAL</button></section>
      <div class="arcade-section-title" id="modeSection"><div><span class="section-kicker">◈ EL TABLERO PRINCIPAL</span><h2>Selecciona tu siguiente minijuego</h2></div><span class="arcade-caption">5 RETOS · 1.000 PUNTOS POR PARTIDA · EXPERIENCIA ARCADE</span></div>
      <section class="modes arcade-modes arcade-premium-grid" id="modeCards" aria-label="Cinco mundos del videojuego">${D.modes.map(m=>{
        const completed=state.scores[m.id]!==undefined,locked=!unlocked(m),active=next.id===m.id;
        return `<button class="mode-card arcade-mode premium-mode ${locked?'locked':''} ${active?'is-next':''}" style="--accent:${m.color}" data-mode="${m.id}" ${locked?'disabled':''}>
          <div class="mode-scene"><img class="mode-illustration" src="assets/pixel/mode-${m.id}.png" alt="Escenario de ${esc(m.title)}" loading="lazy"><span class="mode-illustration-mark">${m.icon}</span><span class="arcade-level">JUEGO ${String(m.day).padStart(2,'0')}</span>${active?'<span class="next-ribbon">SIGUE</span>':''}</div>
          <div class="mode-body"><h3>${esc(m.title)}</h3><span class="mode-desc">${esc(m.description)}</span><div class="mode-pill-row">${(modeTags[m.id]||[]).map(t=>`<span class="mode-pill">${esc(t)}</span>`).join('')}</div><div class="mode-bottom"><span>${locked?'🔒 Bloqueado':completed?'✓ Puntaje guardado':'▶ Iniciar minijuego'}</span><strong>${completed?Number(state.scores[m.id]).toLocaleString('es-CO')+' PT':'1.000 PT'}</strong></div></div>
        </button>`}).join('')}</section>

      <div class="arcade-lower party-lower">
        <section class="arcade-panel quest-panel premium-panel"><div class="arcade-panel-head"><div><span class="section-kicker">PROGRESO DE LA SEMANA</span><h3>Panel de avance</h3></div><span class="quest-progress">${done}/5 COMPLETADOS</span></div>
          <div class="arcade-meter"><span style="width:${done*20}%"></span></div>
          <div class="quest-steps">${D.modes.map(m=>`<div class="quest-step ${state.scores[m.id]!==undefined?'done':''}"><div>${state.scores[m.id]!==undefined?'✓':m.day}</div><span>${esc(m.title)}</span></div>`).join('')}</div>
          <div class="next-quest"><span>PRÓXIMO JUEGO DEL DÍA</span><strong>${esc(next.title)}</strong><button type="button" id="nextGame" class="btn btn-blue btn-sm">INICIAR ↗</button></div>
          <div class="party-medal-count">🏅 <strong>${medalCount()}</strong> medallas obtenidas · Juega para subir de nivel</div>
          <div class="party-tip-box"><strong>Temáticas EI:</strong> calidad documental, SST, auditoría, ciberseguridad, logística, matemáticas y generalidades de la empresa.</div>
        </section>
        <section class="arcade-panel leaderboard-panel premium-panel"><div class="arcade-panel-head"><div><span class="section-kicker">SALÓN DE CAMPEONES</span><h3>Podio actual</h3></div><span class="pixel-trophy">🏆</span></div>
          <div id="hubRanking" class="empty-state">Consultando jugadores…</div><button type="button" class="btn btn-outline btn-sm" id="moreRanking">VER CLASIFICACIÓN COMPLETA ↗</button>
          <div class="party-prize-strip"><div><small>PREMIO</small><strong>Ganador por área</strong></div><div><small>FORMATO</small><strong>Semana de olimpiadas</strong></div></div>
        </section>
      </div>
      <div class="arcade-footer-note">DISEÑO PARTY ARCADE PROFESIONAL · CONTENIDO CORPORATIVO ELECTROINGENIERÍA · ESTILO VISUAL RETRO PREMIUM · PARTICIPACIÓN INTERNA NO COMERCIAL</div>
    </div>`;
    $('#heroAction').onclick=()=>{if(!state.player)openRegistration();else $('#modeCards').scrollIntoView({behavior:'smooth',block:'center'})};
    $('#heroRanking').onclick=renderRanking;$('#heroProfile').onclick=()=>state.player?openWardrobe():openRegistration();
    $('#heroProfileMini').onclick=()=>state.player?openWardrobe():openRegistration();
    $('#moreRanking').onclick=renderRanking;$('#arcadeGallery').onclick=showSpriteGallery;
    $('#nextGame').onclick=()=>openGameBriefing(next.id);
    $('#openWeeklyBoard').onclick=renderBoard;
    $$('.mode-card').forEach(b=>b.onclick=()=>openGameBriefing(b.dataset.mode));
    const chars=window.EI_CHARACTERS;
    if(chars){chars.animate($('#mainAvatarCanvas'),avatar);const profileCanvas=$('#profileCanvas');if(!chars.draw(profileCanvas,avatar)){const repaint=()=>{if(profileCanvas.isConnected)chars.draw(profileCanvas,avatar)};window.addEventListener('ei-character-ready',repaint,{once:true})}}
    drawHero();loadHubRanking();
  }
  async function loadHubRanking(){try{const x=state.remote?(await api('rankings')).rankings:rankFromDemo();if(!$('#hubRanking'))return;const first=x.slice(0,3);$('#hubRanking').outerHTML=first.length?`<table class="team-rank-table"><thead><tr><th>#</th><th>Jugador / Área</th><th>PTS</th></tr></thead><tbody>${first.map((r,i)=>`<tr><td>${['🥇','🥈','🥉'][i]}</td><td><b>${esc(r.alias)}</b><br><small class="text-muted">${esc(r.area)}</small></td><td>${r.total.toLocaleString('es-CO')}</td></tr>`).join('')}</tbody></table>`:`<div id="hubRanking" class="empty-state">Todavía no hay puntajes. ¡Puedes ser la primera persona en clasificar!</div>`}catch(_){if($('#hubRanking'))$('#hubRanking').textContent='No se pudo cargar la clasificación.'}}
  // Arte ambiental original para esta aplicación. El logo institucional se conserva intacto.
  function drawHero(){
    const canvas=$('#heroCanvas');if(!canvas)return;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    const bg=new Image();
    bg.onload=()=>{if(!canvas.isConnected)return;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(bg,0,0,canvas.width,canvas.height);};
    bg.onerror=()=>{ctx.fillStyle='#1b426e';ctx.fillRect(0,0,canvas.width,canvas.height)};
    bg.src='assets/pixel/campus-ei.png';
  }
  const spriteAvatarCache={};
  function avatarOnCanvas(canvas,opt=state.avatar){if(!canvas)return; if(window.EI_CHARACTERS?.draw(canvas,opt,'idle'))return;const g=canvas.getContext('2d');canvas.width=24;canvas.height=28;g.imageSmoothingEnabled=false;g.clearRect(0,0,24,28);
    if((opt.style||'retro')==='retro'){
      const path=opt.accessory==='helmet'?'characters/males/male_01/idle/male_01_hat_idle_32x32.png':'characters/males/male_01/idle/male_01_idle_32x32.png';
      const src=spriteUrl(path);
      if(src){let im=spriteAvatarCache[path];if(!im){im=new Image();spriteAvatarCache[path]=im;im.onload=()=>{if(canvas.isConnected)avatarOnCanvas(canvas,opt)};im.src=src;}
        if(im.complete&&im.naturalWidth){g.drawImage(im,0,0,32,32,0,0,24,28);return;}
      }
    }
    const px=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h)};
    const skins=['#fadbb7','#eebf90','#d99a6d','#ac6a45','#70462f'],hairs=['#3e2b39','#cf8d4e','#0f264d','#e8c052'],shirts=['#267cc3','#f7a82c','#f5f7fb','#8e70d1'];const skin=skins[+opt.skin]||skins[1],hair=hairs[+opt.hairColor]||hairs[0],shirt=shirts[+opt.shirt]||shirts[0];
    px(8,24,3,3,'#0b1d3b');px(13,24,3,3,'#0b1d3b');px(8,20,4,5,'#213954');px(12,20,4,5,'#283d5b');px(6,14,12,9,shirt);px(5,15,2,7,skin);px(17,15,2,7,skin);px(8,13,8,3,skin);px(5,6,14,9,'#17243b');px(6,6,12,8,skin);px(7,4,10,4,hair);
    if(opt.hair==='0'){px(5,4,14,3,hair);px(5,5,3,6,hair)}else if(opt.hair==='1'){px(6,3,12,5,hair);px(10,2,7,3,hair);px(5,5,2,6,hair)}else if(opt.hair==='2'){px(5,3,14,6,hair);px(5,6,2,11,hair);px(17,6,2,11,hair)}else{px(5,4,13,4,hair);px(12,2,6,5,hair)}
    px(8,10,2,2,'#122641');px(14,10,2,2,'#122641');px(11,13,3,1,'#b35d54');
    if(opt.accessory==='helmet'){px(5,2,14,4,'#e5edf1');px(7,1,10,3,'#ffffff');px(4,5,16,2,'#9eb3c4');px(11,2,2,2,'#f4ca48')}
    if(opt.accessory==='glasses'){px(7,9,5,4,'#28384e');px(13,9,5,4,'#28384e');px(8,10,3,2,'#c7eaff');px(14,10,3,2,'#c7eaff');px(12,10,1,1,'#172338')}
    if(opt.accessory==='headphones'){px(5,6,2,7,'#94e6ff');px(17,6,2,7,'#94e6ff');px(6,3,12,2,'#94e6ff')}
    if(opt.accessory==='vest'){px(6,15,3,6,'#ffba39');px(15,15,3,6,'#ffba39');px(10,16,4,2,'#d7faff')}
    px(11,18,2,2,'#ffdb67')
  }
  function renderCharacterSelect(editing=false){
    if(window.EI_GAMES)window.EI_GAMES.cleanup();
    const C=window.EI_CHARACTERS,roles=C.presets;
    const current={...state.avatar,...(state.player?.avatar||{})};
    if(!roles.some(p=>p.id===current.preset))current.preset=roles[0].id;
    if(current.skin===undefined)current.skin=0;
    const picked=()=>roles.find(r=>r.id===current.preset)||roles[0];
    $('#view').innerHTML=`<section class="character-view">
      <nav class="game-breadcrumb"><button type="button" id="characterBack">← VOLVER AL CAMPAMENTO</button><span>/</span><span>${editing?'MI PERSONAJE':'NUEVO PARTICIPANTE'}</span></nav>
      <div class="character-title"><div><span class="section-kicker">✦ SELECCIÓN DE PARTICIPANTES</span><h1>${editing?'Personaliza tu rol':'Elige tu rol'}</h1><p>Seis roles corporativos inspirados en la estructura de la empresa, con animaciones pixel art y vestuario diferenciado.</p></div><div class="character-counter">06 <span>ROLES</span></div></div>
      <div class="character-content">
        <div class="character-roster" id="characterRoster" role="group" aria-label="Selecciona un personaje">${roles.map((r,i)=>`<button type="button" class="character-choice ${r.id===current.preset?'selected':''}" data-character="${r.id}" style="--role:${r.color}" aria-pressed="${r.id===current.preset}">
           <span class="character-choice-art"><canvas width="75" height="75" data-preview="${r.id}" aria-hidden="true"></canvas></span><span class="character-choice-info"><strong>${esc(r.name)}</strong><small>${esc(r.role)}</small></span><span class="choice-check">✓</span>
         </button>`).join('')}</div>
        <div class="character-preview-panel"><div class="scene-label"><span>● PERSONAJE SELECCIONADO</span><span id="roleCode">01 / 06</span></div>
          <div class="character-landscape"><span class="landscape-sun"></span><span class="landscape-hill"></span><span class="character-floor"></span><canvas id="rosterHero" width="160" height="160" aria-label="Previsualización animada del personaje seleccionado"></canvas></div>
          <div class="character-caption"><h2 id="roleName"></h2><p id="roleDesc"></p><span class="character-description">SPRITE ORIGINAL + ROL CORPORATIVO PERSONALIZADO</span></div>
          <div class="skin-selector"><span>TONO DEL PERSONAJE</span><div id="skinButtons">${C.palettes.map((x,i)=>`<button type="button" class="skin-swatch ${Number(current.skin)===i?'active':''}" data-skin="${i}" aria-label="Tono ${i+1}" aria-pressed="${Number(current.skin)===i}" style="--skin:${x.skin}"></button>`).join('')}</div></div>
          <label class="hat-toggle"><input type="checkbox" id="characterHat"> Usar casco / sombrero de trabajo</label>
        </div>
        <form class="character-register" id="characterForm"><span class="section-kicker">${editing?'EDITAR PARTICIPANTE':'CREAR PARTICIPANTE'}</span><h2>${editing?'Guardar apariencia':'Completa tu registro'}</h2>
          ${editing?`<div class="registered-name"><small>JUGADOR</small><strong>${esc(state.player.alias)}</strong><span>${esc(state.player.area)}</span></div>`:`<div class="field"><label for="regName">Nombre completo</label><input id="regName" maxlength="80" minlength="4" required placeholder="Nombre y apellido" autocomplete="name"></div>
           <div class="field"><label for="regAlias">Alias de jugador</label><input id="regAlias" maxlength="24" minlength="3" required placeholder="Ej. PixelJuan" autocomplete="nickname"></div>
           <div class="field"><label for="regArea">Área de trabajo</label><select id="regArea" required><option value="">Selecciona el área</option>${D.areas.map(a=>`<option value="${esc(a)}">${esc(a)}</option>`).join('')}</select></div>`}
          <div class="register-reminder"><span>✦</span><p>${editing?'Los cambios de vestuario no modifican tu puntuación.':'Tu personaje participará en los cinco retos y aparecerá en tu perfil.'}</p></div>
          <p class="modal-helper">Los seis roles se construyen sobre el sprite base disponible en SuperRetroRanch Free Tier; el videojuego aplica los uniformes, colores y variaciones en tiempo real.</p>
          <div class="modal-error" id="characterError" role="alert"></div>
          <button class="btn btn-primary character-submit" id="characterSubmit" type="submit">${editing?'✓ GUARDAR PERSONAJE':'▶ COMENZAR AVENTURA'}</button>
        </form>
      </div></section>`;
    let stopAnimation=()=>{};
    const preview=$('#rosterHero');
    const rerenderPortraits=()=>{if(!$('#characterRoster'))return;$$('[data-preview]').forEach(canvas=>C.draw(canvas,{...current,preset:canvas.dataset.preview,hat:roles.find(x=>x.id===canvas.dataset.preview).hat},'idle'))};
    window.addEventListener('ei-character-ready',rerenderPortraits);
    const cleanupSelect=()=>{stopAnimation();window.removeEventListener('ei-character-ready',rerenderPortraits)};
    const update=()=>{
      const p=picked(),pIndex=roles.indexOf(p);
      $$('.character-choice').forEach(b=>{const selected=b.dataset.character===p.id;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))});
      $$('.skin-swatch').forEach(b=>{const selected=Number(b.dataset.skin)===Number(current.skin);b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected))});
      $('#roleName').textContent=p.name;$('#roleDesc').textContent=p.desc;
      $('#roleCode').textContent=String(pIndex+1).padStart(2,'0')+' / 06';
      $('#characterHat').checked=current.hat!==undefined?Boolean(current.hat):p.hat;
      stopAnimation();stopAnimation=C.animate(preview,current);
      rerenderPortraits();
    };
    $$('.character-choice').forEach(b=>b.onclick=()=>{const p=roles.find(x=>x.id===b.dataset.character);current.preset=p.id;current.hat=p.hat;update();sound()});
    $$('.skin-swatch').forEach(b=>b.onclick=()=>{current.skin=Number(b.dataset.skin);update();sound()});
    $('#characterHat').onchange=e=>{current.hat=e.target.checked;update()};
    $('#characterBack').onclick=()=>{cleanupSelect();renderHub()};
    $('#characterForm').onsubmit=async e=>{
      e.preventDefault();const save=$('#characterSubmit');save.disabled=true;save.textContent='GUARDANDO…';
      const avatar={skin:current.skin,hair:current.hair||0,hairColor:current.hairColor||0,shirt:current.shirt||0,accessory:current.hat?'helmet':'none',style:'retro',preset:current.preset,hat:current.hat};
      try{
        if(editing){
          if(state.remote){const result=await api('avatar',{id:state.player.id,access_key:credentials().access_key,avatar});state.player=result.player}
          else{const data=demoData(),player=data.players.find(x=>x.id===state.player.id);if(player){player.avatar=avatar;saveDemo(data)}state.player.avatar=avatar}
          state.avatar={...avatar};cleanupSelect();renderHeader();renderHub();toast('Personaje actualizado');
        } else {
          const name=$('#regName').value.trim(),alias=$('#regAlias').value.trim(),area=$('#regArea').value;
          if(name.length<4||alias.length<3||!D.areas.includes(area))throw Error('Completa tu nombre, alias y área.');
          const result=await register({name,alias,area,avatar});state.avatar={...avatar};cleanupSelect();renderHeader();renderHub();sound('win');
          if(state.remote&&result.access_key)showCredential(result.access_key,result.player.id);
        }
      }catch(err){$('#characterError').textContent=err.message;save.disabled=false;save.textContent=editing?'✓ GUARDAR PERSONAJE':'▶ COMENZAR AVENTURA';}
    };
    update();window.scrollTo({top:0,behavior:'smooth'});
  }
  function openRegistration(){renderCharacterSelect(false)}
  function openWardrobe(){if(state.player)renderCharacterSelect(true)}
  function openRecovery(){
    $('#modalRoot').innerHTML=`<div class="modal-backdrop"><div class="modal" style="max-width:540px" role="dialog" aria-modal="true"><div class="modal-header"><h2>↩ Recuperar personaje</h2><button id="closeRecovery" class="close-modal">×</button></div><div class="modal-body"><p class="modal-helper">Introduce el identificador y la clave que guardaste al registrarte.</p><form id="recoveryForm"><div class="field"><label for="recoverId">Identificador de jugador</label><input id="recoverId" required placeholder="ID de jugador"></div><div class="field"><label for="recoverKey">Clave de recuperación</label><input id="recoverKey" required placeholder="Tu clave privada" type="password"></div><div id="recoveryError" class="modal-error"></div><div class="reg-bottom"><button type="button" id="backRecovery" class="btn btn-outline">Volver</button><button type="submit" class="btn btn-primary">RECUPERAR</button></div></form></div></div></div>`;
    $('#closeRecovery').onclick=()=>$('#modalRoot').innerHTML='';$('#backRecovery').onclick=openRegistration;
    $('#recoveryForm').onsubmit=async e=>{e.preventDefault();const cred={id:$('#recoverId').value.trim(),access_key:$('#recoverKey').value.trim()};try{const x=await api('resume',cred);state.player=x.player;state.avatar={...state.avatar,...(x.player.avatar||{})};state.scores=x.scores||{};localStorage.setItem(credsKey,JSON.stringify(cred));$('#modalRoot').innerHTML='';renderHeader();renderHub();toast('Bienvenido de nuevo, '+x.player.alias)}catch(err){$('#recoveryError').textContent=err.message}};
  }
  async function register(p){if(state.remote){const x=await api('register',p);state.player=x.player;state.avatar={...state.avatar,...(x.player.avatar||{})};state.scores=x.scores||{};localStorage.setItem(credsKey,JSON.stringify({id:x.player.id,access_key:x.access_key}));return x}
    const d=demoData();const id='demo-'+Date.now().toString(36);const u={...p,id,scores:{}};d.players.push(u);d.current=id;saveDemo(d);state.player=u;state.scores={};return {player:u}}
  function showCredential(secret,id){$('#modalRoot').innerHTML=`<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" style="max-width:560px"><div class="modal-header"><h2>✓ ¡Tu avatar está listo!</h2></div><div class="modal-body"><p>Guarda esta clave privada. Permite recuperar tu perfil si cambias de navegador.</p><div style="padding:16px;background:#061a3d;border:1px dashed #70a3df;border-radius:8px;word-break:break-all;font-family:monospace;font-size:15px"><strong>${esc(id)}</strong><br>${esc(secret)}</div><p class="modal-helper">No compartas esta clave: permite acceder a tus resultados.</p><div class="reg-bottom"><button id="copyCred" class="btn btn-blue">Copiar datos</button><button id="okCred" class="btn btn-primary">¡A jugar!</button></div></div></div></div>`;$('#copyCred').onclick=()=>{navigator.clipboard?.writeText('ID: '+id+'\nClave: '+secret);toast('Datos copiados')};$('#okCred').onclick=()=>$('#modalRoot').innerHTML=''}
  function gameScaffold(mode){
    const m=D.modes.find(x=>x.id===mode),b=briefs[mode];
    $('#view').innerHTML=`<section class="game-shell party-arena" style="--arena:${m.color}">
      <nav class="game-breadcrumb"><button id="gameBack">← TABLERO</button><span>/</span><span>DÍA ${m.day} · ${esc(m.title)}</span></nav>
      <div class="arena-status"><span class="arena-label">★ MINIJUEGO ${m.day}/5</span><span class="arena-mode">${esc(b.tag)}</span><button type="button" class="arena-exit" id="gameQuit">SALIR ✕</button></div>
      <header class="game-header arena-head"><div><div class="section-kicker">${m.icon} DESAFÍO DEL DÍA</div><h1>${esc(m.title)}</h1><p>${esc(m.description)}</p></div>
        <div class="game-header-meta"><div class="stat-box"><span class="stat-label">⏱ TIEMPO</span><span id="gameTime" class="stat-value">--:--</span></div><div class="stat-box"><span class="stat-label">⭐ PUNTOS</span><span id="gamePoints" class="stat-value">0</span></div></div></header>
      <div class="arena-time-track"><span id="arenaTimeMeter" style="width:100%"></span></div>
      <section class="game-main party-game-main"><div id="game-content"></div></section>
      <div class="arena-foot"><span>★ OLIMPIADAS EI PIXEL PARTY</span><span>HASTA 1.000 PUNTOS · ${esc(m.title)}</span></div>
    </section>`;
    const leave=()=>{if(confirm('¿Salir del desafío? Perderás el progreso de esta ronda.')){window.EI_GAMES?.cleanup();state.run=null;renderBoard()}};
    $('#gameBack').onclick=leave;$('#gameQuit').onclick=leave;
    window.scrollTo({top:0,behavior:'smooth'});
  }
  async function startMode(mode){const meta=D.modes.find(m=>m.id===mode);if(!meta||!unlocked(meta)){toast('Este desafío aún no está disponible');return}if(!state.player){openRegistration();return}if(state.busy)return;const played=state.scores[mode]!==undefined;
    if(played&&state.remote&&!confirm('Ya completaste este reto oficialmente. ¿Deseas jugar de nuevo en PRÁCTICA? No cambiará tu puntaje.'))return;
    state.busy=true;let token=null,practice=played&&state.remote;
    try{if(state.remote&&!practice){const r=await api('start',{id:state.player.id,mode,access_key:credentials().access_key});token=r.token}}catch(err){state.busy=false;toast(err.message);return}
    state.busy=false;state.run={mode,started:Date.now(),token,practice};gameScaffold(mode);window.EI_GAMES.start(mode);sound();
  }
  async function finish(mode,score,details){if(!state.run||state.run.mode!==mode)return;const run=state.run;state.run=null;if(window.EI_GAMES)window.EI_GAMES.cleanup();let saved=true,practice=run.practice;
    const points=Math.max(0,Math.min(1000,Math.round(score)));
    if(!practice){if(state.remote){try{const x=await api('finish',{id:state.player.id,mode,token:run.token,score:points,duration:Math.ceil((Date.now()-run.started)/1000),access_key:credentials().access_key});state.scores=x.scores||state.scores}catch(err){saved=false;toast('Sin guardar: '+err.message)}}else{const d=demoData();const p=d.players.find(x=>x.id===state.player.id);if(p){p.scores[mode]=Math.max(p.scores[mode]||0,points);state.scores={...p.scores};saveDemo(d)}}}
    const m=D.modes.find(x=>x.id===mode), medal=medalFor(points);sound('win');
    $('#view').innerHTML=`<section class="party-results"><div class="results-confetti">✦ ★ ✦ ★ ✦</div><div class="result-stage"><div class="section-kicker">MISIÓN COMPLETADA · DÍA ${m.day}</div><h1>${esc(m.title)}</h1>
      <div class="result-coin ${medal.color}"><span>${medal.icon}</span><strong>${medal.name}</strong></div>
      <p class="result-label">PUNTAJE OBTENIDO</p><strong class="result-score">${points.toLocaleString('es-CO')} <small>/ 1.000 PT</small></strong>
      <p class="result-detail">${esc(details||'¡Has terminado la misión!')}</p>
      <div class="result-status">${practice?'MODO PRÁCTICA · Este puntaje no cambia tu ranking.':saved?'✓ Puntaje registrado correctamente.':'⚠ Hubo un problema y el puntaje no se guardó.'}</div>
      <div class="result-medal-scale"><div class="${points>=400?'won':''}">🥉<small>400+</small></div><div class="${points>=650?'won':''}">🥈<small>650+</small></div><div class="${points>=850?'won':''}">🥇<small>850+</small></div></div>
      <div class="result-actions"><button class="btn btn-primary" id="resultBoard">🗺 VOLVER AL TABLERO</button><button class="btn btn-blue" id="resultRetry">↻ VOLVER A JUGAR</button><button class="btn btn-outline" id="resultRanking">🏆 CLASIFICACIÓN</button></div>
      </div></section>`;
    $('#resultBoard').onclick=renderBoard;$('#resultRetry').onclick=()=>openGameBriefing(mode);$('#resultRanking').onclick=renderRanking;renderHeader();window.scrollTo({top:0,behavior:'smooth'})}
  async function renderRanking(){if(window.EI_GAMES)window.EI_GAMES.cleanup();state.run=null;$('#view').innerHTML=`<div class="ranking-page"><div class="section-kicker">${state.remote?'MARCADOR COMPARTIDO':'MODO DEMO LOCAL'}</div><h1>🏆 Clasificación de las Olimpiadas</h1><p class="text-muted">Los puntos corresponden a los cinco retos. ${state.remote?'Resultados compartidos entre participantes.':'Estos resultados solo existen en este navegador; no sirven para entregar premios oficiales.'}</p><div id="rankBody" class="panel">Cargando clasificación…</div><div style="margin:23px 0"><button id="rankBack" class="btn btn-outline">← Volver a la aventura</button></div></div>`;$('#rankBack').onclick=renderTitleScreen;
    try{state.ranking=state.remote?(await api('rankings')).rankings:rankFromDemo();renderRankContent()}catch(err){$('#rankBody').textContent='No se pudo cargar: '+err.message}
  }
  function renderRankContent(){const r=state.ranking||[],areas=['Todos',...new Set(r.map(x=>x.area))].sort((a,b)=>a==='Todos'?-1:b==='Todos'?1:a.localeCompare(b));if(!areas.includes(state.areaFilter))state.areaFilter='Todos';const filtered=state.areaFilter==='Todos'?r:r.filter(x=>x.area===state.areaFilter);
    const leaders=Object.values(r.reduce((a,p)=>{if(!a[p.area]||p.total>a[p.area].total)a[p.area]=p;return a},{})).sort((a,b)=>b.total-a.total);
    $('#rankBody').innerHTML=`<div class="section-kicker">FILTRAR POR ÁREA</div><div class="area-options">${areas.map(a=>`<button class="area-btn ${a===state.areaFilter?'active':''}" data-area="${esc(a)}">${esc(a)}</button>`).join('')}</div>
    <div class="ranking-grid"><div><h3>Tabla de participantes</h3>${filtered.length?`<table class="score-table"><thead><tr><th>#</th><th>Jugador</th><th>Retos</th><th>Puntos</th></tr></thead><tbody>${filtered.map((x,i)=>`<tr><td>${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</td><td><b>${esc(x.alias)}</b><br><small class="text-muted">${esc(x.area)}</small></td><td>${x.completed}/5</td><td>${x.total.toLocaleString('es-CO')}</td></tr>`).join('')}</tbody></table>`:'<div class="empty-state">Aún no hay resultados para esta área.</div>'}</div>
    <div><h3>Primer lugar por área</h3>${leaders.length?leaders.map(l=>`<div class="rank-winner"><span>🏅 <b>${esc(l.area)}</b><br><small>${esc(l.alias)}</small></span><strong>${l.total.toLocaleString('es-CO')} PT</strong></div>`).join(''):'<div class="empty-state">El podio está esperando a sus primeros jugadores.</div>'}<p class="modal-helper">Las clasificaciones se actualizan al finalizar cada prueba. Los premios deben validarse por la organización.</p></div></div>`;
    $$('.area-btn').forEach(b=>b.onclick=()=>{state.areaFilter=b.dataset.area;renderRankContent()})
  }
  $('#homeBtn').onclick=renderTitleScreen;$('#rankingBtn').onclick=renderRanking;$('#soundBtn').onclick=()=>{state.sound=!state.sound;$('#soundBtn').textContent=state.sound?'♫ ON':'♫ OFF';sound('tap');toast(state.sound?'Sonidos activados':'Sonidos desactivados')};$('#soundBtn').textContent='♫ OFF';
  window.EI={state,D,$,$$,esc,shuffle,toast,sound,gameScaffold,finish,renderHub,renderTitleScreen,renderBoard,openGameBriefing,startMode,avatarOnCanvas};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize);else initialize();
})();
