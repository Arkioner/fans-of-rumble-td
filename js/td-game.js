// Fans of Rumble TD · Motor: oleadas, torres, dibujo y controles
'use strict';
/* =========================================================
   ESTADO
   ========================================================= */
const SAVE_KEY = 'fortd-save';
function loadSave() { try { const o = JSON.parse(localStorage.getItem(SAVE_KEY)); if (o && o.v === 1) return metaDefaults(o); } catch (e) { /* sin almacenamiento */ } return metaDefaults({ v: 1, stars: {}, muted: false }); }
let SAVE = loadSave();
function saveGame() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) { /* el progreso vive en memoria */ } }
const starsOf = id => SAVE.stars[id] || 0;
const levelOpen = L => L.li === 0 ? L.wi === 0 || worldDone(L.wi - 1) : starsOf(WORLDS_TD[L.wi].levels[L.li - 1].id) > 0;
const worldDone = wi => { const w = WORLDS_TD[wi]; return !!w.levels && w.levels.every(l => starsOf(l.id) > 0); };

const G = { screen: 'title', t: 0, speed: 1, paused: false, level: null, gold: 0, lives: 0, wave: 0, waves: 0, inWave: false, nextT: 0, spawnQ: [], spawnT: 0,
  foes: [], towers: [], projs: [], parts: [], nums: [], place: null, ghost: null, sel: null, leaderOut: false, over: false, fac: 'animales', boss: null };
let uid = 0;

/* ---------- campo en casillas y camino más corto ---------- */
const COLS = GRID.cols, ROWS = GRID.rows, CELL = GRID.cell, GX = GRID.x0, GY = GRID.y0, GY1 = GY + ROWS * CELL, NCELL = COLS * ROWS;
const HQ = { x: 270, y: 150 }, DEN = { x: 270, y: GY1 + 44 };
const idx = (c, r) => r * COLS + c;
const ccx = i => GX + ((i % COLS) + 0.5) * CELL, ccy = i => GY + (((i / COLS) | 0) + 0.5) * CELL;
const cellAt = (x, y) => ({ c: clamp(Math.floor((x - GX) / CELL), 0, COLS - 1), r: clamp(Math.floor((y - GY) / CELL), 0, ROWS - 1) });
const cellOf = (x, y) => { const p = cellAt(x, y); return idx(p.c, p.r); };
const isGate = (c, r) => (r === 0 || r === ROWS - 1) && Math.abs(c - (COLS - 1) / 2) <= GRID.gate;   // entrada arriba, salida abajo
const ENTRY = [], EXIT = new Set();
for (let c = 0; c < COLS; c++) if (isGate(c, 0)) { ENTRY.push(idx(c, 0)); EXIT.add(idx(c, ROWS - 1)); }
const BLOCK = new Uint8Array(NCELL);   // 1 = hay una torre
let DIST = null;                       // distancia (en casillas) de cada casilla hasta La Madriguera
const NB = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [-1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, -1, Math.SQRT2]];
// vecinos por los que se puede andar (en diagonal solo si no se roza la esquina de una torre)
function eachNb(i, block, fn) {
  const c = i % COLS, r = (i / COLS) | 0;
  for (const [dc, dr, w] of NB) {
    const nc = c + dc, nr = r + dr; if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
    const j = idx(nc, nr); if (block[j]) continue;
    if (dc && dr && (block[idx(c + dc, r)] || block[idx(c, r + dr)])) continue;
    fn(j, w);
  }
}
// Dijkstra desde La Madriguera: con 225 casillas basta con buscar el mínimo a mano
function flow(block) {
  const D = new Float32Array(NCELL).fill(Infinity), done = new Uint8Array(NCELL);
  for (const i of EXIT) if (!block[i]) D[i] = 0;
  for (;;) {
    let b = -1, bd = Infinity; for (let i = 0; i < NCELL; i++) if (!done[i] && D[i] < bd) { bd = D[i]; b = i; }
    if (b < 0) break; done[b] = 1;
    eachNb(b, block, (j, w) => { if (bd + w < D[j]) D[j] = bd + w; });
  }
  return D;
}
// la casilla siguiente en el camino más corto
function nextCell(i, D = DIST, block = BLOCK) { let b = -1, bd = D[i]; eachNb(i, block, (j, w) => { if (D[j] + w * 0.001 < bd) { bd = D[j] + w * 0.001; b = j; } }); return b; }
function routeFrom(i, D = DIST, block = BLOCK) { const out = [i]; while (!EXIT.has(i) && out.length < NCELL) { i = nextCell(i, D, block); if (i < 0) break; out.push(i); } return out; }
const MID_ENTRY = ENTRY[(ENTRY.length / 2) | 0];
function reflow() {
  DIST = flow(BLOCK); G.route = routeFrom(MID_ENTRY);
  // los que ya andan por el campo recalculan su camino desde la casilla en la que están
  for (const f of G.foes) if (!f.atBase) f.goal = cellOf(f.x - f.ox, f.y - f.oy);
}
// '' si se puede construir; si no, el motivo
function whyNot(c, r) {
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return 'fuera';
  const i = idx(c, r);
  if (BLOCK[i]) return 'ocupada';
  if (isGate(c, r)) return 'puerta';
  if (ccx(i) > 420 && ccy(i) > 668) return 'boton';   // debajo del botón de la oleada
  for (const f of G.foes) if (!f.atBase && (cellOf(f.x - f.ox, f.y - f.oy) === i || f.goal === i)) return 'enemigo';
  BLOCK[i] = 1; const D = flow(BLOCK); BLOCK[i] = 0;
  if (D[MID_ENTRY] === Infinity) return 'cierra';
  for (const f of G.foes) if (!f.atBase && D[cellOf(f.x - f.ox, f.y - f.oy)] === Infinity) return 'cierra';
  return '';
}
const canPlace = (c, r) => !whyNot(c, r);
// lo que le queda a un enemigo hasta La Madriguera (para que las torres disparen al más adelantado)
const remOf = f => f.atBase ? -1 : DIST[f.goal] * CELL + Math.hypot(ccx(f.goal) + f.ox - f.x, ccy(f.goal) + f.oy - f.y);

/* ---------- torres ---------- */
const tdef = t => TOWERS[t.fac][t.k];
function rageOf(t) { if (t.fac !== 'animales') return 0; let n = 0; for (const o of G.towers) if (o !== t && o.fac === 'animales' && Math.hypot(o.x - t.x, o.y - t.y) <= TD.rage.radius) n++; return Math.min(n, TD.rage.max); }
function auraOf(t) { let b = 0; for (const o of G.towers) { const D = tdef(o); if (o !== t && D.aura && D.aura.speed && o.stunT <= 0 && Math.hypot(o.x - t.x, o.y - t.y) <= rangeOf(o)) b = Math.max(b, D.aura.speed + 0.1 * (o.lvl - 1)); } return b; }
const rangeOf = t => tdef(t).range * (1 + TD.upRange * (t.lvl - 1)) * (t.mut.range || 1) * (1 + (t.M.T.range || 0));
const dmgOf = t => { const D = tdef(t); return D.dmg * lvlMul(t) * t.M.lvlMul * (1 + (t.M.T.dmg || 0)) * (t.M.T.furia && G.lives < TD.baseHp / 2 ? 1 + t.M.T.furia : 1) * (1 + TD.rage.perAlly * t.rage) * (t.mut.dmg || 1) * (1 + dmgAura(t)) * (D.fury && G.lives < TD.baseHp * D.fury.f ? D.fury.mult : 1) * (D.ramp ? 1 + D.ramp.step * (t.ramp || 0) : 1); };
const upCost = t => Math.round(tdef(t).cost * TD.upCost[t.lvl] / 5) * 5;
const sellOf = t => (t.fac === 'nomuertos' ? t.spent : Math.round(t.spent * TD.sellBack / 5) * 5);   // RENACER: los No-Muertos devuelven todo el oro
function build(k, c, r) {
  const D = TOWERS[G.fac][k];
  if (G.gold < D.cost || !canPlace(c, r) || (D.leader && G.towers.some(t => tdef(t).leader))) return false;
  G.gold -= D.cost;
  const i = idx(c, r), x = ccx(i), y = ccy(i) + 6;
  BLOCK[i] = 1; reflow();
  const t = { id: ++uid, k, fac: G.fac, x, y, cell: i, lvl: 1, spent: D.cost, cdT: 0.3, rage: 0, face: 1, atkT: 0, stunT: 0, critN: 0, jumpT: D.jump ? D.jump.cd * 0.6 : 0, jump: null, dropT: 0.35, abT: D.ab ? D.ab.cd * 0.5 : 0, mut: {}, ramp: 0, hasteT: 0, hasteF: 0, sequel: false };
  t.M = G.vs && G.vsCur === 'ai' ? NOMODS : cardMods(k); t.gritoT = 4;   // lo que lleva equipado la carta (el rival no lleva nada)
  // RNG (Memes): cada torre sale con una mutación al azar
  if (G.fac === 'memes') { const M = pick(CFG.passives.memes.muts); t.mut = Object.assign({ id: M.id, txt: M.txt }, PASSIVES.memes.muts[M.id]); pop(x, y - 56, M.txt, M.color, 15); }
  G.towers.push(t); xpPlay(k); sfx('place'); puff(x, y, '#d9b77e', 10);
  return true;
}
function upgrade(t) { const c = upCost(t); if (t.lvl >= TD.maxLevel || G.gold < c) return; G.gold -= c; t.spent += c; t.lvl++; sfx('up'); pop(t.x, t.y - 50, '¡NIVEL ' + t.lvl + '!', '#ffcb3d', 16); ring(t.x, t.y, 40, 'rgba(255,203,61,.9)'); }
function sell(t) { G.gold += sellOf(t); G.towers = G.towers.filter(o => o !== t); BLOCK[t.cell] = 0; reflow(); if (G.sel === t) G.sel = null; sfx('coin'); puff(t.x, t.y, '#d9b77e', 12); }

/* ---------- ataques, pasivas y habilidades ---------- */
// cada torre tiene como mucho una habilidad con reloj: se deja preparada en D.ab
for (const f in TOWERS) for (const k in TOWERS[f]) { const D = TOWERS[f][k]; for (const type of ['pulse', 'volley', 'teamFight', 'action', 'hack', 'viral']) if (D[type]) D.ab = Object.assign({ type }, D[type]); }
const killLevel = () => { const P = PASSIVES[G.fac]; return P.per ? Math.min(P.max, Math.floor((G.kills || 0) / P.per)) : 0; };
// EXPERIENCIA (Héroes) y COMUNIDAD (Gamers): más daño para todas las torres
function teamDmg() {
  const P = PASSIVES[G.fac];
  if (G.fac === 'heroes') return 1 + P.step * killLevel();
  if (G.fac === 'gamer') return 1 + P.step * Math.min(P.max, new Set(G.towers.map(t => t.k)).size);
  return 1;
}
// HYPE (Streamers): más velocidad de ataque para todas las torres
const teamSpeed = () => (G.fac === 'streamers' ? PASSIVES.streamers.step * killLevel() : 0);
const lvlMul = t => (1 + TD.upDmg * (t.lvl - 1)) * (G.teamDmg || 1);
function dmgAura(t) { let b = 0; for (const o of G.towers) { const A = tdef(o).aura; if (o !== t && A && A.dmg && o.stunT <= 0 && Math.hypot(o.x - t.x, o.y - t.y) <= A.r) b = Math.max(b, A.dmg); } return b; }
function targetOf(t, R = rangeOf(t)) { let tgt = null, tr = Infinity; for (const f of G.foes) if (!f.dead && f.fog <= 0 && Math.hypot(f.x - t.x, f.y - t.y) <= R + f.r) { const rm = remOf(f); if (rm < tr) { tr = rm; tgt = f; } } return tgt; }
const stunFoe = (f, s) => { if (s > 0 && !f.cc) f.stunT = Math.max(f.stunT, FOES[f.k].boss ? s * 0.3 : s); };   // a los jefes les dura mucho menos
const bolt = (x, y, x2, y2, col = '#bfe6ff') => G.parts.push({ kind: 'bolt', x, y, x2, y2, col, t: 0, life: 0.2 });
// el golpe de una torre a un enemigo, con todo lo que lleva encima (frenar, aturdir, marcar, primer golpe…)
function strike(t, f, dmg, crit) {
  if (f.dead || f.hp <= 0) return;
  if (f.markT > 0) dmg *= 1 + f.markF;
  if (t) {
    const D = tdef(t), X = t.M.T; f.lastT = t;
    if (X.crit && Math.random() < X.crit) { dmg *= 3; crit = true; }
    if (X.slowT && !f.cc) { f.slowF = Math.min(f.slowF, 0.6); f.slowT = Math.max(f.slowT, X.slowT); }
    if (!f.seen.has(t.id)) {
      f.seen.add(t.id);
      if (t.fac === 'olvidados') { dmg *= PASSIVES.olvidados.mult; crit = true; }   // NOSTALGIA
      if (D.first) { dmg *= D.first.mult; stunFoe(f, D.first.stun); crit = true; }
    }
    if (D.slow && !f.cc) { f.slowF = D.slow.f; f.slowT = D.slow.t; }
    if (D.stun) stunFoe(f, D.stun);
    if (D.mark) { f.markT = D.mark.t; f.markF = D.mark.f; }
  }
  hurt(f, dmg, crit);
}
function chainFrom(t, f, dmg, C) {
  const hit = [f]; let cur = f;
  for (let i = 0; i < C.n; i++) {
    let best = null, bd = C.r;
    for (const o of G.foes) { if (o.dead || hit.includes(o)) continue; const d = Math.hypot(o.x - cur.x, o.y - cur.y); if (d <= bd) { bd = d; best = o; } }
    if (!best) break;
    bolt(cur.x, cur.y - topOf(cur) * 0.5, best.x, best.y - topOf(best) * 0.5); strike(t, best, dmg * C.f); hit.push(best); cur = best;
  }
}
// lo que añade el equipo al golpe principal de una torre: salpicar y saltar a otro enemigo
function gearHit(t, f, dmg) {
  const X = t.M.T; if (!X.splash && !X.chain) return;
  if (X.splash) for (const o of G.foes) if (o !== f && !o.dead && Math.hypot(o.x - f.x, o.y - f.y) <= 40 + o.r * 0.5) hurt(o, dmg * X.splash);
  if (X.chain) { let best = null, bd = 80; for (const o of G.foes) { if (o === f || o.dead) continue; const d = Math.hypot(o.x - f.x, o.y - f.y); if (d <= bd) { bd = d; best = o; } } if (best) { bolt(f.x, f.y - topOf(f) * 0.5, best.x, best.y - topOf(best) * 0.5, '#ffe14d'); hurt(best, dmg * X.chain); } }
}
function projHit(p, f) {
  strike(p.src, f, p.dmg); if (p.src) gearHit(p.src, f, p.dmg);
  if (p.splash) { ring(f.x, f.y, p.splash, 'rgba(230,220,255,.8)'); for (const o of G.foes) if (o !== f && !o.dead && Math.hypot(o.x - f.x, o.y - f.y) <= p.splash + o.r * 0.5) strike(p.src, o, p.dmg); }
  if (p.chain) chainFrom(p.src, f, p.dmg, p.chain);
}
function attack(t, tgt, mult = 1) {
  const D = tdef(t), R = rangeOf(t); let dmg = dmgOf(t) * mult;
  t.face = tgt.x >= t.x ? 1 : -1; t.atkT = 0.22;
  if (D.kind === 'hit') {
    let crit = false; const ty = tgt.y - topOf(tgt) * 0.5;
    if (D.crit && ++t.critN >= D.crit.every) { t.critN = 0; dmg *= D.crit.mult; crit = true; stunFoe(tgt, D.crit.stun || 0); if (D.crit.text) pop(tgt.x, ty - 26, D.crit.text, '#ffcb3d', 17); }
    if (D.bolt) bolt(t.x, t.y - 40, tgt.x, ty); else slash(tgt.x, ty, crit && !D.crit.text);
    strike(t, tgt, dmg, crit); if (D.chain) chainFrom(t, tgt, dmg, D.chain); gearHit(t, tgt, dmg);
    if (D.ramp) t.ramp = Math.min(D.ramp.max, (t.ramp || 0) + 1);
    sfx(crit ? 'crit' : D.bolt ? 'zap' : 'hit');
  } else if (D.kind === 'shot') {
    G.projs.push({ kind: D.shot, x: t.x + t.face * 8, y: t.y - 26, target: tgt, dmg, speed: D.pspeed || 520, t: 0, src: t, splash: D.splash, chain: D.chain }); sfx('shot');
  } else if (D.kind === 'lob') {
    const lead = Math.min(0.9, Math.hypot(tgt.x - t.x, tgt.y - t.y) / 260), mv = tgt.stunT > 0 ? 0 : lead, p = { x: tgt.x + tgt.vx * mv, y: tgt.y + tgt.vy * mv };
    G.projs.push({ kind: D.shot, x: t.x, y: t.y - 30, sx: t.x, sy: t.y - 30, tx: p.x, ty: p.y, t: 0, dur: lead, dmg, splash: D.splash, src: t, arc: 70 }); sfx('lob');
  } else if (D.kind === 'stomp') {
    for (const f of G.foes) if (Math.hypot(f.x - t.x, f.y - t.y) <= R + f.r) strike(t, f, dmg);
    ring(t.x, t.y, R, 'rgba(255,170,220,.9)'); shake(2); sfx('stomp');
  }
}
// habilidades con reloj. Devuelven false si no había a quién usarla (se reintenta enseguida)
function ability(t, D) {
  const A = D.ab, m = lvlMul(t), near = r => G.foes.filter(f => !f.dead && Math.hypot(f.x - t.x, f.y - t.y) <= r + f.r);
  const shout = (s, col = '#fff6ea') => pop(t.x, t.y - 64, s, col, 16);
  const launch = (fs, n, dmg, shot) => { for (let i = 0; i < n; i++) G.projs.push({ kind: shot, x: t.x + (i - (n - 1) / 2) * 16, y: t.y - 34, target: fs[i % fs.length], dmg, speed: 300, t: 0, src: t }); };
  if (A.type === 'pulse') {
    const fs = near(A.r); if (!fs.length) return false;
    for (const f of fs) { stunFoe(f, A.stun); if (A.dmg) strike(t, f, A.dmg * m); }
    ring(t.x, t.y, A.r, `rgba(${A.col},.95)`); shout(A.text, `rgb(${A.col})`); shake(3); sfx('boom'); return true;
  }
  if (A.type === 'volley') {
    const fs = near(rangeOf(t) * 1.3).sort((a, b) => remOf(a) - remOf(b)); if (!fs.length) return false;
    launch(fs, A.n, A.dmg * m, A.shot); shout(A.text); sfx('jump'); return true;
  }
  if (A.type === 'teamFight') {
    let any = false;
    for (const o of G.towers) { if (o.stunT > 0 || o.jump || tdef(o).kind === 'aura' || Math.hypot(o.x - t.x, o.y - t.y) > A.r) continue; const tg = targetOf(o); if (tg) { attack(o, tg, A.mult); any = true; } }
    if (any) { shout('¡TEAM FIGHT!', '#ffcb3d'); ring(t.x, t.y, A.r, 'rgba(255,203,61,.9)'); sfx('horn'); }
    return any;
  }
  if (A.type === 'action') {
    if (!G.foes.length) return false;
    for (const o of G.towers) if (Math.hypot(o.x - t.x, o.y - t.y) <= A.r) { o.hasteT = A.t; o.hasteF = A.speed; }
    shout('¡ACCIÓN!', '#ffcb3d'); ring(t.x, t.y, A.r, 'rgba(255,203,61,.9)'); sfx('horn'); return true;
  }
  if (A.type === 'hack') {
    let best = null; for (const f of near(A.r)) if (!best || f.hp > best.hp) best = f; if (!best) return false;
    stunFoe(best, A.t); bolt(t.x, t.y - 40, best.x, best.y - topOf(best) * 0.5, '#7dffb0'); pop(best.x, best.y - topOf(best) - 12, '¡HACKEADO!', '#7dffb0', 15); sfx('womp'); return true;
  }
  if (A.type === 'viral') {
    const fs = near(rangeOf(t) * 1.2).sort((a, b) => remOf(a) - remOf(b)); if (!fs.length) return false;
    const c = pick(['fuego', 'aturdir', 'oro', 'perros']);
    if (c === 'fuego') { const g = fs[0]; boom(g.x, g.y, 60, 'dyn'); for (const f of G.foes) if (Math.hypot(f.x - g.x, f.y - g.y) <= 60 + f.r * 0.5) strike(t, f, 70 * m); shout('¡BOLA DE FUEGO!', '#ff7a1a'); }
    else if (c === 'aturdir') { for (const f of fs) stunFoe(f, 1.2); ring(t.x, t.y, rangeOf(t) * 1.2, 'rgba(255,225,77,.95)'); shout('¡ATURDIDOS!', '#ffe14d'); sfx('boom'); }
    else if (c === 'oro') { G.gold += 15; shout('+15 DE CAOS', '#ffcb3d'); sfx('coin'); }
    else { launch(fs, 3, 40 * m, 'dog'); shout('¡MUCH WOW!', '#f0b35a'); sfx('jump'); }
    return true;
  }
  return false;
}
// el daño a la base: primero se come el escudo de plasma de los Ciberpunks
function hitBase(d, f) {
  if (G.vs) {
    G.vs.stolen += d * (f && f.U ? 1 + (f.U.steal || 0) : 1);
    if (f && f.U && f.U.caos && !f.caosDone) { f.caosDone = true; const c = Math.min(G.gold, Math.round(f.U.caos)); G.gold -= c; G.vs.me.gold += c; }   // Microtransacción
  }
  G.shieldT = PASSIVES.ciber.delay;
  if (G.shield > 0) { const a = Math.min(G.shield, d); G.shield -= a; d -= a; }
  G.lives = Math.max(0, G.lives - d);
}

/* ---------- enemigos ---------- */
// la pasiva de la raza enemiga, vuelta contra ti (los jefes no la llevan)
function enemyTrait(f, F) {
  const e = G.efac, E = ETRAITS[e]; if (F.boss) return;
  if (e === 'streamers') f.speed *= E.speed;
  else if (e === 'ciber') f.sh = f.shMax = Math.round(f.maxHp * E.frac);
  else if (e === 'olvidados') f.fog = E.fog;
  else if (e === 'memes') { const M = pick(CFG.passives.memes.muts); f.hp = f.maxHp = Math.round(f.maxHp * M.hp); f.speed *= M.speed; f.sc *= M.scale; f.mutCol = M.id === 'normal' ? null : M.color; }
}
function spawnFoe(k, at = null, hpMul = G.hpMul) {
  const F = FOES[k], U = CFG.units[F.art || k] || {};
  const hp = Math.round(foeHp(k) * hpMul);
  const f = { id: ++uid, k, art: F.art || k, hp, maxHp: hp, speed: foeSpeed(k) * rand(0.95, 1.05), r: F.r || U.r || 12, sc: F.scale || 1, armor: F.armor != null ? F.armor : U.armor || 0, slowT: 0, slowF: 1, stunT: 0, hitT: 0, walk: Math.random() * 6, face: 1, healT: 1.5, despT: F.despido ? F.despido.cd * 0.5 : 0, ox: rand(-6, 6), oy: rand(-6, 6), vx: 0, vy: 0, atkT: 0, atBase: false, seen: new Set(), markT: 0, markF: 0, sumT: F.summon ? F.summon.cd * 0.6 : 0, sh: 0, shMax: 0, shT: 0, fog: 0 };
  enemyTrait(f, F);
  if (G.vs && G.vsCur === 'ai' && !F.boss) unitGear(f);   // tus unidades enviadas llevan el nivel, la habilidad y el equipo de su carta
  // salen de la puerta de Microblizz (o de donde cayó la caja de botín)
  if (at) { f.x = at.x + rand(-8, 8); f.y = at.y + rand(-8, 8); f.atBase = at.atBase; if (at.atBase) { f.bx = f.x; f.by = f.y; } }
  else { f.x = HQ.x + rand(-CELL * (GRID.gate + 0.3), CELL * (GRID.gate + 0.3)); f.y = GY - rand(14, 26); }
  f.goal = cellOf(f.x - f.ox, Math.max(GY + 1, f.y - f.oy));
  G.foes.push(f); if (F.boss) { G.boss = f; sfx('boss'); pop(270, 300, '¡' + foeName(k).toUpperCase() + '!', '#ff4b5c', 34); }
  return f;
}
function hurt(f, dmg, crit) {
  if (f.hp <= 0 || f.invT > 0) return;
  if (f.U && f.U.dodge && Math.random() < f.U.dodge) { num(f.x, f.y - topOf(f) - 6, 'ESQUIVA', '#9fe8ff', 11); return; }
  dmg = dmg * (1 - f.armor); f.hitT = 0.12; f.shT = ETRAITS.ciber.delay;
  if (f.sh > 0) { const a = Math.min(f.sh, dmg); f.sh -= a; dmg -= a; if (dmg <= 0) return; }
  if (f.U && f.U.pause && !f.paused && f.hp - dmg <= 0) { f.paused = true; f.invT = f.U.pause; pop(f.x, f.y - topOf(f) - 8, '¡PAUSA!', '#9fe8ff', 14); return; }
  f.hp -= dmg;
  if (crit || dmg >= 20) num(f.x + rand(-6, 6), f.y - topOf(f) - 6, Math.round(dmg), crit ? '#ffcb3d' : '#fff6ea', crit ? 18 : 13);
  if (f.hp <= 0) kill(f);
}
function kill(f) {
  const F = FOES[f.k], e = G.efac, E = ETRAITS[e];
  // RENACER: los No-Muertos se levantan una vez (los invocados por el jefe no)
  if (e === 'nomuertos' && !F.boss && !f.revived && !f.minion) { f.revived = true; f.hp = Math.round(f.maxHp * E.hpFrac); f.stunT = Math.max(f.stunT, E.delay); f.seen.clear(); pop(f.x, f.y - topOf(f) - 8, '¡RENACE!', '#b98cff', 14); burst(f.x, f.y - 10, ['#b98cff', '#e6dcff'], f.r); sfx('pop'); return; }
  if (f.U && f.U.revive && !f.revU) { f.revU = true; f.hp = Math.round(f.maxHp * f.U.revive); f.stunT = Math.max(f.stunT, 0.8); pop(f.x, f.y - topOf(f) - 8, '¡RENACE!', '#b98cff', 14); return; }
  const gold = G.vs ? Math.ceil(F.gold * VS.bounty) : F.gold;
  f.dead = true; G.gold += gold; G.kills++;
  if (f.lastT && f.lastT.M.T.iman) G.gold += Math.round(f.lastT.M.T.iman);
  if (f.U && f.U.clon && !f.isClone) for (let i = 0; i < 2; i++) { const g = spawnFoe(f.k, f, 1); g.hp = g.maxHp = Math.max(1, Math.round(f.maxHp * f.U.clon)); g.sh = g.shMax = 0; g.sc *= 0.8; g.isClone = true; g.U = Object.assign({}, g.U, { clon: 0, revive: 0, pause: 0 }); }
  // SECUELA: algunos de Cultura Pop vuelven en versión «2»
  if (e === 'pop' && !F.boss && !f.sequel && !f.minion && Math.random() < E.chance) { const g = spawnFoe(f.k, f, 1); g.hp = g.maxHp = Math.max(1, Math.round(f.maxHp * E.hp)); g.sc *= E.scale; g.sequel = true; pop(f.x, f.y - topOf(f) - 8, '¡LA SECUELA!', '#ffcb3d', 14); }
  num(f.x, f.y - topOf(f) - 4, '+' + gold, '#ffcb3d', 13); burst(f.x, f.y - 10, ['#8fc2ff', '#2e8bff', '#fff6ea'], f.r);
  if (F.eject) { for (let i = 0; i < F.ejectN; i++) spawnFoe(F.eject, f); pop(f.x, f.y - 40, '¡BOTÍN!', '#ffcb3d', 18); }
  if (F.boss) { G.boss = null; sfx('win'); shake(10); }
  sfx('pop');
}
const topOf = f => (FOES[f.k].top || (TYPES[f.art] && TYPES[f.art].top) || TOPS[f.art] || 40) * f.sc;

const healerOf = f => (CFG.units[f.art] && CFG.units[f.art].healer ? 1 : 0);

/* ---------- oleadas ---------- */
function buildWave(L, w) {
  const R = mulberry32(L.wi * 1000 + L.li * 100 + w * 7 + 3);
  const avail = L.deck.filter((k, i) => w >= 1 + i * 2 - (i ? 1 : 0));
  let budget = (5 + w * 3.4 + Math.pow(w, 1.5) * 0.6) * L.bud;
  const q = [];
  // los fuertes nunca abren la oleada
  q.push(L.deck[0]);
  // pocos sanadores por oleada: un montón curándose entre ellos no hay quien lo tumbe
  let heals = 0; const maxHeals = 1 + ((w / 4) | 0);
  while (budget > 0) { let k = avail[(R() * avail.length) | 0]; if (CFG.units[k].healer && ++heals > maxHeals) k = avail[0]; q.push(k); budget -= FOES[k].cost; }
  if (L.boss && w === L.waves) q.push(L.boss);
  return q.map((k, i) => ({ k, gap: i === 0 ? 0 : FOES[k].cost >= 5 ? 1.7 : FOES[q[i - 1]].cost >= 5 ? 1.2 : 0.75 + R() * 0.35 }));
}
function startWave() {
  if (G.inWave || G.wave >= G.waves || G.over) return;
  if (G.wave > 0 && G.nextT > 0) { const b = Math.round(G.nextT * TD.earlyBonus); if (b > 0) { G.gold += b; num(470, 700, '+' + b, '#ffcb3d', 16); } }
  G.wave++; G.inWave = true; G.spawnQ = buildWave(G.level, G.wave); G.spawnT = 0;
  G.hpMul = G.level.hp * (1 + G.level.growth * (G.wave - 1));
  banner('OLEADA ' + G.wave + (G.wave === G.waves ? ' · ¡LA ÚLTIMA!' : '')); sfx('horn');
}
function waveDone() {
  G.inWave = false; const b = TD.waveBonus(G.wave); G.gold += b; num(270, 420, '+' + b + ' de CAOS', '#ffcb3d', 20);
  if (G.wave >= G.waves) return finish(true);
  G.nextT = 12;
}

/* =========================================================
   BUCLE
   ========================================================= */
function update(dt) {
  G.t += dt;
  if (G.inWave) {
    G.spawnT -= dt; if (G.vs && !G.spawnQ.length) G.spawnT = 0;
    while (G.spawnQ.length && G.spawnT <= 0) { const s = G.spawnQ.shift(), nf = spawnFoe(s.k, null, FOES[s.k].boss ? G.level.hp : G.hpMul); if (s.lvl > 1) unitLevel(nf, s.lvl); G.spawnT += G.spawnQ.length ? G.spawnQ[0].gap : 0; }
    if (!G.vs && !G.spawnQ.length && !G.foes.length) waveDone();
  } else if (G.wave > 0 && G.wave < G.waves && !G.over) { G.nextT -= dt; if (G.nextT <= 0) { G.nextT = 0; startWave(); } }
  // enemigos
  for (const f of G.foes) {
    f.hitT = Math.max(0, f.hitT - dt); f.slowT -= dt; if (f.slowT <= 0) f.slowF = 1;
    if (f.stunT > 0) { f.stunT -= dt; continue; }
    const x0 = f.x, y0 = f.y; walkFoe(f, f.speed * f.slowF * (f.rushT > 0 ? 3 : 1) * dt);
    f.vx = (f.x - x0) / dt; f.vy = (f.y - y0) / dt; f.walk += Math.hypot(f.x - x0, f.y - y0) * 0.22;
    if (f.x - x0 > 0.05) f.face = 1; else if (f.x - x0 < -0.05) f.face = -1;
    const U = CFG.units[f.art];
    if (U && U.healer) { f.healT -= dt; if (f.healT <= 0) { f.healT = U.healCd; let best = null; for (const o of G.foes) if (o !== f && !o.dead && !healerOf(o) && o.hp < o.maxHp && Math.hypot(o.x - f.x, o.y - f.y) < U.healR && (!best || o.hp / o.maxHp < best.hp / best.maxHp)) best = o; if (best) { const h = U.heal * TD.foeHeal * G.hpMul; best.hp = Math.min(best.maxHp, best.hp + h); num(best.x, best.y - topOf(best), '+' + Math.round(h), '#9ef07a', 12); ring(best.x, best.y - 10, 18, 'rgba(158,240,122,.9)'); } } }
    const F = FOES[f.k];
    if (F.despido) { f.despT -= dt; if (f.despT <= 0) { f.despT = F.despido.cd; let best = null, bd = 1e9; for (const t of G.towers) { const dd = Math.hypot(t.x - f.x, t.y - f.y); if (dd < F.despido.range && dd < bd && t.stunT <= 0) { bd = dd; best = t; } } if (best) { best.stunT = F.despido.t * (1 - Math.min(1, best.M.T.desp || 0)); best.stunTxt = F.despido.text; pop(best.x, best.y - 56, F.despido.text, '#fff6ea', 18); G.projs.push({ kind: 'letter', x: f.x, y: f.y - 60, tx: best.x, ty: best.y - 20, t: 0, dur: 0.5 }); sfx('womp'); } } }
    if (F.summon && !f.atBase) { f.sumT -= dt; if (f.sumT <= 0) { f.sumT = F.summon.cd; for (let i = 0; i < F.summon.n; i++) spawnFoe(F.summon.k, f).minion = true; pop(f.x, f.y - topOf(f) - 10, F.summon.text, '#ff4b5c', 17); ring(f.x, f.y, 40, 'rgba(255,75,92,.9)'); sfx('womp'); } }
    if (f.shMax && f.sh < f.shMax) { f.shT -= dt; if (f.shT <= 0) f.sh = Math.min(f.shMax, f.sh + f.shMax * ETRAITS.ciber.regen * dt); }
    if (f.fog > 0) { for (const t of G.towers) if (Math.hypot(t.x - f.x, t.y - f.y) <= rangeOf(t) + f.r) { f.fog -= dt; break; } }
    // en La Madriguera: la atacan una vez por segundo hasta que los tumbes
    if (f.atBase && Math.hypot(f.bx - f.x, f.by - f.y) < 2) {
      f.face = DEN.x >= f.x ? 1 : -1; f.atkT -= dt;
      if (f.atkT <= 0) { f.atkT = TD.baseAtkCd; f.lunge = 0.25; hitBase(F.leak * (f.U ? 1 + (f.U.leak || 0) : 1) * (f.leakM || 1), f); if (ETRAITS[G.efac].steal && G.gold > 0) { const st = Math.min(G.gold, ETRAITS[G.efac].steal); G.gold -= st; num(DEN.x + rand(-30, 30), DEN.y - 60, '-' + st + ' CAOS', '#ffcb3d', 13); } G.denHitT = 0.2; shake(1 + F.leak * 0.5); sfx('leak'); num(f.x, f.y - topOf(f) - 4, '-' + F.leak, '#ff4b5c', 15); spark(lerp(f.x, DEN.x, 0.3), f.y - 12, '#ff4b5c'); if (G.lives <= 0) finish(false); }
    }
    if (f.lunge > 0) f.lunge -= dt;
    if (f.markT > 0) f.markT -= dt;
    if (f.invT > 0) f.invT -= dt; if (f.rushT > 0) f.rushT -= dt;
    if (f.U && f.U.regen && f.hp < f.maxHp) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * f.U.regen * dt);
  }
  // la base se defiende sola: dispara a los que la están golpeando (primero a los que curan, luego al más tocado)
  G.denT -= dt;
  if (G.denT <= 0) { let tg = null; for (const f of G.foes) if (f.atBase && !f.dead && (!tg || (healerOf(f) - healerOf(tg) || tg.hp - f.hp) > 0)) tg = f; if (tg) { G.denT = TD.baseCd; bolt(DEN.x, DEN.y - 46, tg.x, tg.y - topOf(tg) * 0.5, '#ffe9a8'); hurt(tg, TD.baseDmg); sfx('shot'); } else G.denT = 0.1; }
  G.foes = G.foes.filter(f => !f.dead);
  // torres
  G.teamDmg = teamDmg(); G.teamSpd = teamSpeed();
  if (G.fac === 'ciber') { G.shieldT -= dt; if (G.shieldT <= 0) G.shield = Math.min(PASSIVES.ciber.amt, G.shield + PASSIVES.ciber.regen * dt); }
  for (const t of G.towers) {
    const D = tdef(t); t.rage = rageOf(t); t.atkT = Math.max(0, t.atkT - dt); t.dropT = Math.max(0, t.dropT - dt); if (t.hasteT > 0) t.hasteT -= dt;
    if (t.stunT > 0) { t.stunT -= dt; continue; }
    if (t.jump) { jumpStep(t, dt); continue; }
    if (D.jump) { t.jumpT -= dt; if (t.jumpT <= 0 && tryJump(t)) continue; }
    if (D.ab) { t.abT -= dt; if (t.abT <= 0) t.abT = ability(t, D) ? D.ab.cd : 0.5; }
    if (t.M.T.grito) { t.gritoT -= dt; if (t.gritoT <= 0) { const fs = G.foes.filter(f => !f.dead && Math.hypot(f.x - t.x, f.y - t.y) <= 75 + f.r); if (fs.length) { t.gritoT = 9; for (const f of fs) stunFoe(f, t.M.T.grito); ring(t.x, t.y, 75, 'rgba(230,220,255,.95)'); pop(t.x, t.y - 64, '¡GRITO!', '#e6dcff', 14); } else t.gritoT = 0.5; } }
    if (D.kind === 'aura') continue;
    t.cdT -= dt * (1 + auraOf(t) + G.teamSpd + (t.hasteT > 0 ? t.hasteF : 0) + (t.M.T.spd || 0));
    if (t.cdT > 0) continue;
    const tgt = targetOf(t);
    if (!tgt) { t.ramp = 0; continue; }
    // SECUELA (Cultura Pop): algunos ataques se repiten enseguida con menos daño
    const seq = t.sequel; t.sequel = false;
    attack(t, tgt, seq ? PASSIVES.pop.mult : 1);
    t.cdT = D.cd * (t.mut.cd || 1);
    if (!seq && t.fac === 'pop' && Math.random() < PASSIVES.pop.chance) { t.sequel = true; t.cdT = 0.22; }
  }
  // proyectiles
  for (const p of G.projs) {
    p.t += dt;
    if (p.target) {
      const f = p.target, ty = f.y - topOf(f) * 0.5, dx = f.x - p.x, dy = ty - p.y, L = Math.hypot(dx, dy), st = p.speed * dt;
      if (f.dead && L > st) { p.target = null; p.tx = f.x; p.ty = ty; p.dur = p.t + L / p.speed; p.sx = p.x; p.sy = p.y; p.t0 = p.t; continue; }
      if (L <= st || f.dead) { p.done = true; if (!f.dead) projHit(p, f); spark(p.x, p.y, '#ffd34d'); continue; }
      p.x += (dx / L) * st; p.y += (dy / L) * st; p.rot = (p.rot || 0) + dt * 14; p.ang = Math.atan2(dy, dx);
    } else if (p.kind === 'letter') { if (p.t >= p.dur) p.done = true; }
    else if (p.sx != null && p.arc) {
      const k = Math.min(1, p.t / p.dur); p.x = lerp(p.sx, p.tx, k); p.y = lerp(p.sy, p.ty, k) - Math.sin(k * Math.PI) * p.arc; p.rot = (p.rot || 0) + dt * 9;
      if (k >= 1) { p.done = true; boom(p.tx, p.ty, p.splash, p.kind); for (const f of G.foes) if (Math.hypot(f.x - p.tx, f.y - p.ty) <= p.splash + f.r * 0.5) strike(p.src, f, p.dmg); }
    } else if (p.t >= (p.dur || 0.3)) p.done = true;
  }
  G.projs = G.projs.filter(p => !p.done);
  for (const q of G.parts) { q.t += dt; q.x += (q.vx || 0) * dt; q.y += (q.vy || 0) * dt; if (q.g) q.vy += q.g * dt; }
  G.parts = G.parts.filter(q => q.t < q.life);
  for (const n of G.nums) { n.t += dt; n.y -= dt * 28; }
  G.nums = G.nums.filter(n => n.t < n.life);
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 30);
  if (G.denHitT > 0) G.denHitT -= dt;
}
// anda hacia la casilla siguiente del camino más corto; al llegar a la salida va a pegarle a La Madriguera
function walkFoe(f, step) {
  for (let n = 0; step > 0 && n < 4; n++) {
    let tx, ty;
    if (f.atBase) { tx = f.bx; ty = f.by; }
    else { tx = ccx(f.goal) + f.ox; ty = ccy(f.goal) + f.oy; }
    const dx = tx - f.x, dy = ty - f.y, L = Math.hypot(dx, dy);
    if (L > step) { f.x += (dx / L) * step; f.y += (dy / L) * step; return; }
    f.x = tx; f.y = ty; step -= L;
    if (f.atBase) return;
    if (EXIT.has(f.goal)) { f.atBase = true; f.bx = DEN.x + rand(-48, 48); f.by = GY1 - rand(4, 14); f.atkT = 0.3; continue; }
    const nx = nextCell(f.goal); if (nx < 0) return; f.goal = nx;
  }
}
// CrazyBunny: Chaos Jump sobre el grupo más grande
function tryJump(t) {
  const J = tdef(t).jump; let best = null, bn = 0;
  for (const f of G.foes) { if (Math.hypot(f.x - t.x, f.y - t.y) > J.range) continue; let n = 0; for (const o of G.foes) if (Math.hypot(o.x - f.x, o.y - f.y) <= J.r) n++; if (n > bn) { bn = n; best = f; } }
  if (!best) { t.jumpT = 0.5; return false; }
  t.jump = { t: 0, x0: t.x, y0: t.y, x1: best.x, y1: best.y, hit: false }; t.face = best.x >= t.x ? 1 : -1; sfx('jump'); return true;
}
function jumpStep(t, dt) {
  const J = t.jump, D = tdef(t).jump; J.t += dt;
  if (!J.hit && J.t >= 0.45) {
    J.hit = true; const dmg = D.dmg * lvlMul(t) * (1 + TD.rage.perAlly * t.rage);
    for (const f of G.foes) if (Math.hypot(f.x - J.x1, f.y - J.y1) <= D.r + f.r) { strike(t, f, dmg); stunFoe(f, D.stun); }
    ring(J.x1, J.y1, D.r, 'rgba(255,203,61,.95)'); burst(J.x1, J.y1, ['#ffcb3d', '#fff6ea', '#ff7a1a'], 22); pop(J.x1, J.y1 - 70, '¡CHAOS JUMP!', '#ffcb3d', 20); shake(6); sfx('boom');
  }
  if (J.t >= 1.15) { t.jump = null; t.jumpT = D.cd; t.dropT = 0.25; }
}
function finish(win) {
  if (G.over) return; G.over = true; G.place = null; G.sel = null;
  if (G.vs) { const w = G.vsCur === 'ai'; setTimeout(() => showVsResult(w), 800); return; }   // en VS gana quien tumba la base del otro
  const L = G.level, st = win ? (G.lives >= TD.baseHp * 0.9 ? 3 : G.lives >= TD.baseHp / 2 ? 2 : 1) : 0;
  const first = win && !starsOf(L.id), first3 = win && st === 3 && starsOf(L.id) < 3;
  G.rw = campReward(L, win, st, first, first3);
  if (win && st > starsOf(L.id)) { SAVE.stars[L.id] = st; saveGame(); }
  setTimeout(() => showResult(win, st, first), win ? 900 : 600);
}

/* =========================================================
   MODO VS: tú contra un rival que lleva el juego. Cada uno defiende su campo y manda unidades al del otro.
   Los dos campos usan el mismo motor: el estado de un campo se guarda y se carga en G para simularlo o dibujarlo.
   ========================================================= */
const BOARD_F = ['gold', 'lives', 'foes', 'towers', 'projs', 'parts', 'nums', 'spawnQ', 'spawnT', 'route', 'kills', 'fac', 'efac', 'shield', 'shieldT', 'denHitT', 'denT', 'boss', 'teamDmg', 'teamSpd', 'shake', 'hpMul'];
function saveBoard(B) { for (const k of BOARD_F) B[k] = G[k]; B.block.set(BLOCK); B.dist = DIST; }
function loadBoard(B, who) { for (const k of BOARD_F) G[k] = B[k]; BLOCK.set(B.block); DIST = B.dist; G.vsCur = who; }
// fac: la raza que defiende ese campo · efac: la raza de las unidades que le llegan (la del otro jugador)
const newBoard = (fac, efac) => ({ gold: VS.gold, lives: TD.baseHp, foes: [], towers: [], projs: [], parts: [], nums: [], spawnQ: [], spawnT: 0, route: [], kills: 0, fac, efac, shield: fac === 'ciber' ? PASSIVES.ciber.amt : 0, shieldT: 0, denHitT: 0, denT: 0,
  boss: null, teamDmg: 1, teamSpd: 0, shake: 0, hpMul: 1, block: new Uint8Array(NCELL), dist: null, income: VS.income, sent: 0 });
const VS_LEVEL = { id: 'VS', name: 'Modo VS', hp: 1, growth: 0, bud: 1 };
const sendCost = k => Math.max(10, Math.round(FOES[k].cost * VS.sendCost / 5) * 5);
const sendIncome = k => Math.max(1, Math.round(sendCost(k) * VS.incomeRate));
function startVS(diff) {
  const fac = facNow(), rival = pick(FACTION_ORDER.filter(f => f !== fac && TOWERS[f]));
  const me = newBoard(fac, rival), ai = newBoard(rival, fac);
  // el rival empieza con una línea vertical en el centro (los enemigos la recorren entera y todas las torres les pegan)
  // y luego la convierte en un laberinto en serpentina
  const plan = [], mid = (COLS - 1) / 2;
  for (const r of [6, 7, 5, 4, 3, 8, 9, 10, 2, 11, 12]) plan.push([mid, r]);   // la 6.ª (su líder) cae en una fila de muro, que nunca se vende
  // después, muro a muro: antes de cerrar cada fila horizontal vende las torres del centro que taparían el pasillo de encima,
  // para que el camino pase de bajar recto a hacer giros de lado a lado
  [2, 5, 8, 11].forEach((r, ri) => {
    if (ri) for (const sr of [r - 2, r - 1]) plan.push(['vender', mid, sr]);
    const cols = []; for (let c = 0; c < COLS; c++) if (ri % 2 ? c !== 0 : c !== COLS - 1) cols.push(c); cols.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid)); cols.forEach(c => plan.push([c, r]));
  });
  plan.push(['vender', mid, 12]);
  Object.assign(G, { screen: 'play', level: VS_LEVEL, wave: 1, waves: 1, inWave: true, nextT: 0, place: null, ghost: null, sel: null, over: false, paused: false, trayMode: 'build' });
  G.vs = { me, ai, view: 'me', t: 0, tickT: VS.tick, stolen: 0, diff, aiT: 1.5, plan, pi: 0, n: 0, def: 0, snd: 0, defDone: false };
  me.ulvl = {}; ai.ulvl = {};   // nivel de cada unidad dentro de esta partida
  loadBoard(ai, 'ai'); reflow(); saveBoard(ai); loadBoard(me, 'me'); reflow();
  BG = bgOf(fac); hidePanel(); showScreen(null); buildTray(); hud();
  banner('VS ' + FACTIONS[rival].name.toUpperCase());
}
// un paso de la partida: tu campo, luego el del rival
function vsUpdate(dt) {
  const V = G.vs; V.t += dt; const hp = Math.pow(2, V.t / VS.hpDouble);
  V.tickT -= dt;
  if (V.tickT <= 0) { V.tickT += VS.tick; G.gold += V.me.income; V.ai.gold += Math.round(V.ai.income * VS.ai[V.diff]); num(70, 96, '+' + V.me.income + ' de income', '#ffcb3d', 15); if (V.view === 'me') sfx('coin'); }
  G.hpMul = hp; update(dt); vsSteal(V.ai);
  if (G.over) return;
  saveBoard(V.me); loadBoard(V.ai, 'ai');
  G.hpMul = hp; V.aiT -= dt; if (V.aiT <= 0) { V.aiT = 0.8; aiThink(); }
  update(dt); G.t -= dt; vsSteal(V.me);
  saveBoard(V.ai); loadBoard(V.me, 'me');
}
// lo que tus unidades le quitan a la base rival se lo queda la tuya (y al revés)
function vsSteal(to) { const V = G.vs; if (V.stolen > 0) { to.lives = Math.min(VS.maxHp, to.lives + V.stolen * VS.steal); V.stolen = 0; } }
function vsSend(k) {
  const V = G.vs, c = sendCost(k); if (G.over || G.gold < c) return false;
  if (V.ai.spawnQ.length >= VS.queue) { num(270, 720, 'COLA LLENA', '#ff4b5c', 14); return false; }
  G.gold -= c; xpPlay(k); V.me.income += sendIncome(k); V.me.sent++; V.ai.spawnQ.push({ k, gap: VS.gap, lvl: V.me.ulvl[k] || 1 });
  num(270, 720, '+' + sendIncome(k) + ' income', '#ffcb3d', 14); sfx('horn'); return true;
}
// mejorar una unidad dentro de la partida: las que envíes a partir de ahora salen más duras y pegan más a la base
const unitUpCost = (k, lvl) => Math.round(sendCost(k) * VS.upCost[lvl] / 5) * 5;
function vsUpgrade(k) {
  const V = G.vs, l = V.me.ulvl[k] || 1, c = unitUpCost(k, l); if (G.over || l >= TD.maxLevel) return false;
  if (G.gold < c) { num(270, 720, 'FALTA CAOS', '#ffcb3d', 14); return false; }
  G.gold -= c; V.me.ulvl[k] = l + 1; num(270, 720, CFG.cards[k].name + ' · NIVEL ' + (l + 1), '#c58cff', 15); sfx('up'); return true;
}
function unitLevel(f, lvl) {
  const m = 1 + VS.upHp * (lvl - 1);
  f.hp = f.maxHp = Math.round(f.maxHp * m); f.shMax = Math.round(f.shMax * m); f.sh = f.shMax; f.leakM = 1 + VS.upLeak * (lvl - 1); f.ulvl = lvl; f.sc *= 1 + 0.07 * (lvl - 1);
}
// el rival: reparte su oro entre defenderse y mandarte unidades
function aiThink() {
  const V = G.vs, fac = G.fac, ks = Object.keys(TOWERS[fac]), lead = ks[0], rest = ks.slice(1), cheap = rest[0];
  for (let guard = 0; guard < 6; guard++) {
    const threat = G.foes.length > 8 || G.lives < TD.baseHp * 0.7;
    const early = V.t < VS.aiGrace || V.n < 5;   // al principio solo se defiende, para que te dé tiempo a montar algo
    if (!V.defDone && (early || threat || V.def <= V.snd * VS.aiDef)) {
      if (V.pi < V.plan.length && V.plan[V.pi][0] === 'vender') {
        const [, sc, sr] = V.plan[V.pi], t = G.towers.find(o => o.cell === idx(sc, sr)); V.pi++;
        if (t && !tdef(t).leader) sell(t);
      } else if (V.pi < V.plan.length) {
        let k = V.n === 5 ? lead : V.n < 4 ? cheap : rest[(V.n * 7 + 3) % rest.length];
        if (G.gold < TOWERS[fac][k].cost) { if (G.gold >= TOWERS[fac][cheap].cost) k = cheap; else return; }
        const [c, r] = V.plan[V.pi], why = whyNot(c, r);
        if (!why && build(k, c, r)) { V.pi++; V.n++; V.def += TOWERS[fac][k].cost; } else if (why && why !== 'enemigo') V.pi++; else return;
      } else {
        const t = G.towers.filter(o => o.lvl < TD.maxLevel).sort((a, b) => a.lvl - b.lvl)[0]; if (!t) { V.defDone = true; continue; }
        const c = upCost(t); if (G.gold < c) return; upgrade(t); V.def += c;
      }
    } else {
      const opts = FACTIONS[fac].units.filter(k => sendCost(k) <= G.gold).sort((a, b) => sendCost(b) - sendCost(a)); if (!opts.length) return;
      if (early || V.me.spawnQ.length >= VS.queue) return;
      const k = opts[(Math.random() * Math.min(3, opts.length)) | 0], c = sendCost(k);
      // de vez en cuando, en vez de enviar, mejora la unidad que iba a mandar
      const ul = V.ai.ulvl[k] || 1, uc = unitUpCost(k, ul);
      if (ul < TD.maxLevel && G.gold >= uc && Math.random() < VS.aiUp) { G.gold -= uc; V.ai.ulvl[k] = ul + 1; V.snd += uc; continue; }
      G.gold -= c; V.ai.income += sendIncome(k); V.ai.sent++; V.snd += c; V.me.spawnQ.push({ k, gap: VS.gap, lvl: ul });
    }
  }
}
function vsView(v) {
  const V = G.vs; V.view = v; G.place = null; G.ghost = null; G.sel = null; hidePanel(); hud();
}
function showVsResult(win) {
  const V = G.vs; G.screen = 'result'; showScreen('scr-result');
  $('#res-title').textContent = win ? '¡VICTORIA!' : FACTIONS[V.me.fac].base + ' HA CAÍDO';
  $('#res-title').className = 'ol-big ' + (win ? 'win' : 'lose');
  $('#res-stars').innerHTML = '';
  const m = Math.floor(V.t / 60), s = String(Math.floor(V.t % 60)).padStart(2, '0');
  $('#res-msg').innerHTML = (win ? `Has tumbado la base de ${FAC_NAME(V.ai.fac)} en ${m}:${s}.` : `${capFirst(FAC_NAME(V.ai.fac))} han tumbado tu base en ${m}:${s}.`) + `<br>Enviaste ${V.me.sent} unidades y tu income llegó a ${V.me.income}. El rival envió ${V.ai.sent}.<br>` + vsReward(win, V.diff);
  const art = $('#res-art'); requestAnimationFrame(() => portrait(art, FACTIONS[win ? V.me.fac : V.ai.fac].leader, 120));
  $('#res-next').hidden = true; $('#res-retry').onclick = () => startVS(V.diff);
}

/* ---------- fusión de torres en contacto ---------- */
// dos torres iguales, del mismo nivel y pegadas (arriba, abajo o a los lados) se pueden fusionar en una de un nivel más
function fuseMate(t) {
  if (t.lvl >= TD.fuseMax || tdef(t).leader) return null;
  const c = t.cell % COLS, r = (t.cell / COLS) | 0;
  for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nc = c + dc, nr = r + dr; if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue; const o = G.towers.find(o => o.cell === idx(nc, nr)); if (o && o.k === t.k && o.lvl === t.lvl && o.fac === t.fac) return o; }
  return null;
}
function fuse(t) {
  const o = fuseMate(t); if (!o) return;
  G.towers = G.towers.filter(x => x !== o); BLOCK[o.cell] = 0; reflow();
  t.lvl++; t.spent += o.spent; t.dropT = 0.2;
  puff(o.x, o.y, '#d9b77e', 12); ring(t.x, t.y, 46, 'rgba(197,140,255,.95)'); burst(t.x, t.y - 20, ['#c58cff', '#ffcb3d', '#fff6ea'], 18); pop(t.x, t.y - 54, '¡FUSIÓN! NIVEL ' + t.lvl, '#c58cff', 16); sfx('up');
}

/* =========================================================
   EFECTOS
   ========================================================= */
const num = (x, y, s, col, size = 14) => G.nums.push({ x, y, s: String(s), col, size, t: 0, life: 0.9 });
const pop = (x, y, s, col, size = 18) => G.nums.push({ x, y, s, col, size, t: 0, life: 1.3, big: true });
const ring = (x, y, r, col) => G.parts.push({ kind: 'ring', x, y, r, col, t: 0, life: 0.35 });
const spark = (x, y, col) => G.parts.push({ kind: 'dot', x, y, col, r: 4, t: 0, life: 0.18 });
const shake = n => { if (!REDUCED) G.shake = Math.max(G.shake || 0, n); };
function puff(x, y, col, n) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = rand(20, 70); G.parts.push({ kind: 'dot', x, y: y - 4, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.5 - 20, col, r: rand(2, 4.5), t: 0, life: rand(0.3, 0.55) }); } }
function burst(x, y, cols, r) { for (let i = 0; i < 8 + r * 0.4; i++) { const a = Math.random() * Math.PI * 2, s = rand(40, 130); G.parts.push({ kind: 'dot', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, g: 260, col: pick(cols), r: rand(2, 4), t: 0, life: rand(0.35, 0.6) }); } }
function slash(x, y, crit) { G.parts.push({ kind: 'slash', x, y, col: crit ? '#ffcb3d' : '#fff6ea', r: crit ? 20 : 13, a: rand(-0.6, 0.6), t: 0, life: 0.18 }); if (crit) pop(x, y - 22, '¡ZAS!', '#ffcb3d', 17); }
function boom(x, y, r, kind) { ring(x, y, r, kind === 'trash' ? 'rgba(160,220,90,.95)' : 'rgba(255,150,60,.95)'); burst(x, y, kind === 'trash' ? ['#7a8b5a', '#a3c464', '#5a4a3a'] : ['#ff7a1a', '#ffd34d', '#5a3a20'], r * 0.5); sfx('boom'); }
function banner(s) { const b = $('#banner'); b.textContent = s; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }

/* =========================================================
   SONIDO (sintetizado, como en el original)
   ========================================================= */
let AC = null;
function sfx(k) {
  if (SAVE.muted) return;
  if (G.vs && G.screen === 'play' && G.vsCur !== G.vs.view) return;   // en VS solo suena el campo que estás mirando
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  if (AC.state === 'suspended') AC.resume();
  const S = { shot: [880, 660, 0.05, 'square', 0.03], hit: [300, 160, 0.07, 'square', 0.05], crit: [520, 900, 0.12, 'sawtooth', 0.06], lob: [300, 520, 0.12, 'triangle', 0.05], boom: [140, 40, 0.3, 'sawtooth', 0.09],
    stomp: [90, 40, 0.22, 'square', 0.08], pop: [600, 900, 0.06, 'triangle', 0.04], coin: [990, 1320, 0.12, 'square', 0.05], place: [220, 440, 0.12, 'triangle', 0.08], up: [440, 880, 0.25, 'triangle', 0.08],
    leak: [220, 110, 0.35, 'sawtooth', 0.09], horn: [196, 262, 0.45, 'sawtooth', 0.07], jump: [300, 1000, 0.3, 'triangle', 0.07], zap: [1200, 300, 0.12, 'sawtooth', 0.05], womp: [200, 80, 0.4, 'square', 0.08], boss: [110, 70, 0.8, 'sawtooth', 0.1], win: [523, 1046, 0.6, 'triangle', 0.1] }[k];
  if (!S) return; const [f0, f1, d, type, vol] = S, t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + 0.02);
}

/* =========================================================
   DIBUJO
   ========================================================= */
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
let SCALE = 1, DPR = 1, BG = null;
function fit() {
  SCALE = Math.min(innerWidth / W, innerHeight / H); DPR = Math.min(2.5, window.devicePixelRatio || 1);
  const st = $('#stage'); st.style.width = W * SCALE + 'px'; st.style.height = H * SCALE + 'px';
  cv.width = Math.round(W * SCALE * DPR); cv.height = Math.round(H * SCALE * DPR);
  $('#ui').style.transform = `scale(${SCALE})`;
}
function buildTDBackground(fac) {
  const TH = THEMES[fac] || THEMES.animales;
  const c0 = document.createElement('canvas'); c0.width = W * BG_RES; c0.height = H * BG_RES;
  const c = c0.getContext('2d'); c.scale(BG_RES, BG_RES); c.lineJoin = 'round'; c.lineCap = 'round';
  const R = mulberry32(37), r = (a, b) => a + R() * (b - a);
  let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9fae69'); g.addColorStop(0.25, TH.grad[0]); g.addColorStop(0.6, TH.grad[1]); g.addColorStop(1, TH.grad[2]);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let y = 60; y < H; y += 44) { c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(0, y, W, 22); }
  c.lineWidth = 1.2;
  for (let i = 0; i < 3000; i++) { const px = r(0, W), py = r(60, 800); c.strokeStyle = TH.greens[(R() * TH.greens.length) | 0]; c.globalAlpha = r(0.35, 0.75); c.beginPath(); c.moveTo(px, py); c.lineTo(px + r(-1.5, 1.5), py - r(2.5, 5.5)); c.stroke(); }
  c.globalAlpha = 1;
  // la plaza de Microblizz se come el prado alrededor de la sede
  const edge = px => 146 + Math.sin(px * 0.045) * 6 + Math.sin(px * 0.13) * 3 + (Math.abs(px - 270) < 130 ? 22 * Math.cos(((px - 270) / 130) * Math.PI / 2) : 0);
  c.save(); c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); for (let px = W; px >= 0; px -= 6) c.lineTo(px, edge(px)); c.closePath(); c.fillStyle = '#a9b1bf'; c.fill(); c.clip();
  c.strokeStyle = 'rgba(70,80,100,.22)'; c.lineWidth = 1; c.beginPath(); for (let px = 0; px <= W; px += 26) { c.moveTo(px, 0); c.lineTo(px, 240); } for (let py = 0; py <= 240; py += 26) { c.moveTo(0, py); c.lineTo(W, py); } c.stroke();
  for (let i = 0; i < 30; i++) { c.fillStyle = `rgba(60,70,95,${r(0.05, 0.13)})`; c.fillRect(Math.floor(r(0, 21)) * 26, Math.floor(r(0, 9)) * 26, 26, 26); }
  c.restore();
  c.beginPath(); for (let px = 0; px <= W; px += 6) px ? c.lineTo(px, edge(px)) : c.moveTo(px, edge(px)); c.strokeStyle = '#7d8597'; c.lineWidth = 3; c.stroke();
  const sky = c.createLinearGradient(0, 0, 0, 62); sky.addColorStop(0, '#24133a'); sky.addColorStop(1, '#5b4a80'); c.fillStyle = sky; c.fillRect(0, 0, W, 62);
  let bx = -10; while (bx < W) { const bw = r(34, 64), bh = r(26, 58); c.fillStyle = '#41506f'; c.fillRect(bx, 62 - bh, bw, bh); c.strokeStyle = OL; c.lineWidth = 1.5; c.strokeRect(bx, 62 - bh, bw, bh); c.fillStyle = 'rgba(255,230,140,.55)'; for (let wy = 62 - bh + 6; wy < 56; wy += 9) for (let wx = bx + 5; wx < bx + bw - 6; wx += 9) if (R() < 0.45) c.fillRect(wx, wy, 4, 4); bx += bw + 2; }
  c.fillStyle = '#5a6582'; c.fillRect(0, 60, W, 5);
  // la explanada de tierra: todo el ancho de la pantalla es camino, y lo cierras tú con torres
  const top = GY - 8;
  c.fillStyle = 'rgba(115,80,42,.55)'; c.fillRect(0, top - 5, W, GY1 - top + 10);
  c.fillStyle = '#d9b77e'; c.fillRect(0, top, W, GY1 - top);
  for (let i = 0; i < NCELL; i++) if (((i % COLS) + ((i / COLS) | 0)) % 2) { c.fillStyle = 'rgba(150,105,55,.10)'; c.fillRect(ccx(i) - CELL / 2, ccy(i) - CELL / 2, CELL, CELL); }
  for (let k = 0; k < 2600; k++) { c.fillStyle = R() < 0.5 ? '#b8935e' : '#ead3a3'; c.beginPath(); c.ellipse(r(0, W), r(top, GY1), r(1, 2.4), r(0.8, 1.6), 0, 0, Math.PI * 2); c.fill(); }
  for (let k = 0; k < 40; k++) { const px = r(8, W - 8), py = r(top + 6, GY1 - 6); shape(c, el(px, py, r(2.5, 4.5), r(2, 3)), '#a88a62', 1.1); }
  // la entrada de Microblizz y el sendero hasta La Madriguera
  const gw = (GRID.gate + 0.5) * CELL;
  c.fillStyle = '#d9b77e'; c.fillRect(HQ.x - gw, top - 30, gw * 2, 34);
  c.beginPath(); c.moveTo(DEN.x - gw, GY1 - 2); c.lineTo(DEN.x + gw, GY1 - 2); c.lineTo(DEN.x + gw * 0.8, GY1 + 40); c.lineTo(DEN.x - gw * 0.8, GY1 + 40); c.closePath(); c.fillStyle = 'rgba(115,80,42,.55)'; c.fill();
  c.fillStyle = '#d9b77e'; c.fillRect(DEN.x - gw + 4, GY1 - 4, gw * 2 - 8, 38);
  // flores y setas en la hierba de abajo
  const fcols = ['#ffffff', '#ffd84d', '#ff8fb1', '#b98cff'];
  for (let i = 0; i < 40; i++) { const px = r(10, W - 10), py = r(GY1 + 12, 790); if (Math.abs(px - DEN.x) < gw + 6) continue; const col = fcols[(R() * 4) | 0]; for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; dot(c, px + Math.cos(a) * 2.3, py + Math.sin(a) * 2.3, 1.7, col); } dot(c, px, py, 1.3, '#ffb020'); }
  for (let i = 0; i < 6; i++) { const px = r(20, W - 20), py = r(GY1 + 22, 785); if (Math.abs(px - DEN.x) < gw + 14) continue; shape(c, rr(px - 2.2, py - 7, 4.4, 7, 1.5), '#f3e6cc', 1.3); shape(c, c2 => { c2.moveTo(px - 7, py - 6); c2.quadraticCurveTo(px, py - 16, px + 7, py - 6); c2.closePath(); }, TH.cap, 1.4); dot(c, px - 2.5, py - 9, 1.2, TH.capDot); dot(c, px + 2, py - 10.5, 1, TH.capDot); }
  paintLight(c);
  return c0;
}
function drawSpr(key, x, y, sc, face, o = {}) {
  const s = SPR[key]; if (!s) return; const T = TYPES[key];
  ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; ctx.translate(x, y); if (o.ang) ctx.rotate(o.ang * face); ctx.scale(face * sc * (o.sx || 1), sc * (o.sy || 1));
  ctx.drawImage(s.c, -s.ax, -s.ay, s.wd, s.ht);
  if (T && T.foot && CFG.units[key]) { const r = CFG.units[key].r, l = o.walk != null ? Math.sin(o.walk) * 2.2 : 0; for (const [fx, lift] of [[-0.4, Math.max(0, l)], [0.4, Math.max(0, -l)]]) { ctx.beginPath(); ctx.ellipse(fx * r, -1 - lift, r * 0.3, r * 0.19, 0, 0, Math.PI * 2); ctx.fillStyle = T.foot; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = OL; ctx.stroke(); } }
  if (o.flash > 0) { ctx.globalAlpha = o.flash; ctx.drawImage(s.w, -s.ax, -s.ay, s.wd, s.ht); }
  if (o.grey) { ctx.globalAlpha = 0.55; ctx.drawImage(s.g || s.w, -s.ax, -s.ay, s.wd, s.ht); }
  ctx.restore();
}
function drawStump(x, y, t) {
  ctx.fillStyle = 'rgba(20,10,30,.3)'; ctx.beginPath(); ctx.ellipse(x, y + 3, TOWER_R + 3, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y + 2, TOWER_R, 7.5, 0, 0, Math.PI); ctx.lineTo(x - TOWER_R, y - 3); ctx.closePath(); ctx.fillStyle = '#7a4d1c'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OL; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, y - 3, TOWER_R, 7.5, 0, 0, Math.PI * 2); ctx.fillStyle = '#d9a35e'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, y - 3, TOWER_R * 0.55, 4, 0, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(122,77,28,.6)'; ctx.lineWidth = 1.2; ctx.stroke();
  if (t && t.lvl > 1) for (let i = 0; i < t.lvl - 1; i++) { ctx.save(); ctx.translate(x + (i - (t.lvl - 2) / 2) * (t.lvl > 3 ? 9 : 14), y + 7); ctx.beginPath(); starPath(ctx, 0, 0, 5.5, 2.4); ctx.fillStyle = '#ffcb3d'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = OL; ctx.stroke(); ctx.restore(); }
}
const TSCALE = { bunny: 0.82, mechavaca: 0.82, junkcoon: 0.95 };
const tscale = k => TSCALE[k] || (CFG.units[k].r >= 21 ? 0.8 : CFG.units[k].r >= 18 ? 0.86 : 1);
// las cartas que en el original sacan varias unidades se dibujan como un grupito en la peana
function drawUnits(k, x, y, sc, face, o, n) {
  if (n === 2) { drawSpr(k, x - 8, y - 1, sc * 0.82, face, o); drawSpr(k, x + 8, y + 2, sc * 0.82, face, o); }
  else if (n === 3) { drawSpr(k, x - 10, y - 3, sc * 0.72, face, o); drawSpr(k, x + 10, y - 2, sc * 0.72, face, o); drawSpr(k, x, y + 3, sc * 0.72, face, o); }
  else drawSpr(k, x, y, sc, face, o);
}
// proyectiles de las razas: [color, radio, forma]
const SHOTS = { shadow: ['#9b6bff', 5], frost: ['#9fe8ff', 5], wave: ['#e6dcff', 6, 'ring'], clip: ['#ff5ea8', 4], arrow: ['#ffe9a8', 2.5, 'line'], venom: ['#8fe36a', 5], bullet: ['#ffe14d', 2.5, 'line'], code: ['#7dffb0', 4],
  snipe: ['#ff5ea8', 3, 'line'], shell: ['#5a6582', 6], card: ['#fff6ea', 5, 'rect'], gif: ['#ffb347', 4, 'rect'], note: ['#c58cff', 5], disc: ['#cfd6e6', 6, 'ring'], paper: ['#f3e6cc', 5, 'rect'], missile: ['#ff7a1a', 5],
  skull: ['#f3ecd8', 7], drone: ['#8fc2ff', 7], coin: ['#ffcb3d', 6], dog: ['#f0b35a', 7] };
function drawTower(t) {
  const D = tdef(t), sc = tscale(t.k) * (t.mut.scale || 1);
  // RABIA: brillo naranja que crece con los aliados cercanos (como en el original)
  if (t.rage > 0) { const k = t.rage / TD.rage.max, pulse = 0.85 + 0.15 * Math.sin(G.t * 8 + t.id), R = TOWER_R * (1.5 + k * 0.8); const g = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, R); g.addColorStop(0, `rgba(255,120,40,${(0.25 + 0.4 * k) * pulse})`); g.addColorStop(1, 'rgba(255,60,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(t.x, t.y, R, R * 0.5, 0, 0, Math.PI * 2); ctx.fill(); }
  if (D.aura && t.stunT <= 0) { ctx.save(); ctx.globalAlpha = 0.3 + 0.1 * Math.sin(G.t * 3); ctx.strokeStyle = '#9ef07a'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -G.t * 12; ctx.beginPath(); const ar = D.aura.r || rangeOf(t); ctx.ellipse(t.x, t.y, ar, ar * 0.92, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  if (t.hasteT > 0) { ctx.save(); ctx.globalAlpha = 0.6; ctx.strokeStyle = '#ffcb3d'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(t.x, t.y, TOWER_R + 4, 10, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  drawStump(t.x, t.y, t);
  if (t.jump) return;   // el conejo está en el aire: se dibuja aparte
  let sx = 1, sy = 1, ang = 0, x = t.x, z = 0;
  if (t.dropT > 0) { const k = t.dropT / 0.35; z = k * k * 60; }
  if (t.atkT > 0) { const k = Math.sin((t.atkT / 0.22) * Math.PI); ang = 0.25 * k; sx = 1 + 0.12 * k; sy = 1 - 0.08 * k; x += t.face * 3 * k; }
  else { const br = Math.sin(G.t * 3 + t.id * 1.7) * 0.025; sy = 1 + br; sx = 1 - br * 0.6; }
  const o = { sx, sy, ang, grey: t.stunT > 0 };
  drawUnits(t.k, x, t.y - 3 - z, sc, t.face, o, D.n);
  if (t.stunT > 0) { otxt(ctx, (t.stunTxt || '¡DESPEDIDO!').replace(/[¡!]/g, ''), t.x, t.y - 62, 11, '#fff6ea'); for (let i = 0; i < 3; i++) { const a = G.t * 4 + i * 2.1; dot(ctx, t.x + Math.cos(a) * 14, t.y - 50 + Math.sin(a) * 4, 2.4, '#ffcb3d'); } }
}
function drawBunnyJump(t) {
  const J = t.jump, k = Math.min(1, J.t / 0.45), back = J.t > 0.7 ? Math.min(1, (J.t - 0.7) / 0.45) : 0;
  let x, y, z;
  if (!J.hit) { x = lerp(J.x0, J.x1, k); y = lerp(J.y0, J.y1, k); z = Math.sin(k * Math.PI) * 120; }
  else if (back > 0) { x = lerp(J.x1, J.x0, back); y = lerp(J.y1, J.y0, back); z = Math.sin(back * Math.PI) * 90; }
  else { x = J.x1; y = J.y1; z = 0; }
  ctx.fillStyle = 'rgba(20,10,30,.25)'; ctx.beginPath(); ctx.ellipse(x, y, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
  drawSpr('bunny', x, y - z, 0.82, t.face, { ang: !J.hit ? k * 0.6 : 0 });
}
function drawFoe(f) {
  ctx.fillStyle = 'rgba(20,10,30,.3)'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 1, f.r * 1.05, f.r * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3d9bff'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(f.x, f.y + 1, f.r * 0.95, f.r * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
  if (f.slowT > 0) { ctx.strokeStyle = '#a3c464'; ctx.lineWidth = 3; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.ellipse(f.x, f.y + 1, f.r * 1.25, f.r * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
  if (f.markT > 0) { ctx.strokeStyle = '#ff4b5c'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.ellipse(f.x, f.y + 1, f.r * 1.5, f.r * 0.62, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
  const T = TYPES[f.art] || {}, moving = f.stunT <= 0, z = moving ? Math.abs(Math.sin(f.walk)) * 2.4 * (f.r / 14) : 0;
  const ang = moving ? 0.05 + Math.sin(f.walk) * 0.06 : Math.sin(G.t * 11 + f.id) * 0.07;
  if (f.fog > 0) ctx.globalAlpha = 0.45;
  const lg = f.lunge > 0 ? Math.sin((f.lunge / 0.25) * Math.PI) * 6 : 0;
  drawSpr(f.art, f.x + f.face * lg, f.y - z - (T.hover ? 4 + Math.sin(G.t * 4 + f.id) * 1.5 : 0), f.sc, f.face, { ang, walk: moving ? f.walk : null, flash: f.hitT > 0 ? (f.hitT / 0.12) * 0.9 : 0 });
  if (f.stunT > 0) for (let i = 0; i < 3; i++) { const a = G.t * 5 + i * 2.1; dot(ctx, f.x + Math.cos(a) * 12, f.y - topOf(f) - 6 + Math.sin(a) * 3, 2.2, '#ffcb3d'); }
  ctx.globalAlpha = 1;
  if (f.mutCol) dot(ctx, f.x, f.y - topOf(f) - 3, 3.2, f.mutCol);
  if (f.ulvl > 1) for (let i = 0; i < f.ulvl - 1; i++) { ctx.beginPath(); starPath(ctx, f.x + (i - (f.ulvl - 2) / 2) * 9, f.y - topOf(f) - 16, 4.6, 2); ctx.fillStyle = '#ffcb3d'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = OL; ctx.stroke(); }
  if (f.sh > 0) { ctx.strokeStyle = 'rgba(95,227,255,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(f.x, f.y - topOf(f) * 0.45, f.r * 1.25, topOf(f) * 0.62, 0, 0, Math.PI * 2); ctx.stroke(); }
  if (f.hp < f.maxHp && !FOES[f.k].boss) { const w = Math.max(24, f.r * 2.2), y = f.y - topOf(f) - 8; ctx.fillStyle = OL; ctx.fillRect(f.x - w / 2 - 1.5, y - 1.5, w + 3, 7); ctx.fillStyle = '#173d8f'; ctx.fillRect(f.x - w / 2, y, w, 4); ctx.fillStyle = '#2e8bff'; ctx.fillRect(f.x - w / 2, y, w * Math.max(0, f.hp / f.maxHp), 4); }
}
function drawProj(p) {
  const S = SHOTS[p.kind];
  if (S) {
    const [col, r, shp] = S; ctx.save(); ctx.translate(p.x, p.y);
    if (shp === 'line') { ctx.rotate(p.ang || 0); line(ctx, [-r * 3, 0, r * 2, 0], OL, r + 3); line(ctx, [-r * 3, 0, r * 2, 0], col, r); }
    else if (shp === 'rect') { ctx.rotate(p.rot || 0); shape(ctx, rr(-r, -r * 0.75, r * 2, r * 1.5, 1.5), col, 1.4); }
    else if (shp === 'ring') { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.lineWidth = 5; ctx.strokeStyle = OL; ctx.stroke(); ctx.lineWidth = 2.6; ctx.strokeStyle = col; ctx.stroke(); }
    else { dot(ctx, 0, 0, r + 1.6, OL); dot(ctx, 0, 0, r, col); dot(ctx, -r * 0.3, -r * 0.3, r * 0.35, 'rgba(255,255,255,.7)'); }
    ctx.restore(); return;
  }
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot || 0);
  if (p.kind === 'nut') { shape(ctx, el(0, 1, 4, 4.6), '#a0612b', 1.4); shape(ctx, el(0, -2.5, 4.6, 2.4), '#5a3a20', 1.2); }
  else if (p.kind === 'dyn') { shape(ctx, rr(-3.2, -7, 6.4, 14, 1.6), '#e2463b', 1.4); line(ctx, [0, -7, 2, -11], OL, 1.4); dot(ctx, 2.2, -11.5, 2 + Math.random() * 1.5, '#ffd34d'); }
  else if (p.kind === 'trash') { shape(ctx, el(0, 0, 7, 6.5), '#3b4252', 1.6); shape(ctx, poly(-2, -6, 2, -6, 3, -10, -3, -10), '#3b4252', 1.2); dot(ctx, -2, -1, 1.6, 'rgba(255,255,255,.35)'); }
  else if (p.kind === 'letter') { ctx.rotate(-(p.rot || 0) + Math.sin(p.t * 20) * 0.3); shape(ctx, rr(-8, -5.5, 16, 11, 1.5), '#fff6ea', 1.4); line(ctx, [-8, -5, 0, 1, 8, -5], OL, 1.2); }
  ctx.restore();
  if (p.kind === 'letter') { const k = Math.min(1, p.t / p.dur); p.x = lerp(p.x, p.tx, k * 0.25); p.y = lerp(p.y, p.ty, k * 0.25); }
}
function draw() {
  const V = G.vs;
  if (V && G.screen === 'play' && V.view === 'ai') { saveBoard(V.me); loadBoard(V.ai, 'ai'); drawBoard(); loadBoard(V.me, 'me'); }
  else drawBoard();
}
function drawBoard() {
  ctx.setTransform(SCALE * DPR, 0, 0, SCALE * DPR, 0, 0);
  if (G.screen !== 'play' || !BG) { ctx.fillStyle = '#150b21'; ctx.fillRect(0, 0, W, H); if (BG) ctx.drawImage(BG, 0, 0, W, H); return; }
  const sh = G.shake || 0; if (sh) ctx.translate(rand(-sh, sh) * 0.4, rand(-sh, sh) * 0.4);
  ctx.drawImage(G.vs ? bgOf(G.fac) : BG, 0, 0, W, H);
  // la sede de Microblizz arriba y La Madriguera abajo (arte del original)
  drawSpr(FACTIONS[G.efac].skin + '_base', HQ.x, HQ.y - 6, 0.62, 1);
  // mientras eliges dónde poner una torre: las casillas, la casilla elegida y cómo quedaría el camino
  const gh = G.place && G.ghost;
  if (G.place) {
    ctx.save(); ctx.strokeStyle = 'rgba(90,58,32,.28)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let c = 0; c <= COLS; c++) { ctx.moveTo(GX + c * CELL, GY); ctx.lineTo(GX + c * CELL, GY1); }
    for (let r = 0; r <= ROWS; r++) { ctx.moveTo(GX, GY + r * CELL); ctx.lineTo(GX + COLS * CELL, GY + r * CELL); }
    ctx.stroke(); ctx.restore();
  }
  if (gh) { ctx.fillStyle = G.ghost.ok ? 'rgba(255,255,255,.28)' : 'rgba(255,75,92,.35)'; ctx.fillRect(G.ghost.x - CELL / 2, G.ghost.y - CELL / 2 - 6, CELL, CELL); }
  drawRoute(gh && G.ghost.route ? G.ghost.route : G.route, gh && G.ghost.route ? '#ffcb3d' : 'rgba(255,246,234,.75)');
  // lo que hay que pintar ordenado por altura
  const list = [...G.towers.map(t => ({ y: t.y, f: () => drawTower(t) })), ...G.foes.map(f => ({ y: f.y, f: () => drawFoe(f) })), { y: DEN.y - 70, f: () => drawDen() }];
  list.sort((a, b) => a.y - b.y); for (const e of list) e.f();
  // rango de la torre elegida o de la que vas a poner
  const rs = G.sel || (G.ghost && G.place ? { x: G.ghost.x, y: G.ghost.y, ghost: true } : null);
  if (rs) {
    const R = rs.ghost ? TOWERS[G.fac][G.place].range : rangeOf(rs), ok = rs.ghost ? G.ghost.ok : true;
    ctx.save(); ctx.fillStyle = ok ? 'rgba(255,255,255,.14)' : 'rgba(255,75,92,.18)'; ctx.strokeStyle = ok ? 'rgba(255,255,255,.85)' : 'rgba(255,75,92,.9)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.ellipse(rs.x, rs.y, R, R * 0.92, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
    if (rs.ghost) { ctx.globalAlpha = 0.75; drawStump(rs.x, rs.y); drawUnits(G.place, rs.x, rs.y - 3, tscale(G.place), 1, {}, TOWERS[G.fac][G.place].n); ctx.globalAlpha = 1; }
  }
  for (const t of G.towers) if (t.jump) drawBunnyJump(t);
  for (const p of G.projs) drawProj(p);
  for (const q of G.parts) {
    const k = q.t / q.life;
    if (q.kind === 'ring') { ctx.globalAlpha = 1 - k; ctx.strokeStyle = q.col; ctx.lineWidth = 4 * (1 - k) + 1; ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r * (0.4 + 0.6 * k), q.r * (0.4 + 0.6 * k) * 0.55, 0, 0, Math.PI * 2); ctx.stroke(); }
    else if (q.kind === 'bolt') { ctx.globalAlpha = 1 - k; const dx = q.x2 - q.x, dy = q.y2 - q.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; ctx.beginPath(); ctx.moveTo(q.x, q.y); for (let i = 1; i < 4; i++) { const o = Math.sin(q.x * 0.7 + i * 2.3 + q.y) * 7; ctx.lineTo(q.x + dx * i / 4 + nx * o, q.y + dy * i / 4 + ny * o); } ctx.lineTo(q.x2, q.y2); ctx.lineJoin = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = q.col; ctx.lineWidth = 3; ctx.stroke(); }
    else if (q.kind === 'slash') { ctx.globalAlpha = 1 - k; ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a); ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, q.r, -2.4, -0.6); ctx.stroke(); ctx.strokeStyle = q.col; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
    else { ctx.globalAlpha = 1 - k * 0.7; dot(ctx, q.x, q.y, q.r * (1 - k * 0.5), q.col); }
    ctx.globalAlpha = 1;
  }
  for (const n of G.nums) { ctx.globalAlpha = Math.min(1, (n.life - n.t) * 4); const s = n.big ? n.size * (n.t < 0.12 ? 0.6 + n.t * 3.3 : 1) : n.size; otxt(ctx, n.s, n.x, n.y, s, n.col); ctx.globalAlpha = 1; }
  if (G.boss) { const f = G.boss, w = 300, x = (W - w) / 2, y = 82; ctx.fillStyle = OL; ctx.fillRect(x - 3, y - 3, w + 6, 16); ctx.fillStyle = '#4a1020'; ctx.fillRect(x, y, w, 10); ctx.fillStyle = '#ff4b5c'; ctx.fillRect(x, y, w * Math.max(0, f.hp / f.maxHp), 10); otxt(ctx, foeName(f.k), W / 2, y + 26, 15, '#fff6ea'); }
}
function drawDen() {
  drawSpr(FACTIONS[G.fac].skin + '_base', DEN.x, DEN.y + 14, 0.72, 1, { flash: G.denHitT > 0 ? G.denHitT * 3 : 0 });
  // vida de La Madriguera
  const w = 120, x = DEN.x - w / 2, y = DEN.y + 22, k = Math.min(1, G.lives / TD.baseHp);
  ctx.fillStyle = OL; ctx.fillRect(x - 2, y - 2, w + 4, 11); ctx.fillStyle = '#4a1020'; ctx.fillRect(x, y, w, 7);
  ctx.fillStyle = k > 0.5 ? '#6fd36a' : k > 0.25 ? '#ffcb3d' : '#ff4b5c'; ctx.fillRect(x, y, w * k, 7);
  if (G.fac === 'ciber') { ctx.fillStyle = OL; ctx.fillRect(x - 2, y - 9, w + 4, 8); ctx.fillStyle = '#123a52'; ctx.fillRect(x, y - 7, w, 4); ctx.fillStyle = '#5fe3ff'; ctx.fillRect(x, y - 7, w * (G.shield / PASSIVES.ciber.amt), 4); }
}
// el camino más corto que seguirán los enemigos, con flechitas que avanzan
function drawRoute(route, col) {
  if (!route || route.length < 2) return;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([2, 9]); ctx.lineDashOffset = -G.t * 22; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(HQ.x, GY - 14); for (const i of route) ctx.lineTo(ccx(i), ccy(i)); ctx.lineTo(DEN.x, GY1 + 10); ctx.stroke(); ctx.restore();
}

/* =========================================================
   INTERFAZ
   ========================================================= */
const $ = s => document.querySelector(s);
function showScreen(id) { if (id !== null) { $('#btn-mode').hidden = true; $('#btn-wave').hidden = true; hidePanel(); } for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id; $('#hud').hidden = $('#tray').hidden = id !== null; }
function portrait(cnv, key, h, flip = 1) {
  const k = 3; cnv.width = cnv.clientWidth * k || 180; cnv.height = cnv.clientHeight * k || 180;
  const c = cnv.getContext('2d'); c.scale(k, k); const cw = cnv.width / k, ch = cnv.height / k;
  drawVector(c, key, cw / 2, ch - 4, h || ch * 0.8, flip);
}
function buildTray() {
  const tray = $('#cards'); tray.innerHTML = '';
  if (G.vs && G.trayMode === 'send') {
    // modo VS: las 6 unidades de tu raza, para mandárselas al rival
    for (const k of FACTIONS[G.fac].units) {
      const C = CFG.cards[k], b = document.createElement('button'), l = G.vs.me.ulvl[k] || 1, max = l >= TD.maxLevel; b.className = 'card send r-' + C.rarity; b.dataset.k = k; b.dataset.send = '1';
      b.setAttribute('aria-label', `Enviar ${C.name} de nivel ${l}: ${sendCost(k)} de CAOS, +${sendIncome(k)} de income`);
      b.innerHTML = `<canvas></canvas><span class="nm">${l > 1 ? '★'.repeat(l - 1) + ' ' : ''}+${sendIncome(k)} income</span><span class="cost ol">${sendCost(k)}</span><span class="upg ol${max ? ' max' : ''}" role="button" aria-label="Mejorar ${C.name}">${max ? 'MÁX' : '▲ ' + unitUpCost(k, l)}</span>`;
      tray.appendChild(b); requestAnimationFrame(() => portrait(b.querySelector('canvas'), k, C.rarity === 'epic' ? 40 : 34));
      b.addEventListener('pointerdown', e => { e.preventDefault(); if (e.target.closest('.upg')) { if (vsUpgrade(k)) buildTray(); hud(); return; } vsSend(k); hud(); });
    }
    return;
  }
  for (const k in TOWERS[G.fac]) {
    const D = TOWERS[G.fac][k], C = CFG.cards[k];
    const b = document.createElement('button'); b.className = 'card r-' + C.rarity; b.dataset.k = k; b.setAttribute('aria-label', `${C.name}, ${D.cost} de CAOS`);
    b.innerHTML = `<canvas></canvas><span class="nm">${C.name}</span><span class="cost ol">${D.cost}</span>`;
    tray.appendChild(b);
    requestAnimationFrame(() => portrait(b.querySelector('canvas'), k, C.rarity === 'leader' || C.rarity === 'epic' ? 40 : 34));
    b.addEventListener('pointerdown', e => { e.preventDefault(); if (G.vs && G.vs.view !== 'me') vsView('me'); G.sel = null; hidePanel(); if (G.over) return; if (D.leader && G.towers.some(t => t.k === k)) { showInfo(k); return; } if (G.place === k) { G.place = null; G.ghost = null; } else { G.place = k; G.ghost = null; G.dragging = true; showInfo(k); } refreshTray(); });
  }
}
function showInfo(k) { const C = CFG.cards[k], D = TOWERS[G.fac][k]; $('#info').innerHTML = `<b>${C.name}</b> · ${D.desc}`; $('#info').hidden = false; }
function refreshTray() {
  for (const b of document.querySelectorAll('#cards .card')) { const k = b.dataset.k; if (b.dataset.send) { const l = G.vs.me.ulvl[k] || 1; b.classList.toggle('off', G.gold < sendCost(k)); b.querySelector('.upg').classList.toggle('no', l < TD.maxLevel && G.gold < unitUpCost(k, l)); continue; } const D = TOWERS[G.fac][k]; const used = D.leader && G.towers.some(t => t.k === k); b.classList.toggle('off', G.gold < D.cost || used); b.classList.toggle('sel', G.place === k); b.classList.toggle('used', !!used); }
  if (!G.place) $('#info').hidden = true;
}
function hud() {
  const V = G.vs, wb = $('#btn-wave');
  setText($('#gold'), G.gold); setText($('#lives'), Math.ceil(G.lives)); $('#ui').classList.toggle('vs', !!V); if ($('#btn-mode').hidden !== !V) $('#btn-mode').hidden = !V;
  if (V) {
    // modo VS: la vida del rival, tu income y el botón para mirar su campo
    setText($('#wave-l'), 'RIVAL ♥'); setText($('#wave'), Math.ceil(V.ai.lives));
    if (wb.hidden !== G.over) wb.hidden = G.over; wb.classList.remove('beat'); setText($('#wave-main'), V.view === 'me' ? 'RIVAL' : 'VOLVER'); setText($('#wave-sub'), V.view === 'me' ? 'ver su campo' : 'a tu campo');
    setText($('#btn-mode'), G.trayMode === 'send' ? 'TORRES' : 'ENVIAR UNIDADES');
    setText($('#btn-speed'), 'x' + G.speed); $('#btn-speed').setAttribute('aria-pressed', String(G.speed > 1));
    setText($('#lvl-name'), (V.view === 'me' ? 'TU CAMPO' : 'CAMPO DE ' + FAC_NAME(V.ai.fac).toUpperCase()) + ` · income +${V.me.income} en ${Math.ceil(V.tickT)} s`);
    refreshTray(); if (G.sel) placePanel(); return;
  }
  setText($('#wave-l'), 'OLEADA'); setText($('#wave-main'), '¡OLEADA!'); setText($('#wave'), `${Math.min(G.wave, G.waves)}/${G.waves}`);
  const can = !G.inWave && G.wave < G.waves && !G.over; if (wb.hidden !== !can) wb.hidden = !can; wb.classList.add('beat');
  if (can) setText($('#wave-sub'), G.wave === 0 ? '¡EMPEZAR!' : Math.ceil(G.nextT) + ' s · +' + Math.round(G.nextT * TD.earlyBonus));
  setText($('#btn-speed'), 'x' + G.speed); $('#btn-speed').setAttribute('aria-pressed', String(G.speed > 1));
  setText($('#lvl-name'), `${G.level.id} · ${G.level.name}` + passiveChip());
  refreshTray(); if (G.sel) placePanel();
}
// lo que lleva ganado la pasiva de la raza, junto al nombre del nivel
function passiveChip() {
  const f = G.fac, pc = v => ' · ' + FACTIONS[f].passive + ' +' + Math.round(v * 100) + ' %';
  if (f === 'streamers') return pc(G.teamSpd);
  if (f === 'heroes') return pc(G.teamDmg - 1);
  if (f === 'gamer') return pc(G.teamDmg - 1);
  if (f === 'ciber') return ' · ESCUDO ' + Math.ceil(G.shield);
  return ' · ' + FACTIONS[f].passive;
}
function placePanel() {
  const t = G.sel, p = $('#panel'), C = CFG.cards[t.k], D = tdef(t), max = t.lvl >= TD.maxLevel, c = max ? 0 : upCost(t), mate = fuseMate(t), canFuse = t.lvl < TD.fuseMax && !D.leader;
  p.hidden = false;
  // los botones solo se vuelven a crear cuando cambia la torre, su nivel o si se puede fusionar; el resto se actualiza sin tocarlos (si no, parpadean)
  const key = [t.id, t.lvl, mate ? mate.id : 0, canFuse].join('|');
  if (p.dataset.h !== key) {
    p.dataset.h = key;
    p.innerHTML = `<div class="pn-t ol">${C.name} <small>NV ${t.lvl}</small></div><div class="pn-s" id="pn-st"></div>${canFuse && !mate ? '<div class="pn-h">Pega al lado otra igual y del mismo nivel para fusionarlas.</div>' : ''}
    <div class="pn-b"><button class="btn-up" id="pn-up">${max ? 'MÁXIMO' : 'MEJORAR<small>' + c + ' CAOS</small>'}</button>${mate ? `<button class="btn-fuse" id="pn-fuse">FUSIONAR<small>nivel ${t.lvl + 1}</small></button>` : ''}<button class="btn-sell" id="pn-sell">VENDER<small>+${sellOf(t)}</small></button></div>`;
    $('#pn-up').onclick = () => { upgrade(t); hud(); }; $('#pn-sell').onclick = () => { sell(t); hidePanel(); hud(); }; const pf = $('#pn-fuse'); if (pf) pf.onclick = () => { fuse(t); hud(); };
  }
  const R = Math.round(rangeOf(t)), dmg = D.kind === 'aura' ? `+${Math.round((D.aura.speed + 0.1 * (t.lvl - 1)) * 100)} % velocidad` : `${Math.round(dmgOf(t) / (D.ramp ? 1 + D.ramp.step * (t.ramp || 0) : 1))} de daño`;
  setHtml($('#pn-st'), `${dmg} · alcance ${R}${t.rage ? ` · <span class="rage">RABIA +${t.rage * 10} %</span>` : ''}${t.mut.id && t.mut.id !== 'normal' ? ` · <span class="rage">${t.mut.txt}</span>` : ''}`);
  const up = $('#pn-up'), off = max || G.gold < c; if (up.disabled !== off) up.disabled = off;
  const x = clamp(t.x, 120, W - 120), y = t.y > 520 ? t.y - 160 : t.y + 40; p.style.left = x - 110 + 'px'; p.style.top = y + 'px';
}
// escribir en la página solo cuando el texto cambia de verdad
function setText(el, v) { v = String(v); if (el.textContent !== v) el.textContent = v; }
function setHtml(el, v) { if (el.dataset.v !== v) { el.dataset.v = v; el.innerHTML = v; } }
function hidePanel() { $('#panel').hidden = true; $('#panel').dataset.h = ''; }

// controles: arrastra una carta al campo o tócala y luego toca el campo
function toField(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / SCALE, y: (e.clientY - r.top) / SCALE }; }
const GHOST_MSG = { cierra: '¡NO CIERRES EL CAMINO!', enemigo: 'HAY ENEMIGOS', puerta: 'ES LA ENTRADA', ocupada: 'YA HAY UNA TORRE', boton: 'AQUÍ NO', fuera: 'AQUÍ NO' };
// la casilla bajo el dedo, si se puede construir y cómo quedaría el camino
function ghostAt(p) {
  if (p.y < GY - 6 || p.y > GY1 + 4 || p.x < GX || p.x > GX + COLS * CELL) return null;
  const { c, r } = cellAt(p.x, p.y), i = idx(c, r), why = whyNot(c, r);
  const g = { c, r, x: ccx(i), y: ccy(i) + 6, why, ok: !why && G.gold >= TOWERS[G.fac][G.place].cost, route: null };
  if (!why) { BLOCK[i] = 1; const D = flow(BLOCK); g.route = routeFrom(MID_ENTRY, D, BLOCK); BLOCK[i] = 0; }
  return g;
}
function tryBuild(g) {
  if (!g) return false;
  if (build(G.place, g.c, g.r)) { G.place = null; G.ghost = null; return true; }
  pop(g.x, g.y - 30, g.why ? GHOST_MSG[g.why] : 'FALTA CAOS', g.why ? '#ff4b5c' : '#ffcb3d', 14); return false;
}
addEventListener('pointermove', e => {
  if (G.screen !== 'play' || !G.place || !(G.dragging || e.pointerType === 'mouse')) return;
  const g = ghostAt(toField(e)); if (!g) { G.ghost = null; return; }
  if (!G.ghost || G.ghost.c !== g.c || G.ghost.r !== g.r) G.ghost = g;
});
addEventListener('pointerup', e => {
  if (G.screen !== 'play' || !G.dragging) return; G.dragging = false;
  const p = toField(e); if (G.place && p.y < 792 && p.y > 0 && G.ghost) { tryBuild(ghostAt(p)); hud(); }
});
cv.addEventListener('pointerdown', e => {
  if (G.screen !== 'play' || G.over || (G.vs && G.vs.view !== 'me')) return; const p = toField(e);
  if (G.place) { const g = ghostAt(p); if (g) { G.ghost = g; tryBuild(g); hud(); } return; }
  const pc = p.y >= GY && p.y < GY1 ? cellOf(p.x, p.y) : -1;
  const t = G.towers.find(o => o.cell === pc) || G.towers.find(o => Math.hypot(o.x - p.x, o.y - 20 - p.y) < 22);
  G.sel = t && t !== G.sel ? t : null; if (G.sel) placePanel(); else hidePanel();
});
addEventListener('keydown', e => { if (e.key === 'Escape') { G.place = null; G.ghost = null; G.sel = null; hidePanel(); refreshTray(); } if (e.key === ' ' && G.screen === 'play') { e.preventDefault(); startWave(); } });

function startLevel(L) {
  G.vs = null;
  Object.assign(G, { screen: 'play', level: L, gold: L.gold, lives: TD.baseHp, route: [], wave: 0, waves: L.waves, inWave: false, nextT: 0, spawnQ: [], foes: [], towers: [], projs: [], parts: [], nums: [], place: null, ghost: null, sel: null, over: false, paused: false, boss: null, kills: 0, hpMul: L.hp, fac: facNow(), efac: L.efac, teamDmg: 1, teamSpd: 0, shieldT: 0, denHitT: 0, denT: 0 });
  G.shield = G.fac === 'ciber' ? PASSIVES.ciber.amt : 0; BG = bgOf(G.fac);
  BLOCK.fill(0); reflow();
  hidePanel(); showScreen(null); buildTray(); hud(); $('#lvl-name').textContent = `${L.id} · ${L.name}`;
  banner(`${L.id} · ${L.name.toUpperCase()}`);
}
function showResult(win, st, first) {
  G.screen = 'result'; showScreen('scr-result');
  const L = G.level, W0 = WORLDS_TD[L.wi], next = W0.levels[L.li + 1];
  $('#res-title').textContent = win ? '¡VICTORIA!' : FACTIONS[G.fac].base + ' HA CAÍDO';
  $('#res-title').className = 'ol-big ' + (win ? 'win' : 'lose');
  $('#res-stars').innerHTML = [1, 2, 3].map(i => `<span class="${i <= st ? 'on' : ''}">★</span>`).join('');
  let msg = win ? `¡${capFirst(FACTIONS[G.fac].end)} sigue en pie con ${G.lives} de vida!` : `Tu base ha caído en la oleada ${G.wave} de ${G.waves}. Prueba otras torres u otro laberinto.`;
  const nextWorld = WORLDS_TD[L.wi + 1], go = next || (nextWorld && nextWorld.levels[0]);
  if (win && !next) msg += nextWorld ? `<br><b>¡Mundo liberado!</b> Lo siguiente en la historia: <b>${nextWorld.name}</b>.` : '<br><b>¡Has terminado la campaña!</b> Microblizz y Phony ya no cierran más juegos.';
  $('#res-msg').innerHTML = msg + '<br>' + G.rw;
  const art = $('#res-art'); requestAnimationFrame(() => portrait(art, win ? FACTIONS[G.fac].leader : L.deck[0], 120));
  $('#res-next').hidden = !(win && go); $('#res-next').onclick = () => startLevel(go);
  $('#res-retry').onclick = () => startLevel(L);
}
const FAC_NAME = f => (f && FACTIONS[f] ? (FACTIONS[f].los || 'los ' + FACTIONS[f].name) : '');
function showMap() {
  G.vs = null;
  G.screen = 'map'; showScreen('scr-map');
  const list = $('#worlds'); buildFacPick();
  list.innerHTML = WORLDS_TD.map((w, wi) => {
    const open = wi === 0 || worldDone(wi - 1), E = FACTIONS[w.efac];
    const lv = `<div class="lvls">${w.levels.map(l => { const o = levelOpen(l), s = starsOf(l.id); return `<button class="lvl${l.boss ? ' boss' : ''}" data-l="${l.id}" ${o ? '' : 'disabled'}><b>${l.id}</b><span>${l.name}</span><i>${o ? '★'.repeat(s) + '<em>' + '★'.repeat(3 - s) + '</em>' : '🔒'}</i></button>`; }).join('')}</div>`;
    return `<div class="world${open ? '' : ' locked'}"><div class="wh"><canvas data-k="${E.leader || E.units[0]}"></canvas><div><div class="wn ol">Mundo ${wi + 1} · ${w.name}</div><div class="wj">${open ? w.story : 'Libera el mundo anterior para entrar.'}</div></div></div>${open ? `<div class="wt"><b>Enemigos: ${CORP[w.efac] || E.corr || E.name + ' corrompidos'}.</b> ${ETRAITS[w.efac].txt}</div>` : ''}${lv}</div>`;
  }).join('');
  for (const b of list.querySelectorAll('.lvl')) b.onclick = () => { const [wi, li] = b.dataset.l.split('-').map(Number); startLevel(WORLDS_TD[wi - 1].levels[li - 1]); };
  requestAnimationFrame(() => { for (const c of list.querySelectorAll('canvas[data-k]')) portrait(c, c.dataset.k, 40); });
}
// elegir raza: todas están disponibles desde el principio
const facNow = () => (TOWERS[SAVE.fac] ? SAVE.fac : 'animales');
const BGS = {}, bgOf = f => BGS[f] || (BGS[f] = buildTDBackground(f));
function buildFacPick() {
  const box = $('#fac-pick'), cur = facNow(), F = FACTIONS[cur];
  box.innerHTML = FACTION_ORDER.filter(f => TOWERS[f]).map(f => `<button class="fac${f === cur ? ' sel' : ''}" data-f="${f}" aria-label="${FACTIONS[f].name}" aria-pressed="${f === cur}"><canvas></canvas></button>`).join('');
  for (const b of box.children) b.onclick = () => { SAVE.fac = b.dataset.f; saveGame(); sfx('place'); buildFacPick(); };
  requestAnimationFrame(() => { for (const b of box.children) portrait(b.querySelector('canvas'), FACTIONS[b.dataset.f].leader, 42); });
  $('#map-team').textContent = 'Tu raza: ' + F.name;
  $('#fac-pas').innerHTML = `<b>${F.passive}</b> · ${PASSIVES[cur].txt}`;
}

/* ---------- botones ---------- */
$('#btn-play').onclick = () => { sfx('place'); showMap(); };
$('#btn-wave').onclick = () => { if (G.vs) vsView(G.vs.view === 'me' ? 'ai' : 'me'); else { startWave(); hud(); } };
$('#btn-mode').onclick = () => { if (G.vs.view !== 'me') vsView('me'); G.trayMode = G.trayMode === 'send' ? 'build' : 'send'; G.place = null; G.ghost = null; buildTray(); hud(); };
for (const b of document.querySelectorAll('#vs-row button')) b.onclick = () => { sfx('place'); startVS(b.dataset.d); };
$('#btn-speed').onclick = () => { G.speed = G.speed === 1 ? 2 : 1; hud(); };
$('#btn-pause').onclick = () => { if (G.over) return; G.paused = true; $('#scr-pause').hidden = false; };
$('#pz-go').onclick = () => { G.paused = false; $('#scr-pause').hidden = true; };
$('#pz-retry').onclick = () => { $('#scr-pause').hidden = true; if (G.vs) startVS(G.vs.diff); else startLevel(G.level); };
$('#pz-map').onclick = () => { $('#scr-pause').hidden = true; G.paused = false; showMap(); };
$('#res-map').onclick = () => showMap();
$('#map-back').onclick = () => showMenu();
const soundBtns = () => { for (const b of document.querySelectorAll('.btn-sound')) { b.textContent = SAVE.muted ? '🔇' : '🔊'; b.setAttribute('aria-label', SAVE.muted ? 'Activar sonido' : 'Silenciar sonido'); } };
for (const b of document.querySelectorAll('.btn-sound')) b.onclick = () => { SAVE.muted = !SAVE.muted; saveGame(); soundBtns(); };

/* ---------- arranque ---------- */
let last = performance.now(), hudT = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (G.screen === 'play' && !G.paused && !G.over) { const steps = G.speed; for (let i = 0; i < steps && !G.over; i++) (G.vs ? vsUpdate : update)(dt); }
  else if (G.screen === 'play' && G.over) { const d2 = dt; for (const q of G.parts) { q.t += d2; } G.parts = G.parts.filter(q => q.t < q.life); for (const n of G.nums) { n.t += d2; n.y -= d2 * 28; } G.nums = G.nums.filter(n => n.t < n.life); }
  draw();
  hudT -= dt; if (G.screen === 'play' && hudT <= 0) { hudT = 0.1; hud(); }
  requestAnimationFrame(frame);
}
async function boot() {
  try { await Promise.race([document.fonts.load('20px "Luckiest Guy"'), new Promise(r => setTimeout(r, 2500))]); } catch (e) { /* fuente por defecto */ }
  buildSprites(); BG = bgOf('animales');
  fit(); addEventListener('resize', fit); soundBtns();
  showMenu();
  portrait($('#title-art'), 'bunny', 150); portrait($('#title-foe'), 'fallen', 110, -1);
  window.__TD = { G, TOWERS, vsUpgrade, cardMods, startVS, vsUpdate, vsSend, vsView, fuse, fuseMate, startLevel, startWave, build, sell, upgrade, update, canPlace, whyNot, flow, BLOCK, ENTRY, WORLDS_TD, SAVE, get DIST() { return DIST; } };   // para las pruebas automáticas
  requestAnimationFrame(frame);
}
// boot() se llama al final de js/td-idle.js, cuando ya están cargados los menús
