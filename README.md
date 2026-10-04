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
- Pulsa **¡OLEADA!** para que empiece la siguiente oleada. Si la llamas antes de tiempo, ganas CAOS extra.
- Antes de entrar a un nivel, elige tu **raza** en la pantalla de campaña. Cada una tiene sus torres y su pasiva.

## Razas

En la pantalla de campaña eliges con qué raza juegas. Las nueve del original están disponibles desde el principio, cada una con sus 7 torres (su líder y sus 6 unidades), su base, su decorado y su pasiva adaptada a la defensa de torres:

| Raza | Líder | Pasiva |
|---|---|---|
| Animales Locos | CrazyBunny | **RABIA**: cada torre pega un 10 % más por cada torre aliada en las casillas de alrededor, hasta +50 %. |
| No-Muertos | NecroLord | **RENACER**: al vender una torre recuperas todo el CAOS, así que puedes rehacer el laberinto gratis. |
| Streamers | StreamKing | **HYPE**: cada 10 bajas, todas tus torres atacan un 5 % más rápido (hasta +25 %). |
| Héroes | EpicChampion | **EXPERIENCIA**: cada 12 bajas, +5 % de daño a todas tus torres (hasta +25 %). |
| Ciberpunks | CyberMarine | **ESCUDOS**: tu base lleva un escudo de 25 que se recarga si pasa 3 s sin recibir daño. |
| Memes | MemeLord | **RNG**: cada torre sale con una mutación al azar (gigante, turbo, de cristal o normal). |
| Comunidad Gamer | ProGamer | **COMUNIDAD**: +5 % de daño por cada tipo distinto de torre en el campo (hasta +30 %). |
| Olvidados | VikingoPerdido | **NOSTALGIA**: el primer golpe de cada torre a cada enemigo hace el doble de daño. |
| Cultura Pop | LaDirectora | **SECUELA**: 3 de cada 10 ataques se repiten enseguida con la mitad de daño. |

Cada raza tiene la misma escalera de precios: una torre barata para levantar muros (45-50 de CAOS), torres medias (60-130), una torre grande (160) y su líder (150, solo uno en el campo). Lo que hace cada torre se lee al tocar su carta, y todos los números están en `js/td-data.js`.

## Campaña

Los 12 mundos de la historia del original, con sus nombres de nivel y sus jefes. Cada mundo tiene 4 niveles (el 4.º trae al jefe en la última oleada) y se abre al terminar el anterior.

| Mundo | Lugar | Enemigos | Su truco | Jefe |
|---|---|---|---|---|
| 1 | Oficinas de Microblizz | Microblizz | Ninguno | SurvivalBot |
| 2 | Cementerio de juegos | No-Muertos corrompidos | Cada enemigo se levanta una vez con el 60 % de su vida | NecroLord corrupto |
| 3 | Plató Abandonado | Streamers corrompidos | Corren un 20 % más | StreamKing corrupto |
| 4 | Olimpo Abandonado | Héroes corrompidos | Se hacen más duros con cada oleada | EpicChampion corrupto |
| 5 | Sector Neón | Ciberpunks corrompidos | Escudo del 25 % que se recarga | CyberMarine corrupto |
| 6 | El Foro Infinito | Memes corrompidos | Mutación al azar | MemeLord corrupto |
| 7 | Torre de Microblizz | Microblizz | Ninguno | El CEO de Microblizz |
| 8 | El Sótano de Microblizz | Olvidados corrompidos | Tus torres tardan 2 s en dispararles | VikingoPerdido corrupto |
| 9 | Tiendas sin discos | Phony | Cada golpe a tu base te quita 2 de CAOS | PayStation sin lector |
| 10 | La LAN Party | Gamers corrompidos | Mucha más vida | ProGamer corrupto |
| 11 | Estudios Phony | Cultura Pop corrompida | 3 de cada 10 vuelven en versión «2» | LaDirectora corrupta |
| 12 | Sede de Phony | Phony | Cada golpe a tu base te quita 2 de CAOS | El Presidente de Phony |

Los jefes dejan sin atacar a tu torre más cercana, sacan refuerzos, o las dos cosas. Tu base también se defiende sola: dispara a los enemigos que la están golpeando, así que un enemigo suelto no te hace perder.

Los niveles salen de una regla (`LEVEL_RULE` en `js/td-data.js`): según avanzas hay más oleadas, más tipos de enemigo, más enemigos por oleada, y su vida crece más deprisa. También empiezas con un poco más de CAOS en cada mundo.

## Modo VS

En la pantalla de campaña, elige tu raza y pulsa **MODO VS** (fácil, normal o difícil). Juegas contra un rival que lleva el juego, con una raza al azar distinta de la tuya. Cada uno defiende su campo y manda unidades al del otro.

- Pulsa **ENVIAR UNIDADES** para cambiar las cartas de torres por las 6 unidades de tu raza. Cada envío cuesta CAOS, sale por la puerta del campo rival y **sube tu income** para siempre.
- El **income** es el CAOS que recibes cada 10 segundos. Empieza en 20. Aquí las bajas dan poco CAOS: viene de enviar.
- Las unidades que llegan a la base rival le quitan vida y **esa vida se suma a tu base** (hasta 150).
- Tus unidades llevan la pasiva de tu raza (los No-Muertos se levantan una vez, los Ciberpunks llevan escudo, etc.).
- El botón rojo **RIVAL** te deja mirar su campo; **VOLVER** te devuelve al tuyo.
- La vida de las unidades enviadas se dobla cada 75 segundos, así que las partidas duran unos 4 o 5 minutos.
- Gana quien tumba la base del otro.

## Fusiones

En cualquier modo, dos torres **iguales, del mismo nivel y pegadas** (arriba, abajo o a los lados) se pueden fusionar: toca una y pulsa **FUSIONAR**. La otra desaparece, deja libre su casilla y la que queda sube un nivel. Con CAOS solo se llega al nivel 3; los niveles 4 y 5 solo se consiguen fusionando. Los líderes no se fusionan.

## Progreso: oro, gemas, equipo, gashapón, tienda y horas extra

Como en el original, fuera de la partida hay **oro** y **gemas**, y todo se guarda en el navegador. (Dentro de la partida, lo que gastas en torres ahora se llama **CAOS**, también como en el original.)

- **Menú principal**: JUGAR (campaña y modo VS), EQUIPO, GASHAPÓN, TIENDA y el panel de HORAS EXTRA.
- **Recompensas**: ganar un nivel por primera vez da 100 de oro y 10 gemas (300 y 50 si es el del jefe), sacar 3 estrellas por primera vez da 50 y 10 más, repetirlo da 30 de oro y perder da 10. El modo VS da 40, 60 o 90 de oro según la dificultad.
- **Dos facetas por carta**: cada carta es una **torre** (cuando la pones en tu campo) y una **unidad** (cuando la envías en el modo VS o la pones a hacer horas extra). Las dos comparten nivel, habilidad y equipo.
- **Nivel**: se sube con oro hasta el 10 (mismos precios que el original). Cada nivel da +6 % al daño de la torre y a la vida de la unidad.
- **Habilidad y equipo**: cada carta lleva una habilidad, un arma, algo en la cabeza y un accesorio. Casi todos mejoran **solo una faceta** (por ejemplo, Puños de hierro sube el daño de la torre y Piel dura la vida de la unidad), así que hay que elegir qué prefieres mejorar. Cada objeto está en un solo sitio a la vez.
- **Gashapón**: 50 gemas la tirada (450 las diez), con las probabilidades del original (55 / 30 / 12 / 3 %), garantía de épica cada 10 y de legendaria a las 50, y la calidad de cada copia (de Becario a CEO), que mueve sus números entre el 50 % y el 150 %. Lo que sobra se «despide» a cambio de oro.
- **Tienda**: los mismos packs de oro y gemas del original. Es la versión de prueba: no se cobra nada y te lo llevas gratis. También está el regalo diario.
- **Horas extra**: el líder que elijas sigue trabajando aunque no juegues, hasta 12 horas. Trabaja como **unidad**, así que lo que gana por hora depende de su nivel y de lo que lleve para esa faceta.

En el modo VS, el rival no lleva equipo ni niveles. Las habilidades, los objetos y todos los precios están en `js/td-meta.js`.

## Archivos

- `index.html`: la página del juego.
- `css/td.css`: aspecto (mismos colores, letras y botones que el original).
- `js/00-utils.js`: utilidades pequeñas que el arte del original necesita.
- `js/vendor/01-config.js` y `js/vendor/03-arte.js`: **copiados sin cambios** de Fans of Rumble (commit `42f2240`). Todos los personajes y edificios se dibujan con código, así que el arte es exactamente el mismo.
- `js/td-data.js`: **todo el equilibrio** de la defensa de torres (las torres y la pasiva de cada raza, enemigos, oleadas, mundos y el tamaño del campo).
- `js/td-meta.js`: el progreso fuera de la partida (oro y gemas, niveles, habilidades, equipo, gashapón, tienda y horas extra).
- `js/td-game.js`: el motor (casillas y camino más corto, oleadas, torres, dibujo, controles y menús).

El progreso (estrellas) se guarda en el navegador.
