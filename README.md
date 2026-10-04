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
- Antes de entrar a un nivel, elige tu **raza** en la pantalla de campaña. Cada una tiene sus torres y su pasiva.

## Razas

En la pantalla de campaña eliges con qué raza juegas. Las nueve del original están disponibles desde el principio, cada una con sus 7 torres (su líder y sus 6 unidades), su base, su decorado y su pasiva adaptada a la defensa de torres:

| Raza | Líder | Pasiva |
|---|---|---|
| Animales Locos | CrazyBunny | **RABIA**: cada torre pega un 10 % más por cada torre aliada en las casillas de alrededor, hasta +50 %. |
| No-Muertos | NecroLord | **RENACER**: al vender una torre recuperas todo el oro, así que puedes rehacer el laberinto gratis. |
| Streamers | StreamKing | **HYPE**: cada 10 bajas, todas tus torres atacan un 5 % más rápido (hasta +25 %). |
| Héroes | EpicChampion | **EXPERIENCIA**: cada 12 bajas, +5 % de daño a todas tus torres (hasta +25 %). |
| Ciberpunks | CyberMarine | **ESCUDOS**: tu base lleva un escudo de 25 que se recarga si pasa 3 s sin recibir daño. |
| Memes | MemeLord | **RNG**: cada torre sale con una mutación al azar (gigante, turbo, de cristal o normal). |
| Comunidad Gamer | ProGamer | **COMUNIDAD**: +5 % de daño por cada tipo distinto de torre en el campo (hasta +30 %). |
| Olvidados | VikingoPerdido | **NOSTALGIA**: el primer golpe de cada torre a cada enemigo hace el doble de daño. |
| Cultura Pop | LaDirectora | **SECUELA**: 3 de cada 10 ataques se repiten enseguida con la mitad de daño. |

Cada raza tiene la misma escalera de precios: una torre barata para levantar muros (45-50 de oro), torres medias (60-130), una torre grande (160) y su líder (150, solo uno en el campo). Lo que hace cada torre se lee al tocar su carta, y todos los números están en `js/td-data.js`.

## Campaña

De momento solo se puede jugar el mundo 1 (Oficinas de Microblizz: 4 niveles y el jefe SurvivalBot). Los otros 11 mundos de la historia aparecen en el mapa como bloqueados.

## Archivos

- `index.html`: la página del juego.
- `css/td.css`: aspecto (mismos colores, letras y botones que el original).
- `js/00-utils.js`: utilidades pequeñas que el arte del original necesita.
- `js/vendor/01-config.js` y `js/vendor/03-arte.js`: **copiados sin cambios** de Fans of Rumble (commit `42f2240`). Todos los personajes y edificios se dibujan con código, así que el arte es exactamente el mismo.
- `js/td-data.js`: **todo el equilibrio** de la defensa de torres (las torres y la pasiva de cada raza, enemigos, oleadas, mundos y el tamaño del campo).
- `js/td-game.js`: el motor (casillas y camino más corto, oleadas, torres, dibujo, controles y menús).

El progreso (estrellas) se guarda en el navegador.
