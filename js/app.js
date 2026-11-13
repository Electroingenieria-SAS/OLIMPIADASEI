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
    renderHeader();renderHub();
  }
  function renderHeader(){const e=$('#userChip');if(!state.player){e.hidden=true;e.innerHTML='';return}e.hidden=false;e.innerHTML=`<canvas id="userAvatar" class="mini-head" width="24" height="28"></canvas><span>${esc(state.player.alias)}<small>${esc(state.player.area)}</small></span>`;avatarOnCanvas($('#userAvatar'),state.player.avatar||state.avatar)}
  function total(){return Object.values(state.scores).reduce((a,b)=>a+Number(b||0),0)}
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
    const selected=window.EI_CHARACTERS?.normalize(avatar).role||{name:'Explorador',role:'Operaciones',color:'#35c7bb'};
    $('#view').innerHTML=`<div class="arcade-lobby hub">
      <div class="game-path"><span class="path-dot"></span> CAMPAMENTO EI <span class="path-arrow">/</span> TEMPORADA 2026 <span class="path-arrow">/</span> CINCO DESAFÍOS</div>
      <section class="arcade-hero">
        <div class="arcade-hero-copy">
          <div class="arcade-eyebrow"><span class="online-star">✦</span> LA AVENTURA DEL CONOCIMIENTO</div>
          <h1>OLIMPIADAS <strong>EI <span>PIXEL</span></strong></h1>
          <p>Un mundo de desafíos hecho para Electroingeniería. Demuestra tu rapidez, descubre pistas y escala hasta lo más alto del podio.</p>
          <div class="arcade-actions">
            <button type="button" class="btn btn-primary arcade-primary" id="heroAction">${state.player?'▶ SEGUIR JUGANDO':'▶ CREAR MI PERSONAJE'}</button>
            <button type="button" class="btn btn-outline" id="heroRanking">🏆 CLASIFICACIÓN</button>
          </div>
          <div class="arcade-hero-meta"><span>★ 5 MUNDOS</span><span>◷ TIEMPO LÍMITE</span><span>◆ PREMIOS POR ÁREA</span></div>
        </div>
        <div class="arcade-hero-world">
          <canvas id="heroCanvas" width="400" height="260" aria-label="Escenario pixel art del campus EI"></canvas>
          <div class="world-hud"><span>⚔ MODO AVENTURA</span><span>● 01</span></div>
          <div class="stage-avatar"><canvas id="mainAvatarCanvas" width="112" height="112" aria-label="Personaje elegido"></canvas><div class="avatar-nameplate">${esc(state.player?.alias||selected.name)}<small>${esc(selected.role)}</small></div></div>
        </div>
      </section>
      <div class="arcade-overview">
        <button class="arcade-profile" id="heroProfile" type="button" aria-label="Elegir o modificar personaje">
          <span class="profile-pixel"><canvas id="profileCanvas" width="60" height="60"></canvas></span>
          <span class="profile-copy"><small>TU PERSONAJE</small><strong>${esc(state.player?.alias||'Elige a tu héroe')}</strong><span>${state.player?'Cambiar vestuario y personaje':'Seis personajes para elegir'}</span></span><span class="profile-arrow">›</span>
        </button>
        <div class="arcade-stat"><span class="stat-emoji">✦</span><span><small>MI PUNTAJE</small><strong>${total().toLocaleString('es-CO')} <em>PT</em></strong></span></div>
        <div class="arcade-stat"><span class="stat-emoji">◈</span><span><small>RETOS SUPERADOS</small><strong>${done} <em>/ 5</em></strong></span></div>
        <button class="arcade-mini-action" type="button" id="arcadeGallery"><span>▦</span><span>VER RECURSOS PIXEL<small>Biblioteca de sprites</small></span></button>
      </div>
      <div class="arcade-section-title" id="modeSection"><div><span class="section-kicker">◈ EL MAPA DE LA COMPETENCIA</span><h2>Selecciona tu siguiente nivel</h2></div><span class="arcade-caption">5 MUNDOS · 1.000 PUNTOS POR NIVEL</span></div>
      <section class="modes arcade-modes" id="modeCards" aria-label="Cinco mundos del videojuego">${D.modes.map(m=>{
        const completed=state.scores[m.id]!==undefined,locked=!unlocked(m);
        return `<button class="mode-card arcade-mode ${locked?'locked':''}" style="--accent:${m.color}" data-mode="${m.id}" ${locked?'disabled':''}>
          <div class="mode-scene"><img class="mode-illustration" src="assets/pixel/mode-${m.id}.png" alt="Escenario de ${esc(m.title)}" loading="lazy"><span class="mode-illustration-mark">${m.icon}</span><span class="arcade-level">NIVEL ${String(m.day).padStart(2,'0')}</span></div>
          <div class="mode-body"><h3>${esc(m.title)}</h3><span class="mode-desc">${esc(m.subtitle)}</span><div class="mode-bottom"><span>${locked?'🔒 Bloqueado':completed?'✓ Completado':'▶ JUGAR'}</span><strong>${completed?Number(state.scores[m.id]).toLocaleString('es-CO')+' PT':'1.000 PT'}</strong></div></div>
        </button>`}).join('')}</section>
      <div class="arcade-lower">
        <section class="arcade-panel quest-panel"><div class="arcade-panel-head"><div><span class="section-kicker">REGISTRO DE AVENTURAS</span><h3>Tu progreso de la semana</h3></div><span class="quest-progress">${done}/5 COMPLETADOS</span></div>
          <div class="arcade-meter"><span style="width:${done*20}%"></span></div>
          <div class="quest-steps">${D.modes.map(m=>`<div class="quest-step ${state.scores[m.id]!==undefined?'done':''}"><div>${state.scores[m.id]!==undefined?'✓':m.day}</div><span>${esc(m.title)}</span></div>`).join('')}</div>
          <div class="next-quest"><span>PRÓXIMA MISIÓN</span><strong>${esc(next.title)}</strong><button type="button" id="nextGame" class="btn btn-blue btn-sm">IR AL RETO ↗</button></div>
        </section>
        <section class="arcade-panel leaderboard-panel"><div class="arcade-panel-head"><div><span class="section-kicker">SALÓN DE LA FAMA</span><h3>Tabla de campeones</h3></div><span class="pixel-trophy">🏆</span></div>
          <div id="hubRanking" class="empty-state">Consultando jugadores…</div><button type="button" class="btn btn-outline btn-sm" id="moreRanking">VER CLASIFICACIÓN COMPLETA ↗</button>
        </section>
      </div>
      <div class="arcade-footer-note">ARTE PIXEL: SUPERRETRO RANCH FREE TIER, GIF · SEIS VARIANTES DE VESTUARIO GENERADAS A PARTIR DEL PERSONAJE ORIGINAL · PARTICIPACIÓN INTERNA NO COMERCIAL</div>
    </div>`;
    $('#heroAction').onclick=()=>{if(!state.player)openRegistration();else $('#modeCards').scrollIntoView({behavior:'smooth',block:'center'})};
    $('#heroRanking').onclick=renderRanking;$('#heroProfile').onclick=()=>state.player?openWardrobe():openRegistration();
    $('#moreRanking').onclick=renderRanking;$('#arcadeGallery').onclick=showSpriteGallery;
    $('#nextGame').onclick=()=>startMode(next.id);
    $$('.mode-card').forEach(b=>b.onclick=()=>startMode(b.dataset.mode));
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
      <div class="character-title"><div><span class="section-kicker">✦ SALA DE PERSONAJES</span><h1>${editing?'Personaliza tu héroe':'Elige tu personaje'}</h1><p>Seis estilos con paletas de uniforme, accesorios y animaciones reales del paquete pixel art.</p></div><div class="character-counter">06 <span>AVATARES</span></div></div>
      <div class="character-content">
        <div class="character-roster" id="characterRoster" role="group" aria-label="Selecciona un personaje">${roles.map((r,i)=>`<button type="button" class="character-choice ${r.id===current.preset?'selected':''}" data-character="${r.id}" style="--role:${r.color}" aria-pressed="${r.id===current.preset}">
           <span class="character-choice-art"><canvas width="75" height="75" data-preview="${r.id}" aria-hidden="true"></canvas></span><span class="character-choice-info"><strong>${esc(r.name)}</strong><small>${esc(r.role)}</small></span><span class="choice-check">✓</span>
         </button>`).join('')}</div>
        <div class="character-preview-panel"><div class="scene-label"><span>● PERSONAJE SELECCIONADO</span><span id="roleCode">01 / 06</span></div>
          <div class="character-landscape"><span class="landscape-sun"></span><span class="landscape-hill"></span><span class="character-floor"></span><canvas id="rosterHero" width="160" height="160" aria-label="Previsualización animada del personaje seleccionado"></canvas></div>
          <div class="character-caption"><h2 id="roleName"></h2><p id="roleDesc"></p><span class="character-description">PERSONAJE PIXEL ORIGINAL + VARIANTE DE VESTUARIO</span></div>
          <div class="skin-selector"><span>TONO DEL PERSONAJE</span><div id="skinButtons">${C.palettes.map((x,i)=>`<button type="button" class="skin-swatch ${Number(current.skin)===i?'active':''}" data-skin="${i}" aria-label="Tono ${i+1}" aria-pressed="${Number(current.skin)===i}" style="--skin:${x.skin}"></button>`).join('')}</div></div>
          <label class="hat-toggle"><input type="checkbox" id="characterHat"> Usar sombrero retro</label>
        </div>
        <form class="character-register" id="characterForm"><span class="section-kicker">${editing?'EDITAR VESTUARIO':'CREAR PARTICIPANTE'}</span><h2>${editing?'Guardar apariencia':'Completa tu registro'}</h2>
          ${editing?`<div class="registered-name"><small>JUGADOR</small><strong>${esc(state.player.alias)}</strong><span>${esc(state.player.area)}</span></div>`:`<div class="field"><label for="regName">Nombre completo</label><input id="regName" maxlength="80" minlength="4" required placeholder="Nombre y apellido" autocomplete="name"></div>
           <div class="field"><label for="regAlias">Alias de jugador</label><input id="regAlias" maxlength="24" minlength="3" required placeholder="Ej. PixelJuan" autocomplete="nickname"></div>
           <div class="field"><label for="regArea">Área de trabajo</label><select id="regArea" required><option value="">Selecciona el área</option>${D.areas.map(a=>`<option value="${esc(a)}">${esc(a)}</option>`).join('')}</select></div>`}
          <div class="register-reminder"><span>✦</span><p>${editing?'Los cambios de vestuario no modifican tu puntuación.':'Tu personaje participará en los cinco retos y aparecerá en tu perfil.'}</p></div>
          <p class="modal-helper">Los seis estilos usan el personaje disponible en SuperRetroRanch Free Tier; las variaciones de colores y sombrero se aplican dentro del videojuego.</p>
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
  function gameScaffold(mode){const m=D.modes.find(x=>x.id===mode);$('#view').innerHTML=`<div class="game-shell"><nav class="game-breadcrumb"><button id="gameBack">← Inicio</button><span>/</span><span>Día ${m.day}: ${esc(m.title)}</span></nav><section class="game-header"><div><div class="section-kicker">DESAFÍO ${m.day} DE 5</div><h1><img src="assets/pixel/mode-${m.id}.png" class="game-header-thumb" alt="" aria-hidden="true">${esc(m.title)}</h1><p>${esc(m.subtitle)} · ${esc(m.description)}</p></div><div class="game-header-meta"><div class="stat-box"><span class="stat-label">Tiempo</span><span id="gameTime" class="stat-value">--:--</span></div><div class="stat-box"><span class="stat-label">Puntos</span><span id="gamePoints" class="stat-value">0</span></div></div></section><section class="game-main"><div id="game-content"></div></section></div>`;$('#gameBack').onclick=()=>{if(confirm('¿Salir del desafío? Se perderá el progreso de esta ronda.'))renderHub()};window.scrollTo({top:0,behavior:'smooth'})}
  async function startMode(mode){const meta=D.modes.find(m=>m.id===mode);if(!meta||!unlocked(meta)){toast('Este desafío aún no está disponible');return}if(!state.player){openRegistration();return}if(state.busy)return;const played=state.scores[mode]!==undefined;
    if(played&&state.remote&&!confirm('Ya completaste este reto oficialmente. ¿Deseas jugar de nuevo en PRÁCTICA? No cambiará tu puntaje.'))return;
    state.busy=true;let token=null,practice=played&&state.remote;
    try{if(state.remote&&!practice){const r=await api('start',{id:state.player.id,mode,access_key:credentials().access_key});token=r.token}}catch(err){state.busy=false;toast(err.message);return}
    state.busy=false;state.run={mode,started:Date.now(),token,practice};gameScaffold(mode);window.EI_GAMES.start(mode);sound();
  }
  async function finish(mode,score,details){if(!state.run||state.run.mode!==mode)return;const run=state.run;state.run=null;if(window.EI_GAMES)window.EI_GAMES.cleanup();let saved=true,practice=run.practice;
    const points=Math.max(0,Math.min(1000,Math.round(score)));
    if(!practice){if(state.remote){try{const x=await api('finish',{id:state.player.id,mode,token:run.token,score:points,duration:Math.ceil((Date.now()-run.started)/1000),access_key:credentials().access_key});state.scores=x.scores||state.scores}catch(err){saved=false;toast('Sin guardar: '+err.message)}}else{const d=demoData();const p=d.players.find(x=>x.id===state.player.id);if(p){p.scores[mode]=Math.max(p.scores[mode]||0,points);state.scores={...p.scores};saveDemo(d)}}}
    const m=D.modes.find(x=>x.id===mode);sound('win');$('#view').innerHTML=`<div class="game-shell"><div class="game-main"><div class="results"><div class="result-medal">${points>=850?'🏆':points>=550?'🥇':'⭐'}</div><div class="section-kicker" style="justify-content:center">DESAFÍO COMPLETADO</div><h1>${esc(m.title)}</h1><div class="big-score">${points.toLocaleString('es-CO')}</div><div style="color:#f5d46d;font-weight:900">DE 1.000 PUNTOS</div><p>${esc(details||'¡Has terminado la misión!')}</p>${practice?'<p class="pill gold">MODO PRÁCTICA · Esta puntuación no modifica tu ranking.</p>':saved?'<p class="pill green">✓ Puntaje registrado en tu clasificación</p>':'<p class="pill gold">⚠ Puntaje no registrado: hubo un problema de conexión.</p>'}<div class="result-actions"><button class="btn btn-primary" id="resultHome">← Volver al mapa</button><button class="btn btn-blue" id="resultRanking">🏆 Ver clasificación</button></div></div></div></div>`;$('#resultHome').onclick=renderHub;$('#resultRanking').onclick=renderRanking;renderHeader();window.scrollTo({top:0,behavior:'smooth'})}
  async function renderRanking(){if(window.EI_GAMES)window.EI_GAMES.cleanup();state.run=null;$('#view').innerHTML='<div class="ranking-page"><div class="section-kicker">MARCADOR EN VIVO</div><h1>🏆 Clasificación de las Olimpiadas</h1><p class="text-muted">Los puntajes corresponden a los cinco retos; gana el mayor acumulado dentro de cada área.</p><div id="rankBody" class="panel">Cargando clasificación…</div><div style="margin:23px 0"><button id="rankBack" class="btn btn-outline">← Volver a la aventura</button></div></div>';$('#rankBack').onclick=renderHub;
    try{state.ranking=state.remote?(await api('rankings')).rankings:rankFromDemo();renderRankContent()}catch(err){$('#rankBody').textContent='No se pudo cargar: '+err.message}
  }
  function renderRankContent(){const r=state.ranking||[],areas=['Todos',...new Set(r.map(x=>x.area))].sort((a,b)=>a==='Todos'?-1:b==='Todos'?1:a.localeCompare(b));if(!areas.includes(state.areaFilter))state.areaFilter='Todos';const filtered=state.areaFilter==='Todos'?r:r.filter(x=>x.area===state.areaFilter);
    const leaders=Object.values(r.reduce((a,p)=>{if(!a[p.area]||p.total>a[p.area].total)a[p.area]=p;return a},{})).sort((a,b)=>b.total-a.total);
    $('#rankBody').innerHTML=`<div class="section-kicker">FILTRAR POR ÁREA</div><div class="area-options">${areas.map(a=>`<button class="area-btn ${a===state.areaFilter?'active':''}" data-area="${esc(a)}">${esc(a)}</button>`).join('')}</div>
    <div class="ranking-grid"><div><h3>Tabla de participantes</h3>${filtered.length?`<table class="score-table"><thead><tr><th>#</th><th>Jugador</th><th>Retos</th><th>Puntos</th></tr></thead><tbody>${filtered.map((x,i)=>`<tr><td>${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</td><td><b>${esc(x.alias)}</b><br><small class="text-muted">${esc(x.area)}</small></td><td>${x.completed}/5</td><td>${x.total.toLocaleString('es-CO')}</td></tr>`).join('')}</tbody></table>`:'<div class="empty-state">Aún no hay resultados para esta área.</div>'}</div>
    <div><h3>Primer lugar por área</h3>${leaders.length?leaders.map(l=>`<div class="rank-winner"><span>🏅 <b>${esc(l.area)}</b><br><small>${esc(l.alias)}</small></span><strong>${l.total.toLocaleString('es-CO')} PT</strong></div>`).join(''):'<div class="empty-state">El podio está esperando a sus primeros jugadores.</div>'}<p class="modal-helper">Las clasificaciones se actualizan al finalizar cada prueba. Los premios deben validarse por la organización.</p></div></div>`;
    $$('.area-btn').forEach(b=>b.onclick=()=>{state.areaFilter=b.dataset.area;renderRankContent()})
  }
  $('#homeBtn').onclick=renderHub;$('#rankingBtn').onclick=renderRanking;$('#soundBtn').onclick=()=>{state.sound=!state.sound;$('#soundBtn').textContent=state.sound?'♫ ON':'♫ OFF';sound('tap');toast(state.sound?'Sonidos activados':'Sonidos desactivados')};$('#soundBtn').textContent='♫ OFF';
  window.EI={state,D,$,$$,esc,shuffle,toast,sound,gameScaffold,finish,renderHub,startMode,avatarOnCanvas};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize);else initialize();
})();
