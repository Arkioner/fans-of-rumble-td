"""Genera core/js/idle.js a partir de js/13-horas-extra.js del original, con los cambios mínimos para la defensa de torres."""
SRC = 'games/rumble/js/13-horas-extra.js'   # el juego original, que está en este mismo repositorio
OUT = 'core/js/idle.js'
s = open(SRC, encoding='utf-8').read()

def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:90])
    s = s.replace(a, b)

def cut(start, end):
    """Quita desde `start` hasta justo antes de `end`."""
    global s
    i = s.index(start); j = s.index(end, i)
    s = s[:i] + s[j:]

rep("// Fans of Rumble · HORAS EXTRA: el minijuego del menú\n'use strict';\n",
    "// Fans Of · HORAS EXTRA: el minijuego del menú.\n"
    "// Es js/13-horas-extra.js del original casi tal cual: la escena, los números y las ventanas son los suyos.\n"
    "// Cambia de dónde sale el poder del líder (aquí, de su faceta de UNIDAD: ver idlePower en meta.js) y no hay anuncios.\n"
    "'use strict';\n"
    "/* ---------- lo que el original tenía en otros archivos ---------- */\n"
    "const VIEW = { get sc() { return SCALE; } }, PROJ = {};\n"
    "const audioInit = () => { if (typeof musicWake === 'function') musicWake(); };\n")
cut("const IDLE = {", "const IDLE_MOBS")
rep("const idleFacOk = f => !!(f && FACTIONS[f] && FACTIONS[f].leader && !isCorp(f) && isUnlocked(f));", "const idleFacOk = f => !!(f && TOWERS[f]);")
rep("I.fac = idleFacOk(G.faction) ? G.faction : FACTION_ORDER.find(idleFacOk) || 'animales';", "I.fac = idleFacOk(facNow()) ? facNow() : 'animales';")
cut("// poder del líder: 100 = nivel 1 sin nada", "function idleRates(fac)")
# sin turbo de anuncios
rep("  // v0.9.16: con el turbo (anuncio) gana el doble mientras dura\n  const td = dh > 0 && I.turbo > from ? Math.min(dh, (Math.min(now, I.turbo) - from) / 3600000) : 0, x = dh + Math.max(0, td);\n", "  const x = dh;\n")
rep("const dh = Math.min((now - I.last) / 3600000, IDLE.cap - I.h), from = I.last; I.last = now;", "const dh = Math.min((now - I.last) / 3600000, IDLE.cap - I.h); I.last = now;")
rep("  const pool = Object.keys(DB).filter(id => DB[id].rar === rar && !DB[id].pass && (kind === 'ab' || !DB[id].fac || isUnlocked(DB[id].fac)));", "  const pool = Object.keys(DB).filter(id => DB[id].rar === rar);")
rep("function idleCollect(x2) {   // v0.9.16: x2 = premio doble por anuncio", "function idleCollect(x2) {")
rep("  stat('idle', 1, true); stat('idleh', h, true); stat('idleg', g, true); stat('idlem', gm, true); if (ni) stat('idlei', ni, true); if (full) stat('idlefull', 1, true);\n  achScan(); saveGame();", "  saveGame();")
rep("I.fac = f; idleR = idleRates(f); stat('idleswap', 1); saveGame();", "I.fac = f; idleR = idleRates(f); saveGame();")
rep("const nl = FACTION_ORDER.length - L.length;\n  $('#idle-more').textContent = nl ? `Libera más facciones en la campaña para tener más líderes (te ${nl > 1 ? 'faltan ' + nl : 'falta 1'}).` : '';",
    "$('#idle-more').textContent = 'Trabaja como unidad: súbele la vida, la velocidad o el escudo y ganará más.';")
rep("  adIdleUI();   // v0.9.16\n", "")
rep("const A = invGet(SAVE.abEquip[k]), lab = (A && ABILITIES[A.id] ? ABILITIES[A.id].name : CFG.cards[k].tag).toUpperCase();", "const A = invGet(SAVE.abEquip[k]), lab = (A && ABILITIES[A.id] ? ABILITIES[A.id].name : CFG.cards[k].tag).toUpperCase();")
rep("S2.eu = effStats(k, I.fac).u; idleUI();", "S2.eu = null; idleUI();")
rep("$('#idle-get').addEventListener('click', () => { audioInit(); idleCollectBox(); });   // v0.9.18: primero enseña lo que vas a cobrar",
    "$('#idle-get').addEventListener('click', () => { audioInit(); idleCollectBox(); });   // primero enseña lo que vas a cobrar")

s = s.rstrip('\n') + """
// la ventana que enseña lo que vas a cobrar (del original, js/15-anuncios.js, sin el botón del anuncio)
function idleCollectBox() {
  const I = idleTick(), g = Math.floor(I.gold), gm = Math.floor(I.gems), ni = Math.floor(I.items);
  if (g < 1 && gm < 1 && ni < 1) { play('deny'); toast('Todavía no hay nada. ¡Dale un rato a tu líder!'); return; }
  $('#ib-sub').textContent = `${CFG.cards[FACTIONS[I.fac].leader].name} ha trabajado ${fmtV(Math.floor(I.h * 10) / 10)} h. Esto es lo que ha ganado:`;
  $('#ib-loot').innerHTML = `<span class="rw-chip big ol">${COIN_SVG}${fmt(g)}</span>${gm ? `<span class="rw-chip big ol">${GEM_SVG}${fmt(gm)}</span>` : ''}${ni ? `<span class="rw-chip big ol">${CHEST_SVG}x${ni}</span>` : ''}`;
  $('#ib-row').innerHTML = '<button class="btn-big ol" id="btn-ib-get">RECOGER</button>';
  $('#scr-idlebox').hidden = false; play('select');
  $('#btn-ib-get').onclick = () => { $('#scr-idlebox').hidden = true; idleCollect(); };
}
$('#btn-ib-close').addEventListener('click', () => { $('#scr-idlebox').hidden = true; play('select'); });
// la escena se mueve sola mientras estás en el menú
let idleLast = performance.now();
(function idleLoop(now) { const dt = Math.min(0.1, ((now || idleLast) - idleLast) / 1000); idleLast = now || idleLast; try { idleFrame(dt); } catch (e) { /* el menú nunca debe pararse por la escena */ } requestAnimationFrame(idleLoop); })();

// todo cargado: arranca el juego
boot();
"""
open(OUT, 'w', encoding='utf-8', newline='\n').write(s)
import re
print('ok', len(s), 'bytes')
for name in ['stat(', 'achScan', 'adIdle', 'adBtn', 'isCorp', 'effStats', 'drawEquip', 'G.faction', 'missionEvent', 'idlePower', 'turbo']:
    print(name, s.count(name))
