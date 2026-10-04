// Fans of Rumble TD · Progreso fuera de la partida: oro y gemas, niveles de carta, habilidades, equipo, gashapón, tienda y horas extra.
// Equivale a lo del original (mismos nombres, rarezas, calidades y precios), adaptado a la defensa de torres.
'use strict';
/* =========================================================
   Cada carta tiene DOS FACETAS que comparten nivel, habilidad y equipo:
     · TORRE  (T): cuando la pones en tu campo.
     · UNIDAD (U): cuando la envías al rival en el modo VS o la pones a hacer horas extra.
   Casi todo lo que te equipas mejora solo una faceta, así que hay que elegir cuál prefieres.
   ========================================================= */
const ECON = {
  lvlStep: 0.06, maxLvl: 10,                                           // +6 % por nivel: daño de la torre y vida de la unidad
  goldCost: [0, 50, 100, 200, 400, 750, 1500, 3000, 6000, 12000],      // oro para pasar del nivel i al i+1
  camp: { first: [100, 10], replay: 30, stars3: [50, 10], boss: [300, 50], lose: 10 },   // [oro, gemas]
  vs: { facil: 40, normal: 60, dificil: 90, lose: 10 },                // oro por partida en modo VS
  pull: 50, pull10: 450,                                               // gemas por tirada
  odds: { common: 55, rare: 30, epic: 12, legendary: 3 },              // probabilidades del gashapón (%)
  pityEpic: 10, pityLeg: 50,                                           // garantía: épica o mejor cada 10, legendaria a las 50
  start: { gold: 150, gems: 100 },
  scrap: { common: 25, rare: 60, epic: 150, legendary: 400 },          // oro al despedir una copia (más si es de buena calidad)
};
const RARITY = { common: ['Común', '#63cfe0', '#2a7895'], rare: ['Rara', '#ffb04f', '#cf5a16'], epic: ['Épica', '#d08cff', '#6d28c9'], legendary: ['Legendaria', '#ffe06a', '#c47f10'] };
// calidad de cada copia: sus números salen entre el 50 % y el 150 % del valor central
const QTIERS = [
  { name: 'Becario (básica)', p: 30, lo: 0, hi: 0.4, col: '#b4bccb', scrap: 1 },
  { name: 'Junior (normal)', p: 40, lo: 0.4, hi: 0.7, col: '#63cfe0', scrap: 1.5 },
  { name: 'Senior (buena)', p: 20, lo: 0.7, hi: 0.88, col: '#8cf05a', scrap: 2 },
  { name: 'Director (excelente)', p: 9, lo: 0.88, hi: 0.99, col: '#e2a8ff', scrap: 3 },
  { name: 'CEO (perfecta)', p: 1, lo: 1, hi: 1, col: '#ffcb3d', scrap: 5 },
];
function rollQ() { let x = Math.random() * 100; for (const t of QTIERS) { if (x < t.p) return Math.floor((t.lo + Math.random() * (t.hi - t.lo)) * 1000) / 1000; x -= t.p; } return 1; }
const tierOf = q => (q >= 1 ? 4 : q >= 0.88 ? 3 : q >= 0.7 ? 2 : q >= 0.4 ? 1 : 0);

// Lo que puede mejorar cada faceta. [texto, es un porcentaje]
const STATS = {
  T: { dmg: ['{v} % de daño', 1], range: ['{v} % de alcance', 1], spd: ['ataca un {v} % más rápido', 1], crit: ['el {v} % de sus golpes son críticos (triple)', 1], splash: ['cada golpe salpica el {v} % del daño alrededor', 1],
       slowT: ['sus golpes frenan al enemigo {v} s', 0], chain: ['cada golpe salta a otro enemigo con el {v} % del daño', 1], grito: ['cada 9 s aturde {v} s a los enemigos cercanos', 0],
       furia: ['con tu base a menos de la mitad, +{v} % de daño', 1], iman: ['cada enemigo que derrota da {v} de CAOS extra', 0], desp: ['los jefes la dejan parada un {v} % menos de tiempo', 1] },
  U: { hp: ['{v} % de vida', 1], speed: ['{v} % de velocidad', 1], armor: ['recibe un {v} % menos de daño', 1], shield: ['escudo del {v} % de su vida que se recarga', 1], fog: ['las torres rivales tardan {v} s en verla', 0],
       steal: ['roba un {v} % más de vida a la base rival', 1], revive: ['revive una vez con el {v} % de su vida', 1], clon: ['al caer se divide en 2 copias con el {v} % de su vida', 1], rush: ['los primeros {v} s va al triple de velocidad', 0],
       dodge: ['esquiva el {v} % de los golpes', 1], caos: ['al llegar a la base rival le roba {v} de CAOS', 0], regen: ['se cura un {v} % de su vida cada segundo', 1], cc: ['inmune a aturdimientos y frenazos', 0],
       pause: ['una vez, cuando va a caer, es invulnerable {v} s', 0], leak: ['{v} % de daño a la base rival', 1] },
};
const SIGNED = { dmg: 1, range: 1, hp: 1, speed: 1, leak: 1 };   // estos se escriben con + o −
// fx: [faceta, qué mejora, valor central]. Un valor negativo es una pega y no cambia con la calidad.
// Gashapón de habilidades: una por carta
const ABILITIES = {
  cafeina:  { name: 'Cafeína', rar: 'common', fx: [['U', 'speed', 22]] },
  piel:     { name: 'Piel dura', rar: 'common', fx: [['U', 'hp', 22]] },
  punos:    { name: 'Puños de hierro', rar: 'common', fx: [['T', 'dmg', 18]] },
  reflejos: { name: 'Reflejos', rar: 'common', fx: [['T', 'spd', 18]] },
  speedrun: { name: 'Speedrun', rar: 'common', fx: [['U', 'rush', 3]] },
  plasma:   { name: 'Escudo de plasma', rar: 'rare', fx: [['U', 'shield', 25]] },
  sigilo:   { name: 'Sigilo inicial', rar: 'rare', fx: [['U', 'fog', 2.5]] },
  escarcha: { name: 'Escarcha', rar: 'rare', fx: [['T', 'slowT', 1.3]] },
  vampiro:  { name: 'Vampirismo', rar: 'rare', fx: [['U', 'steal', 40]] },
  hitbox:   { name: 'Hitbox dudosa', rar: 'rare', fx: [['U', 'dodge', 15]] },
  microtrans: { name: 'Microtransacción', rar: 'rare', fx: [['U', 'caos', 8]] },
  cadena:   { name: 'Rayo en cadena', rar: 'epic', fx: [['T', 'chain', 60]] },
  renacer:  { name: 'Renacer', rar: 'epic', fx: [['U', 'revive', 50]] },
  grito:    { name: 'Grito', rar: 'epic', fx: [['T', 'grito', 1]] },
  iman:     { name: 'Imán de CAOS', rar: 'epic', fx: [['T', 'iman', 2]] },
  clon:     { name: 'Clon viral', rar: 'legendary', fx: [['U', 'clon', 40]] },
  furia:    { name: 'Furia legendaria', rar: 'legendary', fx: [['T', 'furia', 40]] },
  gigante:  { name: 'Modo gigante', rar: 'legendary', fx: [['U', 'hp', 40], ['U', 'leak', 40], ['U', 'speed', -15]] },
};
// Gashapón de equipamiento: arma, cabeza y accesorio
const SLOTS = { ab: 'Habilidad', weapon: 'Arma', head: 'Cabeza', acc: 'Accesorio' };
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
  gorro_aluminio:{ name: 'Gorro de papel de aluminio', slot: 'head', rar: 'epic', fx: [['T', 'desp', 70], ['U', 'hp', 10]] },
  orejas_gato:   { name: 'Diadema de orejas de gato', slot: 'head', rar: 'epic', fx: [['U', 'armor', 20]] },
  auriculares:   { name: 'Auriculares con cancelación de ruido', slot: 'head', rar: 'legendary', fx: [['U', 'cc', 1], ['U', 'hp', 15]] },
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
// Tienda (como en el original: versión de prueba, no se cobra nada)
const SHOP = {
  gold: [{ name: 'Puñado de oro', amt: 1000, eur: 0.99, note: 'Para ir tirando.' }, { name: 'Saco de oro', amt: 6000, eur: 4.99, note: 'El CEO te lo agradece personalmente (no).' }, { name: 'Cofre de oro', amt: 13000, eur: 9.99, note: 'Huele a los millones de Microblizz.' },
    { name: 'Cámara acorazada', amt: 28000, eur: 19.99, note: 'Incluye la llave. La puerta no.' }, { name: 'Bóveda del CEO', amt: 75000, eur: 49.99, note: 'Para subir cartas al 10 sin mirar el precio.' }],
  gems: [{ name: 'Bolsita de gemas', amt: 100, eur: 0.99, note: 'Dos tiradas del gashapón.' }, { name: 'Puñado de gemas', amt: 550, eur: 4.99, note: 'Brillan más que el futuro de Microblizz.' }, { name: 'Saco de gemas', amt: 1200, eur: 9.99, note: '' },
    { name: 'Cofre de gemas', amt: 2600, eur: 19.99, note: '' }, { name: 'Caja fuerte de gemas', amt: 7000, eur: 49.99, note: 'Ni el becario sabe la combinación.' }],
  gift: { gold: 100, gems: 5 },   // regalo diario
};
// Horas extra: el líder que elijas sigue trabajando (como UNIDAD) aunque no juegues. Se llena a las 12 h.
const IDLE = { cap: 12, gold: 60, gExp: 1.6, gems: 1, gemsK: 2.5, item: 0.02, itemK: 0.05 };

/* ---------- guardado ---------- */
function metaDefaults(s) {
  const d = { gold: ECON.start.gold, gems: ECON.start.gems, cards: {}, inv: [], seq: 0, gear: {}, pity: { ab: 0, abL: 0, eq: 0, eqL: 0 }, giftDay: '', idle: null };
  for (const k in d) if (s[k] == null) s[k] = d[k];
  return s;
}
const fmt = n => Math.floor(n).toLocaleString('es-ES');
const cardLvl = k => (SAVE.cards[k] && SAVE.cards[k].lvl) || 1;
const invGet = n => (n ? SAVE.inv.find(it => it.n === n) : null);
const defOf = it => (it.k === 'ab' ? ABILITIES : ITEMS)[it.id];
const slotOf = it => (it.k === 'ab' ? 'ab' : ITEMS[it.id].slot);
const gearOf = k => SAVE.gear[k] || (SAVE.gear[k] = {});
const wearerOf = n => Object.keys(SAVE.gear).find(k => Object.values(SAVE.gear[k]).includes(n));
const facOfCard = k => FACTION_ORDER.find(f => FACTIONS[f].leader === k || FACTIONS[f].units.includes(k));
// los números de una copia: valor central x (50 % + calidad)
const fxOf = it => defOf(it).fx.map(([side, st, c]) => [side, st, c < 0 || st === 'cc' ? c : Math.round(c * (0.5 + it.q) * (c < 5 ? 100 : 10)) / (c < 5 ? 100 : 10)]);
function fxText(it) {
  const by = { T: [], U: [] };
  for (const [side, st, v] of fxOf(it)) { const [txt] = STATS[side][st]; by[side].push((SIGNED[st] ? (v < 0 ? '−' : '+') : '') + txt.replace('{v}', String(Math.abs(v)).replace('.', ','))); }
  return (by.T.length ? `<span class="fx-t"><b>TORRE</b> ${by.T.join(' y ')}.</span>` : '') + (by.U.length ? `<span class="fx-u"><b>UNIDAD</b> ${by.U.join(' y ')}.</span>` : '');
}
// todo lo que lleva una carta, sumado y listo para el motor
const NOMODS = { lvl: 1, lvlMul: 1, n: 0, T: {}, U: {} };
function cardMods(k) {
  const lvl = cardLvl(k), M = { lvl, lvlMul: 1 + ECON.lvlStep * (lvl - 1), n: 0, T: {}, U: {} }, g = SAVE.gear[k] || {};
  for (const sl in SLOTS) { const it = invGet(g[sl]); if (!it) continue; M.n++; for (const [side, st, v] of fxOf(it)) M[side][st] = (M[side][st] || 0) + (STATS[side][st][1] ? v / 100 : v); }
  return M;
}

// lo mismo para la faceta de UNIDAD: se aplica a cada unidad tuya que sale en el campo rival
function unitGear(f) {
  const M = cardMods(f.k), U = M.U; f.U = U;
  f.hp = f.maxHp = Math.max(1, Math.round(f.maxHp * M.lvlMul * Math.max(0.2, 1 + (U.hp || 0))));
  f.speed *= Math.max(0.3, 1 + (U.speed || 0)); f.armor = 1 - (1 - f.armor) * (1 - (U.armor || 0));
  if (U.shield) { f.shMax += Math.round(f.maxHp * U.shield); f.sh = f.shMax; }
  f.fog += U.fog || 0; f.rushT = U.rush || 0; f.cc = !!U.cc; if (U.leak > 0.2) f.sc *= 1.2;
}

/* ---------- niveles de carta ---------- */
function levelUp(k) {
  const l = cardLvl(k), c = ECON.goldCost[l]; if (l >= ECON.maxLvl || SAVE.gold < c) return false;
  SAVE.gold -= c; SAVE.cards[k] = { lvl: l + 1 }; saveGame(); return true;
}
/* ---------- equipar ---------- */
function equip(k, it) {
  const w = wearerOf(it.n); if (w) for (const sl in SAVE.gear[w]) if (SAVE.gear[w][sl] === it.n) delete SAVE.gear[w][sl];
  gearOf(k)[slotOf(it)] = it.n; saveGame();
}
function unequip(k, sl) { delete gearOf(k)[sl]; saveGame(); }
const scrapOf = it => Math.round(ECON.scrap[defOf(it).rar] * QTIERS[tierOf(it.q)].scrap);
function scrap(it) { const w = wearerOf(it.n); if (w) for (const sl in SAVE.gear[w]) if (SAVE.gear[w][sl] === it.n) delete SAVE.gear[w][sl]; SAVE.inv = SAVE.inv.filter(o => o !== it); SAVE.gold += scrapOf(it); saveGame(); }

/* ---------- gashapón ---------- */
function newCopy(kind, id) { const it = { n: ++SAVE.seq, k: kind, id, q: rollQ() }; SAVE.inv.push(it); return it; }
function rollCopy(kind) {
  const DB = kind === 'ab' ? ABILITIES : ITEMS, P = SAVE.pity, e = kind, L = kind + 'L';
  P[e]++; P[L]++;
  let x = Math.random() * 100, rar = 'common'; for (const r of ['legendary', 'epic', 'rare']) { if (x < ECON.odds[r]) { rar = r; break; } x -= ECON.odds[r]; }
  if (P[L] >= ECON.pityLeg) rar = 'legendary'; else if (P[e] >= ECON.pityEpic && (rar === 'common' || rar === 'rare')) rar = 'epic';
  if (rar === 'legendary') { P[L] = 0; P[e] = 0; } else if (rar === 'epic') P[e] = 0;
  return newCopy(kind, pick(Object.keys(DB).filter(id => DB[id].rar === rar)));
}
function pull(kind, n) {
  const cost = n === 10 ? ECON.pull10 : ECON.pull * n; if (SAVE.gems < cost) return null;
  SAVE.gems -= cost; const got = []; for (let i = 0; i < n; i++) got.push(rollCopy(kind)); saveGame(); return got;
}

/* ---------- recompensas de las partidas ---------- */
function campReward(L, win, st, first, first3) {
  const C = ECON.camp; let gold = 0, gems = 0;
  if (!win) gold = C.lose; else if (first) { const r = L.boss ? C.boss : C.first; gold = r[0]; gems = r[1]; } else gold = C.replay;
  if (win && first3) { gold += C.stars3[0]; gems += C.stars3[1]; }
  return give(gold, gems);
}
const vsReward = (win, diff) => give(win ? ECON.vs[diff] : ECON.vs.lose, 0);
function give(gold, gems) { SAVE.gold += gold; SAVE.gems += gems; saveGame(); return `<span class="rw">+${fmt(gold)} de oro${gems ? ` y +${gems} gemas` : ''}</span>`; }

/* ---------- horas extra ---------- */
function idleState() {
  const I = SAVE.idle || (SAVE.idle = { fac: 'animales', h: 0, gold: 0, gems: 0, items: 0, last: Date.now() });
  if (!TOWERS[I.fac]) I.fac = 'animales'; if (!(I.last > 0)) I.last = Date.now();
  return I;
}
// poder del líder como UNIDAD: 100 = nivel 1 sin nada. Sube con el nivel y con lo que lleve para la faceta de unidad.
function idlePower(fac) {
  const M = cardMods(FACTIONS[fac].leader), U = M.U;
  const tough = (1 + (U.hp || 0)) * (1 + (U.shield || 0)) / (1 - Math.min(0.6, (U.armor || 0) + (U.dodge || 0))) * (1 + (U.revive || 0) + 2 * (U.clon || 0)) * (1 + 5 * (U.regen || 0));
  const punch = (1 + (U.leak || 0)) * (1 + (U.speed || 0) + 0.1 * (U.rush || 0)) * (1 + (U.steal || 0) * 0.5) * (1 + 0.04 * (U.fog || 0) + 0.04 * (U.pause || 0) + 0.01 * (U.caos || 0) + (U.cc ? 0.1 : 0));
  return M.lvlMul * Math.sqrt(Math.max(0.2, tough) * Math.max(0.2, punch));
}
function idleRates(fac) { const pw = idlePower(fac); return { pw, gold: IDLE.gold * Math.pow(pw, IDLE.gExp), gems: IDLE.gems + (pw - 1) * IDLE.gemsK, item: IDLE.item + (pw - 1) * IDLE.itemK }; }
function idleTick() {
  const I = idleState(), now = Date.now(), dh = Math.max(0, Math.min((now - I.last) / 3600000, IDLE.cap - I.h)), R = idleRates(I.fac); I.last = now;
  if (dh > 0) { I.h += dh; I.gold += R.gold * dh; I.gems += R.gems * dh; I.items += R.item * dh; }
  return I;
}
function idleCollect() {
  const I = idleTick(), g = Math.floor(I.gold), gm = Math.floor(I.gems), ni = Math.floor(I.items); if (g < 1 && gm < 1 && ni < 1) return null;
  I.gold -= g; I.gems -= gm; I.items -= ni; I.h = 0; SAVE.gold += g; SAVE.gems += gm;
  const got = []; for (let i = 0; i < ni; i++) got.push(rollCopy(Math.random() < 0.5 ? 'ab' : 'eq'));
  saveGame(); return { g, gm, got };
}

/* =========================================================
   PANTALLAS
   ========================================================= */
const COIN = '<span class="coin"></span>', GEM = '<span class="gem"></span>';
const eur = v => v.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
function wallets() { for (const w of document.querySelectorAll('[data-wallet]')) w.innerHTML = `<span class="chip ol">${COIN}${fmt(SAVE.gold)}</span><span class="chip ol">${GEM}${fmt(SAVE.gems)}</span>`; }
function toast(s) { const t = $('#toast'); t.innerHTML = s; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); }
function copyHtml(it, extra = '') {
  const D = defOf(it), R = RARITY[D.rar], Q = QTIERS[tierOf(it.q)], w = wearerOf(it.n);
  return `<div class="copy" style="--rc:${R[1]}"><div class="cp-h"><b class="ol">${D.name}</b><span>${SLOTS[slotOf(it)]} · ${R[0]}${D.fac ? ' · solo ' + FACTIONS[D.fac].name : ''}</span></div><div class="cp-q" style="color:${Q.col}">Calidad ${Q.name} · ${Math.round(50 + it.q * 100)} %</div><div class="cp-fx">${fxText(it)}</div>${w ? `<div class="cp-w">La lleva ${CFG.cards[w].name}</div>` : ''}${extra}</div>`;
}

/* ---------- menú principal ---------- */
function showMenu() {
  G.screen = 'title'; G.vs = null; showScreen('scr-title'); wallets(); idleUI();
  $('#gift-dot').hidden = SAVE.giftDay === new Date().toDateString();
}
function idleUI() {
  const I = idleTick(), R = idleRates(I.fac), k = FACTIONS[I.fac].leader, full = I.h >= IDLE.cap - 1e-6;
  $('#idle-box').innerHTML = `<canvas id="idle-art"></canvas><div class="idle-t"><b class="ol">HORAS EXTRA</b><span>${CFG.cards[k].name} trabaja como unidad · poder ${Math.round(R.pw * 100)}</span><span>Cada hora: ${fmt(R.gold)} de oro y ${String(Math.round(R.gems * 10) / 10).replace('.', ',')} gemas</span>
    <span class="idle-bar"><i style="width:${(I.h / IDLE.cap) * 100}%"></i></span><span>${full ? '¡Lleno! Cobra para que siga.' : `Lleva ${String(Math.floor(I.h * 10) / 10).replace('.', ',')} de ${IDLE.cap} h`} · ${COIN}${fmt(I.gold)} ${GEM}${fmt(I.gems)}</span></div>
    <div class="idle-b"><button class="btn-up" id="idle-get">COBRAR</button><button class="btn-sell" id="idle-swap">CAMBIAR</button></div>`;
  requestAnimationFrame(() => portrait($('#idle-art'), k, 62));
  $('#idle-get').onclick = () => { const r = idleCollect(); if (!r) { toast('Todavía no hay nada. ¡Dale un rato a tu líder!'); return; } sfx('coin'); toast(`Horas extra: +${fmt(r.g)} de oro${r.gm ? ` y +${r.gm} gemas` : ''}${r.got.length ? `<br>¡Y ha encontrado ${r.got.map(it => defOf(it).name).join(', ')}!` : ''}`); wallets(); idleUI(); };
  $('#idle-swap').onclick = () => { const L = FACTION_ORDER.filter(f => TOWERS[f]), I2 = idleTick(); I2.fac = L[(L.indexOf(I2.fac) + 1) % L.length]; saveGame(); sfx('place'); idleUI(); };
}

/* ---------- equipo (colección) ---------- */
let collFac = 'animales', cardOpen = null;
function showColl() {
  G.screen = 'coll'; showScreen('scr-coll'); wallets();
  const box = $('#coll-facs');
  box.innerHTML = FACTION_ORDER.filter(f => TOWERS[f]).map(f => `<button class="fac${f === collFac ? ' sel' : ''}" data-f="${f}" aria-label="${FACTIONS[f].name}"><canvas></canvas></button>`).join('');
  for (const b of box.children) b.onclick = () => { collFac = b.dataset.f; sfx('place'); showColl(); };
  requestAnimationFrame(() => { for (const b of box.children) portrait(b.querySelector('canvas'), FACTIONS[b.dataset.f].leader, 42); });
  const ks = Object.keys(TOWERS[collFac]);
  $('#coll-list').innerHTML = `<div class="coll-n ol">${FACTIONS[collFac].name} · ${SAVE.inv.length} objetos en el inventario</div>` + ks.map(k => {
    const C = CFG.cards[k], g = SAVE.gear[k] || {}, n = Object.keys(SLOTS).filter(sl => invGet(g[sl])).length;
    return `<button class="ccard r-${C.rarity}" data-k="${k}"><canvas></canvas><span class="cc-t"><b class="ol">${C.name}</b><small>Nivel ${cardLvl(k)} · ${n} de 4 equipado</small></span><span class="cc-s">${Object.keys(SLOTS).map(sl => { const it = invGet(g[sl]); return `<i style="${it ? 'background:' + RARITY[defOf(it).rar][1] : ''}"></i>`; }).join('')}</span></button>`;
  }).join('');
  for (const b of $('#coll-list').querySelectorAll('.ccard')) { b.onclick = () => { sfx('place'); showCard(b.dataset.k); }; requestAnimationFrame(() => portrait(b.querySelector('canvas'), b.dataset.k, 44)); }
}
const pct = v => (v >= 0 ? '+' : '−') + Math.abs(Math.round(v * 100)) + ' %';
function showCard(k) {
  cardOpen = k; const C = CFG.cards[k], D = TOWERS[facOfCard(k)][k], U = CFG.units[k], M = cardMods(k), l = M.lvl, cost = ECON.goldCost[l], g = SAVE.gear[k] || {};
  const tD = D.kind === 'aura' ? 'Apoyo' : `${Math.round(D.dmg * M.lvlMul * (1 + (M.T.dmg || 0)))} de daño`, uH = Math.round(U.hp * M.lvlMul * (1 + (M.U.hp || 0)));
  $('#card-box').innerHTML = `<div class="cd-h"><canvas id="card-art"></canvas><div><div class="cd-n ol">${C.name}</div><div class="cd-l">Nivel ${l} de ${ECON.maxLvl} · ${pct(M.lvlMul - 1)} a las dos facetas</div>
      <button class="btn-up" id="card-up" ${l >= ECON.maxLvl || SAVE.gold < cost ? 'disabled' : ''}>${l >= ECON.maxLvl ? 'NIVEL MÁXIMO' : `SUBIR NIVEL<small>${fmt(cost)} de oro</small>`}</button></div></div>
    <div class="cd-f"><span class="fx-t"><b>TORRE</b> ${tD} · alcance ${Math.round(D.range * (1 + (M.T.range || 0)))}${M.T.spd ? ' · ' + pct(M.T.spd) + ' vel. ataque' : ''}</span><span class="fx-u"><b>UNIDAD</b> ${fmt(uH)} de vida · velocidad ${Math.round(U.speed * (1 + (M.U.speed || 0)))}</span></div>
    <p class="cd-p">La torre y su unidad comparten nivel, habilidad y equipo. Casi todo mejora solo una faceta: elige cuál prefieres.</p>
    <div class="cd-s">${Object.keys(SLOTS).map(sl => { const it = invGet(g[sl]); return `<button class="slot" data-sl="${sl}" style="${it ? '--rc:' + RARITY[defOf(it).rar][1] : ''}"><b>${SLOTS[sl]}</b>${it ? `<span class="ol">${defOf(it).name}</span><small>${fxText(it)}</small>` : '<span class="empty">Vacío · toca para equipar</span>'}</button>`; }).join('')}</div>
    <button class="btn-ghost ol" id="card-close">CERRAR</button>`;
  $('#scr-card').hidden = false; requestAnimationFrame(() => portrait($('#card-art'), k, 80));
  $('#card-up').onclick = () => { if (levelUp(k)) { sfx('up'); wallets(); showCard(k); } };
  $('#card-close').onclick = () => { $('#scr-card').hidden = true; showColl(); };
  for (const b of $('#card-box').querySelectorAll('.slot')) b.onclick = () => { sfx('place'); showPick(k, b.dataset.sl); };
}
function showPick(k, sl) {
  const fac = facOfCard(k), cur = (SAVE.gear[k] || {})[sl];
  const L = SAVE.inv.filter(it => slotOf(it) === sl && (!defOf(it).fac || defOf(it).fac === fac)).sort((a, b) => Object.keys(RARITY).indexOf(defOf(b).rar) - Object.keys(RARITY).indexOf(defOf(a).rar) || b.q - a.q);
  $('#pick-box').innerHTML = `<div class="cd-n ol">${SLOTS[sl]} de ${CFG.cards[k].name}</div><div class="pick-l">${L.length ? L.map(it => copyHtml(it, `<div class="cp-b"><button class="btn-up" data-eq="${it.n}" ${it.n === cur ? 'disabled' : ''}>${it.n === cur ? 'PUESTO' : 'EQUIPAR'}</button><button class="btn-sell" data-sc="${it.n}">DESPEDIR<small>+${scrapOf(it)} oro</small></button></div>`)).join('') : `<p class="cd-p">No tienes nada para este hueco. Consíguelo en el gashapón de ${sl === 'ab' ? 'habilidades' : 'equipo'}.</p>`}</div>
    <div class="cp-b">${cur ? '<button class="btn-sell" id="pick-off">QUITAR</button>' : ''}<button class="btn-ghost ol" id="pick-close">VOLVER</button></div>`;
  $('#scr-pick').hidden = false;
  const back = () => { $('#scr-pick').hidden = true; showCard(k); };
  $('#pick-close').onclick = back; if (cur) $('#pick-off').onclick = () => { unequip(k, sl); sfx('place'); back(); };
  for (const b of $('#pick-box').querySelectorAll('[data-eq]')) b.onclick = () => { equip(k, invGet(+b.dataset.eq)); sfx('up'); back(); };
  for (const b of $('#pick-box').querySelectorAll('[data-sc]')) b.onclick = () => { scrap(invGet(+b.dataset.sc)); sfx('coin'); wallets(); showPick(k, sl); };
}

/* ---------- gashapón ---------- */
let gachaKind = 'ab';
function showGacha() {
  G.screen = 'gacha'; showScreen('scr-gacha'); wallets();
  for (const b of document.querySelectorAll('[data-gt]')) { b.setAttribute('aria-pressed', String(b.dataset.gt === gachaKind)); b.onclick = () => { gachaKind = b.dataset.gt; sfx('place'); showGacha(); }; }
  const P = SAVE.pity, O = ECON.odds;
  $('#gacha-sub').textContent = gachaKind === 'ab' ? 'Habilidades: una por carta. Unas mejoran la torre y otras la unidad.' : 'Equipo: arma, cabeza y accesorio para cualquier carta.';
  $('#gacha-odds').innerHTML = `Común ${O.common} % · Rara ${O.rare} % · Épica ${O.epic} % · Legendaria ${O.legendary} %<br>Épica o mejor garantizada en ${ECON.pityEpic - P[gachaKind]} tiradas · Legendaria en ${ECON.pityLeg - P[gachaKind + 'L']}<br>Calidad: ${QTIERS.map(t => `<span style="color:${t.col}">${t.name.split(' ')[0]} ${t.p} %</span>`).join(' · ')}`;
  $('#pull-1').innerHTML = `TIRAR x1<small>${GEM}${ECON.pull}</small>`; $('#pull-10').innerHTML = `TIRAR x10<small>${GEM}${ECON.pull10}</small>`;
  const go = n => { const got = pull(gachaKind, n); if (!got) { toast('No tienes gemas suficientes. En la tienda hay (y es gratis).'); sfx('womp'); return; } sfx(got.some(it => defOf(it).rar === 'legendary') ? 'win' : 'up'); $('#gacha-res').innerHTML = got.map(it => copyHtml(it)).join(''); $('#gacha-res').scrollTop = 0; showGacha(); };
  $('#pull-1').onclick = () => go(1); $('#pull-10').onclick = () => go(10);
}

/* ---------- tienda ---------- */
let shopTab = 'gold';
function showShop() {
  G.screen = 'shop'; showScreen('scr-shop'); wallets();
  const today = new Date().toDateString(), ready = SAVE.giftDay !== today, g = SHOP.gift;
  $('#gift-row').innerHTML = `<div class="pack gift"><div><div class="pk-name ol">Regalo diario</div><div class="pk-note">${COIN}${g.gold} y ${GEM}${g.gems}, una vez al día.</div></div><button class="btn-up" id="gift-get" ${ready ? '' : 'disabled'}>${ready ? 'RECOGER' : 'MAÑANA'}</button></div>`;
  $('#gift-get').onclick = () => { SAVE.giftDay = today; SAVE.gold += g.gold; SAVE.gems += g.gems; saveGame(); sfx('coin'); toast(`Regalo diario: +${g.gold} de oro y +${g.gems} gemas`); showShop(); };
  for (const b of document.querySelectorAll('[data-st]')) { b.setAttribute('aria-pressed', String(b.dataset.st === shopTab)); b.onclick = () => { shopTab = b.dataset.st; sfx('place'); showShop(); }; }
  const gem = shopTab === 'gems', L = SHOP[shopTab];
  $('#shop-list').innerHTML = L.map((p, i) => `<div class="pack"><div><div class="pk-name ol">${p.name}</div><div class="pk-amt ol">${gem ? GEM : COIN}${fmt(p.amt)}</div><div class="pk-note">${p.note}</div></div><button class="btn-up" data-buy="${i}">${eur(p.eur)}<small>gratis</small></button></div>`).join('');
  for (const b of $('#shop-list').querySelectorAll('[data-buy]')) b.onclick = () => { const p = L[+b.dataset.buy]; SAVE[gem ? 'gems' : 'gold'] += p.amt; saveGame(); sfx('coin'); toast(`${p.name}: +${fmt(p.amt)} ${gem ? 'gemas' : 'de oro'}. No se ha cobrado nada.`); wallets(); };
}
