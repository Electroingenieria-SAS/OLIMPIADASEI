'use strict';
/* SuperRetroRanch Free Tier pack loader — for this non-commercial game only.
 * Loads a compiled/obfuscated sprite pack, not a directory of downloadable PNGs.
 * The client-side encryption is packaging, not DRM or access control.
 */
window.EI_SPRITES = (() => {
  const KEY = 'EI-OLIMPIADAS-PIXEL-SUPERRETRO-2026-NONCOMMERCIAL-EDITION';
  const PACK_URL = 'assets/superretro/gamepack.bin';
  const map = new Map();
  let collection = [];
  let promise = null;
  let ready = false;
  let lastError = '';
  function bytesEqual(a,b){return a.every((v,i)=>v===b[i]);}
  function asBase64(id){return map.get(id)?.base64 || null;}
  function sourceUrl(id){const img=asBase64(id);return img?`data:image/png;base64,${img}`:null;}
  function list(){return collection.map(({id,filename,group})=>({id,filename,group}));}
  async function load(){
    if(promise)return promise;
    promise=(async()=>{
      if(!window.crypto?.subtle || typeof DecompressionStream==='undefined') throw new Error('Se requiere HTTPS y navegador compatible con compresión gzip');
      const response=await fetch(PACK_URL,{cache:'force-cache'});
      if(!response.ok)throw new Error(`No se pudo cargar el paquete de sprites (${response.status})`);
      const buf=new Uint8Array(await response.arrayBuffer());
      if(buf.length<34 || !bytesEqual([...buf.slice(0,5)],[69,73,83,82,50]))throw new Error('Formato del paquete de sprites inválido');
      const nonce=buf.slice(5,17), cipher=buf.slice(17);
      const keyBytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(KEY));
      const cryptoKey=await crypto.subtle.importKey('raw',keyBytes,{name:'AES-GCM'},false,['decrypt']);
      const compressed=await crypto.subtle.decrypt({name:'AES-GCM',iv:nonce},cryptoKey,cipher);
      const decompressedStream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
      const text=await new Response(decompressedStream).text();
      const payload=JSON.parse(text);
      if(!Array.isArray(payload.sprites) || payload.sprites.length!==53)throw new Error('Paquete de sprites incompleto');
      collection=payload.sprites;
      for(const sprite of collection) map.set(sprite.id,sprite);
      ready=true;
      return list();
    })().catch(err=>{lastError=String(err.message||err);console.warn('EI sprites:',lastError);return[]});
    return promise;
  }
  function idFromFilename(path){return path.replaceAll('/','__').replace(/\.png$/,'');}
  function urlFromFilename(path){return sourceUrl(idFromFilename(path));}
  function getError(){return lastError;}
  return {load,list,url:sourceUrl,urlFromFilename,idFromFilename,getError,get ready(){return ready;},get count(){return map.size;}};
})();
