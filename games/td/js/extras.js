// Fans of Rumble TD · Lo que faltaba de las Opciones del original: música del menú, avisos en la caja, chapas, sangre,
// chat en directo y tutorial. Se engancha al motor desde fuera, sin tocar sus funciones.
'use strict';
if (SAVE.tut == null) SAVE.tut = { done: Object.keys(SAVE.stars || {}).length > 0 };   // quien ya ha ganado algún nivel no necesita la partida guiada

/* ---------- opciones ---------- */
const MENU_TRACKS = [['menu', 'Espera de Microblizz'], ['animales', 'Animales Locos'], ['nomuertos', 'No-Muertos'], ['streamers', 'Streamers'], ['heroes', 'Héroes'], ['ciber', 'Ciberpunks'], ['memes', 'Memes'], ['gamer', 'Comunidad Gamer'], ['olvidados', 'Olvidados'], ['pop', 'Cultura Pop'],
  ['boss0', 'Jefe: SurvivalBot'], ['boss1', 'Jefe: NecroLord'], ['boss2', 'Jefe: StreamKing'], ['boss3', 'Jefe: EpicChampion'], ['boss4', 'Jefe: CyberMarine'], ['boss5', 'Jefe: MemeLord'], ['boss6', 'Jefe: el CEO'], ['boss7', 'Jefe: Vikingo'], ['boss8', 'Jefe: PayStation'], ['boss9', 'Jefe: ProGamer'], ['boss10', 'Jefe: LaDirectora'], ['boss11', 'Jefe: Presidente de Phony']].filter(t => TRACKS[t[0]]);
const menuTrack = () => MENU_TRACKS.find(t => t[0] === SAVE.menuMus) || MENU_TRACKS[0];
const baseOptButtons = optButtons;
optButtons = function () {
  baseOptButtons();
  $('#btn-menumus').textContent = menuTrack()[1].toUpperCase() + ' ▸'; $('#btn-feed').textContent = SAVE.feed ? 'EN LA CAJA' : 'ENCIMA';
  $('#btn-badges').textContent = SAVE.noBadges ? 'NO' : 'SÍ'; $('#btn-blood').textContent = SAVE.blood ? 'SÍ' : 'NO'; $('#btn-chat').textContent = SAVE.chatOff ? 'NO' : 'SÍ';
};
const flip = (k, after) => () => { SAVE[k] = !SAVE[k]; saveGame(); play('select'); optButtons(); if (after) after(); };
$('#btn-menumus').onclick = () => { const i = MENU_TRACKS.indexOf(menuTrack()); SAVE.menuMus = MENU_TRACKS[(i + 1) % MENU_TRACKS.length][0]; saveGame(); play('select'); optButtons(); };
$('#btn-feed').onclick = flip('feed'); $('#btn-badges').onclick = flip('noBadges'); $('#btn-blood').onclick = flip('blood'); $('#btn-chat').onclick = flip('chatOff', () => chatClear());
$('#btn-tut').onclick = () => { play('select'); SAVE.tut = { done: false }; saveGame(); showMenu(); toast('Tutorial reiniciado: entra en Campaña y juega el nivel 1-1', true); };

/* ---------- chat falso en directo (las frases son las del original: core/js/vendor/02-chat.js) ---------- */
const chatSt = { t: 6, recent: [], low: false };
function chatSay(kind, extra) {
  if (SAVE.chatOff || G.screen !== 'play') return;
  const box = $('#chat'), lines = CHAT[kind]; if (!lines) return;
  let txt = pick(lines); for (let i = 0; i < 8 && chatSt.recent.includes(txt); i++) txt = pick(lines);   // sin repetir lo que acaba de salir
  chatSt.recent.push(txt); if (chatSt.recent.length > 10) chatSt.recent.shift();
  txt = txt.replace('{X}', extra || '').replace(/\{yo\}/g, CFG.cards[FACTIONS[G.fac].leader].name);   // aquí no hay nombre de jugador: el chat anima a tu líder
  const [nm, col] = pick(CHAT_USERS), d = document.createElement('div'); d.className = 'cl';
  d.innerHTML = `<b style="color:${col}">${nm}</b>: ${txt}`; box.appendChild(d);
  while (box.children.length > 4) box.removeChild(box.firstChild);
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 650); }, 6500);
}
function chatBurst(kind, n) { chatSay(kind); for (let i = 1; i < n; i++) setTimeout(() => chatSay(kind), 500 + i * 650 + Math.random() * 400); }
function chatClear() { $('#chat').innerHTML = ''; chatSt.t = 6; chatSt.low = false; }

/* ---------- avisos en la caja de abajo a la derecha ---------- */
const FEED = { list: [], max: 5, life: 5, h: '' };
function feedAdd(txt, color) {
  const now = performance.now() / 1000, same = FEED.list.find(f => f.txt === txt && now - f.t < 4);
  if (same) { same.n++; same.t = now; } else { FEED.list.push({ txt, color, n: 1, t: now, id: String(Math.random()) }); if (FEED.list.length > FEED.max) FEED.list.shift(); }
  feedDraw();
}
function feedDraw() {   // solo se vuelve a pintar si cambia algo (si no, la animación de entrada se repetiría sin parar)
  const el = $('#feed'), now = performance.now() / 1000, on = !!SAVE.feed && G.screen === 'play';
  if (el.hidden === on) el.hidden = !on;
  if (!on) { if (FEED.h) { FEED.list.length = 0; el.innerHTML = ''; FEED.h = ''; } return; }
  FEED.list = FEED.list.filter(f => now - f.t < FEED.life);
  const html = FEED.list.map(f => `<div class="fl" data-id="${f.id}"><i></i><span style="color:${f.color || '#fff6ea'}">${f.txt}</span>${f.n > 1 ? `<b>x${f.n}</b>` : ''}</div>`).join('');
  if (FEED.h !== html) { const old = new Set([...el.children].map(c => c.dataset.id)); el.innerHTML = html; FEED.h = html; for (const c of el.children) if (old.has(c.dataset.id)) c.style.animation = 'none'; }
  for (const c of el.children) { const f = FEED.list.find(x => x.id === c.dataset.id), out = !!f && now - f.t > FEED.life - 0.6; if (c.classList.contains('out') !== out) c.classList.toggle('out', out); }
}

/* ---------- tutorial: una partida guiada en el nivel 1-1 ---------- */
const TUT = [
  ['<b>Arrastra una carta</b> de abajo a una casilla del campo para poner tu primera torre. También puedes tocar la carta y luego la casilla.', () => G.towers.length >= 1],
  ['Cada torre <b>bloquea el paso</b>. Pon 2 más para que los enemigos den un rodeo: la línea de puntos es el camino que seguirán. Nunca puedes cerrarlo del todo.', () => G.towers.length >= 3],
  ['Pulsa <b>¡OLEADA!</b>, el botón rojo, para que salgan los robots de Microblizz.', () => G.wave >= 1],
  ['Cada baja te da CAOS. <b>Toca una torre</b> para mejorarla, o pon otra igual pegada a ella para fusionarlas.', () => !!G.sel || G.wave >= 3],
  ['¡Eso es todo! Aguanta todas las oleadas sin que caiga tu base. En el menú tienes el equipo, el gashapón y el modo VS.', () => G.wave >= (G.tutW || 99)],
];
function tutShow() {
  const el = $('#tut'), on = G.tut != null && G.screen === 'play' && !G.vs && !G.over;
  if (el.hidden === on) el.hidden = !on;
  if (!on) return;
  if (TUT[G.tut][1]()) { G.tut++; if (G.tut === TUT.length - 1) G.tutW = G.wave + 1; if (G.tut >= TUT.length) { tutEnd(true); return; } sfx('up'); }
  const html = `<span>${G.tut + 1}/${TUT.length}</span>${TUT[G.tut][0]}<button class="btn-link" id="tut-skip">Saltar tutorial</button>`;
  if (el.dataset.h !== html) { el.dataset.h = html; el.innerHTML = html; $('#tut-skip').onclick = () => tutEnd(false); }
}
function tutEnd(done) { G.tut = null; $('#tut').hidden = true; SAVE.tut = { done: true }; saveGame(); if (done) toast('¡Tutorial completado! Ya sabes lo básico. ¡A por Microblizz!', true); }

/* ---------- enganches al motor ---------- */
const base = { startLevel, startVS, hud, finish, spawnFoe, build, showScreen };
startLevel = function (L) { base.startLevel(L); G.tut = L.id === '1-1' && !SAVE.tut.done ? 0 : null; chatClear(); chatBurst('start', 2); tutShow(); };
startVS = function (d) { base.startVS(d); G.tut = null; chatClear(); chatBurst('start', 2); };
hud = function () {   // el motor lo llama 10 veces por segundo durante la partida
  base.hud(); feedDraw(); tutShow();
  if (G.paused || G.over) return;
  chatSt.t -= 0.1; if (chatSt.t <= 0) { chatSay('idle'); chatSt.t = rand(5, 10); }
  if (!chatSt.low && G.lives < TD.baseHp * 0.3) { chatSt.low = true; chatSay('baseLowP'); }
};
finish = function (win) { if (!G.over) chatBurst((G.vs ? G.vsCur === 'ai' : win) ? 'win' : 'lose', 2); base.finish(win); };
spawnFoe = function (k, at, hpMul) { const f = base.spawnFoe(k, at, hpMul); if (FOES[k].boss) chatBurst('boss', 2); return f; };
build = function (k, c, r) { const ok = base.build(k, c, r); if (ok && TOWERS[G.fac][k].leader && !(G.vs && G.vsCur === 'ai')) chatSay('leader'); return ok; };
showScreen = function (id) { base.showScreen(id); if (id !== null) { $('#tut').hidden = true; $('#feed').hidden = true; $('#chat').innerHTML = ''; } };
