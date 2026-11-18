# Olimpiadas EI Pixel Party — V2

Mini party game de Electroingeniería con cinco pruebas cortas relacionadas con calidad documental, SST, auditoría, ciberseguridad, matemáticas, trazabilidad y logística.

## Flujo de juego

1. **Pantalla inicial**: Iniciar partida, elegir personaje, tablero, reglas y clasificación.
2. **Selección de personaje**: seis roles corporativos (Jefe, Coordinador, Analista, Auxiliar, Técnico y Operativo). Son variaciones del sprite disponible en SuperRetroRanch Free Tier, no seis sprites de personajes diferentes.
3. **Tablero semanal**: cinco estaciones seleccionables, cada una con briefing, instrucciones, tiempo límite y puntuación máxima.
4. **Minijuegos**: agilidad mental, memoria, bodega explorable, lógica y conocimiento, con marcadores y temporizadores propios.
5. **Resultados**: mejor puntaje por prueba y medallas de Oro (850+), Plata (650+), Bronce (400+) y Participación (menos de 400).

La versión pública en GitHub Pages funciona como **demostración local**: no sincroniza puntajes entre dispositivos. Para otorgar premios oficiales es necesario integrar un backend autenticado y validar resultados del lado servidor. El PHP incluido es solo para servidores que lo ejecuten, no para GitHub Pages.

## Ejecutar y verificar

- Servidor estático local: `python -m http.server 8000` y abrir `http://localhost:8000`.
- Verificación de estructura y preguntas: `node tools/check_party_v2.mjs`.
- Comprobaciones JS: `node --check js/app.js`, `node --check js/games.js`, `node --check js/characters.js`.

## Deploy

El workflow `.github/workflows/deploy.yml` publica los archivos estáticos con GitHub Actions en GitHub Pages cuando cambia la rama `main`.

## Recursos gráficos

El recurso `assets/superretro/gamepack.bin` usa 53 sprites gratuitos del paquete aportado para este proyecto. El pack no contiene las otras figuras mostradas en las vistas previas premium; los seis roles se elaboran mediante recoloración dinámica. El uso de recursos debe respetar los términos de su licencia, especialmente si se distribuye en un repositorio público.

## Personajes oficiales — Pixel Heroes (noviembre de 2026)

Se integraron los **seis personajes originales proporcionados por Electroingeniería**: `01_jefe`, `02_coordinador`, `03_analista`, `04_auxiliar`, `05_tecnico`, `06_operativo`.

- Recursos de ejecución: `assets/pixel-heroes/manifest.json` y `assets/pixel-heroes/personajes/XX_rol/{atlas_completo.png,animaciones.json}`.
- Fuentes editables: `source-assets/pixel-heroes/` (Aseprite, OpenRaster, SVG y paletas). No se distribuyen mediante GitHub Pages.
- Código compartido: `js/hero-runtime.js` (atlas/carga/validación, animación, física de los pies); `js/characters.js` (compatibilidad con perfil y vistas existentes); `js/games.js` (bodega con dirección, carrera, interacciones y obstáculos).
- La carga inicial utiliza únicamente seis atlas PNG y siete JSON; no carga los 768 archivos de fotogramas individuales.
- Los cuatro sentidos, cinco estados y duración de cuadros se obtienen directamente de cada `animaciones.json`.
- El personaje se guarda con `avatar.preset` y se traduce desde los ID antiguos si existían partidas previas.
- Controles bodega: WASD/flechas, Shift para correr, E/espacio para interactuar, D-pad táctil y desplazamiento mediante clic.
- Resultados: retrato animado de celebración al finalizar cada minijuego.

### Despliegue

El workflow copia solo `assets/`, `css/`, `js/` e `index.html` a GitHub Pages. La carpeta `source-assets/` permanece en el repositorio, **sin incluirse en el artefacto publicado**. Las rutas son relativas para funcionar bajo `/OLIMPIADASEI/`.

Prueba local: `python -m http.server 8000` y visita `http://localhost:8000/`.

Verificación: `node tools/check_pixel_heroes.mjs` y `python tools/verify_pixel_heroes.py`. Las pruebas de navegador se realizan con Playwright cuando esté disponible.
