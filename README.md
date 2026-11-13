# Olimpiadas EI Pixel — Electroingeniería

Juego institucional de cinco retos: agilidad mental, memoria, caso explorable, lógica y conocimiento. Incluye registro, avatar, exploración de escenarios, preguntas de SST, calidad documental, auditoría, ciberseguridad, matemáticas y logística.

**Jugar:** https://electroingenieria-sas.github.io/OLIMPIADASEI/

## Uso real del paquete SuperRetroRanch Free Tier

Se usan los **53 archivos PNG utilizables** del ZIP que aportó el equipo. Los miles de `.jpg` de `assets_premium_preview` son **vistas previas premium**, no los sprites PNG del nivel gratuito y no se publican.

Para cumplir la prohibición de redistribuir las imágenes como archivos independientes, los 53 originales se empaquetan en `assets/superretro/gamepack.bin` (gzip + AES-GCM del lado del cliente). La aplicación carga el paquete con `js/sprites.js` y convierte sus recursos en imágenes pixel art. **No es DRM ni garantiza que no se puedan extraer**; es una medida organizativa para evitar entregar el conjunto como 53 PNG independientes.

Los sprites se usan en:

- Galería **VER MIS 53 SPRITES** disponible desde la pantalla de inicio (se muestran todos los recursos del nivel gratuito y su nombre original).
- Creación de personaje: elección entre el avatar auténtico de SuperRetroRanch y el avatar EI con colores personalizables.
- Protagonista y compañero de la escena explorable con el sprite real de caminar.
- Escenarios del campus y las cinco tarjetas de retos, creados con elementos del paquete.
- Ocho fichas del juego de memoria, con iconos del paquete original.
- Vegetación y detalles de entorno en el escenario explorable.

El archivo `assets/superretro/manifest.json` enumera los 53 nombres de origen. Para recompilar el paquete **internamente** se requiere colocar los PNG originales en `assets/superretro` siguiendo su estructura y ejecutar:

```bash
python -m pip install cryptography
python tools/build_superretro_pack.py
```

El autor de los recursos es **Gif — SuperRetroRanch**. Licencia *Free Tier*: uso no comercial, modificaciones permitidas, prohibida la redistribución directa y la venta de sprites. Se debe confirmar que la política interna de uso y distribución del proyecto sea compatible con la licencia. Los logos de Electroingeniería se mantienen intactos.

## Despliegue GitHub Actions / Pages

El workflow `.github/workflows/deploy.yml` construye un directorio `dist` con HTML, CSS, JavaScript y assets, y lo publica automáticamente en GitHub Pages tras un push a `main`.

```bash
python -m http.server 8000
```

Abrir http://localhost:8000. Para descifrar y mostrar el paquete se necesita `localhost` o HTTPS, navegador moderno y soporte para WebCrypto + `DecompressionStream`.

**Nota de competencia:** GitHub Pages es hosting estático. El ranking actual es una **demostración local** (almacenamiento del navegador). Para premiar por áreas se necesita backend compartido (Supabase o equivalente) y puntuación validada en servidor. El PHP de `server-php/` no se despliega a Pages.
