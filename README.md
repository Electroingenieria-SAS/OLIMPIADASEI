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
- Los sprites `character-idle.png`, `character-walk.png` y `ground-tiles.png` de esta publicación son **originales dibujados para este proyecto**.
- Los sprites del paquete `SuperRetroRanch_FreeTier_v35.zip` **NO están incluidos** en este repositorio ni en el despliegue debido a las restricciones de redistribución y uso comercial de su licencia Free Tier.

## Ejecución local

```bash
python -m http.server 8000
```

Abrir http://localhost:8000. En un hosting PHP separado puede implementarse posteriormente un backend de competencia real.
