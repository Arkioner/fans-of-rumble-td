# Fans of Rumble · juegos

Un solo repositorio para los juegos hechos con el mundo de [Fans of Rumble](https://github.com/jdanielhl1984-commits/fans-of-rumble): mismas razas, cartas, objetos, menús y música, y una carpeta por juego con sus propias reglas. Se publica entero, de una vez, en GitHub Pages.

Se juega en https://arkioner.github.io/fans-of-rumble-td/

## Estructura

```
index.html            la entrada de la web: el selector de juegos
sw.js                 limpia el modo sin conexión que el TD tenía antes en la raíz (no cachea nada)
core/                 LO COMÚN A TODOS LOS JUEGOS
  css/base.css          colores, letras, contornos, marco de la pantalla y capa de interfaz de 540 x 960
  css/menus.css         los menús del original; se genera con herramientas/estilos_menus.py
  img/                  iconos
  js/utils.js           utilidades pequeñas que necesita el arte
  js/vendor/            copiado sin cambios del original: razas, cartas y números (01-config), arte (03-arte),
                        canciones (05-musica), frases del chat (02-chat), iconos y frases del final (08-textos)
  js/meta.js            progreso: oro y gemas, niveles y experiencia de las cartas, habilidades, objetos, equipo, gashapón y recompensas
  js/save.js            guardado en el navegador, compartido por todos los juegos
  js/audio.js           efectos de sonido
  js/music.js           música
  js/menus.js           pantallas comunes: colección, inventario, gashapón, tienda, opciones, novedades e instalar
  js/idle.js            horas extra; se genera con herramientas/horas_extra.py
games/
  rumble/               FANS OF RUMBLE, el juego original (ver games/rumble/README.md): sus archivos sin cambios,
                        salvo que 01-config.js, 03-arte.js y los iconos los carga de core/
  td/                   FANS OF RUMBLE TD (su documentación está en games/td/README.md)
    index.html            la página del juego: carga core/ y luego lo suyo
    manifest.webmanifest  para instalarlo como app
    sw.js                 su modo sin conexión
    css/td.css            marcador, bandeja de cartas, panel de la torre y ajustes sobre los menús comunes
    js/data.js            torres, pasivas, enemigos, mundos y reglas del modo VS
    js/game.js            el motor: casillas y camino, oleadas, torres, modo VS, dibujo y controles
    js/pantallas.js       portada, campaña, antes de jugar, pausa y final
    js/extras.js          chat en directo, caja de avisos, tutorial y sus opciones
herramientas/           scripts que regeneran archivos de core/ a partir del original (games/rumble/)
```

## Qué va en cada sitio

- **core/** tiene lo que debe ser igual en todos los juegos: quiénes son las razas y sus cartas, cómo se guardan y mejoran, qué objetos y habilidades hay y cómo se equipan, el aspecto de los menús y el sonido.
- **games/<juego>/** tiene el bucle de juego y las reglas de ese modo: qué hace cada carta en ese juego, sus niveles, su marcador y sus pantallas de partida.
- El progreso se guarda una sola vez por navegador: el oro, las gemas, los niveles y el inventario son los mismos en todos los juegos.

El original (`games/rumble/`) todavía no usa el progreso, el guardado, los menús ni el sonido de `core/`: tiene los suyos, de los que salieron los de core. Unificarlos es el siguiente paso.

Dos cosas que hoy están en core y son todavía del TD: `js/meta.js` describe cada objeto con dos facetas (torre y unidad), y `js/menus.js` las enseña así. Cuando llegue el segundo juego habrá que decidir cómo las lee él.

## Añadir un juego

1. Crea `games/<nombre>/` con su `index.html`, que cargue primero lo de `core/` (copia el orden de `games/td/index.html`) y después sus propios `js/` y `css/`.
2. Si se va a instalar como app, dale su `manifest.webmanifest` y su `sw.js` (copia los del TD y cambia la lista de archivos).
3. Añade su tarjeta al selector, el `index.html` de la raíz.

## Publicar

GitHub Pages sirve la rama `gh-pages`, que es una copia de `main`. Este repositorio está configurado para que `git push` suba las dos. Con cada cambio que note el jugador hay que subir `VERSION` (en `core/js/meta.js`), el `?v=` de los enlaces de `games/td/index.html` y añadir la entrada a `NEWS` (en `core/js/menus.js`).
