// Fans of Rumble TD · Motor: oleadas, torres, dibujo y controles
'use strict';
/* =========================================================
   ESTADO
   ========================================================= */
const SAVE_KEY = 'fortd-save';
function loadSave() { try { const o = JSON.parse(localStorage.getItem(SAVE_KEY)); if (o && o.v === 1) return o; } catch (e) { /* sin almacenamiento */ } return { v: 1, stars: {}, muted: false }; }
let SAVE = loadSave();
function saveGame() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) { /* el progreso vive en memoria */ } }
const starsOf = id => SAVE.stars[id] || 0;
const levelOpen = L => L.li === 0 ? L.wi === 0 || worldDone(L.wi - 1) : starsOf(WORLDS_TD[L.wi].levels[L.li - 1].id) > 0;
const worldDone = wi => { const w = WORLDS_TD[wi]; return !!w.levels && w.levels.every(l => starsOf(l.id) > 0); };
const factionsJoined = () => WORLDS_TD.filter((w, wi) => w.joins && (wi === 0 || worldDone(wi))).map(w => w.joins).filter(f => TOWERS[f]);

const G = { screen: 'title', t: 0, speed: 1, paused: false, level: null, gold: 0, lives: 0, wave: 0, waves: 0, inWave: false, nextT: 0, spawnQ: [], spawnT: 0,
  foes: [], towers: [], projs: [], parts: [], nums: [], place: null, ghost: null, sel: null, leaderOut: false, over: false, fac: 'animales', boss: null };
let uid = 0;

/* ---------- camino ---------- */
const SEGS = []; let PATH_LEN = 0;
for (let i = 0; i < TD_PATH.length - 1; i++) { const [ax, ay] = TD_PATH[i], [bx, by] = TD_PATH[i + 1], L = Math.hypot(bx - ax, by - ay); SEGS.push({ ax, ay, bx, by, L, d0: PATH_LEN }); PATH_LEN += L; }
function pathAt(d) {
  d = clamp(d, 0, PATH_LEN);
  for (const s of SEGS) if (d <= s.d0 + s.L) { const t = (d - s.d0) / s.L; return { x: s.ax + (s.bx - s.ax) * t, y: s.ay + (s.by - s.ay) * t, dx: s.bx - s.ax }; }
  const s = SEGS[SEGS.length - 1]; return { x: s.bx, y: s.by, dx: s.bx - s.ax };
}
function distToSeg(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay; const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1); return Math.hypot(px - (ax + dx * t), py - (ay + dy * t)); }
const pathDist = (x, y) => Math.min(...SEGS.map(s => distToSeg(x, y, s.ax, s.ay, s.bx, s.by)));
const HQ = { x: 270, y: 150 }, DEN = { x: 270, y: 768 };
function canPlace(x, y) {
  if (x < FIELD.x0 + TOWER_R || x > FIELD.x1 - TOWER_R || y < FIELD.y0 + 50 || y > FIELD.y1 - 6) return false;
  if (pathDist(x, y) < PATH_HALF + TOWER_R + 2) return false;
  if (Math.hypot(x - HQ.x, y - HQ.y + 30) < 78 || Math.hypot(x - DEN.x, y - DEN.y + 30) < 66) return false;
  if (x > 420 && y > 668) return false;   // el botón de la oleada
  return !G.towers.some(t => Math.hypot(t.x - x, t.y - y) < TOWER_R * 2 + 4);
}

/* ---------- torres ---------- */
const tdef = t => TOWERS[t.fac][t.k];
function rageOf(t) { if (t.fac !== 'animales') return 0; let n = 0; for (const o of G.towers) if (o !== t && o.fac === 'animales' && Math.hypot(o.x - t.x, o.y - t.y) <= TD.rage.radius) n++; return Math.min(n, TD.rage.max); }
function auraOf(t) { let b = 0; for (const o of G.towers) { const D = tdef(o); if (o !== t && D.aura && o.stunT <= 0 && Math.hypot(o.x - t.x, o.y - t.y) <= rangeOf(o)) b = Math.max(b, D.aura.speed + 0.1 * (o.lvl - 1)); } return b; }
const rangeOf = t => tdef(t).range * (1 + TD.upRange * (t.lvl - 1));
const dmgOf = t => tdef(t).dmg * (1 + TD.upDmg * (t.lvl - 1)) * (1 + TD.rage.perAlly * t.rage);
const upCost = t => Math.round(tdef(t).cost * TD.upCost[t.lvl] / 5) * 5;
const sellOf = t => Math.round(t.spent * TD.sellBack / 5) * 5;
function build(k, x, y) {
  const D = TOWERS[G.fac][k];
  if (G.gold < D.cost || !canPlace(x, y) || (D.leader && G.towers.some(t => tdef(t).leader))) return false;
  G.gold -= D.cost;
  const t = { id: ++uid, k, fac: G.fac, x, y, lvl: 1, spent: D.cost, cdT: 0.3, rage: 0, face: 1, atkT: 0, stunT: 0, critN: 0, jumpT: D.jump ? D.jump.cd * 0.6 : 0, jump: null, dropT: 0.35 };
  G.towers.push(t); sfx('place'); puff(x, y, '#d9b77e', 10);
  return true;
}
function upgrade(t) { const c = upCost(t); if (t.lvl >= TD.maxLevel || G.gold < c) return; G.gold -= c; t.spent += c; t.lvl++; sfx('up'); pop(t.x, t.y - 50, '¡NIVEL ' + t.lvl + '!', '#ffcb3d', 16); ring(t.x, t.y, 40, 'rgba(255,203,61,.9)'); }
function sell(t) { G.gold += sellOf(t); G.towers = G.towers.filter(o => o !== t); G.sel = null; sfx('coin'); puff(t.x, t.y, '#d9b77e', 12); }

/* ---------- enemigos ---------- */
function spawnFoe(k, d = 0, hpMul = G.hpMul) {
  const F = FOES[k], U = CFG.units[F.art || k] || {};
  const hp = Math.round(foeHp(k) * hpMul);
  const f = { id: ++uid, k, art: F.art || k, d, hp, maxHp: hp, speed: foeSpeed(k) * rand(0.95, 1.05), r: F.r || U.r || 12, sc: F.scale || 1, armor: U.armor || 0, slowT: 0, slowF: 1, stunT: 0, hitT: 0, walk: Math.random() * 6, face: 1, healT: 1.5, despT: F.despido ? F.despido.cd * 0.5 : 0, off: rand(-7, 7), x: 0, y: 0 };
  const p = pathAt(d); f.x = p.x; f.y = p.y;
  G.foes.push(f); if (F.boss) { G.boss = f; sfx('boss'); pop(270, 300, '¡' + foeName(k).toUpperCase() + '!', '#ff4b5c', 34); }
  return f;
}
function hurt(f, dmg, crit) {
  if (f.hp <= 0) return;
  dmg = dmg * (1 - f.armor); f.hp -= dmg; f.hitT = 0.12;
  if (crit || dmg >= 20) num(f.x + rand(-6, 6), f.y - topOf(f) - 6, Math.round(dmg), crit ? '#ffcb3d' : '#fff6ea', crit ? 18 : 13);
  if (f.hp <= 0) kill(f);
}
function kill(f) {
  const F = FOES[f.k]; f.dead = true; G.gold += F.gold; G.kills++;
  num(f.x, f.y - topOf(f) - 4, '+' + F.gold, '#ffcb3d', 13); burst(f.x, f.y - 10, ['#8fc2ff', '#2e8bff', '#fff6ea'], f.r);
  if (F.eject) { for (let i = 0; i < F.ejectN; i++) spawnFoe(F.eject, Math.max(0, f.d - 8 - i * 9)); pop(f.x, f.y - 40, '¡BOTÍN!', '#ffcb3d', 18); }
  if (F.boss) { G.boss = null; sfx('win'); shake(10); }
  sfx('pop');
}
const topOf = f => ((TYPES[f.art] && TYPES[f.art].top) || 40) * f.sc;

/* ---------- oleadas ---------- */
function buildWave(L, w) {
  const R = mulberry32(L.wi * 1000 + L.li * 100 + w * 7 + 3);
  const avail = L.deck.filter((k, i) => w >= 1 + i * 2 - (i ? 1 : 0));
  let budget = 5 + w * 3.4 + Math.pow(w, 1.5) * 0.6;
  const q = [];
  // los fuertes nunca abren la oleada
  q.push('becario');
  while (budget > 0) { const k = avail[(R() * avail.length) | 0]; q.push(k); budget -= FOES[k].cost; }
  if (L.boss && w === L.waves) q.push(L.boss);
  return q.map((k, i) => ({ k, gap: i === 0 ? 0 : FOES[k].cost >= 5 ? 1.7 : FOES[q[i - 1]].cost >= 5 ? 1.2 : 0.75 + R() * 0.35 }));
}
function startWave() {
  if (G.inWave || G.wave >= G.waves || G.over) return;
  if (G.wave > 0 && G.nextT > 0) { const b = Math.round(G.nextT * TD.earlyBonus); if (b > 0) { G.gold += b; num(470, 700, '+' + b, '#ffcb3d', 16); } }
  G.wave++; G.inWave = true; G.spawnQ = buildWave(G.level, G.wave); G.spawnT = 0;
  G.hpMul = G.level.hp * (1 + TD.hpGrowth * (G.wave - 1));
  banner('OLEADA ' + G.wave + (G.wave === G.waves ? ' · ¡LA ÚLTIMA!' : '')); sfx('horn');
}
function waveDone() {
  G.inWave = false; const b = TD.waveBonus(G.wave); G.gold += b; num(270, 420, '+' + b + ' de oro', '#ffcb3d', 20);
  if (G.wave >= G.waves) return finish(true);
  G.nextT = 12;
}

/* =========================================================
   BUCLE
   ========================================================= */
function update(dt) {
  G.t += dt;
  if (G.inWave) {
    G.spawnT -= dt;
    while (G.spawnQ.length && G.spawnT <= 0) { const s = G.spawnQ.shift(); spawnFoe(s.k, 0, FOES[s.k].boss ? G.level.hp : G.hpMul); G.spawnT += G.spawnQ.length ? G.spawnQ[0].gap : 0; }
    if (!G.spawnQ.length && !G.foes.length) waveDone();
  } else if (G.wave > 0 && G.wave < G.waves && !G.over) { G.nextT -= dt; if (G.nextT <= 0) { G.nextT = 0; startWave(); } }
  // enemigos
  for (const f of G.foes) {
    f.hitT = Math.max(0, f.hitT - dt); f.slowT -= dt; if (f.slowT <= 0) f.slowF = 1;
    if (f.stunT > 0) { f.stunT -= dt; continue; }
    const sp = f.speed * f.slowF; f.d += sp * dt; f.walk += dt * sp * 0.22;
    const p = pathAt(f.d); f.face = p.dx > 0.5 ? 1 : p.dx < -0.5 ? -1 : f.face;
    const nx = p.dx ? 0 : 1; f.x = p.x + f.off * nx; f.y = p.y + (p.dx ? f.off * 0.5 : 0);
    const U = CFG.units[f.art];
    if (U && U.healer) { f.healT -= dt; if (f.healT <= 0) { f.healT = U.healCd; let best = null; for (const o of G.foes) if (o !== f && !o.dead && o.hp < o.maxHp && Math.hypot(o.x - f.x, o.y - f.y) < U.healR && (!best || o.hp / o.maxHp < best.hp / best.maxHp)) best = o; if (best) { const h = U.heal * 2 * G.hpMul; best.hp = Math.min(best.maxHp, best.hp + h); num(best.x, best.y - topOf(best), '+' + Math.round(h), '#9ef07a', 12); ring(best.x, best.y - 10, 18, 'rgba(158,240,122,.9)'); } } }
    const F = FOES[f.k];
    if (F.despido) { f.despT -= dt; if (f.despT <= 0) { f.despT = F.despido.cd; let best = null, bd = 1e9; for (const t of G.towers) { const dd = Math.hypot(t.x - f.x, t.y - f.y); if (dd < F.despido.range && dd < bd && t.stunT <= 0) { bd = dd; best = t; } } if (best) { best.stunT = F.despido.t; pop(best.x, best.y - 56, '¡DESPEDIDO!', '#fff6ea', 18); G.projs.push({ kind: 'letter', x: f.x, y: f.y - 60, tx: best.x, ty: best.y - 20, t: 0, dur: 0.5 }); sfx('womp'); } } }
    if (f.d >= PATH_LEN) { f.dead = true; f.leaked = true; G.lives -= F.leak; shake(4 + F.leak); sfx('leak'); pop(DEN.x, DEN.y - 90, '-' + F.leak, '#ff4b5c', 24); if (F.boss) G.boss = null; if (G.lives <= 0) { G.lives = 0; finish(false); } }
  }
  G.foes = G.foes.filter(f => !f.dead);
  // torres
  for (const t of G.towers) {
    const D = tdef(t); t.rage = rageOf(t); t.atkT = Math.max(0, t.atkT - dt); t.dropT = Math.max(0, t.dropT - dt);
    if (t.stunT > 0) { t.stunT -= dt; continue; }
    if (t.jump) { jumpStep(t, dt); continue; }
    if (D.jump) { t.jumpT -= dt; if (t.jumpT <= 0 && tryJump(t)) continue; }
    if (D.kind === 'aura') continue;
    t.cdT -= dt * (1 + auraOf(t));
    if (t.cdT > 0) continue;
    const R = rangeOf(t); let tgt = null;
    for (const f of G.foes) if (Math.hypot(f.x - t.x, f.y - t.y) <= R + f.r && (!tgt || f.d > tgt.d)) tgt = f;
    if (!tgt) continue;
    t.cdT = D.cd; t.face = tgt.x >= t.x ? 1 : -1; t.atkT = 0.22;
    const dmg = dmgOf(t);
    if (D.kind === 'hit') {
      let m = 1, crit = false; if (D.crit && ++t.critN >= D.crit.every) { t.critN = 0; m = D.crit.mult; crit = true; }
      hurt(tgt, dmg * m, crit); slash(tgt.x, tgt.y - topOf(tgt) * 0.5, crit); sfx(crit ? 'crit' : 'hit');
    } else if (D.kind === 'shot') {
      G.projs.push({ kind: D.shot, x: t.x + t.face * 8, y: t.y - 26, target: tgt, dmg, speed: 520, t: 0 }); sfx('shot');
    } else if (D.kind === 'lob') {
      const lead = Math.min(0.9, Math.hypot(tgt.x - t.x, tgt.y - t.y) / 260), p = pathAt(tgt.d + tgt.speed * tgt.slowF * lead * (tgt.stunT > 0 ? 0 : 1));
      G.projs.push({ kind: D.shot, x: t.x, y: t.y - 30, sx: t.x, sy: t.y - 30, tx: p.x, ty: p.y, t: 0, dur: lead, dmg, splash: D.splash, slow: D.slow, arc: 70 }); sfx('lob');
    } else if (D.kind === 'stomp') {
      for (const f of G.foes) if (Math.hypot(f.x - t.x, f.y - t.y) <= R + f.r) { hurt(f, dmg); if (D.slow) { f.slowF = D.slow.f; f.slowT = D.slow.t; } }
      ring(t.x, t.y, R, 'rgba(255,170,220,.9)'); shake(2); sfx('stomp');
    }
  }
  // proyectiles
  for (const p of G.projs) {
    p.t += dt;
    if (p.target) {
      const f = p.target, ty = f.y - topOf(f) * 0.5, dx = f.x - p.x, dy = ty - p.y, L = Math.hypot(dx, dy), st = p.speed * dt;
      if (f.dead && !f.leaked && L > st) { p.target = null; p.tx = f.x; p.ty = ty; p.dur = p.t + L / p.speed; p.sx = p.x; p.sy = p.y; p.t0 = p.t; continue; }
      if (L <= st || f.dead) { p.done = true; if (!f.dead) hurt(f, p.dmg); spark(p.x, p.y, '#ffd34d'); continue; }
      p.x += (dx / L) * st; p.y += (dy / L) * st; p.rot = (p.rot || 0) + dt * 14;
    } else if (p.kind === 'letter') { if (p.t >= p.dur) p.done = true; }
    else if (p.sx != null && p.arc) {
      const k = Math.min(1, p.t / p.dur); p.x = lerp(p.sx, p.tx, k); p.y = lerp(p.sy, p.ty, k) - Math.sin(k * Math.PI) * p.arc; p.rot = (p.rot || 0) + dt * 9;
      if (k >= 1) { p.done = true; boom(p.tx, p.ty, p.splash, p.kind); for (const f of G.foes) if (Math.hypot(f.x - p.tx, f.y - p.ty) <= p.splash + f.r * 0.5) { hurt(f, p.dmg); if (p.slow) { f.slowF = p.slow.f; f.slowT = p.slow.t; } } }
    } else if (p.t >= (p.dur || 0.3)) p.done = true;
  }
  G.projs = G.projs.filter(p => !p.done);
  for (const q of G.parts) { q.t += dt; q.x += (q.vx || 0) * dt; q.y += (q.vy || 0) * dt; if (q.g) q.vy += q.g * dt; }
  G.parts = G.parts.filter(q => q.t < q.life);
  for (const n of G.nums) { n.t += dt; n.y -= dt * 28; }
  G.nums = G.nums.filter(n => n.t < n.life);
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 30);
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
    J.hit = true; const dmg = D.dmg * (1 + TD.upDmg * (t.lvl - 1)) * (1 + TD.rage.perAlly * t.rage);
    for (const f of G.foes) if (Math.hypot(f.x - J.x1, f.y - J.y1) <= D.r + f.r) { hurt(f, dmg); f.stunT = Math.max(f.stunT, D.stun); }
    ring(J.x1, J.y1, D.r, 'rgba(255,203,61,.95)'); burst(J.x1, J.y1, ['#ffcb3d', '#fff6ea', '#ff7a1a'], 22); pop(J.x1, J.y1 - 70, '¡CHAOS JUMP!', '#ffcb3d', 20); shake(6); sfx('boom');
  }
  if (J.t >= 1.15) { t.jump = null; t.jumpT = D.cd; t.dropT = 0.25; }
}
function finish(win) {
  if (G.over) return; G.over = true; G.place = null; G.sel = null;
  const L = G.level, st = win ? (G.lives >= TD.lives - 2 ? 3 : G.lives >= TD.lives / 2 ? 2 : 1) : 0;
  const first = win && !starsOf(L.id);
  if (win && st > starsOf(L.id)) { SAVE.stars[L.id] = st; saveGame(); }
  setTimeout(() => showResult(win, st, first), win ? 900 : 600);
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
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  if (AC.state === 'suspended') AC.resume();
  const S = { shot: [880, 660, 0.05, 'square', 0.03], hit: [300, 160, 0.07, 'square', 0.05], crit: [520, 900, 0.12, 'sawtooth', 0.06], lob: [300, 520, 0.12, 'triangle', 0.05], boom: [140, 40, 0.3, 'sawtooth', 0.09],
    stomp: [90, 40, 0.22, 'square', 0.08], pop: [600, 900, 0.06, 'triangle', 0.04], coin: [990, 1320, 0.12, 'square', 0.05], place: [220, 440, 0.12, 'triangle', 0.08], up: [440, 880, 0.25, 'triangle', 0.08],
    leak: [220, 110, 0.35, 'sawtooth', 0.09], horn: [196, 262, 0.45, 'sawtooth', 0.07], jump: [300, 1000, 0.3, 'triangle', 0.07], womp: [200, 80, 0.4, 'square', 0.08], boss: [110, 70, 0.8, 'sawtooth', 0.1], win: [523, 1046, 0.6, 'triangle', 0.1] }[k];
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
  const edge = px => 168 + Math.sin(px * 0.045) * 8 + Math.sin(px * 0.13) * 4 + (Math.abs(px - 270) < 130 ? 30 * Math.cos(((px - 270) / 130) * Math.PI / 2) : 0);
  c.save(); c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); for (let px = W; px >= 0; px -= 6) c.lineTo(px, edge(px)); c.closePath(); c.fillStyle = '#a9b1bf'; c.fill(); c.clip();
  c.strokeStyle = 'rgba(70,80,100,.22)'; c.lineWidth = 1; c.beginPath(); for (let px = 0; px <= W; px += 26) { c.moveTo(px, 0); c.lineTo(px, 240); } for (let py = 0; py <= 240; py += 26) { c.moveTo(0, py); c.lineTo(W, py); } c.stroke();
  for (let i = 0; i < 30; i++) { c.fillStyle = `rgba(60,70,95,${r(0.05, 0.13)})`; c.fillRect(Math.floor(r(0, 21)) * 26, Math.floor(r(0, 9)) * 26, 26, 26); }
  c.restore();
  c.beginPath(); for (let px = 0; px <= W; px += 6) px ? c.lineTo(px, edge(px)) : c.moveTo(px, edge(px)); c.strokeStyle = '#7d8597'; c.lineWidth = 3; c.stroke();
  const sky = c.createLinearGradient(0, 0, 0, 62); sky.addColorStop(0, '#24133a'); sky.addColorStop(1, '#5b4a80'); c.fillStyle = sky; c.fillRect(0, 0, W, 62);
  let bx = -10; while (bx < W) { const bw = r(34, 64), bh = r(26, 58); c.fillStyle = '#41506f'; c.fillRect(bx, 62 - bh, bw, bh); c.strokeStyle = OL; c.lineWidth = 1.5; c.strokeRect(bx, 62 - bh, bw, bh); c.fillStyle = 'rgba(255,230,140,.55)'; for (let wy = 62 - bh + 6; wy < 56; wy += 9) for (let wx = bx + 5; wx < bx + bw - 6; wx += 9) if (R() < 0.45) c.fillRect(wx, wy, 4, 4); bx += bw + 2; }
  c.fillStyle = '#5a6582'; c.fillRect(0, 60, W, 5);
  // camino de tierra
  const lane = (col, w) => { c.beginPath(); TD_PATH.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  lane('rgba(115,80,42,.55)', PATH_HALF * 2 + 10); lane('#d9b77e', PATH_HALF * 2);
  for (const s of SEGS) { const nx = -(s.by - s.ay) / s.L, ny = (s.bx - s.ax) / s.L; for (let k = 0; k < s.L / 6; k++) { const t = R(), o = r(-PATH_HALF + 4, PATH_HALF - 4); c.fillStyle = R() < 0.5 ? '#b8935e' : '#ead3a3'; c.beginPath(); c.ellipse(s.ax + (s.bx - s.ax) * t + nx * o, s.ay + (s.by - s.ay) * t + ny * o, r(1, 2.4), r(0.8, 1.6), 0, 0, Math.PI * 2); c.fill(); } }
  // flores y setas
  const fcols = ['#ffffff', '#ffd84d', '#ff8fb1', '#b98cff'];
  for (let i = 0; i < 120; i++) { const px = r(26, W - 26), py = r(190, 790); if (pathDist(px, py) < PATH_HALF + 8) continue; const col = fcols[(R() * 4) | 0]; for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; dot(c, px + Math.cos(a) * 2.3, py + Math.sin(a) * 2.3, 1.7, col); } dot(c, px, py, 1.3, '#ffb020'); }
  for (let i = 0; i < 14; i++) { const px = r(30, 510), py = r(200, 780); if (pathDist(px, py) < PATH_HALF + 14) continue; shape(c, rr(px - 2.2, py - 7, 4.4, 7, 1.5), '#f3e6cc', 1.3); shape(c, c2 => { c2.moveTo(px - 7, py - 6); c2.quadraticCurveTo(px, py - 16, px + 7, py - 6); c2.closePath(); }, TH.cap, 1.4); dot(c, px - 2.5, py - 9, 1.2, TH.capDot); dot(c, px + 2, py - 10.5, 1, TH.capDot); }
  // setos a los lados
  for (let y = 180; y < 800; y += 21) for (const side of [0, 1]) { const px = side ? W - r(-4, 6) : r(-4, 6); for (let k = 0; k < 3; k++) { const ox = r(-7, 7), oy = r(-6, 6), rad = r(8, 12); c.beginPath(); c.arc(px + ox, y + oy, rad, 0, Math.PI * 2); c.fillStyle = TH.hedge[0]; c.fill(); c.lineWidth = 1.5; c.strokeStyle = OL; c.stroke(); c.beginPath(); c.arc(px + ox - rad * 0.3, y + oy - rad * 0.3, rad * 0.45, 0, Math.PI * 2); c.fillStyle = TH.hedge[1]; c.fill(); } }
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
  if (t && t.lvl > 1) for (let i = 0; i < t.lvl - 1; i++) { ctx.save(); ctx.translate(x - 7 + i * 14, y + 7); ctx.beginPath(); starPath(ctx, 0, 0, 5.5, 2.4); ctx.fillStyle = '#ffcb3d'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = OL; ctx.stroke(); ctx.restore(); }
}
const TSCALE = { bunny: 0.82, mechavaca: 0.82, junkcoon: 0.95 };
function drawTower(t) {
  const D = tdef(t), sc = TSCALE[t.k] || 1;
  // RABIA: brillo naranja que crece con los aliados cercanos (como en el original)
  if (t.rage > 0) { const k = t.rage / TD.rage.max, pulse = 0.85 + 0.15 * Math.sin(G.t * 8 + t.id), R = TOWER_R * (1.5 + k * 0.8); const g = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, R); g.addColorStop(0, `rgba(255,120,40,${(0.25 + 0.4 * k) * pulse})`); g.addColorStop(1, 'rgba(255,60,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(t.x, t.y, R, R * 0.5, 0, 0, Math.PI * 2); ctx.fill(); }
  if (D.aura && t.stunT <= 0) { ctx.save(); ctx.globalAlpha = 0.3 + 0.1 * Math.sin(G.t * 3); ctx.strokeStyle = '#9ef07a'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -G.t * 12; ctx.beginPath(); ctx.ellipse(t.x, t.y, rangeOf(t), rangeOf(t) * 0.92, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  drawStump(t.x, t.y, t);
  if (t.jump) return;   // el conejo está en el aire: se dibuja aparte
  let sx = 1, sy = 1, ang = 0, x = t.x, z = 0;
  if (t.dropT > 0) { const k = t.dropT / 0.35; z = k * k * 60; }
  if (t.atkT > 0) { const k = Math.sin((t.atkT / 0.22) * Math.PI); ang = 0.25 * k; sx = 1 + 0.12 * k; sy = 1 - 0.08 * k; x += t.face * 3 * k; }
  else { const br = Math.sin(G.t * 3 + t.id * 1.7) * 0.025; sy = 1 + br; sx = 1 - br * 0.6; }
  const o = { sx, sy, ang, grey: t.stunT > 0 };
  if (t.k === 'squirrel') { drawSpr('squirrel', x - 8, t.y - 4 - z, sc * 0.82, t.face, o); drawSpr('squirrel', x + 8, t.y - 1 - z, sc * 0.82, t.face, Object.assign({}, o, { ang: -ang })); }
  else drawSpr(t.k, x, t.y - 3 - z, sc, t.face, o);
  if (t.stunT > 0) { otxt(ctx, 'DESPEDIDO', t.x, t.y - 62, 11, '#fff6ea'); for (let i = 0; i < 3; i++) { const a = G.t * 4 + i * 2.1; dot(ctx, t.x + Math.cos(a) * 14, t.y - 50 + Math.sin(a) * 4, 2.4, '#ffcb3d'); } }
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
  const T = TYPES[f.art] || {}, moving = f.stunT <= 0, z = moving ? Math.abs(Math.sin(f.walk)) * 2.4 * (f.r / 14) : 0;
  const ang = moving ? 0.05 + Math.sin(f.walk) * 0.06 : Math.sin(G.t * 11 + f.id) * 0.07;
  drawSpr(f.art, f.x, f.y - z - (T.hover ? 4 + Math.sin(G.t * 4 + f.id) * 1.5 : 0), f.sc, f.face, { ang, walk: moving ? f.walk : null, flash: f.hitT > 0 ? (f.hitT / 0.12) * 0.9 : 0 });
  if (f.stunT > 0) for (let i = 0; i < 3; i++) { const a = G.t * 5 + i * 2.1; dot(ctx, f.x + Math.cos(a) * 12, f.y - topOf(f) - 6 + Math.sin(a) * 3, 2.2, '#ffcb3d'); }
  if (f.hp < f.maxHp && !FOES[f.k].boss) { const w = Math.max(24, f.r * 2.2), y = f.y - topOf(f) - 8; ctx.fillStyle = OL; ctx.fillRect(f.x - w / 2 - 1.5, y - 1.5, w + 3, 7); ctx.fillStyle = '#173d8f'; ctx.fillRect(f.x - w / 2, y, w, 4); ctx.fillStyle = '#2e8bff'; ctx.fillRect(f.x - w / 2, y, w * Math.max(0, f.hp / f.maxHp), 4); }
}
function drawProj(p) {
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot || 0);
  if (p.kind === 'nut') { shape(ctx, el(0, 1, 4, 4.6), '#a0612b', 1.4); shape(ctx, el(0, -2.5, 4.6, 2.4), '#5a3a20', 1.2); }
  else if (p.kind === 'dyn') { shape(ctx, rr(-3.2, -7, 6.4, 14, 1.6), '#e2463b', 1.4); line(ctx, [0, -7, 2, -11], OL, 1.4); dot(ctx, 2.2, -11.5, 2 + Math.random() * 1.5, '#ffd34d'); }
  else if (p.kind === 'trash') { shape(ctx, el(0, 0, 7, 6.5), '#3b4252', 1.6); shape(ctx, poly(-2, -6, 2, -6, 3, -10, -3, -10), '#3b4252', 1.2); dot(ctx, -2, -1, 1.6, 'rgba(255,255,255,.35)'); }
  else if (p.kind === 'letter') { ctx.rotate(-(p.rot || 0) + Math.sin(p.t * 20) * 0.3); shape(ctx, rr(-8, -5.5, 16, 11, 1.5), '#fff6ea', 1.4); line(ctx, [-8, -5, 0, 1, 8, -5], OL, 1.2); }
  ctx.restore();
  if (p.kind === 'letter') { const k = Math.min(1, p.t / p.dur); p.x = lerp(p.x, p.tx, k * 0.25); p.y = lerp(p.y, p.ty, k * 0.25); }
}
function draw() {
  ctx.setTransform(SCALE * DPR, 0, 0, SCALE * DPR, 0, 0);
  if (G.screen !== 'play' || !BG) { ctx.fillStyle = '#150b21'; ctx.fillRect(0, 0, W, H); if (BG) ctx.drawImage(BG, 0, 0, W, H); return; }
  const sh = G.shake || 0; if (sh) ctx.translate(rand(-sh, sh) * 0.4, rand(-sh, sh) * 0.4);
  ctx.drawImage(BG, 0, 0, W, H);
  // la sede de Microblizz arriba y La Madriguera abajo (arte del original)
  drawSpr('e_base', HQ.x, HQ.y - 6, 0.62, 1);
  // lo que hay que pintar ordenado por altura
  const list = [...G.towers.map(t => ({ y: t.y, f: () => drawTower(t) })), ...G.foes.map(f => ({ y: f.y, f: () => drawFoe(f) })), { y: DEN.y, f: () => drawDen() }];
  list.sort((a, b) => a.y - b.y); for (const e of list) e.f();
  // rango de la torre elegida o de la que vas a poner
  const rs = G.sel || (G.ghost && G.place ? { x: G.ghost.x, y: G.ghost.y, ghost: true } : null);
  if (rs) {
    const R = rs.ghost ? TOWERS[G.fac][G.place].range : rangeOf(rs), ok = rs.ghost ? G.ghost.ok : true;
    ctx.save(); ctx.fillStyle = ok ? 'rgba(255,255,255,.14)' : 'rgba(255,75,92,.18)'; ctx.strokeStyle = ok ? 'rgba(255,255,255,.85)' : 'rgba(255,75,92,.9)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.ellipse(rs.x, rs.y, R, R * 0.92, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
    if (rs.ghost) { ctx.globalAlpha = 0.75; drawStump(rs.x, rs.y); if (G.place === 'squirrel') { drawSpr('squirrel', rs.x - 8, rs.y - 4, 0.82, 1); drawSpr('squirrel', rs.x + 8, rs.y - 1, 0.82, 1); } else drawSpr(G.place, rs.x, rs.y - 3, TSCALE[G.place] || 1, 1); ctx.globalAlpha = 1; }
  }
  for (const t of G.towers) if (t.jump) drawBunnyJump(t);
  for (const p of G.projs) drawProj(p);
  for (const q of G.parts) {
    const k = q.t / q.life;
    if (q.kind === 'ring') { ctx.globalAlpha = 1 - k; ctx.strokeStyle = q.col; ctx.lineWidth = 4 * (1 - k) + 1; ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r * (0.4 + 0.6 * k), q.r * (0.4 + 0.6 * k) * 0.55, 0, 0, Math.PI * 2); ctx.stroke(); }
    else if (q.kind === 'slash') { ctx.globalAlpha = 1 - k; ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a); ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, q.r, -2.4, -0.6); ctx.stroke(); ctx.strokeStyle = q.col; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
    else { ctx.globalAlpha = 1 - k * 0.7; dot(ctx, q.x, q.y, q.r * (1 - k * 0.5), q.col); }
    ctx.globalAlpha = 1;
  }
  for (const n of G.nums) { ctx.globalAlpha = Math.min(1, (n.life - n.t) * 4); const s = n.big ? n.size * (n.t < 0.12 ? 0.6 + n.t * 3.3 : 1) : n.size; otxt(ctx, n.s, n.x, n.y, s, n.col); ctx.globalAlpha = 1; }
  if (G.boss) { const f = G.boss, w = 300, x = (W - w) / 2, y = 82; ctx.fillStyle = OL; ctx.fillRect(x - 3, y - 3, w + 6, 16); ctx.fillStyle = '#4a1020'; ctx.fillRect(x, y, w, 10); ctx.fillStyle = '#ff4b5c'; ctx.fillRect(x, y, w * Math.max(0, f.hp / f.maxHp), 10); otxt(ctx, foeName(f.k), W / 2, y + 26, 15, '#fff6ea'); }
}
function drawDen() { drawSpr('p_base', DEN.x, DEN.y + 14, 0.72, 1); }

/* =========================================================
   INTERFAZ
   ========================================================= */
const $ = s => document.querySelector(s);
function showScreen(id) { for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id; $('#hud').hidden = $('#tray').hidden = id !== null; }
function portrait(cnv, key, h, flip = 1) {
  const k = 3; cnv.width = cnv.clientWidth * k || 180; cnv.height = cnv.clientHeight * k || 180;
  const c = cnv.getContext('2d'); c.scale(k, k); const cw = cnv.width / k, ch = cnv.height / k;
  drawVector(c, key, cw / 2, ch - 4, h || ch * 0.8, flip);
}
function buildTray() {
  const tray = $('#cards'); tray.innerHTML = '';
  for (const k in TOWERS[G.fac]) {
    const D = TOWERS[G.fac][k], C = CFG.cards[k];
    const b = document.createElement('button'); b.className = 'card r-' + C.rarity; b.dataset.k = k; b.setAttribute('aria-label', `${C.name}, ${D.cost} de oro`);
    b.innerHTML = `<canvas></canvas><span class="nm">${C.name}</span><span class="cost ol">${D.cost}</span>`;
    tray.appendChild(b);
    requestAnimationFrame(() => portrait(b.querySelector('canvas'), k, k === 'bunny' || k === 'mechavaca' ? 40 : 34));
    b.addEventListener('pointerdown', e => { e.preventDefault(); G.sel = null; hidePanel(); if (G.over) return; if (D.leader && G.towers.some(t => t.k === k)) { showInfo(k); return; } if (G.place === k) { G.place = null; G.ghost = null; } else { G.place = k; G.ghost = null; G.dragging = true; showInfo(k); } refreshTray(); });
  }
}
function showInfo(k) { const C = CFG.cards[k], D = TOWERS[G.fac][k]; $('#info').innerHTML = `<b>${C.name}</b> · ${D.desc}`; $('#info').hidden = false; }
function refreshTray() {
  for (const b of document.querySelectorAll('#cards .card')) { const k = b.dataset.k, D = TOWERS[G.fac][k]; const used = D.leader && G.towers.some(t => t.k === k); b.classList.toggle('off', G.gold < D.cost || used); b.classList.toggle('sel', G.place === k); b.classList.toggle('used', !!used); }
  if (!G.place) $('#info').hidden = true;
}
function hud() {
  $('#gold').textContent = G.gold; $('#lives').textContent = G.lives; $('#wave').textContent = `${Math.min(G.wave, G.waves)}/${G.waves}`;
  const wb = $('#btn-wave'), can = !G.inWave && G.wave < G.waves && !G.over; wb.hidden = !can;
  if (can) $('#wave-sub').textContent = G.wave === 0 ? '¡EMPEZAR!' : Math.ceil(G.nextT) + ' s · +' + Math.round(G.nextT * TD.earlyBonus);
  $('#btn-speed').textContent = 'x' + G.speed; $('#btn-speed').setAttribute('aria-pressed', String(G.speed > 1));
  refreshTray(); if (G.sel) placePanel();
}
function placePanel() {
  const t = G.sel, p = $('#panel'), C = CFG.cards[t.k], D = tdef(t), max = t.lvl >= TD.maxLevel, c = upCost(t);
  p.hidden = false;
  const R = Math.round(rangeOf(t)), dmg = D.kind === 'aura' ? `+${Math.round((D.aura.speed + 0.1 * (t.lvl - 1)) * 100)} % velocidad` : `${Math.round(dmgOf(t))} de daño`;
  const html = `<div class="pn-t ol">${C.name} <small>NV ${t.lvl}</small></div><div class="pn-s">${dmg} · alcance ${R}${t.rage ? ` · <span class="rage">RABIA +${t.rage * 10} %</span>` : ''}</div>
    <div class="pn-b"><button class="btn-up" id="pn-up" ${max || G.gold < c ? 'disabled' : ''}>${max ? 'MÁXIMO' : 'MEJORAR<small>' + c + ' oro</small>'}</button><button class="btn-sell" id="pn-sell">VENDER<small>+${sellOf(t)}</small></button></div>`;
  if (p.dataset.h !== html) { p.innerHTML = html; p.dataset.h = html; $('#pn-up').onclick = () => { upgrade(t); hud(); }; $('#pn-sell').onclick = () => { sell(t); hidePanel(); hud(); }; }
  const x = clamp(t.x, 120, W - 120), y = t.y > 520 ? t.y - 160 : t.y + 40; p.style.left = x - 110 + 'px'; p.style.top = y + 'px';
}
function hidePanel() { $('#panel').hidden = true; $('#panel').dataset.h = ''; }

// controles: arrastra una carta al campo o tócala y luego toca el campo
function toField(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / SCALE, y: (e.clientY - r.top) / SCALE }; }
addEventListener('pointermove', e => { if (G.screen !== 'play' || !G.place) return; const p = toField(e); if (p.y > FIELD.y1 + 4 || p.y < 0) { if (G.dragging) G.ghost = null; return; } if (G.dragging || e.pointerType === 'mouse') G.ghost = { x: p.x, y: p.y, ok: canPlace(p.x, p.y) && G.gold >= TOWERS[G.fac][G.place].cost }; });
addEventListener('pointerup', e => {
  if (G.screen !== 'play' || !G.dragging) return; G.dragging = false;
  const p = toField(e); if (G.place && p.y <= FIELD.y1 + 4 && p.y > 0 && G.ghost) { if (build(G.place, p.x, p.y)) { G.place = null; G.ghost = null; } hud(); }
});
cv.addEventListener('pointerdown', e => {
  if (G.screen !== 'play' || G.over) return; const p = toField(e);
  if (G.place) { G.ghost = { x: p.x, y: p.y, ok: canPlace(p.x, p.y) }; if (build(G.place, p.x, p.y)) { G.place = null; G.ghost = null; } else if (!canPlace(p.x, p.y)) pop(p.x, p.y - 20, 'AQUÍ NO', '#ff4b5c', 14); else pop(p.x, p.y - 20, 'FALTA ORO', '#ffcb3d', 14); hud(); return; }
  const t = G.towers.find(o => Math.hypot(o.x - p.x, o.y - 20 - p.y) < 30);
  G.sel = t && t !== G.sel ? t : null; if (G.sel) placePanel(); else hidePanel();
});
addEventListener('keydown', e => { if (e.key === 'Escape') { G.place = null; G.ghost = null; G.sel = null; hidePanel(); refreshTray(); } if (e.key === ' ' && G.screen === 'play') { e.preventDefault(); startWave(); } });

function startLevel(L) {
  Object.assign(G, { screen: 'play', level: L, gold: TD.startGold, lives: TD.lives, wave: 0, waves: L.waves, inWave: false, nextT: 0, spawnQ: [], foes: [], towers: [], projs: [], parts: [], nums: [], place: null, ghost: null, sel: null, over: false, paused: false, boss: null, kills: 0, hpMul: L.hp, fac: 'animales' });
  hidePanel(); showScreen(null); buildTray(); hud(); $('#lvl-name').textContent = `${L.id} · ${L.name}`;
  banner(`${L.id} · ${L.name.toUpperCase()}`);
}
function showResult(win, st, first) {
  G.screen = 'result'; showScreen('scr-result');
  const L = G.level, W0 = WORLDS_TD[L.wi], next = W0.levels[L.li + 1];
  $('#res-title').textContent = win ? '¡VICTORIA!' : 'LA MADRIGUERA HA CAÍDO';
  $('#res-title').className = 'ol-big ' + (win ? 'win' : 'lose');
  $('#res-stars').innerHTML = [1, 2, 3].map(i => `<span class="${i <= st ? 'on' : ''}">★</span>`).join('');
  let msg = win ? `Has parado a Microblizz con ${G.lives} vidas.` : `Microblizz ha despedido a todos en la oleada ${G.wave}. ¡Prueba otras torres!`;
  const nextWorld = WORLDS_TD[L.wi + 1];
  if (win && first && !next && nextWorld) msg += `<br><b>¡Mundo liberado!</b> Lo siguiente en la historia: <b>${nextWorld.name}</b>, donde se unen ${FAC_NAME(nextWorld.joins)}. (Llega en la próxima versión.)`;
  $('#res-msg').innerHTML = msg;
  const art = $('#res-art'); requestAnimationFrame(() => portrait(art, win ? 'bunny' : 'becario', 120));
  $('#res-next').hidden = !(win && next); $('#res-next').onclick = () => startLevel(next);
  $('#res-retry').onclick = () => startLevel(L);
}
const FAC_NAME = f => (f && FACTIONS[f] ? (FACTIONS[f].los || 'los ' + FACTIONS[f].name) : '');
function showMap() {
  G.screen = 'map'; showScreen('scr-map');
  const list = $('#worlds'); const fj = factionsJoined();
  list.innerHTML = WORLDS_TD.map((w, wi) => {
    const playable = !!w.levels, open = wi === 0 || worldDone(wi - 1);
    const joinTxt = w.joins ? (wi === 0 ? `Juegas con ${FAC_NAME(w.joins)}` : `Al liberarlo se unen ${FAC_NAME(w.joins)}`) : w.efac === 'phony' ? 'Contra Phony y su PayStation' : 'Contra Microblizz';
    const lv = playable ? `<div class="lvls">${w.levels.map(l => { const o = levelOpen(l), s = starsOf(l.id); return `<button class="lvl${l.boss ? ' boss' : ''}" data-l="${l.id}" ${o ? '' : 'disabled'}><b>${l.id}</b><span>${l.name}</span><i>${o ? '★'.repeat(s) + '<em>' + '★'.repeat(3 - s) + '</em>' : '🔒'}</i></button>`; }).join('')}</div>` : `<div class="soon">${open && wi > 0 ? 'Próximamente' : 'Bloqueado'}</div>`;
    return `<div class="world${playable && open ? '' : ' locked'}"><div class="wh"><canvas data-f="${w.joins || ''}"></canvas><div><div class="wn ol">Mundo ${wi + 1} · ${w.name}</div><div class="wj">${joinTxt}</div></div></div>${lv}</div>`;
  }).join('');
  for (const b of list.querySelectorAll('.lvl')) b.onclick = () => { const [wi, li] = b.dataset.l.split('-').map(Number); startLevel(WORLDS_TD[wi - 1].levels[li - 1]); };
  requestAnimationFrame(() => { for (const c of list.querySelectorAll('canvas[data-f]')) { const f = c.dataset.f; const key = f && FACTIONS[f] ? FACTIONS[f].leader : c.closest('.world').querySelector('.wn').textContent.includes('Phony') || c.closest('.world').innerHTML.includes('Phony') ? 'descargabot' : 'becario'; portrait(c, key, 40); } });
  $('#map-team').textContent = 'Tu equipo: ' + fj.map(f => FACTIONS[f].name).join(', ');
}

/* ---------- botones ---------- */
$('#btn-play').onclick = () => { sfx('place'); showMap(); };
$('#btn-wave').onclick = () => { startWave(); hud(); };
$('#btn-speed').onclick = () => { G.speed = G.speed === 1 ? 2 : 1; hud(); };
$('#btn-pause').onclick = () => { if (G.over) return; G.paused = true; $('#scr-pause').hidden = false; };
$('#pz-go').onclick = () => { G.paused = false; $('#scr-pause').hidden = true; };
$('#pz-retry').onclick = () => { $('#scr-pause').hidden = true; startLevel(G.level); };
$('#pz-map').onclick = () => { $('#scr-pause').hidden = true; G.paused = false; showMap(); };
$('#res-map').onclick = () => showMap();
$('#map-back').onclick = () => { G.screen = 'title'; showScreen('scr-title'); };
const soundBtns = () => { for (const b of document.querySelectorAll('.btn-sound')) { b.textContent = SAVE.muted ? '🔇' : '🔊'; b.setAttribute('aria-label', SAVE.muted ? 'Activar sonido' : 'Silenciar sonido'); } };
for (const b of document.querySelectorAll('.btn-sound')) b.onclick = () => { SAVE.muted = !SAVE.muted; saveGame(); soundBtns(); };

/* ---------- arranque ---------- */
let last = performance.now(), hudT = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (G.screen === 'play' && !G.paused && !G.over) { const steps = G.speed; for (let i = 0; i < steps; i++) update(dt); }
  else if (G.screen === 'play' && G.over) { const d2 = dt; for (const q of G.parts) { q.t += d2; } G.parts = G.parts.filter(q => q.t < q.life); for (const n of G.nums) { n.t += d2; n.y -= d2 * 28; } G.nums = G.nums.filter(n => n.t < n.life); }
  draw();
  hudT -= dt; if (G.screen === 'play' && hudT <= 0) { hudT = 0.1; hud(); }
  requestAnimationFrame(frame);
}
async function boot() {
  try { await Promise.race([document.fonts.load('20px "Luckiest Guy"'), new Promise(r => setTimeout(r, 2500))]); } catch (e) { /* fuente por defecto */ }
  buildSprites(); BG = buildTDBackground('animales');
  fit(); addEventListener('resize', fit); soundBtns();
  showScreen('scr-title');
  portrait($('#title-art'), 'bunny', 150); portrait($('#title-foe'), 'fallen', 110, -1);
  window.__TD = { G, startLevel, startWave, build, upgrade, update, canPlace, WORLDS_TD, SAVE };   // para las pruebas automáticas
  requestAnimationFrame(frame);
}
boot();
