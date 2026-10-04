// Fans of Rumble TD · Progreso fuera de la partida: datos y reglas (oro y gemas, niveles, habilidades, equipo, gashapón, tienda y horas extra).
// Mismos nombres, rarezas, calidades, precios y forma de guardar que el original (js/02-progresion.js), adaptados a la defensa de torres.
// Las pantallas están en js/td-menus.js y js/td-idle.js.
'use strict';
/* =========================================================
   Cada carta tiene DOS FACETAS que comparten nivel, habilidad y equipo:
     · TORRE  (T): cuando la pones en tu campo.
     · UNIDAD (U): cuando la envías al rival en el modo VS o la pones a hacer horas extra.
   Casi todo lo que te equipas mejora solo una faceta, así que hay que elegir cuál prefieres.
   ========================================================= */
const VERSION = '0.8.1';
const ECON = {
  lvlStep: 0.06, maxLvl: 10,                                                     // +6 % por nivel: daño de la torre y vida de la unidad
  xpNeed:   [0, 50, 100, 175, 300, 500, 800, 1300, 2000, 3200],                  // XP para pasar del nivel i al i+1
  goldCost: [0, 50, 100, 200, 400, 750, 1500, 3000, 6000, 12000],                // oro para pasar del nivel i al i+1
  xpPerPlay: 4, xpCap: 60, winXpMult: 1.3,                                                  // XP por cada torre que pones o unidad que envías (hasta 60 por carta y partida); +30 % si ganas
  camp: { first: [100, 10], replay: 30, stars3: [50, 10], boss: [300, 50], lose: 10 },   // [oro, gemas]
  vs: { facil: 40, normal: 60, dificil: 90, lose: 10 },                          // oro por partida en modo VS
  pull: 50,                                                                      // gemas por tirada
  odds: { common: 55, rare: 30, epic: 12, legendary: 3 },                        // probabilidades del gashapón (%)
  pityEpic: 10, pityLeg: 50, pityQ: 10,                                          // garantías: épica cada 10, legendaria a las 50, calidad Director cada 10
  start: { gold: 150, gems: 100 },
  scrap: { common: 25, rare: 60, epic: 150, legendary: 400 },                    // oro al despedir una copia (más si es de buena calidad)
  reroll: { common: 250, rare: 500, epic: 1000, legendary: 2000 },               // oro por volver a tirar los números de una copia
};
const RARITY = { common: ['Común', '#63cfe0', '#2a7895'], rare: ['Rara', '#ffb04f', '#cf5a16'], epic: ['Épica', '#d08cff', '#6d28c9'], legendary: ['Legendaria', '#ffe06a', '#c47f10'] };
// calidad de cada copia: cada efecto sale entre el 50 % (calidad 0) y el 150 % (calidad 100) de su valor central
const QTIERS = [
  { name: 'Becario (básica)', p: 30, lo: 0, hi: 0.4, col: '#b4bccb' },
  { name: 'Junior (normal)', p: 40, lo: 0.4, hi: 0.7, col: '#63cfe0' },
  { name: 'Senior (buena)', p: 20, lo: 0.7, hi: 0.88, col: '#8cf05a' },
  { name: 'Director (excelente)', p: 9, lo: 0.88, hi: 0.99, col: '#e2a8ff' },
  { name: 'CEO (perfecta)', p: 1, lo: 1, hi: 1, col: '#ffcb3d' },
];
function rollQ(minTier) {
  const pool = QTIERS.slice(minTier || 0); let x = Math.random() * pool.reduce((a, t) => a + t.p, 0);
  for (const t of pool) { if (x < t.p) return Math.floor((t.lo + Math.random() * (t.hi - t.lo)) * 1000) / 1000; x -= t.p; }
  return 1;
}
const tierOf = q => (q >= 1 ? 4 : q >= 0.88 ? 3 : q >= 0.7 ? 2 : q >= 0.4 ? 1 : 0);
const avgQ = it => it.q.reduce((a, b) => a + b, 0) / it.q.length;

// Lo que puede mejorar cada faceta. [texto, es un porcentaje, se escribe con signo]
const STATS = {
  T: { dmg: ['{v} % de daño', 1, 1], range: ['{v} % de alcance', 1, 1], spd: ['ataca un {v} % más rápido', 1], crit: ['el {v} % de sus golpes son críticos (triple)', 1], splash: ['cada golpe salpica el {v} % del daño alrededor', 1],
       slowT: ['sus golpes frenan al enemigo {v} s', 0], chain: ['cada golpe salta a otro enemigo con el {v} % del daño', 1], grito: ['cada 9 s aturde {v} s a los enemigos cercanos', 0],
       furia: ['con tu base a menos de la mitad, +{v} % de daño', 1], iman: ['cada enemigo que derrota da {v} de CAOS extra', 0], desp: ['los jefes la dejan parada un {v} % menos de tiempo', 1] },
  U: { hp: ['{v} % de vida', 1, 1], speed: ['{v} % de velocidad', 1, 1], armor: ['recibe un {v} % menos de daño', 1], shield: ['escudo del {v} % de su vida que se recarga', 1], fog: ['las torres rivales tardan {v} s en verla', 0],
       steal: ['roba un {v} % más de vida a la base rival', 1], revive: ['revive una vez con el {v} % de su vida', 1], clon: ['al caer se divide en 2 copias con el {v} % de su vida', 1], rush: ['los primeros {v} s va al triple de velocidad', 0],
       dodge: ['esquiva el {v} % de los golpes', 1], caos: ['al llegar a la base rival le roba {v} de CAOS', 0], regen: ['se cura un {v} % de su vida cada segundo', 1], cc: ['inmune a aturdimientos y frenazos', 0],
       pause: ['una vez, cuando va a caer, es invulnerable {v} s', 0], leak: ['{v} % de daño a la base rival', 1, 1] },
};
// fx: [faceta, qué mejora, valor central]. Un valor negativo es una pega y no cambia con la calidad. ic: las dos letras del icono (como en el original).
// Gashapón de habilidades: una por carta
const ABILITIES = {
  cafeina:  { name: 'Cafeína', rar: 'common', ic: 'CF', fx: [['U', 'speed', 22]] },
  piel:     { name: 'Piel dura', rar: 'common', ic: 'PD', fx: [['U', 'hp', 22]] },
  punos:    { name: 'Puños de hierro', rar: 'common', ic: 'PH', fx: [['T', 'dmg', 18]] },
  reflejos: { name: 'Reflejos', rar: 'common', ic: 'RF', fx: [['T', 'spd', 18]] },
  speedrun: { name: 'Speedrun', rar: 'common', ic: 'SR', fx: [['U', 'rush', 3]] },
  plasma:   { name: 'Escudo de plasma', rar: 'rare', fac: 'ciber', ic: 'EP', fx: [['U', 'shield', 25]] },
  sigilo:   { name: 'Sigilo inicial', rar: 'rare', fac: 'animales', ic: 'SG', fx: [['U', 'fog', 2.5]] },
  escarcha: { name: 'Escarcha', rar: 'rare', fac: 'nomuertos', ic: 'ES', fx: [['T', 'slowT', 1.3]] },
  vampiro:  { name: 'Vampirismo', rar: 'rare', ic: 'VP', fx: [['U', 'steal', 40]] },
  hitbox:   { name: 'Hitbox dudosa', rar: 'rare', ic: 'HB', fx: [['U', 'dodge', 15]] },
  microtrans: { name: 'Microtransacción', rar: 'rare', ic: 'MT', fx: [['U', 'caos', 8]] },
  cadena:   { name: 'Rayo en cadena', rar: 'epic', fac: 'heroes', ic: 'RC', fx: [['T', 'chain', 60]] },
  renacer:  { name: 'Renacer', rar: 'epic', fac: 'nomuertos', ic: 'RN', fx: [['U', 'revive', 50]] },
  grito:    { name: 'Grito', rar: 'epic', fac: 'nomuertos', ic: 'GR', fx: [['T', 'grito', 1]] },
  iman:     { name: 'Imán de CAOS', rar: 'epic', ic: 'IC', fx: [['T', 'iman', 2]] },
  clon:     { name: 'Clon viral', rar: 'legendary', fac: 'memes', ic: 'CV', fx: [['U', 'clon', 40]] },
  furia:    { name: 'Furia legendaria', rar: 'legendary', ic: 'FL', fx: [['T', 'furia', 40]] },
  gigante:  { name: 'Modo gigante', rar: 'legendary', ic: 'MG', fx: [['U', 'hp', 40], ['U', 'leak', 40], ['U', 'speed', -15]] },
};
// Gashapón de equipamiento: arma, cabeza y accesorio. En el original solo los llevaba el líder; aquí, cualquier carta.
const SLOTS = { weapon: 'Arma', head: 'Cabeza', acc: 'Accesorio' };
const ITEMS = {
  espada_carton: { name: 'Espada de cartón piedra', slot: 'weapon', rar: 'common', fx: [['T', 'dmg', 10]] },
  mando_cable:   { name: 'Mando con cable de 3 metros', slot: 'weapon', rar: 'common', fx: [['T', 'range', 15]] },
  raton_dpi:     { name: 'Ratón de 16.000 DPI', slot: 'weapon', rar: 'rare', fx: [['T', 'range', 12], ['T', 'dmg', 10]] },
  baguette:      { name: 'Baguette de ayer', slot: 'weapon', rar: 'rare', fx: [['T', 'crit', 20]] },
  teclado_rgb:   { name: 'Teclado mecánico RGB', slot: 'weapon', rar: 'epic', fx: [['T', 'spd', 25]] },
  lanzaconfeti:  { name: 'Lanzaconfeti', slot: 'weapon', rar: 'epic', fx: [['T', 'splash', 40]] },
  banhammer_oro: { name: 'BanHammer de oro', slot: 'weapon', rar: 'legendary', fx: [['T', 'dmg', 25], ['T', 'slowT', 0.6]] },
  cuernos:       { name: 'Casco con cuernos', slot: 'head', rar: 'common', fx: [['U', 'hp', 15]] },
  gorra_reves:   { name: 'Gorra del revés', slot: 'head', rar: 'common', fx: [['U', 'speed', 12]] },
  corona_carton: { name: 'Corona de hamburguesería', slot: 'head', rar: 'rare', fx: [['U', 'hp', 10], ['T', 'dmg', 10]] },
  casco_vr:      { name: 'Casco de realidad virtual', slot: 'head', rar: 'rare', fx: [['T', 'dmg', 25], ['U', 'hp', -10]] },
  gorro_aluminio:{ name: 'Gorro de papel de aluminio', slot: 'head', rar: 'epic', fx: [['T', 'desp', 60], ['U', 'hp', 10]] },
  orejas_gato:   { name: 'Diadema de orejas de gato', slot: 'head', rar: 'epic', fx: [['U', 'armor', 20]] },
  auriculares:   { name: 'Auriculares con cancelación de ruido', slot: 'head', rar: 'legendary', fx: [['U', 'cc', 0], ['U', 'hp', 15]] },
  taza:          { name: 'Taza del becario', slot: 'acc', rar: 'common', fx: [['U', 'regen', 1]] },
  pase_caducado: { name: 'Pase de batalla caducado', slot: 'acc', rar: 'common', fx: [['T', 'dmg', 3], ['U', 'hp', 3]] },
  almohada:      { name: 'Almohada de viaje', slot: 'acc', rar: 'rare', fx: [['T', 'desp', 40]] },
  disco_fisico:  { name: 'Disco físico de coleccionista', slot: 'acc', rar: 'rare', fx: [['U', 'hp', 18]] },
  silla_gamer:   { name: 'Silla gamer portátil', slot: 'acc', rar: 'epic', fx: [['U', 'armor', 15]] },
  alfombrilla:   { name: 'Alfombrilla XXL', slot: 'acc', rar: 'epic', fx: [['T', 'range', 15]] },
  boton_pausa:   { name: 'Botón de pausa', slot: 'acc', rar: 'legendary', fx: [['U', 'pause', 3]] },
  // objetos de facción: más fuertes, pero solo los pueden llevar las cartas de su raza
  zanahoria_oro:   { name: 'Zanahoria de oro', slot: 'weapon', rar: 'legendary', fac: 'animales', fx: [['T', 'dmg', 22], ['U', 'speed', 15]] },
  corona_huesos:   { name: 'Corona de huesos', slot: 'head', rar: 'legendary', fac: 'nomuertos', fx: [['U', 'hp', 22], ['U', 'regen', 1.5]] },
  microfono_oro:   { name: 'Micrófono de oro', slot: 'acc', rar: 'legendary', fac: 'streamers', fx: [['T', 'dmg', 18], ['T', 'spd', 10]] },
  yelmo_olimpo:    { name: 'Yelmo del Olimpo', slot: 'head', rar: 'legendary', fac: 'heroes', fx: [['U', 'hp', 20], ['U', 'armor', 14]] },
  nucleo_plasma:   { name: 'Núcleo de plasma', slot: 'acc', rar: 'legendary', fac: 'ciber', fx: [['U', 'shield', 45], ['T', 'dmg', 15]] },
  gafas_pixel:     { name: 'Gafas pixeladas', slot: 'head', rar: 'legendary', fac: 'memes', fx: [['T', 'crit', 22], ['U', 'speed', 15]] },
  raton_campeon:   { name: 'Ratón del campeón', slot: 'weapon', rar: 'legendary', fac: 'gamer', fx: [['T', 'spd', 28], ['T', 'range', 15]] },
  cartucho_dorado: { name: 'Cartucho dorado', slot: 'acc', rar: 'legendary', fac: 'olvidados', fx: [['T', 'dmg', 15], ['U', 'fog', 2]] },
  claqueta_oro:    { name: 'Claqueta de oro', slot: 'weapon', rar: 'legendary', fac: 'pop', fx: [['T', 'dmg', 18], ['T', 'splash', 35]] },
};
// De cada «fx» salen lo que el original guardaba a mano: st (los valores centrales que cambian con la calidad) y desc (el texto con {0}, {1}…)
for (const DB of [ABILITIES, ITEMS]) for (const id in DB) {
  const D = DB[id], by = { T: [], U: [] }; D.st = []; D.fi = [];
  D.fx.forEach(([side, st, c]) => {
    const [txt, , signed] = STATS[side][st], fixed = c <= 0;
    if (!fixed) { D.fi.push(D.st.length); D.st.push(c); } else D.fi.push(-1);
    by[side].push((signed ? (c < 0 ? '−' : '+') : '') + txt.replace('{v}', fixed ? String(Math.abs(c)) : '{' + (D.st.length - 1) + '}'));
  });
  D.desc = (by.T.length ? `<i class="ft">TORRE</i> ${by.T.join(' y ')}. ` : '') + (by.U.length ? `<i class="fu">UNIDAD</i> ${by.U.join(' y ')}.` : '');
  D.side = by.T.length && by.U.length ? 'TU' : by.T.length ? 'T' : 'U';
}
const fitsFac = (id, f) => !ITEMS[id] || !ITEMS[id].fac || ITEMS[id].fac === f;
const defOf = it => (it.k === 'ab' ? ABILITIES : ITEMS)[it.id];
const statDec = c => (c < 5 ? 2 : 1);
const statsOf = it => defOf(it).st.map(c => ({ c, dec: statDec(c) }));
const rnd = (v, dec) => { const m = Math.pow(10, dec); return Math.round(v * m) / m; };
const valsOf = it => statsOf(it).map((st, i) => rnd(st.c * (0.5 + (it.q[i] == null ? 0.5 : it.q[i])), st.dec));

// Tienda (como en el original: versión de prueba, no se cobra nada)
const SHOP = {
  gold: [
    { id: 'g1', name: 'Puñado de oro', amt: 1000, eur: 0.99, note: 'Para ir tirando.' },
    { id: 'g2', name: 'Saco de oro', amt: 6000, eur: 4.99, note: 'El CEO te lo agradece personalmente (no).' },
    { id: 'g3', name: 'Cofre de oro', amt: 13000, eur: 9.99, note: 'Huele a los millones de Microblizz.' },
    { id: 'g4', name: 'Cámara acorazada', amt: 28000, eur: 19.99, note: 'Incluye la llave. La puerta no.' },
    { id: 'g5', name: 'Bóveda del CEO', amt: 75000, eur: 49.99, note: 'Para subir cartas al 10 sin mirar el precio.' },
  ],
  gems: [
    { id: 'e1', name: 'Bolsita de gemas', amt: 100, eur: 0.99, note: 'Dos tiradas del gashapón.' },
    { id: 'e2', name: 'Puñado de gemas', amt: 550, eur: 4.99, note: 'Brillan más que el futuro de Microblizz.' },
    { id: 'e3', name: 'Saco de gemas', amt: 1200, eur: 9.99, note: '' },
    { id: 'e4', name: 'Cofre de gemas', amt: 2600, eur: 19.99, note: '' },
    { id: 'e5', name: 'Caja fuerte de gemas', amt: 7000, eur: 49.99, note: 'Ni el becario sabe la combinación.' },
  ],
  joke: { name: 'Paquete Millonario', amt: 1000000, was: 500, eur: 100 },
  gift: { gold: 100, gems: 5 },
};

/* ---------- guardado (misma forma que el del original) ---------- */
function metaDefaults(s) {
  const d = { gold: ECON.start.gold, gems: ECON.start.gems, units: {}, inv: [], invSeq: 0, abEquip: {}, equip: {}, pity: {}, giftDay: '', idle: null, seenVer: '', tickets: 0 };
  for (const k in d) if (s[k] == null) s[k] = d[k];
  // partidas guardadas con la primera versión del progreso: nivel por carta, un solo número de calidad y todo el equipo junto
  if (s.cards) { for (const k in s.cards) s.units[k] = { lvl: s.cards[k].lvl || 1, xp: 0 }; delete s.cards; }
  for (const it of s.inv) { if (!it.u) { it.u = 'i' + it.n; delete it.n; } if (!Array.isArray(it.q)) it.q = defOfSafe(it) ? defOfSafe(it).st.map(() => it.q) : [it.q]; }
  if (s.gear) { for (const k in s.gear) for (const sl in s.gear[k]) { const u = 'i' + s.gear[k][sl]; if (sl === 'ab') s.abEquip[k] = u; else (s.equip[k] = s.equip[k] || {})[sl] = u; } delete s.gear; }
  if (s.seq) { s.invSeq = Math.max(s.invSeq, s.seq); delete s.seq; }
  s.inv = s.inv.filter(it => defOfSafe(it));
  return s;
}
const defOfSafe = it => (it.k === 'ab' ? ABILITIES : ITEMS)[it.id];
const uSave = k => SAVE.units[k] || (SAVE.units[k] = { lvl: 1, xp: 0 });
const invGet = u => (u ? SAVE.inv.find(it => it.u === u) : null);
const facOfCard = k => FACTION_ORDER.find(f => FACTIONS[f].leader === k || FACTIONS[f].units.includes(k));
const isUnlocked = () => true;   // en la defensa de torres todas las razas están disponibles desde el principio

/* ---------- lo que lleva una carta, sumado y listo para el motor ---------- */
const NOMODS = { lvl: 1, lvlMul: 1, n: 0, T: {}, U: {} };
function cardMods(k) {
  const lvl = (SAVE.units[k] && SAVE.units[k].lvl) || 1, M = { lvl, lvlMul: 1 + ECON.lvlStep * (lvl - 1), n: 0, T: {}, U: {} }, E = SAVE.equip[k] || {};
  for (const it of [invGet(SAVE.abEquip[k]), ...Object.keys(SLOTS).map(sl => invGet(E[sl]))]) {
    if (!it) continue; const D = defOf(it), V = valsOf(it); M.n++;
    D.fx.forEach(([side, st, c], i) => { const v = D.fi[i] < 0 ? c : V[D.fi[i]]; M[side][st] = (M[side][st] || 0) + (st === 'cc' ? 1 : STATS[side][st][1] ? v / 100 : v); });
  }
  return M;
}
// la faceta de UNIDAD se aplica a cada unidad tuya que sale en el campo rival
function unitGear(f) {
  const M = cardMods(f.k), U = M.U; f.U = U;
  f.hp = f.maxHp = Math.max(1, Math.round(f.maxHp * M.lvlMul * Math.max(0.2, 1 + (U.hp || 0))));
  f.speed *= Math.max(0.3, 1 + (U.speed || 0)); f.armor = 1 - (1 - f.armor) * (1 - (U.armor || 0));
  if (U.shield) { f.shMax += Math.round(f.maxHp * U.shield); f.sh = f.shMax; }
  f.fog += U.fog || 0; f.rushT = U.rush || 0; f.cc = !!U.cc; if (U.leak > 0.2) f.sc *= 1.2;
}
// los números que enseña la colección (como effStats del original): vida de la unidad, daño de la torre y qué le suma lo que lleva
function effStats(k) {
  const M = cardMods(k), fac = facOfCard(k), D = TOWERS[fac][k], U = CFG.units[k], b = [], pc = v => (v > 0 ? '+' : '−') + Math.abs(Math.round(v * 100)) + ' %';
  if (M.T.dmg) b.push('torre ' + pc(M.T.dmg) + ' de daño'); if (M.T.range) b.push('torre ' + pc(M.T.range) + ' de alcance'); if (M.T.spd) b.push('torre ' + pc(M.T.spd) + ' de velocidad de ataque');
  if (M.U.hp) b.push('unidad ' + pc(M.U.hp) + ' de vida'); if (M.U.speed) b.push('unidad ' + pc(M.U.speed) + ' de velocidad');
  const extra = Object.keys(M.T).filter(s => !['dmg', 'range', 'spd'].includes(s)).length + Object.keys(M.U).filter(s => !['hp', 'speed'].includes(s)).length; if (extra) b.push(extra > 1 ? `${extra} efectos más` : '1 efecto más');
  return { M, hp: U.hp * M.lvlMul * Math.max(0.2, 1 + (M.U.hp || 0)), dmg: D.dmg * M.lvlMul * (1 + (M.T.dmg || 0)), range: D.range * (1 + (M.T.range || 0)), aura: D.kind === 'aura', boosts: b };
}

/* ---------- experiencia y recompensas de las partidas ---------- */
// cada torre que pones y cada unidad que envías da experiencia a su carta; se cobra al acabar la partida
function xpPlay(k) { if (G.vs && G.vsCur === 'ai') return; const X = G.xpPlay || (G.xpPlay = {}); X[k] = Math.min(ECON.xpCap, (X[k] || 0) + ECON.xpPerPlay); }
function xpGrant(win) { const X = G.xpPlay || {}; let n = 0; for (const k in X) { const g = Math.round(X[k] * (win ? ECON.winXpMult : 1)); uSave(k).xp += g; n += g; } G.xpPlay = {}; return n; }
function campReward(L, win, st, first, first3) {
  const C = ECON.camp; let gold = 0, gems = 0;
  if (!win) gold = C.lose; else if (first) { const r = L.boss ? C.boss : C.first; gold = r[0]; gems = r[1]; } else gold = C.replay;
  if (win && first3) { gold += C.stars3[0]; gems += C.stars3[1]; }
  return give(gold, gems, xpGrant(win));
}
const vsReward = (win, diff) => give(win ? ECON.vs[diff] : ECON.vs.lose, 0, xpGrant(win));
function give(gold, gems, xp) { SAVE.gold += gold; SAVE.gems += gems; saveGame(); return `<span class="rw">+${fmt(gold)} de oro${gems ? ` y +${gems} gemas` : ''}${xp ? ` · +${fmt(xp)} XP para tus cartas` : ''}</span>`; }

/* ---------- horas extra: el líder que elijas sigue trabajando (como UNIDAD) aunque no juegues. Se llena a las 12 h ---------- */
const IDLE = { cap: 12, gold: 60, gExp: 1.6, gems: 1, gemsK: 2.5, item: 0.02, itemK: 0.05 };
// poder del líder: 100 = nivel 1 sin nada. Sube con el nivel y con lo que lleve para la faceta de unidad.
function idlePower(fac) {
  const M = cardMods(FACTIONS[fac].leader), U = M.U;
  const tough = (1 + (U.hp || 0)) * (1 + (U.shield || 0)) / (1 - Math.min(0.6, (U.armor || 0) + (U.dodge || 0))) * (1 + (U.revive || 0) + 2 * (U.clon || 0)) * (1 + 5 * (U.regen || 0));
  const punch = (1 + (U.leak || 0)) * (1 + (U.speed || 0) + 0.1 * (U.rush || 0)) * (1 + (U.steal || 0) * 0.5) * (1 + 0.04 * (U.fog || 0) + 0.04 * (U.pause || 0) + 0.01 * (U.caos || 0) + (U.cc ? 0.1 : 0));
  return Math.max(1, M.lvlMul * Math.sqrt(Math.max(0.2, tough) * Math.max(0.2, punch)) + 0.05 * M.n);
}
