// Fans of Rumble TD · Datos: torres de cada facción, enemigos y mundos (en el orden de la historia del original)
'use strict';
/* =========================================================
   Todo lo que se puede equilibrar vive aquí.
   Los nombres, el arte y los números base salen de js/vendor/01-config.js (el juego original):
   aquí solo se convierten en torres y oleadas.
   ========================================================= */
const TD = {
  startGold: 400,
  baseHp: 100,            // vida de La Madriguera: los enemigos que llegan la atacan hasta tirarla
  baseAtkCd: 1,           // cada enemigo pega a La Madriguera una vez por segundo
  sellBack: 0.6,          // al vender una torre recuperas el 60 % de lo invertido
  maxLevel: 3,
  upCost: [0, 0.8, 1.2],  // mejorar a nivel 2 cuesta el 80 % del precio; a nivel 3, el 120 %
  upDmg: 0.4,             // +40 % de daño por nivel
  upRange: 0.1,           // +10 % de alcance por nivel
  waveBonus: w => 35 + w * 6,
  earlyBonus: 0.5,        // llamar la oleada antes de tiempo: oro extra por cada segundo que te ahorras
  hpGrowth: 0.10,         // cada oleada, los enemigos tienen un 10 % más de vida
  foeHp: 0.85,            // los enemigos tienen el 85 % de la vida del original (aquí no pelean: solo andan)
  rage: { radius: 52, perAlly: 0.10, max: 5 },   // pasiva RABIA del original, ahora entre torres vecinas (las 8 casillas de alrededor)
};

// Torres de cada facción. key = carta del original (su arte, nombre y descripción vienen de CFG.cards)
// kind: 'hit' (golpe al primero que tiene a tiro), 'shot' (proyectil), 'lob' (proyectil en arco con daño en área),
//       'stomp' (golpea a todos los que tiene alrededor), 'aura' (no ataca: mejora a las torres cercanas)
const TOWERS = {
  animales: {
    bunny:     { cost: 150, kind: 'hit',   dmg: 26, cd: 1.0, range: 85,  leader: true, jump: { cd: 8, range: 220, r: 72, dmg: 70, stun: 0.6 },
                 desc: 'Líder (solo uno). Pega fuerte y cada 8 s salta sobre el grupo más grande: daño en área y los deja aturdidos.' },
    squirrel:  { cost: 50, kind: 'shot',  dmg: 11, cd: 0.42, range: 105, shot: 'nut',
                 desc: 'Dos ardillas que tiran bellotas a toda velocidad. Baratas y nunca paran.' },
    beaver:    { cost: 70, kind: 'lob',   dmg: 38, cd: 1.9, range: 115, splash: 48, shot: 'dyn',
                 desc: 'Lanza cartuchos de dinamita: daño en área, ideal para los grupos de becarios.' },
    fox:       { cost: 85, kind: 'hit',   dmg: 30, cd: 1.1, range: 95, crit: { every: 3, mult: 3 },
                 desc: 'Ataca desde las sombras: cada tercer golpe hace el triple. Perfecta contra los tanques.' },
    meercat:   { cost: 80, kind: 'aura',  dmg: 0,  cd: 1,   range: 95, aura: { speed: 0.3 },
                 desc: 'La enfermera no pega: las torres que tiene alrededor atacan un 30 % más rápido.' },
    junkcoon:  { cost: 110, kind: 'lob',   dmg: 34, cd: 1.5, range: 145, splash: 44, shot: 'trash', slow: { f: 0.6, t: 1.2 },
                 desc: 'Bolsas de basura desde muy lejos: daño en área y los enemigos pringados van más lentos.' },
    mechavaca: { cost: 160, kind: 'stomp', dmg: 46, cd: 1.4, range: 72, slow: { f: 0.5, t: 1 },
                 desc: 'Un mecha rosa con una vaca dentro. Cada pisotón golpea a todos los que tiene cerca y los frena.' },
  },
};

// Enemigos (Microblizz). hp y speed se toman de CFG.units; aquí va lo propio de la defensa de torres.
// leak: daño que hace a La Madriguera cada vez que la golpea.
const FOES = {
  becario:    { gold: 7,  leak: 1, cost: 1 },
  starbot:    { gold: 10,  leak: 1, cost: 1.6 },
  soportebot: { gold: 12, leak: 1, cost: 2.4 },
  cajabotin:  { gold: 14, leak: 2, cost: 2.8, eject: 'becario', ejectN: 3 },
  fallen:     { gold: 28, leak: 4, cost: 5.5 },
  parchebot:  { gold: 30, leak: 3, cost: 6 },
  // jefe del mundo 1: SurvivalBot. Usa el arte de FallenHero, más grande, y despide torres (las deja 2,5 s sin atacar)
  survivalbot:{ gold: 200, leak: 20, cost: 0, art: 'fallen', name: 'SurvivalBot', hp: 6000, speed: 18, r: 30, scale: 1.65, boss: true, despido: { cd: 7, range: 170, t: 2.5 } },
};
const foeHp = k => FOES[k].hp || CFG.units[k].hp * TD.foeHp;
const foeSpeed = k => FOES[k].speed || CFG.units[k].speed;
const foeName = k => FOES[k].name || CFG.enemyCards[k].name;

// Las razas se unen en el orden de la historia del original: cada mundo liberado trae su facción.
const WORLDS_TD = [
  { name: 'Oficinas de Microblizz', efac: 'microblizz', joins: 'animales', story: 'Microblizz ha comprado el estudio que hacía tus juegos favoritos. Lo primero: despedir a la gente y poner robots. Los Animales Locos defienden La Madriguera.',
    levels: [
      { name: 'La compra',          waves: 8,  hp: 1.0,  deck: ['becario', 'starbot'] },
      { name: 'Cartas de despido',  waves: 10, hp: 1.0,  deck: ['becario', 'starbot', 'fallen'] },
      { name: 'Cierre del estudio', waves: 12, hp: 1.1,  deck: ['becario', 'starbot', 'fallen', 'cajabotin', 'soportebot'] },
      { name: 'SurvivalBot',        waves: 12, hp: 1.2,  deck: ['becario', 'starbot', 'fallen', 'cajabotin', 'soportebot', 'parchebot'], boss: 'survivalbot' }] },
  { name: 'Cementerio de juegos',   efac: 'nomuertos', joins: 'nomuertos' },
  { name: 'Plató Abandonado',       efac: 'streamers', joins: 'streamers' },
  { name: 'Olimpo Abandonado',      efac: 'heroes',    joins: 'heroes' },
  { name: 'Sector Neón',            efac: 'ciber',     joins: 'ciber' },
  { name: 'El Foro Infinito',       efac: 'memes',     joins: 'memes' },
  { name: 'Torre de Microblizz',    efac: 'microblizz' },
  { name: 'El Sótano de Microblizz', efac: 'olvidados', joins: 'olvidados' },
  { name: 'Tiendas sin discos',     efac: 'phony' },
  { name: 'La LAN Party',           efac: 'gamer',     joins: 'gamer' },
  { name: 'Estudios Phony',         efac: 'pop',       joins: 'pop' },
  { name: 'Sede de Phony',          efac: 'phony' },
];
// mundo 1: la facción de inicio. Del mundo 2 en adelante, liberar el mundo hace que su facción se una a ti.
WORLDS_TD.forEach((w, wi) => (w.levels || []).forEach((l, li) => { l.id = `${wi + 1}-${li + 1}`; l.wi = wi; l.li = li; }));

// Campo: una explanada de tierra tan ancha como la pantalla, dividida en casillas. Los enemigos salen de la sede de Microblizz
// (arriba) y buscan siempre el camino más corto hasta La Madriguera (abajo). Cada torre ocupa una casilla: con ellas formas
// el laberinto, pero nunca se puede cerrar el paso del todo.
const GRID = { cols: 15, rows: 15, cell: 36, x0: 0, y0: 180, gate: 1 };   // gate: casillas a cada lado del centro que forman la entrada y la salida
const TOWER_R = 17;        // radio de la peana de una torre
