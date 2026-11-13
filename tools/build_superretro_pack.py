"""Compile the supplied noncommercial Free Tier PNGs into a compressed AES-GCM web game pack.

Source PNGs are intentionally not published as individually downloadable assets in the
public repository. The runtime key is client-side: this is obfuscation, not DRM.
"""
from __future__ import annotations
import base64, gzip, hashlib, json, os, sys
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets' / 'superretro'
TARGET = SOURCE / 'gamepack.bin'
KEY_TEXT = 'EI-OLIMPIADAS-PIXEL-SUPERRETRO-2026-NONCOMMERCIAL-EDITION'

PNG = sorted(x for x in SOURCE.rglob('*.png') if x.is_file())
if len(PNG) != 53:
    raise RuntimeError(f'Expected 53 Free Tier PNGs, found {len(PNG)}')

def classify(p: Path) -> str:
    path=p.relative_to(SOURCE)
    if path.parts[0]=='characters':return 'Personajes y animaciones'
    if path.parts[0]=='crops':return 'Cultivos e iconos'
    if path.parts[0]=='tiles':return 'Terreno y escenarios'
    return 'Objetos de escenario'

bundle=[]
for i, path in enumerate(PNG):
    relative=str(path.relative_to(SOURCE)).replace('\\','/')
    bundle.append({'id':relative.replace('/','__').replace('.png',''),
                   'filename':relative,
                   'group':classify(path),
                   'base64':base64.b64encode(path.read_bytes()).decode('ascii')})

raw=json.dumps({'version':2,'license':'Non-commercial game use. Do not redistribute as standalone assets.', 'sprites':bundle},separators=(',',':')).encode()
compressed=gzip.compress(raw,compresslevel=9,mtime=0)
key=hashlib.sha256(KEY_TEXT.encode('utf-8')).digest()
nonce=os.urandom(12)
ciphertext=AESGCM(key).encrypt(nonce,compressed,None)
TARGET.write_bytes(b'EISR2'+nonce+ciphertext)
# Non-sensitive list of bundled source sprite names for traceability.
manifest={'format':'EISR2','sprite_count':len(bundle),'groups':sorted(set(x['group'] for x in bundle)),
          'sprites':[{'id':x['id'],'source_file':x['filename'],'group':x['group']} for x in bundle]}
(SOURCE/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Compiled',len(bundle),'Free Tier PNGs into',TARGET, 'pack bytes:', TARGET.stat().st_size)
