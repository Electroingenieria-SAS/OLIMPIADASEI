import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
const cwd=process.cwd();
const read=(p)=>fs.readFileSync(path.join(cwd,p),'utf8');
const dataCtx={window:{}};
vm.runInNewContext(read('js/data.js'),dataCtx);
const D=dataCtx.window.EI_DATA;
assert.equal(D.modes.length,5,'Deben existir exactamente cinco minijuegos');
assert.deepEqual(Array.from(D.modes,m=>m.id),['agility','memory','case','logic','knowledge']);
for(const m of D.modes){
 assert(fs.existsSync(`assets/pixel/mode-${m.id}.png`),`Falta imagen de ${m.id}`);
 assert(m.title && m.time>0,`Faltan metadatos en ${m.id}`);
}
assert(D.agility.length>=10 && D.knowledge.length>=12 && D.memory.length===8 && D.logic.length===6 && D.caseClues.length===4,'Bancos de retos incompletos');
for(const item of [...D.agility,...D.knowledge,...D.caseClues,...D.logic.filter(q=>q.type==='choice')]){
 assert(item.options?.length>=3,'Preguntas sin opciones');
 assert(Number.isInteger(item.a)&&item.a>=0&&item.a<item.options.length,`Índice de respuesta inválido: ${item.q}`);
}
const chars=read('js/hero-runtime.js');
for(const role of ['Jefe','Coordinador','Analista','Auxiliar','Técnico','Operativo']){
 assert(chars.includes(`name:'${role}'`),`Falta rol ${role}`);
}
const app=read('js/app.js');
for(const marker of ['renderTitleScreen','renderBoard','renderHowTo','openGameBriefing','medalFor','arenaTimeMeter','resultRetry']){
 assert(app.includes(marker),`Falta función ${marker}`);
}
for(const src of ['css/styles.css','css/arcade.css','js/sprites.js','js/hero-runtime.js','js/characters.js','js/data.js','js/app.js','js/games.js','assets/superretro/gamepack.bin']){
 assert(fs.statSync(src).size>1000,`Recurso requerido incompleto: ${src}`);
}
const manifest=JSON.parse(read('assets/superretro/manifest.json'));
assert.equal(manifest.sprite_count,53,'Assets del paquete incompletos');
const html=read('index.html');
assert(html.includes('js/characters.js')&&html.includes('css/arcade.css'),'Página sin dependencias');
console.log('EI Pixel Party V2: 5 minijuegos, 6 roles, recursos, reglas y componentes verificados.');
