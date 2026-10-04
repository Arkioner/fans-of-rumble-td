# Fans of Rumble · Tower Defense

Una versión de defensa de torres de [Fans of Rumble](https://github.com/jdanielhl1984-commits/fans-of-rumble): Microblizz quiere cerrar tus juegos favoritos y sus robots marchan hacia **La Madriguera**. Pon torres en el camino para que no pase ni un becario.

## Cómo jugar

Abre `index.html` en el navegador (o sírvelo con cualquier servidor estático, por ejemplo `python3 -m http.server`).

Es un tower defense clásico de laberinto:

- El campo es una explanada de tierra tan ancha como la pantalla, dividida en casillas. Los robots salen de la sede de Microblizz (arriba) y van a **La Madriguera** (abajo).
- Arrastra una carta a una casilla, o tócala y luego toca la casilla, para poner una torre. Cada torre ocupa una casilla y bloquea el paso: con ellas construyes el laberinto.
- **No se puede cerrar el camino**: siempre tiene que quedar al menos un paso hasta La Madriguera. Si una torre lo cerraría, el juego no te deja ponerla.
- Los enemigos siempre buscan el **camino más corto**. La línea de puntos te lo enseña, y al elegir una casilla ves en amarillo cómo quedaría.
- Los que llegan a La Madriguera se quedan **atacándola** hasta que los tumbas. Si se queda sin vida, pierdes.
- Cada nivel tiene un número fijo de **oleadas**. Si acabas con todos los enemigos de la última, ganas. Cuanta más vida le quede a La Madriguera, más estrellas.
- Toca una torre para **mejorarla** (hasta el nivel 3) o **venderla** (recuperas el 60 % y el camino se vuelve a abrir).
- Pulsa **¡OLEADA!** para que empiece la siguiente oleada. Si la llamas antes de tiempo, ganas oro extra.
- **RABIA** (la pasiva de los Animales Locos): cada torre pega un 10 % más por cada torre aliada en las casillas de alrededor, hasta +50 %.

## Facciones en el orden de la historia

Las razas se unen en el mismo orden que en la campaña del original: cada mundo liberado trae su facción.

| Mundo | Lugar | Facción | Estado |
|---|---|---|---|
| 1 | Oficinas de Microblizz | Animales Locos (inicio) | Jugable: 4 niveles y el jefe SurvivalBot |
| 2 | Cementerio de juegos | No-Muertos | Próximamente |
| 3 | Plató Abandonado | Streamers | Próximamente |
| 4 | Olimpo Abandonado | Héroes | Próximamente |
| 5 | Sector Neón | Ciberpunks | Próximamente |
| 6 | El Foro Infinito | Memes | Próximamente |
| 7 | Torre de Microblizz | — | Próximamente |
| 8 | El Sótano de Microblizz | Olvidados | Próximamente |
| 9 | Tiendas sin discos | — (Phony) | Próximamente |
| 10 | La LAN Party | Comunidad Gamer | Próximamente |
| 11 | Estudios Phony | Cultura Pop | Próximamente |
| 12 | Sede de Phony | — | Próximamente |

### Torres de los Animales Locos

| Torre | Oro | Qué hace |
|---|---|---|
| CrazyBunny (líder) | 150 | Solo uno. Cada 8 s salta sobre el grupo más grande: daño en área y aturde. |
| MadSquirrel | 50 | Dos ardillas que tiran bellotas muy rápido. |
| BoomBeaver | 70 | Dinamita con daño en área. |
| SlyFox | 85 | Cada tercer golpe hace el triple. |
| MeerCat | 80 | No ataca: las torres cercanas atacan un 30 % más rápido. |
| JunkCoon | 110 | Bolsas de basura desde lejos: área y ralentiza. |
| MechaVaca | 160 | Pisotón que golpea a todos alrededor y los frena. |

## Archivos

- `index.html`: la página del juego.
- `css/td.css`: aspecto (mismos colores, letras y botones que el original).
- `js/00-utils.js`: utilidades pequeñas que el arte del original necesita.
- `js/vendor/01-config.js` y `js/vendor/03-arte.js`: **copiados sin cambios** de Fans of Rumble (commit `42f2240`). Todos los personajes y edificios se dibujan con código, así que el arte es exactamente el mismo.
- `js/td-data.js`: **todo el equilibrio** de la defensa de torres (torres, enemigos, oleadas, mundos y el tamaño del campo).
- `js/td-game.js`: el motor (casillas y camino más corto, oleadas, torres, dibujo, controles y menús).

El progreso (estrellas) se guarda en el navegador.
