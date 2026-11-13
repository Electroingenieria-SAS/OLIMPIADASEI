# Olimpiadas EI Pixel

Juego web institucional de Electroingeniería: cinco minijuegos pixel art (agilidad mental, memoria, caso explorable, lógica y conocimiento). Incluye avatar personalizable, registro, clasificación y preguntas de cultura de calidad, SST, auditoría, ciberseguridad, matemáticas y logística.

## Ver el juego

Una vez activo GitHub Pages (Settings → Pages → Source: **GitHub Actions**), la URL prevista es:

https://electroingenieria-sas.github.io/OLIMPIADASEI/

Cada actualización a `main` publica automáticamente con `.github/workflows/deploy.yml`.

## Modo disponible en GitHub Pages

**Demostración local**. Los participantes y puntajes se guardan en el navegador mediante `localStorage`, **NO** se comparten con otros empleados ni pueden usarse como ranking válido para premios. Es un prototipo para probar mecánicas de juego. El modo PHP del prototipo original se incluye en `server-php/`, pero **NO** funciona en GitHub Pages ni se publica como contenido web.

Para una competencia corporativa entre áreas: crear un backend compartido seguro (ejemplo: Supabase con Edge Functions y Postgres), identidad laboral, control de intentos, fechas y puntuación calculada del lado del servidor antes de habilitar premios. No configurar claves privadas en archivos JavaScript.

## Licencia de recursos

- Los logos de Electroingeniería fueron entregados por la organización y se muestran sin redibujar su marca.
- Los sprites `character-idle.png`, `character-walk.png`, `ground-tiles.png` y los escenarios de `assets/pixel/` son **originales del proyecto**. Los nuevos escenarios incluyen campus EI, cinco minijuegos y un atlas de 8 mosaicos para la bodega. El generador reproducible está en `tools/generate_art.py` (requiere Pillow).
- Se revisó el archivo `SuperRetroRanch_FreeTier_v35(1).zip`: contiene 53 sprites PNG en `assets/` y miles de vistas previas premium en `assets_premium_preview/`. Su licencia Free Tier permite **uso no comercial** y prohíbe **redistribuir** los archivos originales o modificados; por ello **no se suben** a este repositorio público ni se incluyen en GitHub Pages. Para utilizarlos efectivamente en este juego empresarial hace falta una licencia o autorización que cubra el uso y el despliegue.

## Ejecución local

```bash
python -m http.server 8000
```

Abrir http://localhost:8000. En un hosting PHP separado puede implementarse posteriormente un backend de competencia real.

## Renovación visual (13 de noviembre de 2026)

- Escenario principal original de un campus industrial pixel art con oficina, bodega y colaboradores.
- Ilustraciones originales para los cinco retos; las imágenes sustituyen los iconos gigantes en las tarjetas.
- Mapa de caso explorable renderizado desde `assets/pixel/case-tiles.png`, con fallback para errores de carga.
- Los logos institucionales siguen siendo los originales, sin redibujarlos.
- Arte fuente reproducible: `python -m pip install pillow && python tools/generate_art.py`.
- **No modifica** el modo demostración ni incorpora un backend compartido de clasificación.
