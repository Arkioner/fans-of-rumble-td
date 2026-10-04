// Fans of Rumble TD · Menús: cartera, colección, inventario, gashapón, tienda y novedades.
// Es el código de js/09-menus.js y js/11-logros.js del original, adaptado: aquí todas las cartas llevan equipo (no solo el líder)
// y cada objeto dice si mejora la TORRE o la UNIDAD. Los estilos son los del original (css/menus.css).
'use strict';
/* ---------- lo que el original tenía repartido por otros archivos ---------- */
const play = n => sfx({ select: 'place', deny: 'womp', levelup: 'up', win: 'win', crown: 'coin', roll: 'horn', despido: 'womp', sad: 'womp' }[n] || n);
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function show(id) { showScreen(id); G.screen = id.slice(4); const h = document.querySelector('#' + id + ' .scr-head .h2'); if (h) fitText(h, 38, 20); }
function fitText(el, max, min) { el.style.fontSize = max + 'px'; let sz = max; while (el.scrollWidth > el.clientWidth + 0.5 && sz > min) { sz -= 0.5; el.style.fontSize = sz + 'px'; } }
function drawArt(cv, key, LW, LH) {
  const R2 = 3; cv.width = LW * R2; cv.height = LH * R2; const x = cv.getContext('2d'); x.setTransform(R2, 0, 0, R2, 0, 0); x.clearRect(0, 0, LW, LH);
  x.fillStyle = 'rgba(20,10,30,.25)'; x.beginPath(); x.ellipse(LW / 2, LH - 4, LW * 0.32, Math.max(2, LH * 0.08), 0, 0, Math.PI * 2); x.fill();
  const h = LH - 8, n = Math.min(3, (CFG.cards[key] && CFG.cards[key].count) || 1);
  if (n === 2) { drawVector(x, key, LW / 2 - LW * 0.15, LH - 4, h * 0.74, 1); drawVector(x, key, LW / 2 + LW * 0.15, LH - 2, h * 0.8, -1); }
  else if (n === 3) { const hs = key === 'skeleton' ? 0.82 : 0.66; drawVector(x, key, LW / 2 - LW * 0.24, LH - 5, h * hs, 1); drawVector(x, key, LW / 2 + LW * 0.24, LH - 5, h * hs, -1); drawVector(x, key, LW / 2, LH - 2, h * (hs + 0.1), 1); }
  else drawVector(x, key, LW / 2, LH - 3, h * 0.92, 1);
}
const FAC_COLOR = { animales: '#ff9a3c', nomuertos: '#5ef2c0', streamers: '#c084fc', heroes: '#ffcb3d', ciber: '#22e3ff', memes: '#a3e635', gamer: '#4ade80', olvidados: '#d6a96a', pop: '#ff6b9a' };

/* =========================================================
   CARTERA, COLECCIÓN, GASHAPÓN Y TIENDA (del original)
   ========================================================= */
const COIN_SVG = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#ffcb3d" style="stroke: var(--outline)" stroke-width="1.8"/><circle cx="10" cy="10" r="5" fill="none" stroke="#c48a10" stroke-width="1.4"/><path d="M10 6.8v6.4" stroke="#c48a10" stroke-width="1.6" stroke-linecap="round"/></svg>';
const GEM_SVG = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3h10l4 5-9 10L1 8z" fill="#ff5fd2" style="stroke: var(--outline)" stroke-width="1.6" stroke-linejoin="round"/><path d="M1 8h18M7 3l3 15M13 3l-3 15" stroke="#b81e8f" stroke-width="1" fill="none"/></svg>';
const SLOT_SVG = {
  weapon: '<svg viewBox="0 0 24 24"><path d="M5 19l3-3M7 21l-4-4M8 16L19 5l1-2-2 1L7 15z" stroke="#20102c" stroke-width="2" fill="#cdd5e0" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  head: '<svg viewBox="0 0 24 24"><path d="M4 16a8 8 0 0 1 16 0v2H4z" fill="#cdd5e0" stroke="#20102c" stroke-width="2" stroke-linejoin="round"/><path d="M8 18v-3h8v3" stroke="#20102c" stroke-width="2" fill="none"/></svg>',
  acc: '<svg viewBox="0 0 24 24"><rect x="5" y="8" width="14" height="12" rx="3" fill="#cdd5e0" stroke="#20102c" stroke-width="2"/><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="#20102c" stroke-width="2" fill="none"/></svg>',
};
const fmt = n => Math.floor(n).toLocaleString('es-ES');
const fmtV = v => String(v).replace('.', ',');
const RAR_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 };
function updateWallets() {
  for (const w of document.querySelectorAll('[data-wallet]')) {
    w.innerHTML = `<button class="wal" data-wal="gold" aria-label="Oro: ${fmt(SAVE.gold)}. Comprar más">${COIN_SVG}${fmt(SAVE.gold)}<i class="wal-plus ol">+</i></button><button class="wal" data-wal="gems" aria-label="Gemas: ${fmt(SAVE.gems)}. Comprar más">${GEM_SVG}${fmt(SAVE.gems)}<i class="wal-plus ol">+</i></button>`;
    for (const b of w.children) b.onclick = () => { play('select'); openShop(b.dataset.wal); };
  }
  updateBadges();
}
/* ---------- niveles ---------- */
const needXp = l => ECON.xpNeed[l] || 0, lvlCost = l => ECON.goldCost[l] || 0;
const canLevel = k => { const us = uSave(k); return us.lvl < ECON.maxLvl && us.xp >= needXp(us.lvl); };
function levelUp(k) {
  if (!canLevel(k)) return false;
  const us = uSave(k), cost = lvlCost(us.lvl);
  if (SAVE.gold < cost) { toast(`Te falta oro: ${fmt(cost - SAVE.gold)} más`); play('deny'); return false; }
  SAVE.gold -= cost; us.xp -= needXp(us.lvl); us.lvl++; saveGame(); play('levelup');
  toast(`¡${CFG.cards[k].name} sube a nivel ${us.lvl}!`, true); return true;
}
/* ---------- colección ---------- */
let collFac = null;
function buildColl() {
  if (!collFac) collFac = facNow();
  const F = FACTIONS[collFac];
  $('#coll-tabs').innerHTML = FACTION_ORDER.map(f => `<button class="fac-tab" data-cf="${f}" aria-pressed="${f === collFac}" style="--fc:${FAC_COLOR[f]}" aria-label="${FACTIONS[f].name}"><canvas></canvas></button>`).join('');
  for (const b of $('#coll-tabs').children) { drawArt(b.querySelector('canvas'), FACTIONS[b.dataset.cf].leader, 48, 36); b.onclick = () => { collFac = b.dataset.cf; play('select'); buildColl(); }; }
  const box = $('#passive-box'); box.className = 'passive-box ' + F.kind;
  box.innerHTML = `<div><b class="ol">${F.name.toUpperCase()} · ${F.passive}</b><span>${PASSIVES[collFac].txt}</span></div>`;
  const list = $('#coll-list');
  list.innerHTML = '<p class="coll-hint">Cada carta es una <b>torre</b> y una <b>unidad</b> que comparten nivel, <b>habilidad</b> y <b>objetos</b> (arma, cabeza y accesorio). Toca las <b>ranuras</b> para equipar. Salen en el <b>Gashapón</b>. El número rojo dice cuántas tienes sin usar.</p>' + [F.leader, ...F.units].map(k => collRow(k)).join('');
  for (const cv of list.querySelectorAll('canvas[data-k]')) drawArt(cv, cv.dataset.k, 62, 54);
  list.querySelectorAll('[data-up]').forEach(b => { b.onclick = () => { if (levelUp(b.dataset.up)) { updateWallets(); buildColl(); } }; });
  // si la ranura ya lleva algo, se abre su ficha (volver a tirar, bloquear, cambiar…); si está vacía, la lista para elegir
  list.querySelectorAll('[data-ab]').forEach(b => { b.onclick = () => { const k = b.dataset.ab, u = SAVE.abEquip[k]; if (invGet(u)) openItem(u, { kind: 'ab', key: k }); else openPick('ab', k); }; });
  list.querySelectorAll('[data-eq]').forEach(b => { b.onclick = () => { const k = b.dataset.ek, sl = b.dataset.eq, u = (SAVE.equip[k] || {})[sl]; if (invGet(u)) openItem(u, { kind: 'eq', key: sl, card: k }); else openPick('eq', sl, k); }; });
}
function collRow(k) {
  const c = CFG.cards[k], us = uSave(k), max = us.lvl >= ECON.maxLvl, need = needXp(us.lvl), D = TOWERS[collFac][k];
  const ready = !max && us.xp >= need, cost = lvlCost(us.lvl), pct = max ? 100 : Math.min(100, (us.xp / need) * 100);
  const es = effStats(k), bst = es.boosts.length ? `<span class="boost">Con lo que lleva: ${es.boosts.join(', ')}</span>` : '';
  const stats = `<i class="ft">TORRE</i> ${es.aura ? 'Apoyo' : 'Daño ' + Math.round(es.dmg)} · Alcance ${Math.round(es.range)} <i class="fu">UNIDAD</i> Vida ${Math.round(es.hp)}` + bst;
  const worn = wornSet(), E = SAVE.equip[k] || {};
  let slots = slotTile('ab', k, invGet(SAVE.abEquip[k]), 'HABILIDAD', worn, k);
  for (const sl in SLOTS) slots += slotTile('eq', sl, invGet(E[sl]), SLOTS[sl].toUpperCase(), worn, k);
  const btn = max ? '<button class="btn-up max" disabled>NV MÁX</button>' : `<button class="btn-up" data-up="${k}" ${ready ? '' : 'disabled'}>SUBIR<small>${COIN_SVG}${fmt(cost)}</small></button>`;
  return `<div class="coll-row" data-rarity="${c.rarity}"><canvas data-k="${k}"></canvas><div><div class="coll-name ol">${c.name}<em>Nv ${us.lvl}</em></div><div class="deck-desc">${D.desc}</div><div class="xpbar"><i style="width:${pct}%"></i><span>${max ? 'NIVEL MÁXIMO' : `${fmt(us.xp)} / ${fmt(need)} XP`}</span></div><div class="deck-stats">${stats}</div></div>${btn}<div class="slots">${slots}</div></div>`;
}
// ranuras grandes. Vacías con borde punteado y un número rojo si tienes copias sin usar para esa ranura
function wornSet() { const w = new Set(Object.values(SAVE.abEquip)); for (const k in SAVE.equip) for (const sl in SAVE.equip[k]) w.add(SAVE.equip[k][sl]); return w; }
function slotTile(kind, key, it, label, worn, card) {
  const D = it && defOf(it), attr = kind === 'ab' ? `data-ab="${key}"` : `data-eq="${key}" data-ek="${card}"`;
  if (!D) {
    const n = SAVE.inv.filter(x => !worn.has(x.u) && (kind === 'ab' ? x.k === 'ab' : x.k === 'eq' && ITEMS[x.id].slot === key && fitsFac(x.id, collFac))).length;
    const ic = kind === 'ab' ? '<span class="sl-plus">+</span>' : SLOT_SVG[key];
    return `<button class="slot" ${attr} aria-label="${label}: vacía. Toca para equipar"><span class="sl-ic">${ic}</span><span class="sl-txt"><span class="sl-lbl ol">${label}</span><span class="sl-name">${n ? 'Toca para equipar' : 'Vacía · sale en el gashapón'}</span></span>${n ? `<span class="sl-n ol">${n}</span>` : ''}</button>`;
  }
  const R = RARITY[D.rar], T = QTIERS[tierOf(avgQ(it))];
  return `<button class="slot full" ${attr} style="--qc:${T.col};--rc2:${R[2]}" aria-label="${label}: ${D.name}, calidad ${T.name}. Toca para cambiar"><span class="sl-ic" style="background:${R[1]}">${kind === 'ab' ? D.ic : SLOT_SVG[key]}</span><span class="sl-txt"><span class="sl-lbl ol">${label}</span><span class="sl-name">${D.name}</span><span class="sl-q ol">${T.name.split(" ")[0]} ${sideTag(D)}</span></span></button>`;
}
const sideTag = D => (D.side === 'T' ? '· TORRE' : D.side === 'U' ? '· UNIDAD' : '· LAS DOS');
function descOf(it) {
  const D = defOf(it), V = valsOf(it); let t = D.desc + (it.k === 'eq' && D.fac ? ` <i class="wn">Solo para ${FAC_NAME(D.fac)}.</i>` : '');
  V.forEach((v, i) => { t = t.replace('{' + i + '}', `<b class="sv">${fmtV(v)}</b>`); });
  return t;
}
const rangeTxt = it => { const S = statsOf(it); return !S.length ? '' : (S.length > 1 ? 'Rangos: ' : 'Rango: ') + S.map(st => `${fmtV(rnd(st.c * 0.5, st.dec))}–${fmtV(rnd(st.c * 1.5, st.dec))}`).join(' · '); };
const qBadge = (it, big) => { const q = avgQ(it), T = QTIERS[tierOf(q)]; return `<span class="qbadge" style="--qc:${T.col}">${big ? 'CALIDAD ' + T.name.toUpperCase() : T.name} · ${Math.round(q * 100)} %</span>`; };
const sortInv = (a, b) => RAR_ORDER[defOf(a).rar] - RAR_ORDER[defOf(b).rar] || defOf(a).name.localeCompare(defOf(b).name) || avgQ(b) - avgQ(a);
function wearer(it) {   // nombre de la carta que lo lleva puesto (o null)
  if (it.k === 'ab') { for (const k in SAVE.abEquip) if (SAVE.abEquip[k] === it.u) return CFG.cards[k].name; return null; }
  for (const k in SAVE.equip) for (const sl in SAVE.equip[k]) if (SAVE.equip[k][sl] === it.u) return CFG.cards[k].name;
  return null;
}
function unequip(it) {
  for (const k in SAVE.abEquip) if (SAVE.abEquip[k] === it.u) delete SAVE.abEquip[k];
  for (const k in SAVE.equip) for (const sl in SAVE.equip[k]) if (SAVE.equip[k][sl] === it.u) delete SAVE.equip[k][sl];
}
function pickRowHtml(it, sel) {
  const D = defOf(it), R = RARITY[D.rar], w = wearer(it);
  return `<button class="pick-opt" data-id="${it.u}" aria-pressed="${sel === it.u}" style="--rc:${R[2]}"><span class="ic" style="background:${R[1]}">${it.k === 'ab' ? D.ic : SLOT_SVG[D.slot]}</span><span><span class="inv-top"><b class="ol">${D.name}</b>${qBadge(it)}</span><span class="pk-desc">${descOf(it)}${w ? ` <i class="wn">Lo lleva ${w}.</i>` : ''}</span></span></button>`;
}
// ventana con una lista para elegir (sirve para Colección y para el Inventario)
function openList(title, html, onChoose) {
  $('#pick-title').textContent = title; const list = $('#pick-list'); list.innerHTML = html;
  list.querySelectorAll('.pick-opt').forEach(b => { b.onclick = () => { $('#scr-pick').hidden = true; onChoose(b.dataset.id); }; });
  const g = list.querySelector('[data-goto]'); if (g) g.onclick = () => { $('#scr-pick').hidden = true; gachaTab = g.dataset.goto; play('select'); updateWallets(); openGacha(); };
  for (const cv of list.querySelectorAll('canvas[data-art]')) drawArt(cv, cv.dataset.art, 44, 36);
  $('#scr-pick').hidden = false; list.scrollTop = 0;
}
function openPick(kind, key, card) {
  let html = '', owned, sel, title; const k = kind === 'ab' ? key : card, fac = facOfCard(k);
  if (kind === 'ab') { title = 'Habilidad para ' + CFG.cards[k].name; sel = SAVE.abEquip[k]; owned = SAVE.inv.filter(it => it.k === 'ab'); }
  else { title = SLOTS[key] + ' para ' + CFG.cards[k].name; sel = (SAVE.equip[k] || {})[key]; owned = SAVE.inv.filter(it => it.k === 'eq' && ITEMS[it.id].slot === key && fitsFac(it.id, fac)); }
  if (sel) html += `<button class="pick-opt" data-id="" style="--rc:#3e2363"><span class="ic" style="background:#cdb9ea">✕</span><span><b class="ol">${kind === 'ab' ? 'Quitar habilidad' : 'Quitar objeto'}</b></span></button>`;
  if (!owned.length) html += `<p class="deck-sub">${kind === 'ab' ? 'Aún no tienes habilidades.' : 'Aún no tienes objetos de este tipo.'} Salen en el gashapón${kind === 'ab' ? '' : ' de equipo'}: cada tirada cuesta ${ECON.pull} gemas.</p><button class="btn-ghost ol" data-goto="${kind}">IR AL GASHAPÓN</button>`;
  html += owned.sort(sortInv).map(it => pickRowHtml(it, sel)).join('');
  openList(title, html, uid => chooseFor(kind, key, uid, k));
}
// cada copia está en un solo sitio: si la llevaba otra carta, se la quita
function chooseFor(kind, key, uid, k) {
  const it = invGet(uid); if (it) unequip(it);
  if (kind === 'ab') { if (it) SAVE.abEquip[k] = uid; else delete SAVE.abEquip[k]; }
  else { SAVE.equip[k] = SAVE.equip[k] || {}; if (it) SAVE.equip[k][key] = uid; else delete SAVE.equip[k][key]; }
  saveGame(); play('select'); refreshInv();
}
function openColl() { updateWallets(); show('scr-coll'); buildColl(); $('#coll-list').scrollTop = 0; }

/* ---------- gashapón de Microblizz ---------- */
let gachaTab = 'ab', gachaAnim = null, gachaRAF = 0;
function rollRarity(kind, force) {
  const P = SAVE.pity, pk = kind, pl = kind + 'L'; P[pk] = (P[pk] || 0) + 1; P[pl] = (P[pl] || 0) + 1;
  let r = 'common';
  if (P[pl] >= ECON.pityLeg) r = 'legendary';
  else if (force || P[pk] >= ECON.pityEpic) r = Math.random() < ECON.odds.legendary / (ECON.odds.legendary + ECON.odds.epic) ? 'legendary' : 'epic';
  else { let x = Math.random() * 100; for (const k of ['legendary', 'epic', 'rare']) { if (x < ECON.odds[k]) { r = k; break; } x -= ECON.odds[k]; } }
  if (r === 'epic' || r === 'legendary') P[pk] = 0;
  if (r === 'legendary') P[pl] = 0;
  return r;
}
// tiradas x1, x10 y x50. Primero se gastan las tiradas gratis; cada tirada cuenta para las garantías
function onePull(kind, force) {
  const rar = rollRarity(kind, force), DB = kind === 'ab' ? ABILITIES : ITEMS;
  const id = pick(Object.keys(DB).filter(k => DB[k].rar === rar)), prev = bestCopy(kind, id), nPrev = SAVE.inv.filter(x => x.k === kind && x.id === id).length;
  const P = SAVE.pity, qk = 'q' + kind; P[qk] = (P[qk] || 0) + 1;
  const it = newCopy(kind, id, P[qk] >= ECON.pityQ ? 3 : 0), tq = tierOf(avgQ(it)); if (tq >= 3) P[qk] = 0;
  const pn = prev && QTIERS[tierOf(avgQ(prev))].name, better = !!prev && avgQ(it) > avgQ(prev);
  const tag = tq === 4 ? '¡CALIDAD PERFECTA!' : !prev ? (kind === 'ab' ? '¡NUEVA!' : '¡NUEVO!') : better ? `¡TU MEJOR COPIA! (la anterior era ${pn})` : `Copia n.º ${nPrev + 1} · tu mejor copia sigue siendo ${pn}`;
  return { it, tag, isNew: !prev, better };
}
function pullCost(n) { const free = Math.min(SAVE.tickets || 0, n); return { free, gems: (n - free) * ECON.pull }; }
function pull(n) {
  n = n || 1; if (gachaAnim) return;
  const c = pullCost(n);
  if (SAVE.gems < c.gems) { play('deny'); confirmBox('FALTAN GEMAS', `Para girar x${n} te faltan <b>${fmt(c.gems - SAVE.gems)} gemas</b>.<small>Las consigues ganando niveles de la campaña, con las horas extra o en la tienda.</small>`, 'IR A LA TIENDA', () => openShop('gems')); return; }
  SAVE.tickets = (SAVE.tickets || 0) - c.free; SAVE.gems -= c.gems;
  // cada bloque de 10 tiradas trae al menos una épica (o legendaria)
  const kind = gachaTab, res = []; let gotEpic = false;
  for (let i = 0; i < n; i++) {
    if (i % 10 === 0) gotEpic = false;
    const r = onePull(kind, n >= 10 && i % 10 === 9 && !gotEpic), rr = defOf(r.it).rar;
    if (rr === 'epic' || rr === 'legendary') gotEpic = true;
    res.push(r);
  }
  saveGame(); updateWallets(); buildGachaText();
  const cv = $('#gacha-cv'); cv.classList.remove('shake'); void cv.offsetWidth; cv.classList.add('shake'); play('roll');
  const top = res.reduce((a, r) => (RAR_ORDER[defOf(r.it).rar] < RAR_ORDER[defOf(a.it).rar] ? r : a));
  gachaAnim = { t: 0, col: RARITY[defOf(top.it).rar][1] };
  setTimeout(() => { gachaAnim = null; if (n === 1) showPull(res[0].it, res[0].tag); else showMulti(res); }, 1100);
}
const RAR_PL = { common: ['común', 'comunes'], rare: ['rara', 'raras'], epic: ['épica', 'épicas'], legendary: ['legendaria', 'legendarias'] };
function showMulti(res) {
  const card = $('#gr-card'), top = res.reduce((a, r) => (RAR_ORDER[defOf(r.it).rar] < RAR_ORDER[defOf(a.it).rar] ? r : a)), R = RARITY[defOf(top.it).rar];
  card.classList.add('multi'); card.style.setProperty('--rc1', R[1]); card.style.setProperty('--rc2', R[2]);
  const cnt = r => res.filter(x => defOf(x.it).rar === r).length, good = res.filter(x => tierOf(avgQ(x.it)) >= 3).length, news = res.filter(x => x.isNew).length;
  const sum = ['legendary', 'epic', 'rare', 'common'].filter(r => cnt(r)).map(r => `${cnt(r)} ${RAR_PL[r][cnt(r) > 1 ? 1 : 0]}`).join(' · ');
  const order = res.slice().sort((a, b) => RAR_ORDER[defOf(a.it).rar] - RAR_ORDER[defOf(b.it).rar] || avgQ(b.it) - avgQ(a.it));
  card.innerHTML = `<div class="gr-rar ol">TIRADA x${res.length}</div><div class="gr-sum">${sum}${good ? ` · <b>${good} Director (excelente) o mejor</b>` : ''}${news ? ` · ${news} ${news > 1 ? 'nuevas' : 'nueva'}` : ''}</div><div class="gr-grid">${order.map(r => {
    const D = defOf(r.it), RR = RARITY[D.rar], T = QTIERS[tierOf(avgQ(r.it))], nw = r.it.k === 'ab' ? 'NUEVA' : 'NUEVO';
    return `<button class="gt" data-gu="${r.it.u}" style="--rc:${RR[1]};--rc2:${RR[2]};--qc:${T.col}" aria-label="${D.name}, ${RR[0]}, calidad ${T.name}"><span class="gt-ic">${r.it.k === 'ab' ? D.ic : SLOT_SVG[D.slot]}</span><span class="gt-name">${D.name}</span><span class="gt-q ol">${T.name}</span>${r.isNew ? `<span class="gt-new ol">${nw}</span>` : r.better ? '<span class="gt-new best ol">MEJOR</span>' : ''}</button>`;
  }).join('')}</div><small class="gr-hint">Toca una para ver sus números. Las que no quieras, despídelas en el inventario.</small>`;
  for (const b of card.querySelectorAll('[data-gu]')) b.onclick = () => { play('select'); openItem(b.dataset.gu); };
  $('#gacha-result').hidden = false;
  play(res.some(x => tierOf(avgQ(x.it)) >= 3 || defOf(x.it).rar === 'legendary' || defOf(x.it).rar === 'epic') ? 'win' : 'levelup');
}
function addCopy(k, id, q) { const it = { u: 'i' + (++SAVE.invSeq), k, id, q }; SAVE.inv.push(it); return it; }
function newCopy(k, id, minTier) { const D = (k === 'ab' ? ABILITIES : ITEMS)[id]; return addCopy(k, id, Array.from({ length: Math.max(1, D.st.length) }, () => rollQ(minTier))); }
function bestCopy(k, id) { let b = null; for (const it of SAVE.inv) if (it.k === k && it.id === id && (!b || avgQ(it) > avgQ(b))) b = it; return b; }
function showPull(it, tag) {
  const D = defOf(it), kind = it.k, R = RARITY[D.rar], T = QTIERS[tierOf(avgQ(it))], card = $('#gr-card');
  card.classList.remove('multi'); card.style.setProperty('--rc1', R[1]); card.style.setProperty('--rc2', R[2]);
  card.innerHTML = `<div class="gr-rar ol">${R[0].toUpperCase()}${kind === 'eq' ? ' · ' + SLOTS[D.slot].toUpperCase() : ''}</div><div class="gr-ic">${kind === 'ab' ? D.ic : SLOT_SVG[D.slot]}</div><div class="gr-name ol">${D.name}</div><div class="gr-q ol" style="--qc:${T.col}">CALIDAD ${T.name.toUpperCase()} · ${Math.round(avgQ(it) * 100)} %</div><div class="gr-desc">${descOf(it)}<br><small class="rg">${rangeTxt(it)}</small>${kind === 'ab' && D.fac ? '<br><small>Viene de los ' + FACTIONS[D.fac].name + '</small>' : ''}</div><span class="gr-tag">${tag}</span>`;
  $('#gacha-result').hidden = false; play(tierOf(avgQ(it)) >= 3 || D.rar === 'legendary' || D.rar === 'epic' ? 'win' : 'levelup');
}
const TICKET_SVG = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 6a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 18 6v2a2 2 0 0 0 0 4v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 14v-2a2 2 0 0 0 0-4z" fill="#ffe06a" style="stroke: var(--outline)" stroke-width="1.5" stroke-linejoin="round"/></svg>';
function buildGachaText() {
  for (const b of document.querySelectorAll('[data-gt]')) b.setAttribute('aria-pressed', String(b.dataset.gt === gachaTab));
  $('#gacha-sub').textContent = gachaTab === 'ab' ? 'Habilidades para tus cartas: unas mejoran la torre y otras la unidad. Cada copia sale con su propia calidad, de Becario (básica) a CEO (perfecta): búscale la mejor.' : 'Equipo freak para cualquier carta: arma, cabeza y accesorio. Cada objeto dice si mejora la torre, la unidad o las dos, y sale con su propia calidad.';
  const lab = n => { const c = pullCost(n); return c.gems ? `${fmt(c.gems)} ${GEM_SVG}${c.free ? `<i class="fr">+${c.free} gratis</i>` : ''}` : `${TICKET_SVG} gratis`; };
  for (const b of document.querySelectorAll('[data-pull]')) { const n = +b.dataset.pull; b.innerHTML = `${n === 10 ? '<span class="tag">FAVORITA DEL CEO</span>' : n === 50 ? '<span class="tag">MODO BALLENA</span>' : ''}x${n}<small>${lab(n)}</small>${n >= 10 ? `<span class="sure">${n === 10 ? '1 épica segura' : n / 10 + ' épicas seguras'}</span>` : ''}`; }
  const P = SAVE.pity, O = ECON.odds;
  $('#gacha-odds').textContent = `Probabilidades: común ${O.common} %, rara ${O.rare} %, épica ${O.epic} %, legendaria ${O.legendary} %. Calidad de cada efecto (del 50 % al 150 % de su valor): ${QTIERS.map(t => t.name + ' ' + t.p + ' %').join(', ')}. Garantías: épica o mejor como mucho cada ${ECON.pityEpic} tiradas (llevas ${P[gachaTab] || 0}), legendaria a las ${ECON.pityLeg} (llevas ${P[gachaTab + 'L'] || 0}) y calidad Director (excelente) o mejor cada ${ECON.pityQ} (llevas ${P['q' + gachaTab] || 0}). Las tiradas x10 y x50 traen al menos una épica o legendaria por cada 10. Cada tirada cuesta ${ECON.pull} gemas (unos 0,50 € si compras el pack pequeño de gemas). Microblizz no se hace responsable de tu afición a las cápsulas.`;
}
function drawGacha() {
  const cv = $('#gacha-cv'); if (!cv || $('#scr-gacha').hidden) { gachaRAF = 0; return; }
  const LW = 270, LH = 300, R2 = 2; if (cv.width !== LW * R2) { cv.width = LW * R2; cv.height = LH * R2; }
  const c = cv.getContext('2d'); c.setTransform(R2, 0, 0, R2, 0, 0); c.clearRect(0, 0, LW, LH); c.lineJoin = 'round'; c.lineCap = 'round';
  const t = performance.now() / 1000, an = gachaAnim; if (an) an.t += 1 / 60;
  const MC = ['#2e6fd8', '#1d3f8a', '#173d8f'];
  shape(c, el(135, 288, 100, 9), 'rgba(0,0,0,.3)', 0);
  shape(c, rr(48, 176, 174, 108, 14), MC[0], 2.6);
  shape(c, rr(56, 184, 158, 26, 8), MC[1], 2);
  txt(c, gachaTab === 'ab' ? 'HABILIDADES' : 'EQUIPO', 135, 198, 15, '#e8f1ff');
  shape(c, rr(74, 222, 44, 44, 8), MC[2], 2.2); shape(c, rr(84, 236, 24, 22, 4), '#0b1a3f', 1.6);
  const rot = an ? an.t * 9 : 0; c.save(); c.translate(172, 244); c.rotate(rot);
  shape(c, el(0, 0, 19, 19), '#ffcb3d', 2.4); shape(c, rr(-15, -4, 30, 8, 3), '#e0a92a', 1.8); c.restore();
  shape(c, rr(150, 214, 44, 10, 3), '#0b1a3f', 1.4);
  txt(c, 'MICROBLIZZ', 135, 276, 10, '#bfe0ff');
  if (an) { const k = Math.min(1, an.t / 0.8), y = 160 + k * 88; shape(c, el(96, y, 10, 10), an.col, 2); shape(c, c2 => c2.arc(96, y, 10, Math.PI, 0), '#fff', 1.6); }
  shape(c, rr(108, 160, 54, 20, 6), MC[0], 2.2);
  c.save(); c.beginPath(); c.arc(135, 92, 82, 0, Math.PI * 2); c.clip();
  c.fillStyle = 'rgba(190,230,255,.35)'; c.fillRect(40, 0, 200, 200);
  const cols = ['#ff5fa8', '#ffe14d', '#7be04a', '#63cfe0', '#d08cff', '#ffb04f'];
  for (let i = 0; i < 22; i++) { const a = i * 2.39, rr2 = 18 + (i % 6) * 10, x = 135 + Math.cos(a) * rr2 + (an ? Math.sin(t * 30 + i) * 3 : 0), y = 120 + Math.sin(a) * rr2 * 0.55 + (i % 3) * 10 - 10 + (an ? Math.cos(t * 28 + i) * 3 : 0);
    shape(c, el(x, y, 12, 12), cols[i % 6], 1.8); shape(c, c2 => c2.arc(x, y, 12, Math.PI, 0), 'rgba(255,255,255,.85)', 1.6); }
  c.restore();
  c.beginPath(); c.arc(135, 92, 82, 0, Math.PI * 2); c.lineWidth = 4; c.strokeStyle = OL; c.stroke();
  c.beginPath(); c.arc(112, 62, 30, Math.PI * 1.1, Math.PI * 1.45); c.lineWidth = 6; c.strokeStyle = 'rgba(255,255,255,.6)'; c.stroke();
  shape(c, rr(100, 2, 70, 18, 7), MC[0], 2.4);
  gachaRAF = requestAnimationFrame(drawGacha);
}
function openGacha() { updateWallets(); buildGachaText(); show('scr-gacha'); $('#gacha-result').hidden = true; if (!gachaRAF) gachaRAF = requestAnimationFrame(drawGacha); }

/* ---------- inventario: todas tus copias, con su calidad ---------- */
let invTab = 'ab', invFilter = 'all', invSort = 'q', itemCur = null;
const INV_FILTERS = { ab: [['all', 'Todas'], ['common', 'Comunes'], ['rare', 'Raras'], ['epic', 'Épicas'], ['legendary', 'Legendarias']], eq: [['all', 'Todo'], ['weapon', 'Armas'], ['head', 'Cabeza'], ['acc', 'Accesorios']] };
const INV_SORTS = { q: 'calidad', rar: 'rareza', name: 'nombre' };
const LOCK_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7.5" rx="1.6" fill="#ffcb3d" stroke="#20102c" stroke-width="1.4"/><path d="M5.3 7V5.2a2.7 2.7 0 0 1 5.4 0V7" stroke="#20102c" stroke-width="1.6" fill="none"/></svg>';
const scrapValue = it => Math.round(ECON.scrap[defOf(it).rar] * [1, 1.5, 2, 3, 5][tierOf(avgQ(it))]);
const canScrap = it => !it.lock && !wearer(it);
// despido masivo: copias Becario y Junior que nadie lleva, sin bloquear, y nunca tu mejor copia de cada una
const massList = () => SAVE.inv.filter(it => it.k === invTab && canScrap(it) && tierOf(avgQ(it)) <= 1 && bestCopy(it.k, it.id) !== it);
function openInv(tab) { if (tab) invTab = tab; invFilter = 'all'; updateWallets(); show('scr-inv'); buildInv(); $('#inv-list').scrollTop = 0; }
function buildInv() {
  for (const b of document.querySelectorAll('[data-it]')) b.setAttribute('aria-pressed', String(b.dataset.it === invTab));
  $('#inv-filters').innerHTML = INV_FILTERS[invTab].map(([v, l]) => `<button class="chip-btn" data-if="${v}" aria-pressed="${invFilter === v}">${l}</button>`).join('');
  for (const b of document.querySelectorAll('[data-if]')) b.onclick = () => { invFilter = b.dataset.if; play('select'); buildInv(); };
  $('#btn-inv-sort').textContent = 'Orden: ' + INV_SORTS[invSort];
  const all = SAVE.inv.filter(it => it.k === invTab && defOf(it));
  const L = all.filter(it => invFilter === 'all' || (invTab === 'ab' ? defOf(it).rar : defOf(it).slot) === invFilter);
  L.sort(invSort === 'q' ? (a, b) => avgQ(b) - avgQ(a) || sortInv(a, b) : invSort === 'name' ? (a, b) => defOf(a).name.localeCompare(defOf(b).name) || avgQ(b) - avgQ(a) : sortInv);
  $('#inv-sub').textContent = all.length ? `${all.length} ${all.length === 1 ? 'copia' : 'copias'}${invFilter !== 'all' ? ` (${L.length} con este filtro)` : ''}. Toca una para ver sus números, equiparla, evaluarla o despedirla.` : '';
  $('#inv-list').innerHTML = L.length ? L.map(invRow).join('') : `<p class="deck-sub">${all.length ? 'Nada con este filtro.' : invTab === 'ab' ? 'Aún no tienes habilidades: salen en el gashapón.' : 'Aún no tienes equipo: sale en el gashapón de equipo.'}</p>${all.length ? '' : '<button class="btn-ghost ol" id="btn-inv-gacha">IR AL GASHAPÓN</button>'}`;
  const g = $('#btn-inv-gacha'); if (g) g.onclick = () => { play('select'); gachaTab = invTab; openGacha(); };
  for (const b of document.querySelectorAll('[data-u]')) b.onclick = () => { play('select'); openItem(b.dataset.u); };
  const n = massList().length, mb = $('#btn-mass'); mb.textContent = n ? `DESPIDO MASIVO (${n})` : 'DESPIDO MASIVO'; mb.disabled = !n;
}
function invRow(it) {
  const D = defOf(it), R = RARITY[D.rar], w = wearer(it);
  const meta = w || it.lock ? `<span class="inv-meta">${it.lock ? LOCK_SVG + 'Contrato indefinido' : ''}${w && it.lock ? ' · ' : ''}${w ? 'Lo lleva ' + w : ''}</span>` : '';
  return `<button class="inv-row" data-u="${it.u}" style="--rc:${R[2]}"><span class="ic" style="background:${R[1]}">${it.k === 'ab' ? D.ic : SLOT_SVG[D.slot]}</span><span class="inv-main"><span class="inv-top"><b class="ol">${D.name}</b>${qBadge(it)}</span><span class="inv-desc">${descOf(it)}</span>${meta}</span></button>`;
}
let itemSlot = null;   // la ranura de la Colección desde la que se abrió la ficha
function openItem(uid, slot) {
  itemSlot = slot === 'keep' ? itemSlot : slot || null;
  const it = invGet(uid); if (!it) { $('#scr-item').hidden = true; itemCur = null; return; } itemCur = uid;
  const D = defOf(it), R = RARITY[D.rar], S = statsOf(it), V = valsOf(it), w = wearer(it);
  const bars = S.map((st, i) => { const qi = it.q[i], Ti = QTIERS[tierOf(qi)]; return `<div class="qstat">${S.length > 1 ? `Efecto ${i + 1}: ` : 'Valor: '}<b>${fmtV(V[i])}</b> <small>(de ${fmtV(rnd(st.c * 0.5, st.dec))} a ${fmtV(rnd(st.c * 1.5, st.dec))}) · ${Ti.name}</small><div class="qbar" style="--qc:${Ti.col}"><i style="width:${Math.max(2, qi * 100)}%"></i></div></div>`; }).join('');
  const others = SAVE.inv.filter(x => x !== it && x.k === it.k && x.id === it.id).sort((a, b) => avgQ(b) - avgQ(a));
  const oth = others.length ? `Tus otras copias: ${others.slice(0, 5).map(x => `${QTIERS[tierOf(avgQ(x))].name} ${Math.round(avgQ(x) * 100)} %`).join(' · ')}${others.length > 5 ? ` y ${others.length - 5} más` : ''}.` : 'Es tu única copia.';
  const facet = D.side === 'T' ? 'mejora la TORRE' : D.side === 'U' ? 'mejora la UNIDAD' : 'mejora las dos facetas';
  $('#item-body').innerHTML = `<div class="item-head"><span class="ic" style="background:${R[1]}">${it.k === 'ab' ? D.ic : SLOT_SVG[D.slot]}</span><div><b class="ol">${D.name}</b><div class="item-note">${R[0]}${it.k === 'eq' ? ' · ' + SLOTS[D.slot] : ' · Habilidad'} · ${facet}${it.k === 'ab' && D.fac ? ' · de los ' + FACTIONS[D.fac].name : ''}</div></div></div>
    <div>${qBadge(it, true)}</div><div class="inv-desc">${descOf(it)}</div>${bars}
    <div class="item-note">${w ? 'Lo lleva ' + w + '.' : 'No lo lleva nadie.'}${it.lock ? ' Contrato indefinido: no se puede despedir.' : ''}</div><div class="item-note">${oth}</div>`;
  const rc = ECON.reroll[D.rar], sv = scrapValue(it);
  $('#item-actions').innerHTML = `<button class="btn-ghost ol btn-ok" id="ia-equip">${w ? 'CAMBIAR' : 'EQUIPAR'}</button><button class="btn-ghost ol" id="ia-unequip" ${w ? '' : 'disabled'}>QUITAR</button>
    <button class="btn-ghost ol" id="ia-lock">${it.lock ? 'RESCINDIR CONTRATO<small>se puede despedir</small>' : 'CONTRATO INDEFINIDO<small>bloquear: no se despide</small>'}</button><button class="btn-ghost ol danger" id="ia-scrap" ${canScrap(it) ? '' : 'disabled'}>DESPEDIR · +${fmt(sv)} ORO<small>indemnización: desaparece</small></button>
    <button class="btn-ghost ol wide" id="ia-reroll" ${S.length ? '' : 'disabled'}>EVALUACIÓN DE DESEMPEÑO · ${fmt(rc)} ORO<small>vuelve a sortear sus números</small></button>`;
  $('#ia-equip').onclick = () => { if (itemSlot && w) { $('#scr-item').hidden = true; openPick(itemSlot.kind, itemSlot.key, itemSlot.card); } else equipFromInv(it); };
  $('#ia-unequip').onclick = () => { unequip(it); saveGame(); play('select'); refreshInv(); };
  $('#ia-lock').onclick = () => { it.lock = !it.lock; saveGame(); play('select'); refreshInv(); toast(it.lock ? 'Contrato indefinido: ya no se puede despedir' : 'Contrato rescindido: ya se puede despedir'); };
  $('#ia-scrap').onclick = () => scrapOne(it);
  $('#ia-reroll').onclick = () => rerollOne(it);
  $('#scr-item').hidden = false;
}
function refreshInv() { if (!$('#scr-inv').hidden) buildInv(); if (!$('#scr-coll').hidden) buildColl(); if (itemCur && !$('#scr-item').hidden) openItem(itemCur, 'keep'); }
function equipFromInv(it) {
  const D = defOf(it); let html = '';
  for (const f of FACTION_ORDER.filter(f => it.k === 'ab' || fitsFac(it.id, f))) {
    const F = FACTIONS[f];
    html += `<p class="pick-head ol">${F.name}</p>` + [F.leader, ...F.units].map(k => {
      const cur = it.k === 'ab' ? invGet(SAVE.abEquip[k]) : invGet((SAVE.equip[k] || {})[D.slot]);
      return `<button class="pick-opt unit" data-id="${k}" aria-pressed="${cur === it}"><canvas data-art="${k}"></canvas><span><b class="ol">${CFG.cards[k].name}</b><span>${cur ? 'Lleva ' + defOf(cur).name + ' (' + QTIERS[tierOf(avgQ(cur))].name + ')' : it.k === 'ab' ? 'Sin habilidad' : SLOTS[D.slot] + ' libre'}</span></span></button>`; }).join('');
  }
  openList(`¿Quién lleva ${D.name}?`, html, k => { unequip(it); if (it.k === 'ab') SAVE.abEquip[k] = it.u; else (SAVE.equip[k] = SAVE.equip[k] || {})[D.slot] = it.u; saveGame(); play('select'); toast(`${CFG.cards[k].name} lleva ahora ${D.name}`, true); refreshInv(); });
}
function scrapOne(it) {
  if (!canScrap(it)) return;
  const D = defOf(it), sv = scrapValue(it);
  confirmBox('DESPEDIR', `¿Despedir esta copia de <b>${D.name}</b> (${QTIERS[tierOf(avgQ(it))].name})?<span class="big">+${fmt(sv)} ${COIN_SVG}</span><small>La copia desaparece y te da oro. Cuanto mejor es su calidad, más oro.</small>`, 'DESPEDIR', () => {
    SAVE.inv = SAVE.inv.filter(x => x !== it); SAVE.gold += sv; saveGame(); play('despido'); updateWallets();
    $('#scr-item').hidden = true; itemCur = null; refreshInv(); toast(`Despedida: +${fmt(sv)} de oro`);
  });
}
function rerollOne(it) {
  const D = defOf(it), cost = ECON.reroll[D.rar];
  if (SAVE.gold < cost) { toast(`Te falta oro: ${fmt(cost - SAVE.gold)} más`); play('deny'); return; }
  confirmBox('EVALUACIÓN DE DESEMPEÑO', `Se vuelven a sortear todos los números de tu <b>${D.name}</b>.<span class="big">${fmt(cost)} ${COIN_SVG}</span><small>Puede salir mejor… o peor. Ahora es ${QTIERS[tierOf(avgQ(it))].name} (${Math.round(avgQ(it) * 100)} %). Mismas probabilidades que el gashapón, sin garantía.</small>`, 'TIRAR', () => {
    const before = avgQ(it); SAVE.gold -= cost; it.q = it.q.map(() => rollQ(0)); saveGame(); updateWallets();
    const after = avgQ(it), T = QTIERS[tierOf(after)];
    play(after > before ? 'levelup' : 'sad'); toast(after > before ? `¡Ha salido mejor! Ahora es ${T.name} (${Math.round(after * 100)} %)` : `Ha salido peor: ahora es ${T.name} (${Math.round(after * 100)} %). Mala suerte`, after > before);
    refreshInv();
  });
}
function massScrap() {
  const L = massList(); if (!L.length) return;
  const gold = L.reduce((a, it) => a + scrapValue(it), 0);
  confirmBox('DESPIDO MASIVO', `Vas a despedir <b>${L.length} ${L.length === 1 ? 'copia' : 'copias'}</b> de ${invTab === 'ab' ? 'habilidades' : 'equipo'} de calidad Becario y Junior que nadie lleva puestas.<span class="big">+${fmt(gold)} ${COIN_SVG}</span><small>Se salvan las bloqueadas y tu mejor copia de cada una. Microblizz estaría orgullosa.</small>`, 'DESPEDIR A TODAS', () => {
    const del = new Set(L); SAVE.inv = SAVE.inv.filter(x => !del.has(x)); SAVE.gold += gold; saveGame(); updateWallets(); play('despido'); buildInv(); toast(`${L.length} despedidas: +${fmt(gold)} de oro`);
  });
}

/* ---------- tienda ---------- */
const eur = v => v.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: Number.isInteger(v) ? 0 : 2 });
let shopTab = 'gold', jokeT = 0;
const PILE = (n, gem) => { // dibujo de un montón de monedas o gemas, más alto cuanto más grande el pack
  let o = ''; const k = Math.min(6, n), POS = [[30, 38], [17, 38], [43, 38], [23.5, 28], [36.5, 28], [30, 18]];
  for (let i = 0; i < k; i++) { const [x, y] = POS[i];
    o += gem ? `<path transform="translate(${x - 9} ${y - 9}) scale(.9)" d="M5 3h10l4 5-9 10L1 8z" fill="#ff5fd2" stroke="#20102c" stroke-width="1.6" stroke-linejoin="round"/>` : `<ellipse cx="${x}" cy="${y}" rx="9" ry="5" fill="#ffcb3d" stroke="#20102c" stroke-width="1.6"/><ellipse cx="${x}" cy="${y - 1}" rx="5" ry="2.4" fill="none" stroke="#c48a10" stroke-width="1.2"/>`; }
  return `<svg viewBox="0 0 60 48" aria-hidden="true">${o}</svg>`;
};
function bonusPct(list, p) { const base = list[0].amt / list[0].eur, r = p.amt / p.eur; const b = Math.floor((r / base - 1) * 100); return b > 0 ? b : 0; }
function giftReady() { return SAVE.giftDay !== todayStr(); }
function jokeClock() { const now = new Date(), end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); const s = Math.floor((end - now) / 1000); return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(v => String(v).padStart(2, '0')).join(':'); }
function buildShop() {
  for (const b of document.querySelectorAll('[data-st]')) b.setAttribute('aria-pressed', String(b.dataset.st === shopTab));
  const g = SHOP.gift, ready = giftReady();
  $('#gift-row').innerHTML = `<div class="pack gift"><div class="pk-ic">${PILE(2)}</div><div><div class="pk-name ol">Regalo del becario</div><div class="pk-note">Gratis una vez al día: ${g.gold} de oro y ${g.gems} gemas. Se lo ha «encontrado» en la oficina de Microblizz.</div></div><button class="btn-price ol" id="btn-gift" ${ready ? '' : 'disabled'}>${ready ? 'GRATIS' : 'MAÑANA'}</button></div>`;
  $('#btn-gift').onclick = () => {
    if (!giftReady()) return;
    SAVE.giftDay = todayStr(); SAVE.gold += g.gold; SAVE.gems += g.gems; saveGame(); play('crown'); updateWallets(); buildShop(); toast(`+${g.gold} de oro y +${g.gems} gemas`, true);
  };
  const L = SHOP[shopTab], gem = shopTab === 'gems';
  let h = '';
  if (!gem) { const J = SHOP.joke; h += `<div class="pack joke"><span class="joke-flag">¡OFERTA!</span><div class="pk-ic">${PILE(6)}</div><div><div class="pk-name ol">${J.name}</div><div class="pk-amt ol">${COIN_SVG}${fmt(J.amt)}</div><div class="pk-note">¡Oferta irrepetible! (se repite cada día) · Termina en <span class="countdown" id="joke-clock">${jokeClock()}</span></div></div><button class="btn-price ol" id="btn-joke"><small>${eur(J.was)}</small>${eur(J.eur)}</button></div>`; }
  h += L.map(p => { const b = bonusPct(L, p); return `<div class="pack${gem ? ' gem' : ''}"><div class="pk-ic">${PILE(1 + L.indexOf(p) + (L.indexOf(p) > 2 ? 1 : 0), gem)}</div><div><div class="pk-name ol">${p.name}${b ? `<span class="pk-bonus">+${b} % extra</span>` : ''}</div><div class="pk-amt ol">${gem ? GEM_SVG : COIN_SVG}${fmt(p.amt)}</div>${p.note ? `<div class="pk-note">${p.note}</div>` : ''}</div><button class="btn-price ol" data-buy="${p.id}">${eur(p.eur)}</button></div>`; }).join('');
  h += `<p class="small-print">${gem ? 'Las gemas sirven para el gashapón (50 gemas por tirada: unos 0,50 € con el pack pequeño).' : 'El oro sirve para subir de nivel tus cartas. La experiencia no se vende: siempre hay que jugar.'} Los «% extra» se comparan con el pack más pequeño. Precios de prueba: en esta versión no se cobra nada.</p>`;
  const list = $('#shop-list'); list.innerHTML = h;
  list.querySelectorAll('[data-buy]').forEach(b => { b.onclick = () => {
    const p = L.find(x => x.id === b.dataset.buy); play('select');
    confirmBox('¿COMPRAR?', `${p.name}<span class="big">${gem ? GEM_SVG : COIN_SVG} ${fmt(p.amt)}</span>por <b>${eur(p.eur)}</b><small>Versión de prueba: no se cobra nada y te lo llevas gratis.</small>`, 'COMPRAR', () => {
      if (gem) SAVE.gems += p.amt; else SAVE.gold += p.amt;
      saveGame(); play('win'); updateWallets(); toast(`+${fmt(p.amt)} ${gem ? 'gemas' : 'de oro'} · Microblizz te da las gracias`, true);
    });
  }; });
  const jb = $('#btn-joke'); if (jb) jb.onclick = () => { play('deny'); confirmBox('AGOTADO', `Se lo ha quedado el CEO de Microblizz.<small>Además, el precio tachado nunca existió: es un truco para que parezca una ganga. Así lo hacen ellos. Aquí, no.</small>`, null); };
  clearInterval(jokeT); jokeT = setInterval(() => { const c = $('#joke-clock'); if (!c || $('#scr-shop').hidden) { clearInterval(jokeT); return; } c.textContent = jokeClock(); }, 1000);
}
function openShop(tab) { if (tab) shopTab = tab; updateWallets(); show('scr-shop'); buildShop(); }
/* ---------- ventana de confirmación ---------- */
function confirmBox(title, html, okTxt, onOk, noTxt) {
  $('#cf-title').textContent = title; $('#cf-body').innerHTML = html;
  $('#cf-btns').innerHTML = okTxt ? `<button class="btn-ghost ol btn-ok" id="cf-ok">${okTxt}</button><button class="btn-ghost ol" id="cf-no">MEJOR NO</button>` : `<button class="btn-ghost ol" id="cf-no">${noTxt || 'VAYA'}</button>`;
  $('#scr-confirm').hidden = false;
  const close = () => { $('#scr-confirm').hidden = true; };
  $('#cf-no').onclick = () => { play('select'); close(); };
  if (okTxt) $('#cf-ok').onclick = () => { close(); onOk(); };
}
function updateBadges() {
  $('#coll-badge').hidden = !FACTION_ORDER.some(f => [FACTIONS[f].leader, ...FACTIONS[f].units].some(k => canLevel(k) && SAVE.gold >= lvlCost(uSave(k).lvl)));
  $('#shop-badge').hidden = !giftReady();
  const t = SAVE.tickets || 0; $('#gacha-badge').hidden = !t;
  $('#feat-gacha').textContent = t ? `¡${t} ${t > 1 ? 'tiradas gratis' : 'tirada gratis'}!` : 'Tira x1, x10 o x50';
  $('#feat-shop').textContent = giftReady() ? '¡Regalo diario gratis!' : 'Oro, gemas y ofertas';
  $('#news-badge').hidden = SAVE.seenVer === VERSION;
}
let toastTimer = null;
function toast(msg, good) { const t = $('#toast'); t.textContent = msg; t.classList.toggle('good', !!good); t.classList.toggle('menu', G.screen !== 'play'); t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400); }

/* =========================================================
   NOVEDADES: el informe de cada parche. Sale solo la primera vez que abres el juego después de actualizarse.
   Con cada versión nueva hay que subir VERSION (en td-meta.js) y poner aquí arriba del todo lo que cambia.
   ========================================================= */
const NEWS = [
  { v: '0.6.1', real: [
      '<b>Arreglado el parpadeo de las cartas de torres</b>: durante la partida se apagaban y encendían solas varias veces por segundo. Ahora solo se apagan cuando no te llega el CAOS.'],
    joke: ['Microblizz aclara que el parpadeo era una función prémium de discoteca. Se retira por falta de suscriptores.'] },
  { v: '0.6.0', real: [
      '<b>Menús como los del original</b>: colección, inventario, gashapón con su máquina de cápsulas, tienda y horas extra tienen ahora su mismo aspecto.',
      '<b>Informe de parches</b>: esta ventana. Sale una vez con cada versión y puedes volver a verla en NOVEDADES.',
      '<b>Experiencia</b>: cada torre que pones y cada unidad que envías da XP a su carta. Para subirla de nivel hace falta XP y oro, como en el original.',
      '<b>Inventario</b>: todas tus copias con su calidad. Puedes bloquearlas, volver a sortear sus números o despedirlas (también en masa).',
      'El gashapón tiene tiradas <b>x1, x10 y x50</b>, con una épica segura por cada 10.',
      'Arreglado el parpadeo de los botones de la torre durante el combate.'],
    joke: ['Microblizz quería cobrar 0,99 € por leer estas notas. Al becario se le olvidó poner el botón de pagar.', 'El CEO ha preguntado por qué las torres no tienen contrato temporal.', 'Phony anuncia que la música subirá de tono para siempre. También el precio.'] },
  { v: '0.5.0', real: [
      '<b>Música del original</b>: un tema por raza, el de cada jefe y los de victoria y derrota. Después de sonar entera sigue subiendo de tono sin fin (paradoja de Shepard) para que no canse.'],
    joke: ['La música era gratis. Microblizz está investigando cómo ha podido pasar.'] },
  { v: '0.4.0', real: [
      '<b>Progreso</b>: oro y gemas, niveles de carta, habilidades, equipo, gashapón, tienda y horas extra.',
      'Cada carta es una <b>torre</b> y una <b>unidad</b> que comparten nivel, habilidad y equipo: casi todo mejora solo una de las dos.',
      '<b>Modo VS</b>: mejora tus unidades dentro de la partida, y el rival gasta más en mandarte las suyas. Lo de dentro de la partida ahora se llama <b>CAOS</b>.'],
    joke: ['Las horas extra no se pagan. Se «acumulan».'] },
  { v: '0.3.0', real: ['<b>Modo VS</b> contra un rival que lleva el juego: envía unidades, sube tu income y róbale vida a su base.', '<b>Fusiones</b>: dos torres iguales, del mismo nivel y pegadas se funden en una mejor.'], joke: ['El rival también es un becario. No se lo digas.'] },
  { v: '0.2.0', real: ['Las <b>9 razas</b> con sus torres y su pasiva, y los <b>12 mundos</b> de la campaña con sus jefes.'], joke: ['Doce mundos y ni un solo día de vacaciones.'] },
  { v: '0.1.0', real: ['Defensa de torres de <b>laberinto</b>: el campo es todo camino, lo cierras tú con torres y nunca del todo.'], joke: ['Microblizz ha patentado «andar en línea recta».'] },
];
function openNews() {
  const cur = NEWS[0], rest = NEWS.slice(1);
  $('#news-title').textContent = 'NOVEDADES · ' + VERSION;
  $('#news-body').innerHTML = `<h4>LO NUEVO</h4><ul>${cur.real.map(t => `<li>${t}</li>`).join('')}</ul><h4>NOTAS DE MICROBLIZZ Y PHONY</h4><ul class="joke">${cur.joke.map(t => `<li>${t}</li>`).join('')}</ul>`
    + rest.map(n => `<h4>VERSIÓN ${n.v}</h4><ul>${n.real.map(t => `<li>${t}</li>`).join('')}</ul><ul class="joke">${n.joke.map(t => `<li>${t}</li>`).join('')}</ul>`).join('');
  $('#scr-news').hidden = false; $('#news-body').scrollTop = 0;
}
// al volver al menú principal: las novedades, si hay versión nueva
function titlePopups() { if ($('#scr-title').hidden || !$('#scr-news').hidden) return; if (SAVE.seenVer !== VERSION) openNews(); }

/* ---------- menú principal ---------- */
function showMenu() {
  G.vs = null; G.xpPlay = {}; show('scr-title'); updateWallets(); titlePopups();
}

/* ---------- botones ---------- */
$('#btn-coll').onclick = () => { play('select'); openColl(); };
$('#btn-inv').onclick = () => { play('select'); openInv(); };
$('#btn-gacha').onclick = () => { play('select'); openGacha(); };
$('#btn-shop').onclick = () => { play('select'); openShop(); };
$('#btn-news').onclick = () => { play('select'); openNews(); };
$('#btn-news-ok').onclick = () => { $('#scr-news').hidden = true; play('select'); if (SAVE.seenVer !== VERSION) { SAVE.seenVer = VERSION; saveGame(); updateBadges(); } };
for (const b of document.querySelectorAll('[data-back]')) b.onclick = () => { play('select'); showMenu(); };
for (const b of document.querySelectorAll('[data-gt]')) b.onclick = () => { gachaTab = b.dataset.gt; play('select'); buildGachaText(); };
for (const b of document.querySelectorAll('[data-pull]')) b.onclick = () => pull(+b.dataset.pull);
$('#btn-gr-ok').onclick = () => { $('#gacha-result').hidden = true; play('select'); };
$('#btn-gr-inv').onclick = () => { play('select'); openInv(gachaTab); };
for (const b of document.querySelectorAll('[data-it]')) b.onclick = () => { invTab = b.dataset.it; invFilter = 'all'; play('select'); buildInv(); };
$('#btn-inv-sort').onclick = () => { const ks = Object.keys(INV_SORTS); invSort = ks[(ks.indexOf(invSort) + 1) % ks.length]; play('select'); buildInv(); };
$('#btn-mass').onclick = massScrap;
$('#btn-item-close').onclick = () => { $('#scr-item').hidden = true; itemCur = null; play('select'); };
$('#btn-pick-close').onclick = () => { $('#scr-pick').hidden = true; play('select'); };
for (const b of document.querySelectorAll('[data-st]')) b.onclick = () => { shopTab = b.dataset.st; play('select'); buildShop(); };
