'use strict';
/** Compatibilidad para la UI y las partidas anteriores. Todos los retratos y sprites
 * ahora provienen EXCLUSIVAMENTE de los 6 atlas oficiales de Electroingeniería.
 */
window.EI_CHARACTERS=(()=>{
  const heroes=window.EI_HEROES;
  const presets=heroes.roles.map(r=>({...r,hat:false}));
  const normalize=opt=>{
    const id=heroes.resolve(opt);return {preset:id,role:presets.find(x=>x.id===id)};
  };
  const draw=(canvas,opt={},action='idle',direction=0,frame=0)=>heroes.drawAvatar(canvas,heroes.resolve(opt),action,['down','left','right','up'][direction]||'down',frame);
  const drawAt=(ctx,opt={},x,y,size=64,direction=0,frame=0,action='idle')=>{
    const animator=new heroes.Animator(heroes.resolve(opt));
    animator.setState(action,['down','left','right','up'][direction]||'down',{force:true});
    const frames=heroes.record(opt)?.metadata?.actions?.[`${action}_${animator.direction}`]?.frames?.length||1;
    animator.index=Math.abs(frame)%frames;
    return animator.draw(ctx,x+size*.5,y+size*.94,size/64);
  };
  const animate=(canvas,opt={},action='idle',direction='down')=>heroes.animatePreview(canvas,heroes.resolve(opt),action,direction);
  return {presets,normalize,draw,drawAt,animate,createAnimator:opt=>new heroes.Animator(heroes.resolve(opt)),load:heroes.load};
})();
