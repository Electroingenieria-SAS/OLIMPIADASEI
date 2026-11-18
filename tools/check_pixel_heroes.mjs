import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const root='assets/pixel-heroes';
const manifest=JSON.parse(fs.readFileSync(`${root}/manifest.json`,'utf8'));
const ids=['01_jefe','02_coordinador','03_analista','04_auxiliar','05_tecnico','06_operativo'];
const lengths={idle:4,walk:8,run:8,interact:6,celebrate:6},dirs=['down','left','right','up'];
assert.deepEqual(manifest.characters.map(x=>x.id),ids);
let frames=0,sequences=0;
const meta=new Map();
for(const id of ids){
  const path=`${root}/personajes/${id}`;
  const data=JSON.parse(fs.readFileSync(`${path}/animaciones.json`,'utf8'));
  const png=fs.readFileSync(`${path}/atlas_completo.png`);
  assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16),512);
  assert.equal(png.readUInt32BE(20),1600);
  assert.equal(png[25],6,'PNG should be RGBA');
  assert.equal(data.identifier,id);assert.equal(data.frameWidth,64);assert.equal(data.frameHeight,80);assert.equal(data.totalFrames,128);
  for(const [ai,[action,length]] of Object.entries(lengths).entries())for(const [di,direction] of dirs.entries()){
    const seq=data.actions[`${action}_${direction}`];assert.ok(seq,`${id}: ${action}_${direction}`);
    assert.equal(seq.frames.length,length);assert.equal(seq.frameCount,length);
    for(const [i,frame] of seq.frames.entries()){
      assert.deepEqual([frame.x,frame.y,frame.w,frame.h],[i*64,(ai*4+di)*80,64,80]);
      assert.ok(frame.durationMs>0);
      frames++;
    }
    sequences++;
  }
  meta.set(id,data);
}
assert.equal(frames,768);assert.equal(sequences,120);
// Pruebas unitarias del controlador JS sin DOM ni navegador.
const browser={};const sandbox={window:browser,Map,Promise,Math,performance:{now:()=>0},requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},console,Image:class {},fetch:()=>Promise.reject(Error('mock'))};
vm.runInNewContext(fs.readFileSync('js/hero-runtime.js','utf8'),sandbox);
const api=browser.EI_HEROES;
assert.ok(api);assert.equal(api.resolve('jefe'),'01_jefe');assert.equal(api.resolve('operaciones'),'06_operativo');
const anim=new api.Animator('03_analista');
assert.equal(anim.action,'idle');assert.equal(anim.direction,'down');
anim.setMovement(0,-1,false);assert.equal(anim.action,'walk');assert.equal(anim.direction,'up');
anim.index=3;anim.setMovement(0,-1,false);assert.equal(anim.index,3,'Same animation must not reset per frame');
anim.setMovement(0,-1,true);assert.equal(anim.action,'run');
anim.setMovement(0,0);assert.equal(anim.action,'idle');assert.equal(anim.direction,'up','Facing preserved when idle');
assert.ok(anim.trigger('interact'));assert.equal(anim.action,'interact');assert.ok(!anim.trigger('interact'),'One-shot action cannot trigger twice');
// Valida los estados contra los metadatos reales sin escribir cuadros de ejemplo.
for(const id of ids)for(const action of Object.keys(lengths))for(const d of dirs){
  const x=meta.get(id).actions[`${action}_${d}`];assert.equal(x.frames.length,lengths[action]);
}
const solid=(x,y)=> x<0||y<0||x>100||y>100||(x>=48&&x<=70&&y>=35&&y<=70);
const move=new api.FootMover({x:30,y:50,boxW:18,boxH:10,speed:100,runSpeed:180,solidAt:solid});
assert.equal(move.canOccupy(60,50),false);
const baseX=move.x,baseY=move.y;move.move(1,1,.1,false);
assert.ok(move.x>baseX&&move.y>baseY,'Diagonal allowed while in open space');
const before={x:move.x,y:move.y};move.move(1,0,1,true);assert.ok(move.x<48-9,'Collider cannot enter solid rectangle');
assert.ok(Math.abs(move.y-before.y)<.00001,'Horizontal movement does not change Y');
const diagonal=new api.FootMover({x:20,y:20,speed:100,solidAt:()=>false});
diagonal.move(1,1,.1);assert.ok(Math.abs(Math.hypot(diagonal.x-20,diagonal.y-20)-10)<.01,'Diagonal speed normalized');
console.log(`OK Pixel Heroes: ${ids.length} personajes, ${sequences} secuencias, ${frames} cuadros, estados/colisiones y consistencia de atlas.`);
