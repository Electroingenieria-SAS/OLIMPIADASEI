'use strict';
(() => {
  const D = window.EI_DATA;
  const state = {
    remote:false,config:{lock_by_day:false},player:null,scores:{},run:null,
    sound:false,avatar:{skin:1,hair:0,hairColor:0,shirt:0,accessory:'helmet'},
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
    renderHeader();renderHub();
  }
  function renderHeader(){const e=$('#userChip');if(!state.player){e.hidden=true;e.innerHTML='';return}e.hidden=false;e.innerHTML=`<canvas id="userAvatar" class="mini-head" width="24" height="28"></canvas><span>${esc(state.player.alias)}<small>${esc(state.player.area)}</small></span>`;avatarOnCanvas($('#userAvatar'),state.player.avatar||state.avatar)}
  function total(){return Object.values(state.scores).reduce((a,b)=>a+Number(b||0),0)}
  function unlocked(mode){if(!state.remote||!state.config.lock_by_day)return true;let start=state.config.start_date;if(!start)return true;const target=new Date(start+'T00:00:00-05:00').getTime()+(mode.day-1)*86400000;return Date.now()>=target}
  function renderHub(){if(window.EI_GAMES)window.EI_GAMES.cleanup();state.run=null;
    const done=Object.keys(state.scores).length;
    $('#view').innerHTML=`<div class="hub">
      <section class="hero">
        <div class="hero-art"><canvas id="heroCanvas" width="400" height="260" aria-hidden="true"></canvas><span class="floating-coin">🏆</span>${state.player?`<div class="profile-bubble"><canvas id="heroAvatar" width="24" height="28"></canvas><span>${esc(state.player.alias)}</span></div>`:''}</div>
        <div class="hero-copy">
          <span class="event-tag">✦ LA AVENTURA DE APRENDER • EDICIÓN EI</span>
          <h1>OLIMPIADAS<br><em>EI PIXEL</em></h1>
          <p>Cinco mundos. Cinco desafíos. Una competencia para demostrar lo que sabes de calidad, SST, auditoría, ciberseguridad y logística.</p>
          <div class="cta-row">
            <button class="btn btn-primary" id="heroAction">${state.player?'▶ CONTINUAR AVENTURA':'✦ CREAR MI PERSONAJE'}</button>
            <button class="btn btn-outline" id="heroRanking">🏆 VER CLASIFICACIÓN</button>${state.player?'<button class="btn btn-outline" id="editAvatarBtn">✎ EDITAR AVATAR</button>':''}
          </div>
          <div class="quick-stats"><span>🎮 <b>5</b> minijuegos</span><span>⭐ <b>5.000</b> puntos posibles</span><span>🏅 <b>1 ganador</b> por área</span></div>
        </div>
      </section>
      <div class="section-title-row"><div><div class="section-kicker">ELIGE TU DESAFÍO</div><h2>Tu ruta hacia el podio</h2></div><p>${state.player?`${esc(state.player.alias)} · ${total().toLocaleString('es-CO')} puntos`:'Regístrate y empieza a jugar'}</p></div>
      <section class="modes" id="modeCards" aria-label="Modos de juego">${D.modes.map(m=>{
        const completed=state.scores[m.id]!==undefined;const locked=!unlocked(m);
        return `<button class="mode-card ${locked?'locked':''}" style="--accent:${m.color}" data-mode="${m.id}" ${locked?'disabled':''}>
          <div class="mode-scene"><span class="mode-icon">${m.icon}</span></div>
          <div class="mode-body"><div><span class="pill">DÍA ${m.day}</span></div><h3>${esc(m.title)}</h3><span class="mode-desc">${esc(m.description)}</span>
          <div class="mode-bottom"><span>${locked?'🔒 Próximamente':completed?'✓ Completado':'▶ Jugar ahora'}</span>${completed?`<strong class="chip-score">${Number(state.scores[m.id]).toLocaleString('es-CO')} PT</strong>`:`<strong>1.000 PT</strong>`}</div></div>
        </button>`}).join('')}</section>
      <div class="two-panels">
        <section class="panel"><div class="section-kicker">AVANCE PERSONAL</div><h3>Tu recorrido de 5 días</h3><p class="panel-sub">Cada reto suma hasta 1.000 puntos para tu clasificación.</p><div class="progress-track"><div style="width:${done*20}%"></div></div><div class="steps">${D.modes.map(m=>`<div class="step ${state.scores[m.id]!==undefined?'done':''} ${state.scores[m.id]===undefined&&unlocked(m)?'active':''}"><div class="step-point">${state.scores[m.id]!==undefined?'✓':m.day}</div><div class="step-name">${esc(m.title)}</div></div>`).join('')}</div><p class="text-muted" style="font-size:12px;margin:23px 0 0">${done} de 5 desafíos completados · <b>${total().toLocaleString('es-CO')} puntos</b> acumulados</p></section>
        <section class="panel"><div class="section-kicker">EL PODIO</div><h3>Premios por área 🏆</h3><p class="panel-sub">Se premia al mayor puntaje total en cada área de trabajo.</p><div id="hubRanking" class="empty-state">Cargando participantes…</div><button class="btn btn-blue btn-sm" id="moreRanking" style="margin-top:13px">Ver tabla completa →</button></section>
      </div>
    </div>`;
    $('#heroAction').addEventListener('click',()=>{if(!state.player)openRegistration();else $('#modeCards').scrollIntoView({behavior:'smooth',block:'center'})});
    $('#heroRanking').onclick=renderRanking;$('#moreRanking').onclick=renderRanking;if($('#editAvatarBtn'))$('#editAvatarBtn').onclick=openWardrobe;if($('#heroAvatar'))avatarOnCanvas($('#heroAvatar'),state.player.avatar||state.avatar);
    $$('.mode-card').forEach(b=>b.addEventListener('click',()=>startMode(b.dataset.mode)));
    drawHero();loadHubRanking();
  }
  async function loadHubRanking(){try{const x=state.remote?(await api('rankings')).rankings:rankFromDemo();if(!$('#hubRanking'))return;const first=x.slice(0,3);$('#hubRanking').outerHTML=first.length?`<table class="team-rank-table"><thead><tr><th>#</th><th>Jugador / Área</th><th>PTS</th></tr></thead><tbody>${first.map((r,i)=>`<tr><td>${['🥇','🥈','🥉'][i]}</td><td><b>${esc(r.alias)}</b><br><small class="text-muted">${esc(r.area)}</small></td><td>${r.total.toLocaleString('es-CO')}</td></tr>`).join('')}</tbody></table>`:`<div id="hubRanking" class="empty-state">Todavía no hay puntajes. ¡Puedes ser la primera persona en clasificar!</div>`}catch(_){if($('#hubRanking'))$('#hubRanking').textContent='No se pudo cargar la clasificación.'}}
  function drawHero(){const canvas=$('#heroCanvas');if(!canvas)return;const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;const W=400,H=260;
    g.clearRect(0,0,W,H);g.fillStyle='#1c407f';g.fillRect(0,0,W,H);
    for(let i=0;i<65;i++){const x=(i*73+27)%W,y=(i*37+11)%140;g.fillStyle=i%3===0?'#72bcff':'#4269b1';g.fillRect(x,y,2,2)}
    g.fillStyle='#092858';g.fillRect(90,76,260,164);g.fillStyle='#305ba4';g.fillRect(100,85,240,145);g.fillStyle='#0a2452';g.fillRect(115,100,210,128);
    g.fillStyle='#e6dafa';g.fillRect(176,45,86,51);g.fillStyle='#ffd36b';g.fillRect(187,58,65,7);g.fillRect(197,66,45,20);g.fillStyle='#d88a31';g.fillRect(209,86,23,7);g.fillStyle='#fff0ad';g.fillRect(191,58,8,10);g.fillStyle='#f4c05d';g.fillRect(177,56,12,21);g.fillRect(247,56,12,21);
    g.fillStyle='#73bdeb';for(let row=0;row<3;row++)for(let col=0;col<5;col++){g.fillRect(130+col*36,114+row*28,24,16);g.fillStyle='#f9dc7a';g.fillRect(134+col*36,118+row*28,9,6);g.fillStyle='#73bdeb'}
    g.fillStyle='#102748';g.fillRect(0,231,W,29);for(let i=0;i<30;i++){g.fillStyle=i%2?'#265b94':'#2a477e';g.fillRect(i*18,231+(i%3)*4,13,29)}
    const char=new Image();char.onload=()=>{g.drawImage(char,0,0,32,32,300,179,56,56);g.drawImage(char,0,0,32,32,75,196,38,38)};char.src='assets/character-idle.png';
  }
  function avatarOnCanvas(canvas,opt=state.avatar){if(!canvas)return;const g=canvas.getContext('2d');canvas.width=24;canvas.height=28;g.imageSmoothingEnabled=false;g.clearRect(0,0,24,28);
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
  function openRegistration(){const opts=state.avatar;$('#modalRoot').innerHTML=`<div class="modal-backdrop" role="presentation"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="regTitle">
     <div class="modal-header"><h2 id="regTitle">✦ Crea tu personaje</h2><button id="closeModal" class="close-modal" aria-label="Cerrar">×</button></div>
     <div class="modal-body"><div class="reg-grid"><div><div class="avatar-frame"><canvas id="avatarPreview" width="24" height="28" aria-label="Previsualización de personaje"></canvas></div><p class="modal-helper">Elige tu aspecto. ¡Tu avatar te acompañará por los cinco mundos!</p></div>
     <form id="registerForm"><div class="custom-grid"><div class="field"><label for="regName">Nombre completo</label><input id="regName" placeholder="Tu nombre y apellido" maxlength="80" minlength="4" required></div><div class="field"><label for="regAlias">Nombre de jugador</label><input id="regAlias" placeholder="Ej. PixelJuan" maxlength="24" minlength="3" required></div></div>
     <div class="field"><label for="regArea">Área de trabajo</label><select id="regArea" required><option value="">Selecciona tu área</option>${D.areas.map(a=>`<option>${esc(a)}</option>`).join('')}</select></div>
     <div class="custom-grid"><div class="field"><label for="avSkin">Tono de piel</label><select id="avSkin" data-avatar="skin">${['Claro','Trigueño claro','Trigueño','Moreno','Oscuro'].map((x,i)=>`<option value="${i}">${x}</option>`).join('')}</select></div>
       <div class="field"><label for="avHair">Peinado</label><select id="avHair" data-avatar="hair">${['Corto','Alto','Largo','Lateral'].map((x,i)=>`<option value="${i}">${x}</option>`).join('')}</select></div>
       <div class="field"><label for="avHairColor">Color de cabello</label><select id="avHairColor" data-avatar="hairColor">${['Castaño oscuro','Castaño claro','Negro azulado','Rubio'].map((x,i)=>`<option value="${i}">${x}</option>`).join('')}</select></div>
       <div class="field"><label for="avShirt">Uniforme</label><select id="avShirt" data-avatar="shirt">${['Azul EI','Naranja','Blanco','Violeta'].map((x,i)=>`<option value="${i}">${x}</option>`).join('')}</select></div></div>
     <div class="field"><label for="avAccessory">Accesorio</label><select id="avAccessory" data-avatar="accessory"><option value="helmet">Casco de seguridad</option><option value="glasses">Gafas</option><option value="headphones">Auriculares</option><option value="vest">Chaleco reflectivo</option><option value="none">Sin accesorio</option></select></div>
     <p class="modal-helper">${state.remote?'Al registrarte obtendrás una clave para recuperar tu personaje. Por seguridad, guárdala.':'Esta versión de demostración guarda tu partida únicamente en el navegador.'}</p>${state.remote?'<button type="button" id="recoverBtn" class="btn btn-outline btn-sm">¿Ya tienes un personaje? Recuperar cuenta</button>':''}<div id="regError" class="modal-error" role="alert"></div>
     <div class="reg-bottom"><button type="button" id="cancelReg" class="btn btn-outline">Cancelar</button><button type="submit" id="submitReg" class="btn btn-primary">✦ COMENZAR AVENTURA</button></div></form></div></div></div></div>`;
    avatarOnCanvas($('#avatarPreview'));
    if($('#recoverBtn'))$('#recoverBtn').onclick=openRecovery;
    $$('[data-avatar]').forEach(e=>{e.value=String(opts[e.dataset.avatar]);e.onchange=()=>{opts[e.dataset.avatar]=e.value;avatarOnCanvas($('#avatarPreview'));sound()}});
    const close=()=>$('#modalRoot').innerHTML='';$('#closeModal').onclick=close;$('#cancelReg').onclick=close;$('#registerForm').onsubmit=async e=>{e.preventDefault();const name=$('#regName').value.trim(),alias=$('#regAlias').value.trim(),area=$('#regArea').value;
       if(name.length<4||alias.length<3||!D.areas.includes(area)){ $('#regError').textContent='Completa tu nombre, alias y área.';return}
       const b=$('#submitReg');b.disabled=true;b.textContent='REGISTRANDO…';try{const r=await register({name,alias,area,avatar:{...opts}});close();renderHeader();renderHub();sound('win');if(state.remote&&r.access_key){showCredential(r.access_key,r.player.id)}}catch(err){$('#regError').textContent=err.message;b.disabled=false;b.textContent='✦ COMENZAR AVENTURA'}
    }
  }
  function openWardrobe(){
    if(!state.player)return;
    const a={...state.avatar,...(state.player.avatar||{})};
    const options=(items,key)=>items.map((label,i)=>`<option value="${i}" ${String(a[key])===String(i)?'selected':''}>${label}</option>`).join('');
    $('#modalRoot').innerHTML=`<div class="modal-backdrop"><div class="modal" style="max-width:650px" role="dialog" aria-modal="true"><div class="modal-header"><h2>🎨 Tu vestuario pixel</h2><button id="closeWardrobe" class="close-modal" aria-label="Cerrar">×</button></div><div class="modal-body"><div class="reg-grid"><div><div class="avatar-frame"><canvas id="avatarPreview" width="24" height="28"></canvas></div></div><div><div class="field"><label>Peinado</label><select data-avatar="hair">${options(['Corto','Alto','Largo','Lateral'],'hair')}</select></div><div class="field"><label>Color de cabello</label><select data-avatar="hairColor">${options(['Castaño oscuro','Castaño claro','Negro azulado','Rubio'],'hairColor')}</select></div><div class="field"><label>Tono de piel</label><select data-avatar="skin">${options(['Claro','Trigueño claro','Trigueño','Moreno','Oscuro'],'skin')}</select></div><div class="field"><label>Uniforme</label><select data-avatar="shirt">${options(['Azul EI','Naranja','Blanco','Violeta'],'shirt')}</select></div><div class="field"><label>Accesorio</label><select data-avatar="accessory">${['helmet','glasses','headphones','vest','none'].map((v,i)=>`<option value="${v}" ${a.accessory===v?'selected':''}>${['Casco de seguridad','Gafas','Auriculares','Chaleco reflectivo','Sin accesorio'][i]}</option>`).join('')}</select></div></div></div><div id="wardrobeError" class="modal-error"></div><div class="reg-bottom"><button id="saveWardrobe" class="btn btn-primary">GUARDAR PERSONAJE</button></div></div></div></div>`;
    const repaint=()=>avatarOnCanvas($('#avatarPreview'),a);repaint();
    $$('[data-avatar]').forEach(e=>e.onchange=()=>{a[e.dataset.avatar]=e.value;repaint()});$('#closeWardrobe').onclick=()=>$('#modalRoot').innerHTML='';
    $('#saveWardrobe').onclick=async()=>{try{if(state.remote){const r=await api('avatar',{id:state.player.id,access_key:credentials().access_key,avatar:a});state.player=r.player}else{const d=demoData(),p=d.players.find(x=>x.id===state.player.id);if(p){p.avatar=a;saveDemo(d)}state.player.avatar=a}state.avatar={...a};$('#modalRoot').innerHTML='';renderHeader();renderHub();toast('Avatar actualizado')}catch(err){$('#wardrobeError').textContent=err.message}};
  }
  function openRecovery(){
    $('#modalRoot').innerHTML=`<div class="modal-backdrop"><div class="modal" style="max-width:540px" role="dialog" aria-modal="true"><div class="modal-header"><h2>↩ Recuperar personaje</h2><button id="closeRecovery" class="close-modal">×</button></div><div class="modal-body"><p class="modal-helper">Introduce el identificador y la clave que guardaste al registrarte.</p><form id="recoveryForm"><div class="field"><label for="recoverId">Identificador de jugador</label><input id="recoverId" required placeholder="ID de jugador"></div><div class="field"><label for="recoverKey">Clave de recuperación</label><input id="recoverKey" required placeholder="Tu clave privada" type="password"></div><div id="recoveryError" class="modal-error"></div><div class="reg-bottom"><button type="button" id="backRecovery" class="btn btn-outline">Volver</button><button type="submit" class="btn btn-primary">RECUPERAR</button></div></form></div></div></div>`;
    $('#closeRecovery').onclick=()=>$('#modalRoot').innerHTML='';$('#backRecovery').onclick=openRegistration;
    $('#recoveryForm').onsubmit=async e=>{e.preventDefault();const cred={id:$('#recoverId').value.trim(),access_key:$('#recoverKey').value.trim()};try{const x=await api('resume',cred);state.player=x.player;state.avatar={...state.avatar,...(x.player.avatar||{})};state.scores=x.scores||{};localStorage.setItem(credsKey,JSON.stringify(cred));$('#modalRoot').innerHTML='';renderHeader();renderHub();toast('Bienvenido de nuevo, '+x.player.alias)}catch(err){$('#recoveryError').textContent=err.message}};
  }
  async function register(p){if(state.remote){const x=await api('register',p);state.player=x.player;state.avatar={...state.avatar,...(x.player.avatar||{})};state.scores=x.scores||{};localStorage.setItem(credsKey,JSON.stringify({id:x.player.id,access_key:x.access_key}));return x}
    const d=demoData();const id='demo-'+Date.now().toString(36);const u={...p,id,scores:{}};d.players.push(u);d.current=id;saveDemo(d);state.player=u;state.scores={};return {player:u}}
  function showCredential(secret,id){$('#modalRoot').innerHTML=`<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" style="max-width:560px"><div class="modal-header"><h2>✓ ¡Tu avatar está listo!</h2></div><div class="modal-body"><p>Guarda esta clave privada. Permite recuperar tu perfil si cambias de navegador.</p><div style="padding:16px;background:#061a3d;border:1px dashed #70a3df;border-radius:8px;word-break:break-all;font-family:monospace;font-size:15px"><strong>${esc(id)}</strong><br>${esc(secret)}</div><p class="modal-helper">No compartas esta clave: permite acceder a tus resultados.</p><div class="reg-bottom"><button id="copyCred" class="btn btn-blue">Copiar datos</button><button id="okCred" class="btn btn-primary">¡A jugar!</button></div></div></div></div>`;$('#copyCred').onclick=()=>{navigator.clipboard?.writeText('ID: '+id+'\nClave: '+secret);toast('Datos copiados')};$('#okCred').onclick=()=>$('#modalRoot').innerHTML=''}
  function gameScaffold(mode){const m=D.modes.find(x=>x.id===mode);$('#view').innerHTML=`<div class="game-shell"><nav class="game-breadcrumb"><button id="gameBack">← Inicio</button><span>/</span><span>Día ${m.day}: ${esc(m.title)}</span></nav><section class="game-header"><div><div class="section-kicker">DESAFÍO ${m.day} DE 5</div><h1>${m.icon} ${esc(m.title)}</h1><p>${esc(m.subtitle)} · ${esc(m.description)}</p></div><div class="game-header-meta"><div class="stat-box"><span class="stat-label">Tiempo</span><span id="gameTime" class="stat-value">--:--</span></div><div class="stat-box"><span class="stat-label">Puntos</span><span id="gamePoints" class="stat-value">0</span></div></div></section><section class="game-main"><div id="game-content"></div></section></div>`;$('#gameBack').onclick=()=>{if(confirm('¿Salir del desafío? Se perderá el progreso de esta ronda.'))renderHub()};window.scrollTo({top:0,behavior:'smooth'})}
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
