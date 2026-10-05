# Fans of TD

La defensa de torres de la serie Fans Of, hecha a partir de [Fans of Rumble](https://github.com/jdanielhl1984-commits/fans-of-rumble): Microblizz quiere cerrar tus juegos favoritos y sus robots marchan hacia **La Madriguera**. Pon torres en el camino para que no pase ni un becario.

## Cómo jugar

Se juega en https://arkioner.github.io/fans-of-rumble-td/. Para probarlo en tu equipo, sirve la raíz del repositorio con cualquier servidor estático (por ejemplo `python -m http.server`) y abre `games/td/`. Abrir el archivo a mano con doble clic ya no funciona, porque el juego carga archivos de `core/`.

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

Cada raza tiene la misma escalera de precios: una torre barata para levantar muros (45-50 de CAOS), torres medias (60-130), una torre grande (160) y su líder (150, solo uno en el campo). Lo que hace cada torre se lee al tocar su carta, y todos los números están en `games/td/js/data.js`.

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

Los niveles salen de una regla (`LEVEL_RULE` en `games/td/js/data.js`): según avanzas hay más oleadas, más tipos de enemigo, más enemigos por oleada, y su vida crece más deprisa. También empiezas con un poco más de CAOS en cada mundo.

## Modo VS

En la pantalla de campaña, elige tu raza y pulsa **MODO VS** (fácil, normal o difícil). Juegas contra un rival que lleva el juego, con una raza al azar distinta de la tuya. Cada uno defiende su campo y manda unidades al del otro.

- Pulsa **ENVIAR UNIDADES** para cambiar las cartas de torres por las 6 unidades de tu raza. Cada envío cuesta CAOS, sale por la puerta del campo rival y **sube tu income** para siempre (un 15 % de lo que cuesta).
- Cada carta de unidad tiene debajo un botón **▲** para **mejorarla** dentro de la partida (hasta el nivel 3): las que envíes desde entonces tienen un 60 % más de vida y pegan un 50 % más a la base rival por nivel, al mismo precio de envío.
- El **income** es el CAOS que recibes cada 10 segundos. Empieza en 20. Aquí las bajas dan poco CAOS: viene de enviar.
- Las unidades que llegan a la base rival le quitan vida y **esa vida se suma a tu base** (hasta 150).
- Tus unidades llevan la pasiva de tu raza (los No-Muertos se levantan una vez, los Ciberpunks llevan escudo, etc.).
- El botón rojo **RIVAL** te deja mirar su campo; **VOLVER** te devuelve al tuyo.
- La vida de las unidades enviadas se dobla cada 75 segundos, así que las partidas duran unos 4 o 5 minutos.
- Gana quien tumba la base del otro.

## Fusiones

En cualquier modo, dos torres **iguales, del mismo nivel y pegadas** (arriba, abajo o a los lados) se pueden fusionar: toca una y pulsa **FUSIONAR**. La otra desaparece, deja libre su casilla y la que queda sube un nivel. Con CAOS solo se llega al nivel 3; los niveles 4 y 5 solo se consiguen fusionando. Los líderes no se fusionan.

## Progreso: oro, gemas, colección, inventario, gashapón, tienda y horas extra

Como en el original, fuera de la partida hay **oro** y **gemas**, y todo se guarda en el navegador. (Dentro de la partida, lo que gastas en torres se llama **CAOS**, también como en el original.)

Estas pantallas usan el código y los estilos del juego original, así que se ven y se manejan igual: la cartera de arriba, la colección con sus ranuras, el inventario, la máquina de cápsulas del gashapón, la tienda y la escena de las horas extra.

- **Dos facetas por carta**: cada carta es una **torre** (cuando la pones en tu campo) y una **unidad** (cuando la envías en el modo VS o la pones a hacer horas extra). Las dos comparten nivel, habilidad y equipo.
- **Colección**: una pestaña por raza. Cada carta tiene su nivel, su barra de experiencia y cuatro ranuras: habilidad, arma, cabeza y accesorio. En el original solo el líder llevaba objetos; aquí, todas las cartas.
- **Nivel**: hace falta **experiencia y oro**, hasta el nivel 10 (mismos precios que el original). Cada torre que pones y cada unidad que envías da 4 XP a su carta (hasta 60 por carta y partida, un 30 % más si ganas). Cada nivel da +6 % al daño de la torre y a la vida de la unidad.
- **Habilidades y objetos**: casi todos mejoran **solo una faceta**, y lo dicen con una etiqueta de TORRE o de UNIDAD. Cada copia está en un solo sitio a la vez.
- **Inventario**: todas tus copias con su calidad. Puedes filtrarlas, ordenarlas, bloquearlas («contrato indefinido»), volver a sortear sus números («evaluación de desempeño») o despedirlas a cambio de oro, una a una o en masa.
- **Gashapón**: 50 gemas la tirada, x1, x10 o x50, con las probabilidades del original (55 / 30 / 12 / 3 %), una épica segura por cada 10, legendaria a las 50 y calidad Director cada 10. La calidad de cada copia (de Becario a CEO) mueve sus números entre el 50 % y el 150 %.
- **Tienda**: los mismos packs de oro y gemas del original. Es la versión de prueba: no se cobra nada y te lo llevas gratis. También está el regalo diario.
- **Horas extra**: el líder que elijas sigue trabajando aunque no juegues, hasta 12 horas, y gana oro, gemas y a veces un objeto. Trabaja como **unidad**, así que lo que gana depende de su nivel y de lo que lleve para esa faceta.
- **Recompensas**: ganar un nivel por primera vez da 100 de oro y 10 gemas (300 y 50 si es el del jefe), sacar 3 estrellas por primera vez da 50 y 10 más, repetirlo da 30 de oro y perder da 10. El modo VS da 40, 60 o 90 de oro según la dificultad.

En el modo VS, el rival no lleva equipo ni niveles. Las habilidades, los objetos y todos los precios están en `core/js/meta.js`.

## Novedades (informe de parches)

Al abrir el juego después de una actualización sale una ventana con lo que ha cambiado, y se puede volver a ver en el botón NOVEDADES del menú. Con cada versión nueva hay que subir `VERSION` (en `core/js/meta.js`) y añadir su entrada al principio de `NEWS` (en `js/td-menus.js`).

## Música

Suenan las mismas canciones del original, hechas con código y sin archivos: la del menú, un tema por raza, el del jefe de cada mundo y las de victoria y derrota. La última oleada va un poco más rápida y en pausa suena apagada.

El ajuste: las 8 primeras vueltas de cada tema (32 compases) son idénticas al original. A partir de ahí, en vez de volver a empezar igual, la canción sigue subiendo de tono para siempre con la **paradoja de Shepard**. Cada nota suena en dos octavas a la vez; según sube, la de arriba se apaga y la de abajo va entrando, así que al subir una octava entera está otra vez donde empezó sin que se note el salto. Sube un semitono cada 4 compases. Los dos números están en `SHEP`, al principio de `js/td-music.js`.

## Opciones e instalar

En el menú principal, **Opciones** tiene las mismas filas que el original y en el mismo orden: volumen, música, música del menú (la de cualquier raza o jefe), números de daño, avisos de las unidades (encima o en una caja abajo a la derecha), chapas, sangre, temblor de pantalla, chat en directo, modo pruebas (todo abierto, 3.000.000 de oro y 5.000 gemas), pasar el progreso a otro dispositivo con un código, novedades, tutorial, instalar y empezar de cero.

El **chat en directo** usa las frases del original (`core/js/vendor/02-chat.js`). El **tutorial** es una partida guiada en el nivel 1-1: sale sola la primera vez y se puede repetir desde Opciones. Todo esto vive en `games/td/js/extras.js`.

**Instalar** abre el juego como una app, a pantalla completa (`manifest.webmanifest`). Instalado o no, cuando se abre desde la web guarda una copia para funcionar sin conexión (`sw.js`); siempre que hay conexión pide primero la última versión.
