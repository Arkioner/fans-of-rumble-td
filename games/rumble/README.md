# Fans of Rumble (el juego original)

Copia de [Fans of Rumble](https://github.com/jdanielhl1984-commits/fans-of-rumble) en su commit `42f2240` (versión 0.9.27), para tenerlo en el mismo repositorio y la misma web que el resto de juegos.

Los archivos son los del original, sin cambios en el código. Lo único distinto son las rutas:

- `js/01-config.js` y `js/03-arte.js` no están aquí: son idénticos a `core/js/vendor/01-config.js` y `core/js/vendor/03-arte.js`, así que `index.html` y `sw.js` los cargan de `core/`.
- Los iconos se cargan de `core/img/`.

No se han traído las partes que solo sirven para empaquetarlo como app nativa (`app/`, `capacitor.config.json`, `package.json`) ni sus herramientas de equilibrio.

## Lo que todavía no comparte con core

- **Guardado**: usa su propia partida guardada (`for-save-1`), separada de la del TD. El oro, las gemas y el inventario no son comunes todavía.
- **Progreso, menús, música y sonido**: usa sus propios archivos (`js/02-progresion.js`, `js/09-menus.js`, `js/05-audio.js`…). Los de `core/` salieron de estos, adaptados al TD.
- **El enlace de compartir** sigue apuntando a la web del original.

Para actualizar esta copia cuando cambie el original: vuelve a ejecutar la copia desde el clon y revisa que `01-config.js` y `03-arte.js` sigan siendo iguales a los de `core/`.
