// Fans of TD · Portada, campaña, pantalla previa, cómo se juega, pausa y final de partida.
// Tienen la misma estructura y las mismas clases que en el original (index.html y js/09-menus.js), para que se vean igual.
'use strict';
const enemyLabel = f => (isCorp(f) ? CORP[f] : FACTIONS[f].corr || FACTIONS[f].name + ' corrompidos');
const ownerOf = L => (L && L.wi >= 8 ? 'phony' : 'microblizz');   // del mundo 9 en adelante manda Phony

/* ---------- portada ---------- */
function setTagline() { const F = FACTIONS[facNow()]; $('#tagline').innerHTML = `<b>${F.name}</b> contra <i>Microblizz${starsOf('7-4') > 0 ? ' y Phony' : ''}</i>`; }
function drawTitleArt() {
  const fac = facNow(), F = FACTIONS[fac], TH = THEMES[fac];
  const c = $('#title-art'), LW = 420, LH = 200, R2 = 3; c.width = LW * R2; c.height = LH * R2;
  const x = c.getContext('2d'); x.setTransform(R2, 0, 0, R2, 0, 0); x.lineJoin = 'round'; x.clearRect(0, 0, LW, LH);
  x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(210, 190, 192, 16, 0, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.ellipse(210, 180, 178, 24, 0, 0, Math.PI * 2); x.fillStyle = TH.title[0]; x.fill(); x.lineWidth = 3; x.strokeStyle = OL; x.stroke();
  x.beginPath(); x.ellipse(210, 175, 152, 13, 0, 0, Math.PI * 2); x.fillStyle = TH.title[1]; x.fill();
  const [a, lead, b] = F.trio, [ha, hl, hb] = F.trioH;
  drawVector(x, a, 86, 182, ha, 1); drawVector(x, b, 336, 182, hb, -1); drawVector(x, lead, 206, 188, hl, 1);
}
const baseShowMenu = showMenu;
showMenu = function () { $('#scr-pause').hidden = true; G.paused = false; baseShowMenu(); G.screen = 'title'; setTagline(); drawTitleArt(); };

/* ---------- campaña ---------- */
function buildCamp() {
  const list = $('#world-list'); let cur = 0;
  list.innerHTML = WORLDS_TD.map((w, wi) => {
    const open = SAVE.testAll || wi === 0 || worldDone(wi - 1), stars = w.levels.reduce((a, l) => a + starsOf(l.id), 0); if (open) cur = wi;
    const nodes = w.levels.map(l => { const st = starsOf(l.id), ok = levelOpen(l); return `<button class="node${l.boss ? ' boss' : ''}${ok && !st ? ' next' : ''}" data-lv="${l.id}" ${ok ? '' : 'disabled'}><b class="ol">${l.boss ? 'JEFE' : l.id}</b><small>${l.name}</small><span class="st">${'★'.repeat(st)}<i>${'★'.repeat(3 - st)}</i></span></button>`; }).join('');
    const nextTxt = wi === 6 ? 'Premio: abre el sótano y la Campaña 2' : wi === WORLDS_TD.length - 1 ? 'El final de la partida' : 'Premio: abre el mundo ' + (wi + 2);
    const port = w.efac === 'microblizz' ? (wi ? 'parchebot' : 'becario') : w.efac === 'phony' ? (wi === 11 ? 'remasterbot' : 'descargabot') : FACTIONS[w.efac].leader;
    const head = wi === 0 ? '<div class="camp-head ol">CAMPAÑA 1 · LA REBELIÓN DE LOS FANS<small>contra Microblizz</small></div>' : wi === 8 ? '<div class="camp-head c2 ol">CAMPAÑA 2 · LA ERA DIGITAL<small>contra Phony y su PayStation</small></div>' : '';
    return head + `<div class="world${open ? '' : ' locked'}" data-wi="${wi}" style="--wc:${w.efac === 'microblizz' ? '#1d3f8a' : w.efac === 'phony' ? '#8a6a12' : FAC_COLOR[w.efac] + '77'}"><div class="world-head"><canvas data-k="${port}"></canvas><div class="world-name ol">${wi + 1}. ${w.name}<small>${enemyLabel(w.efac)} · ${nextTxt}</small></div><div class="world-stars ol">★ ${stars}/12</div></div><p class="world-story">${open ? w.story + ' ' + ETRAITS[w.efac].txt : 'Bloqueado: gana al jefe del mundo anterior.'}</p><div class="nodes">${nodes}</div></div>`;
  }).join('');
  for (const cv of list.querySelectorAll('canvas[data-k]')) drawArt(cv, cv.dataset.k, 52, 46);
  for (const b of list.querySelectorAll('[data-lv]')) b.onclick = () => { play('select'); const [wi, li] = b.dataset.lv.split('-').map(Number); openPrep('camp', WORLDS_TD[wi - 1].levels[li - 1]); };
  const el = list.querySelector(`[data-wi="${cur}"]`); if (el) list.scrollTop = Math.max(0, el.offsetTop - list.offsetTop - 8);
}
function openCamp() { G.vs = null; $('#scr-pause').hidden = true; G.paused = false; updateWallets(); show('scr-camp'); buildCamp(); }
function showMap() { openCamp(); }   // otras partes del juego la llaman así

/* ---------- antes de jugar: elegir facción (y rival, en el modo VS) ---------- */
const PREP = { mode: 'camp', lvl: null };
const VS_DIFF = [['facil', 'Becario', 'Fácil, para aprender'], ['normal', 'Ejecutivo', 'El rival de verdad'], ['dificil', 'CEO', 'Gana más income que tú']];
$('#fac-grid').innerHTML = FACTION_ORDER.filter(f => TOWERS[f]).map(f => { const F = FACTIONS[f]; return `<button class="diff-opt fac-opt" data-fac="${f}" aria-pressed="false" style="--fc: ${FAC_COLOR[f]}"><canvas></canvas><b class="ol">${F.name}</b><small>${ICONS[F.icon]} ${F.pname}</small></button>`; }).join('');
$('#diff-row').innerHTML = VS_DIFF.map(([d, n, s]) => `<button class="diff-opt" data-vd="${d}" aria-pressed="false"><b class="ol">${n}</b><small>${s}</small></button>`).join('');
function syncPrep() {
  const fac = facNow(), F = FACTIONS[fac], d = SAVE.vsDiff || 'normal';
  for (const b of document.querySelectorAll('[data-fac]')) b.setAttribute('aria-pressed', String(b.dataset.fac === fac));
  for (const b of document.querySelectorAll('[data-vd]')) b.setAttribute('aria-pressed', String(b.dataset.vd === d));
  const box = $('#prep-passive'); box.className = 'passive-box ' + F.kind; box.innerHTML = `${ICONS[F.icon]}<div><b class="ol">${F.passive}</b><span>${PASSIVES[fac].txt}</span></div>`;
}
for (const b of document.querySelectorAll('[data-fac]')) { drawArt(b.querySelector('canvas'), FACTIONS[b.dataset.fac].leader, 56, 44); b.onclick = () => { SAVE.fac = b.dataset.fac; saveGame(); play('select'); syncPrep(); }; }
for (const b of document.querySelectorAll('[data-vd]')) b.onclick = () => { SAVE.vsDiff = b.dataset.vd; saveGame(); play('select'); syncPrep(); };
function openPrep(mode, lvl) {
  PREP.mode = mode; PREP.lvl = lvl || null; const info = $('#prep-info');
  if (mode === 'camp') {
    const W0 = WORLDS_TD[lvl.wi], st = starsOf(lvl.id), fr = lvl.boss ? ECON.camp.boss : ECON.camp.first;
    $('#prep-title').textContent = lvl.boss ? `JEFE DEL MUNDO ${lvl.wi + 1}` : `NIVEL ${lvl.id}`;
    info.innerHTML = `<b class="ol">${lvl.name}</b><br>Mundo ${lvl.wi + 1}: ${W0.name}. Rival: ${enemyLabel(W0.efac)}, ${lvl.waves} oleadas${lvl.boss ? ', con jefe y sus habilidades' : ''}.<br><span class="stars">${'★'.repeat(st)}<span style="color:#4a3866">${'★'.repeat(3 - st)}</span></span> Estrellas: ganar · con media base en pie · con la base casi intacta.<br><span class="rw">${st ? `Recompensa: ${ECON.camp.replay} de oro por repetirlo` : `Primera victoria: ${fr[0]} de oro y ${fr[1]} gemas`}${st < 3 ? ` · 3 estrellas: +${ECON.camp.stars3[0]} de oro y +${ECON.camp.stars3[1]} gemas` : ''}, y experiencia para tus cartas.</span>`;
  } else {
    $('#prep-title').textContent = 'MODO VS';
    info.innerHTML = `Contra un rival que lleva el juego, con una raza al azar. Cada uno defiende su campo y manda unidades al del otro: gana quien tumba la base rival.<br><span class="rw">Recompensa: ${ECON.vs.facil}, ${ECON.vs.normal} o ${ECON.vs.dificil} de oro según el rival si ganas (${ECON.vs.lose} si pierdes), y experiencia para tus cartas.</span>`;
  }
  $('#diff-label').hidden = $('#diff-row').hidden = mode !== 'vs';
  syncPrep(); updateWallets(); show('scr-prep'); fitText($('#prep-title'), 52, 26);
  for (const nb of document.querySelectorAll('#fac-grid .fac-opt b')) fitText(nb, 16, 10);
}
$('#btn-play').onclick = () => { play('select'); if (PREP.mode === 'vs') startVS(SAVE.vsDiff || 'normal'); else startLevel(PREP.lvl); };
$('#btn-prep-back').onclick = () => { play('select'); if (PREP.mode === 'camp') openCamp(); else showMenu(); };
$('#btn-camp').onclick = () => { play('select'); openCamp(); };
$('#btn-vs').onclick = () => { play('select'); openPrep('vs'); };
$('#btn-howto').onclick = () => { play('select'); show('scr-howto'); };
$('#btn-howto-ok').onclick = () => { play('select'); showMenu(); };

/* ---------- pausa ---------- */
const PAUSE_QUOTES = { microblizz: ['Microblizz ya está pensando qué juego cerrar ahora.', 'El CEO aprovecha la pausa para subir los precios.', 'Los becarios no tienen pausa. Tú sí.'], phony: ['Phony te cobra la pausa en la próxima suscripción.', 'La PayStation sigue descargando una actualización.', 'Pausa disponible solo con conexión.'] };
function pauseGame() { if (G.screen !== 'play' || G.over || G.paused) return; G.paused = true; $('#banner').classList.remove('show'); $('#pause-quote').textContent = pick(PAUSE_QUOTES[G.vs ? 'microblizz' : ownerOf(G.level)]); $('#scr-pause').hidden = false; }
$('#btn-pause').onclick = () => { play('select'); pauseGame(); };
$('#btn-resume').onclick = () => { G.paused = false; $('#scr-pause').hidden = true; play('select'); };
$('#btn-restart').onclick = () => { $('#scr-pause').hidden = true; play('select'); if (G.vs) startVS(G.vs.diff); else startLevel(G.level); };
$('#btn-quit').onclick = () => { play('select'); showMenu(); };
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });

/* ---------- final de la partida ---------- */
function endScreen(o) {
  G.screen = 'result'; showScreen('scr-end'); $('#banner').classList.remove('show');
  const t = $('#end-title'); t.textContent = o.title; t.className = 'end-title ol-big ' + (o.win ? 'win' : 'lose'); fitText(t, 74, 34);
  $('#end-crowns').innerHTML = o.stars == null ? '' : [0, 1, 2].map(i => `<span class="${i < o.stars ? 'on' : 'off'}">${STAR_SVG}</span>`).join('');
  $('#end-sub').textContent = o.sub; $('#end-rewards').innerHTML = o.rw; $('#end-quote').textContent = o.quote;
  o.stats.forEach(([v, lab], i) => { $('#st-' + i).textContent = v; $('#st-l' + i).textContent = lab; });
  $('#btn-next').hidden = !o.next; $('#btn-next').onclick = () => { play('select'); o.next(); };
  $('#btn-again').onclick = () => { play('select'); o.again(); };
}
$('#btn-menu').onclick = () => { play('select'); showMenu(); };
function showResult(win, st, first) {
  const L = G.level, W0 = WORLDS_TD[L.wi], next = W0.levels[L.li + 1], nextWorld = WORLDS_TD[L.wi + 1], go = next || (nextWorld && nextWorld.levels[0]), Q = ownerOf(L) === 'phony' ? QUOTES_PH : QUOTES;
  let rw = G.rw; if (win && !next) rw = `<span class="rw-chip big ol">${nextWorld ? '¡MUNDO LIBERADO! SE ABRE ' + nextWorld.name.toUpperCase() : '¡CAMPAÑA TERMINADA!'}</span>` + rw;
  endScreen({ win, stars: win ? st : null, rw, title: win ? '¡VICTORIA!' : 'DERROTA',
    sub: win ? `${L.name}: ${st === 3 ? '¡3 estrellas!' : st + (st === 1 ? ' estrella' : ' estrellas') + ` (${FACTIONS[G.fac].end} acabó con ${Math.ceil(G.lives)} de vida)`}` : `Han tirado ${FACTIONS[G.fac].end} en la oleada ${G.wave} de ${G.waves}.`,
    quote: pick(Q[win ? 'p' : 'e']), stats: [[G.towers.length, 'torres en pie'], [G.kills, 'enemigos despedidos'], [`${G.wave}/${G.waves}`, 'oleadas']],
    next: win && go ? () => openPrep('camp', go) : null, again: () => startLevel(L) });
}
function showVsResult(win) {
  const V = G.vs, m = Math.floor(V.t / 60), s = String(Math.floor(V.t % 60)).padStart(2, '0');
  endScreen({ win, stars: null, rw: vsReward(win, V.diff), title: win ? '¡VICTORIA!' : 'DERROTA',
    sub: win ? `Has tirado la base de ${FAC_NAME(V.ai.fac)} en ${m}:${s}.` : `${capFirst(FAC_NAME(V.ai.fac))} han tirado ${FACTIONS[V.me.fac].end} en ${m}:${s}.`,
    quote: pick(QUOTES[win ? 'p' : 'e']), stats: [[V.me.sent, 'unidades enviadas'], [V.me.kills || 0, 'enemigos despedidos'], [V.me.income, 'income final']],
    next: null, again: () => startVS(V.diff) });
}
