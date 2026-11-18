"""Extracts the six user-supplied original pixel heroes. Does not use internet.
Usage: python tools/install_pixel_heroes.py /path/to/Electroingenieria_Pixel_Heroes_6_Personajes_Editables.zip
"""
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NAMES = ['01_jefe','02_coordinador','03_analista','04_auxiliar','05_tecnico','06_operativo']
ACTIONS = {'idle':4,'walk':8,'run':8,'interact':6,'celebrate':6}
DIRECTIONS = ('down','left','right','up')


def install(path):
    with zipfile.ZipFile(path) as z:
        base='Electroingenieria_Pixel_Heroes/'
        manifest=json.loads(z.read(base+'manifest.json'))
        assert [c['id'] for c in manifest['characters']] == NAMES
        dest=ROOT/'assets/pixel-heroes'; dest.mkdir(parents=True,exist_ok=True)
        (dest/'manifest.json').write_bytes(z.read(base+'manifest.json'))
        source=ROOT/'source-assets/pixel-heroes'; source.mkdir(parents=True,exist_ok=True)
        for role in NAMES:
            prefix=base+'personajes/'+role+'/'
            metadata=json.loads(z.read(prefix+'animaciones.json'))
            assert metadata['identifier']==role
            assert metadata['frameWidth']==64 and metadata['frameHeight']==80
            assert metadata['totalFrames']==128
            assert len(metadata['actions'])==20
            count=0
            for ai,(action, expected) in enumerate(ACTIONS.items()):
                for di,direction in enumerate(DIRECTIONS):
                    seq=metadata['actions'][action+'_'+direction]
                    assert seq['frameCount']==expected and len(seq['frames'])==expected
                    for fi,frame in enumerate(seq['frames']):
                        assert (frame['x'],frame['y'],frame['w'],frame['h'])==(fi*64,(ai*4+di)*80,64,80)
                        assert frame['durationMs']>0
                        count+=1
            assert count==128
            target=dest/'personajes'/role
            target.mkdir(parents=True,exist_ok=True)
            for filename in ('atlas_completo.png','animaciones.json'):
                (target/filename).write_bytes(z.read(prefix+filename))
            # Editable project sources are kept in the repository, but excluded from Pages deployment.
            src=source/role;src.mkdir(parents=True,exist_ok=True)
            for filename in z.namelist():
                if filename.startswith(prefix+'fuentes/') and not filename.endswith('/'):
                    (src/filename.rsplit('/',1)[-1]).write_bytes(z.read(filename))
            print(role, '20 secuencias / 128 cuadros')
        for extra in ('README.md','INICIO_RAPIDO.txt','docs/phaser3_ejemplo.js','docs/godot4_ejemplo.gd'):
            (source/(extra.replace('/','_'))).write_bytes(z.read(base+extra))
        (source/'LICENSE-NOTE.md').write_text('Fuente de personajes suministrada por el titular del proyecto. Los archivos editables de esta carpeta no forman parte de GitHub Pages. La publicación de los atlas sí es necesaria para el videojuego.\n',encoding='utf-8')
    print('OK: 6 atlas, 6 metadatos, fuentes editables separadas')

if __name__=='__main__':install(sys.argv[1])
