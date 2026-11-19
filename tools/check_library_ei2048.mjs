import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const src=fs.readFileSync('js/investigation-core.js','utf8');
const ctx={module:{exports:{}},globalThis:{}};
vm.runInNewContext(src,ctx);
const c=ctx.module.exports;
const collisions=JSON.parse(fs.readFileSync('assets/library/colisiones.json'));
const interactions=JSON.parse(fs.readFileSync('assets/library/interacciones.json'));
assert.equal(c.validate(collisions,interactions),true);
assert.equal(c.blocked(collisions,c.SPAWN.x,c.SPAWN.y),false);
const ids=new Set();
for(const ev of interactions.eventos){
 ids.add(ev.id);
 const route=c.path(collisions,c.SPAWN,ev.activacion_tile);
 assert(route.length>0,`Sin ruta a ${ev.id}`);
 const start=route.at(-1);
 assert.equal(start.x,ev.activacion_tile.x);
 assert.equal(start.y,ev.activacion_tile.y);
 for(const tile of route)assert.equal(c.blocked(collisions,tile.x,tile.y),false);
 assert.equal(c.nearby(collisions,(start.x+.5)*32,(start.y+.5)*32,ev),true);
 assert.equal(c.nearby(collisions,656,848,ev),ev.id==='INT-05'?false:false);
}
assert.equal(ids.size,5);
let occupied=0,solid=0;
for(let y=0;y<30;y++)for(let x=0;x<40;x++){if(collisions.tiles[y][x]===1){solid++;assert(!c.canOccupy(collisions,(x+.5)*32,(y+.5)*32));}else occupied++;}
assert(occupied>100&&solid>80);
let s=c.initial();
assert.deepEqual(Array.from(s.found),[]);
for(const ev of interactions.eventos){assert.equal(c.addEvidence(s,ev.id),true);assert.equal(c.addEvidence(s,ev.id),false);}
assert.equal(c.score(s),40);assert.equal(s.phase,'solve');
assert.equal(c.answer(s,0,'delay').ok,false);assert.equal(c.answer(s,1,'hold').ok,false); // previous question must be solved
assert.equal(c.answer(s,0,'14awgv12').ok,true);
assert.equal(c.answer(s,1,'hold').ok,true);
assert.equal(c.answer(s,2,['release','hold','verify','repack','trace']).ok,false);
assert.equal(c.answer(s,2,c.SOLUTION).ok,true);
assert.equal(s.complete,true);assert(s.points<100);assert(s.points>=80);
const resumed=c.restore(JSON.parse(JSON.stringify(s)),collisions);
assert.equal(resumed.complete,true);assert.equal(c.addEvidence(resumed,'INT-01'),false);assert.equal(c.answer(resumed,0,'14awgv12').ok,false);
const clean=c.initial();for(const id of c.IDS)c.addEvidence(clean,id);
c.answer(clean,0,'14awgv12');c.answer(clean,1,'hold');c.answer(clean,2,c.SOLUTION);
assert.equal(clean.points,100,'Perfecto 40+45+15');assert.equal(c.score(clean),100);
const hinted=c.initial();for(const id of c.IDS)c.addEvidence(hinted,id);hinted.hints=1;
c.answer(hinted,0,'14awgv12');c.answer(hinted,1,'hold');c.answer(hinted,2,c.SOLUTION);
assert.equal(hinted.points,93);
const root='assets/library/';
for(const file of ['01_biblioteca_mapa.png','02_biblioteca_colisiones.png','03_biblioteca_interacciones.png']){
 const buf=fs.readFileSync(root+file);
 assert.equal(buf.subarray(1,4).toString(),'PNG');
 assert.equal(buf.readUInt32BE(16),1280);assert.equal(buf.readUInt32BE(20),960);
}
for(const path of ['js/investigation.js','js/investigation-content.js','js/investigation-core.js'])assert(fs.statSync(path).size>1000);
const app=fs.readFileSync('js/app.js','utf8'),html=fs.readFileSync('index.html','utf8');
assert(app.includes('openInvestigationBriefing')&&app.includes("startInvestigation")&&app.includes("finish('investigation'"));
assert(html.includes('js/investigation.js')&&html.includes('js/investigation-content.js'));
const php=fs.readFileSync('server-php/api.php','utf8');assert(php.includes("'investigation'"));
console.log(`Biblioteca EI-2048 OK: ${occupied} tiles transitables, ${solid} sólidos, 5 rutas, 5 interacciones, decisiones, puntuación /100, 3 PNG y enlaces de integración.`);
