// Fans of Rumble TD · Las canciones del juego original: copiadas sin cambios de js/05-audio.js de Fans of Rumble (escalas, secuencias y los 25 temas).
'use strict';
/* =========================================================
   MUSIC (synthesised, no files): menu, one theme per faction, boss, last-minute rush, win / lose jingles
   ========================================================= */
const SCALES = { maj: [0, 2, 4, 5, 7, 9, 11], min: [0, 2, 3, 5, 7, 8, 10], phr: [0, 1, 3, 5, 7, 8, 10], hmin: [0, 2, 3, 5, 7, 8, 11], wt: [0, 2, 4, 6, 8, 10] };
// "4 - . 2" -> [{ s: 0, v: 4, n: 2 }, { s: 3, v: 2, n: 1 }]   (s = step 0-15, n = length in steps; "-" holds, "." rests, "?" = random note)
function mseq(str) {
  const out = [];
  str.trim().split(/\s+/).forEach((t, i) => {
    if (t === '-') { if (out.length) out[out.length - 1].n++; }
    else if (t !== '.') out.push({ s: i, v: t === '?' ? '?' : (isNaN(+t) ? t : +t), n: 1 });
  });
  return out;
}
const TRACKS = (() => {
  const mk = d => { d.sc = SCALES[d.scale]; d.L = d.lead.seq.map(mseq); d.B = d.bass ? mseq(d.bass.seq) : []; d.A = d.arp ? d.arp.seq.split(' ') : null; return d; };
  const T = {
    // música de espera de Microblizz: ascensor, jazz suave, nada que ver con el caos de ahí abajo
    menu: mk({
      bpm: 92, tonic: 53, scale: 'maj', prog: [0, 5, 1, 4], seven: true, swing: 0.1, dv: 0.5,
      pad: { wave: 'triangle', vol: 0.34, lp: 1600, att: 0.25 },
      bass: { wave: 'sine', vol: 0.5, seq: 'r . . . . . f . . . r . . . f .' },
      drums: { k: 'x.......x.......', h: '..x...x...x...x.' },
      lead: { wave: 'sine', bell: true, vol: 0.36, gate: 0.9, min: 0.9, oct: 7, up: 0, seq: [
        '4 . . . 2 . 4 . 6 . . . 4 . . .',
        '5 . . . 4 . 2 . 4 . . . 2 . . .',
        '3 . . . 4 . 5 . 4 . 3 . 1 . . .',
        '4 . . . 6 . 5 . 3 . . . 4 . . .'] } }),
    // Animales Locos: dibujos animados, saltarín
    animales: mk({
      bpm: 132, tonic: 48, scale: 'maj', prog: [0, 4, 5, 3], dv: 1,
      pad: { wave: 'square', vol: 0.16, lp: 1200, att: 0.05 },
      bass: { wave: 'triangle', vol: 0.7, seq: 'r . o . r . o . r . o . r . f .' },
      drums: { k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.' },
      lead: { wave: 'square', vol: 0.2, gate: 0.55, lp: 4000, oct: 7, up: 7, seq: [
        '4 . 4 2 . 0 . 2 4 - . . 7 . 4 .',
        '6 . 6 4 . 1 . 4 6 - . . 8 . 6 .',
        '5 . 7 5 . 2 . 5 7 - . . 9 . 7 .',
        '5 . 3 5 . 7 . 5 7 8 9 8 7 5 4 2'] } }),
    // No-Muertos: lento, gótico, campanas de caja de música
    nomuertos: mk({
      bpm: 78, tonic: 45, scale: 'min', prog: [0, 5, 3, 4], dv: 0.8,
      pad: { wave: 'sawtooth', vol: 0.28, lp: 700, att: 0.5 },
      bass: { wave: 'triangle', vol: 0.8, oct: 0, seq: 'r - - - - - - - o . . . r . . .' },
      drums: { k: 'x.......x.x.....', t: '........x.......' },
      lead: { wave: 'sine', bell: true, vol: 0.3, gate: 1.5, min: 1.2, oct: 14, up: 0, seq: [
        '4 . . . 2 . . . 0 . . . 2 . . .',
        '5 . . . 7 . . . 5 . . . 4 . . .',
        '7 . . . 5 . . . 3 . . . 5 . . .',
        '8 . . . 6 . . . 4 . . . 6 . 7 .'] } }),
    // Streamers: pop de directo, bombo a negro y palmas
    streamers: mk({
      bpm: 124, tonic: 50, scale: 'maj', prog: [0, 4, 5, 3], dv: 1,
      pad: { wave: 'sawtooth', vol: 0.15, lp: 2200, att: 0.05 },
      bass: { wave: 'sawtooth', vol: 0.45, lp: 600, seq: '. . r . . . r . . . r . . . r .' },
      drums: { k: 'x...x...x...x...', c: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
      arp: { wave: 'square', vol: 0.1, lp: 3000, oct: 0, gate: 0.5, seq: '0 1 2 3 2 1 2 3 0 1 2 3 2 1 2 1' },
      lead: { wave: 'sawtooth', vol: 0.19, det: 9, lp: 3500, gate: 0.8, oct: 7, up: 0, seq: [
        '2 . 4 . 7 - - . 4 . 2 . 4 - . .',
        '6 . 4 . 6 . 8 - . . 6 . 4 . 2 .',
        '5 . 7 . 9 - - . 7 . 5 . 7 - . .',
        '5 . 7 . 10 - - . 9 . 7 . 5 . 3 .'] } }),
    // Héroes: fanfarria épica, marcha y trompetas
    heroes: mk({
      bpm: 100, tonic: 48, scale: 'maj', prog: [0, 3, 4, 0], dv: 1, crash: true,
      pad: { wave: 'sawtooth', vol: 0.2, lp: 1400, att: 0.25 },
      bass: { wave: 'triangle', vol: 0.7, seq: 'r . . r . . r . r . . r . . . .' },
      drums: { k: 'x.....x.x.......', s: '....x.......x.x.', t: '..............x.' },
      lead: { wave: 'sawtooth', vol: 0.22, det: 7, lp: 3000, att: 0.03, gate: 0.95, oct: 7, up: 0, seq: [
        '0 - . 0 . 4 - - 7 - - - 4 - . .',
        '3 - . 3 . 7 - - 10 - - - 7 - . .',
        '4 - . 4 . 8 - - 11 - - - 8 - 6 .',
        '7 - - - 4 - 7 - 9 - 8 - 7 - - -'] } }),
    // Ciberpunks: synthwave, bajo pulsante y arpegio
    ciber: mk({
      bpm: 112, tonic: 45, scale: 'min', prog: [0, 0, 6, 5], dv: 1,
      pad: { wave: 'sawtooth', vol: 0.13, lp: 900, att: 0.3 },
      bass: { wave: 'sawtooth', vol: 0.5, lp: 500, oct: 0, seq: 'r r . r r . r . r r . r r . o .' },
      drums: { k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
      arp: { wave: 'square', vol: 0.1, lp: 2500, oct: 7, gate: 0.4, seq: '0 1 2 3 0 1 2 3 0 1 2 3 0 1 2 3' },
      lead: { wave: 'sawtooth', vol: 0.17, det: 10, lp: 2200, gate: 0.95, oct: 14, up: 0, seq: [
        '4 - - . 2 . 0 . 2 - - - . . . .',
        '4 - - . 7 - 6 - 4 - . . . . . .',
        '6 - - . 4 . 3 . 4 - - - . . 1 .',
        '5 - - . 7 - 9 - 7 - 5 - 4 - . .'] } }),
    // Memes: rápido, raro y con notas al azar (RNG)
    memes: mk({
      bpm: 140, tonic: 55, scale: 'maj', prog: [0, 3, 4, 3], swing: 0.05, dv: 1,
      pad: { wave: 'square', vol: 0.12, lp: 1500, att: 0.05 },
      bass: { wave: 'square', vol: 0.4, lp: 900, seq: 'r . r . o . r . r . r . o . f .' },
      drums: { k: 'x..x..x...x.x...', s: '....x.......x..x', h: 'x.x.x.x.x.x.x.x.' },
      lead: { wave: 'square', vol: 0.19, lp: 3500, gate: 0.6, oct: 7, up: 7, seq: [
        '4 . 4 . ? . 7 - . ? . 4 . ? . 2',
        '3 . 3 . ? . 5 - . ? . 3 . ? . 7',
        '4 . 4 . ? . 6 - . ? . 4 . ? . 8',
        '3 . ? . 5 . ? . 7 . ? . 5 . ? .'] } }),
    // Jefes (y CEO de Microblizz): amenaza corporativa
    boss: mk({
      bpm: 150, tonic: 40, scale: 'phr', prog: [0, 1, 0, 6], dv: 1, crash: true,
      pad: { wave: 'sawtooth', vol: 0.18, lp: 800, att: 0.1 },
      bass: { wave: 'sawtooth', vol: 0.45, lp: 700, oct: 0, seq: 'r r . r r . r r . r r . r . r r' },
      drums: { k: 'x.x.x.x.x.xxx.x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
      lead: { wave: 'sawtooth', vol: 0.21, det: 12, lp: 2800, gate: 0.85, oct: 14, up: 0, seq: [
        '0 . 0 . 1 - 0 . . . 3 - 1 . 0 .',
        '1 . 1 . 2 - 1 . . . 4 - 2 . 1 .',
        '0 . 0 . 1 - 0 . . . 5 - 3 . 1 .',
        '6 . 6 . 5 - 6 . . . 4 - 3 - 2 .'] } }),
    // ---- un tema por jefe de mundo (v0.9.8) ----
    // Mundo 1, SurvivalBot: robot corporativo con tecleo de oficina
    boss0: mk({
      bpm: 128, tonic: 45, scale: 'min', prog: [0, 5, 6, 4], dv: 1, crash: true,
      pad: { wave: 'square', vol: 0.12, lp: 900, att: 0.05 },
      bass: { wave: 'square', vol: 0.4, lp: 600, oct: 0, seq: 'r . r . r . r . r . r . o . r .' },
      drums: { k: 'x...x...x...x...', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx' },
      lead: { wave: 'square', vol: 0.17, gate: 0.5, lp: 3000, oct: 14, up: 0, seq: [
        '0 . 2 . 4 . 2 . 0 . 4 . 7 . 4 .',
        '5 . 7 . 9 . 7 . 5 . 9 . 12 . 9 .',
        '6 . 8 . 10 . 8 . 6 . 10 . 13 . 10 .',
        '4 . 6 . 8 . 6 . 4 . 8 . 11 . 7 -'] } }),
    // Mundo 2, NecroLord corrupto: órgano de catedral en menor armónica
    boss1: mk({
      bpm: 96, tonic: 50, scale: 'hmin', prog: [0, 5, 3, 4], dv: 1, crash: true,
      pad: { wave: 'square', vol: 0.2, lp: 1300, att: 0.04 },
      bass: { wave: 'sawtooth', vol: 0.5, lp: 500, seq: 'r - - - r - - - r - - - o - r -' },
      drums: { k: 'x.......x.......', t: '....x.......x.x.' },
      lead: { wave: 'square', vol: 0.16, det: 5, lp: 2200, gate: 0.95, oct: 7, up: 0, seq: [
        '7 - - - 6 - 7 - 9 - - - 7 - 4 -',
        '5 - - - 7 - 9 - 12 - - - 9 - 7 -',
        '3 - - - 5 - 7 - 10 - - - 8 - 7 -',
        '4 - - - 6 - 8 - 11 - - - 10 - 8 -'] } }),
    // Mundo 3, StreamKing corrupto: EDM de directo patrocinado con fallos (notas al azar)
    boss2: mk({
      bpm: 128, tonic: 47, scale: 'min', prog: [0, 5, 2, 6], dv: 1, crash: true,
      pad: { wave: 'sawtooth', vol: 0.14, lp: 1800, att: 0.02 },
      bass: { wave: 'sawtooth', vol: 0.45, lp: 700, oct: 0, seq: '. . r . . . r . . . r . . . r r' },
      drums: { k: 'x...x...x...x...', c: '....x.......x...', h: '......x.......x.', o: '..x.......x.....' },
      arp: { wave: 'square', vol: 0.09, lp: 3200, oct: 7, gate: 0.4, seq: '0 2 1 3 0 2 1 3 0 2 1 3 2 1 0 1' },
      lead: { wave: 'sawtooth', vol: 0.18, det: 14, lp: 3200, gate: 0.7, oct: 14, up: 0, seq: [
        '0 . 0 . 2 . 4 . ? . 4 . 2 . 0 .',
        '0 . 0 . 2 . 4 . ? . 5 . 4 . 2 .',
        '2 . 2 . 4 . 6 . ? . 7 . 6 . 4 .',
        '6 . 6 . 8 . 9 . ? ? ? ? 8 . 6 .'] } }),
    // Mundo 4, EpicChampion corrupto: épica de guerra en menor, tambores y metales
    boss3: mk({
      bpm: 112, tonic: 50, scale: 'min', prog: [0, 5, 6, 0], dv: 1, crash: true,
      pad: { wave: 'sawtooth', vol: 0.22, lp: 1200, att: 0.2 },
      bass: { wave: 'triangle', vol: 0.75, seq: 'r . . r . . r . r . . r . . r .' },
      drums: { k: 'x..x..x.x..x..x.', t: '....x.......x.xx', s: '............x...' },
      lead: { wave: 'sawtooth', vol: 0.21, det: 8, lp: 2600, att: 0.03, gate: 0.95, oct: 7, up: 0, seq: [
        '0 - - . 0 . 2 - 4 - - - 2 - 0 -',
        '5 - - . 5 . 4 - 2 - - - 4 - 5 -',
        '6 - - . 6 . 8 - 9 - - - 8 - 6 -',
        '7 - - - 4 - 7 - 9 - 7 - 4 - - -'] } }),
    // Mundo 5, CyberMarine corrupto: darksynth industrial
    boss4: mk({
      bpm: 118, tonic: 45, scale: 'phr', prog: [0, 0, 1, 6], dv: 1, crash: true,
      pad: { wave: 'sawtooth', vol: 0.15, lp: 900, att: 0.1 },
      bass: { wave: 'sawtooth', vol: 0.5, lp: 600, oct: 0, seq: 'r r r r r r r r r r r r o o r r' },
      drums: { k: 'x...x...x...x...', s: '....x.......x...', c: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
      arp: { wave: 'square', vol: 0.08, lp: 2400, oct: 7, gate: 0.35, seq: '0 1 2 3 2 1 0 1 0 1 2 3 2 1 0 3' },
      lead: { wave: 'sawtooth', vol: 0.17, det: 12, lp: 2000, gate: 0.95, oct: 14, up: 0, seq: [
        '0 - - - . . 1 - 0 - - - . . . .',
        '0 - - - . . 3 - 1 - - - . . . .',
        '1 - - - . . 3 - 4 - - - 3 - 1 -',
        '6 - - - 5 - 4 - 3 - 1 - 0 - - -'] } }),
    // Mundo 6, MemeLord corrupto: caos en escala de tonos enteros, con notas al azar
    boss5: mk({
      bpm: 156, tonic: 52, scale: 'wt', prog: [0, 1, 0, 2], swing: 0.12, dv: 1, crash: true,
      pad: { wave: 'square', vol: 0.12, lp: 1400, att: 0.05 },
      bass: { wave: 'square', vol: 0.4, lp: 800, seq: 'r . o . r . o . r o . r . o r .' },
      drums: { k: 'x..x..x.x..x.x..', s: '....x..x....x...', h: 'x.x.x.x.x.x.x.x.' },
      lead: { wave: 'square', vol: 0.18, lp: 3600, gate: 0.6, oct: 6, up: 6, seq: [
        '0 . 2 . 4 . ? . 6 . ? . 4 . 2 .',
        '1 . 3 . 5 . ? . 7 . ? . 5 . 3 .',
        '0 . 2 . 4 . ? ? ? ? 8 . 6 . 4 .',
        '2 . 4 . 6 . 8 - - . ? . ? . ? .'] } }),
    // Mundo 7 y Modo Jefe, el CEO: la música de espera del menú… en versión malvada
    boss6: mk({
      bpm: 138, tonic: 53, scale: 'hmin', prog: [0, 5, 1, 4], seven: true, dv: 1, crash: true,
      pad: { wave: 'sawtooth', vol: 0.2, lp: 1100, att: 0.08 },
      bass: { wave: 'sawtooth', vol: 0.5, lp: 650, seq: 'r . r r . r r . r . r r . r o .' },
      drums: { k: 'x.x.x.x.x.xxx.x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
      lead: { wave: 'sawtooth', vol: 0.21, det: 10, lp: 2600, gate: 0.9, oct: 7, up: 7, seq: [
        '4 . . . 2 . 4 . 6 . . . 4 . . .',
        '5 . . . 4 . 2 . 4 . . . 2 . . .',
        '3 . . . 4 . 5 . 4 . 3 . 1 . . .',
        '4 . . . 6 . 5 . 3 . . . 4 . . .'] } }),
    // ---- v0.9.13: facciones nuevas
    // Comunidad Gamer: chiptune con ritmo de torneo
    gamer: mk({
      bpm: 136, tonic: 50, scale: 'min', prog: [0, 5, 2, 6], dv: 1,
      pad: { wave: 'sawtooth', vol: 0.12, lp: 1600, att: 0.03 },
      bass: { wave: 'square', vol: 0.4, lp: 800, seq: 'r . r r . r . r r . r . o . r .' },
      drums: { k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '......x.......x.' },
      arp: { wave: 'square', vol: 0.08, lp: 3400, oct: 7, gate: 0.4, seq: '0 1 2 3 2 1 0 1 0 1 2 3 2 1 0 2' },
      lead: { wave: 'square', vol: 0.17, lp: 3600, gate: 0.7, oct: 14, up: 0, seq: [
        '0 . 2 . 4 . 2 . 0 . 4 . 7 - . .',
        '5 . 4 . 2 . 0 . 2 . 4 . 5 - . .',
        '2 . 4 . 5 . 4 . 2 . 5 . 9 - . .',
        '6 . 5 . 4 . 2 . 1 . 2 . 4 - 6 .'] } }),
    // Olvidados: 8 bits nostálgicos, como un juego que nunca salió
    olvidados: mk({
      bpm: 112, tonic: 52, scale: 'maj', prog: [0, 4, 5, 3], swing: 0.08, dv: 0.9,
      pad: { wave: 'triangle', vol: 0.16, lp: 1200, att: 0.08 },
      bass: { wave: 'triangle', vol: 0.5, seq: 'r . . r . . r . r . . r . . o .' },
      drums: { k: 'x.......x.......', s: '....x.......x...', h: '..x...x...x...x.' },
      arp: { wave: 'square', vol: 0.06, lp: 2400, oct: 7, gate: 0.5, seq: '0 1 2 1 0 1 2 3 0 1 2 1 0 1 2 3' },
      lead: { wave: 'square', vol: 0.15, lp: 2600, gate: 0.85, oct: 7, up: 7, seq: [
        '4 - - . 2 . 4 . 7 - - . 6 - 4 .',
        '4 - - . 1 . 4 . 6 - - . 4 - 1 .',
        '5 - - . 4 . 2 . 4 - - . 2 - 0 .',
        '3 - - . 4 . 5 . 6 - - - 4 - - .'] } }),
    // Cultura Pop: fanfarria de película taquillera
    pop: mk({
      bpm: 120, tonic: 48, scale: 'maj', prog: [0, 5, 3, 4], dv: 1, crash: true,
      pad: { wave: 'sawtooth', vol: 0.18, lp: 1400, att: 0.06 },
      bass: { wave: 'sawtooth', vol: 0.42, lp: 700, seq: 'r . . r r . . . r . . r r . o .' },
      drums: { k: 'x.....x.x.......', s: '....x.......x..x', t: '..............x.', h: 'x.x.x.x.x.x.x.x.' },
      lead: { wave: 'sawtooth', vol: 0.2, det: 8, lp: 3000, gate: 0.9, oct: 7, up: 0, seq: [
        '4 - - 4 7 - - - 9 - 7 - 4 - - -',
        '5 - - 5 7 - - - 9 - 11 - 12 - - -',
        '10 - - 9 7 - - - 5 - 7 - 9 - - -',
        '11 - - - 9 - 7 - 8 - - - 11 - - -'] } }),
    // Mundo 8, VikingoPerdido corrupto: marcha vikinga con tambores de guerra
    boss7: mk({
      bpm: 104, tonic: 45, scale: 'min', prog: [0, 6, 5, 6], dv: 1, crash: true,
      pad: { wave: 'sawtooth', vol: 0.18, lp: 900, att: 0.1 },
      bass: { wave: 'square', vol: 0.45, lp: 600, oct: 0, seq: 'r . r . r . r . r . r . r r r .' },
      drums: { k: 'x...x...x...x.x.', t: '..x...x...x.xx..', s: '....x.......x...' },
      lead: { wave: 'square', vol: 0.18, det: 6, lp: 2400, gate: 0.85, oct: 7, up: 0, seq: [
        '0 - - 2 3 - 2 - 0 - - - 4 - 3 -',
        '6 - - 5 4 - 3 - 4 - - - 2 - - -',
        '5 - - 4 3 - 2 - 3 - - - 5 - 7 -',
        '6 - - - 4 - - - 6 - 5 - 4 - - -'] } }),
    // Mundo 9, PayStation sin lector: música de tienda de consolas, pero fría y amenazante
    boss8: mk({
      bpm: 132, tonic: 47, scale: 'hmin', prog: [0, 5, 3, 4], dv: 1, crash: true,
      pad: { wave: 'sawtooth', vol: 0.14, lp: 1300, att: 0.04 },
      bass: { wave: 'sawtooth', vol: 0.45, lp: 650, oct: 0, seq: 'r . r . . r . r r . r . . r o .' },
      drums: { k: 'x...x...x...x...', c: '....x.......x...', h: 'x.xxx.xxx.xxx.xx' },
      arp: { wave: 'triangle', vol: 0.09, lp: 3200, oct: 7, gate: 0.5, seq: '0 2 1 3 0 2 1 3 0 2 1 3 3 2 1 0' },
      lead: { wave: 'sawtooth', vol: 0.19, det: 12, lp: 2800, gate: 0.8, oct: 14, up: 0, seq: [
        '0 . . 0 . . 2 . 4 . . 4 . . 2 .',
        '5 . . 5 . . 4 . 2 . . 2 . . 4 .',
        '3 . . 3 . . 2 . 0 . . 0 . . 2 .',
        '4 . . 6 . . 7 - - . 6 . 4 . 2 .'] } }),
    // Mundo 10, ProGamer corrupto: electrónica de final de torneo
    boss9: mk({
      bpm: 150, tonic: 49, scale: 'min', prog: [0, 0, 5, 6], dv: 1, crash: true,
      pad: { wave: 'sawtooth', vol: 0.14, lp: 1800, att: 0.02 },
      bass: { wave: 'sawtooth', vol: 0.45, lp: 750, oct: 0, seq: '. r . r . r . r . r . r . r r r' },
      drums: { k: 'x...x...x...x...', s: '....x.......x...', h: '.x.x.x.x.x.x.x.x', o: '..............x.' },
      arp: { wave: 'square', vol: 0.08, lp: 3600, oct: 14, gate: 0.35, seq: '0 1 2 3 0 1 2 3 0 1 2 3 3 2 1 0' },
      lead: { wave: 'square', vol: 0.17, det: 8, lp: 3400, gate: 0.6, oct: 14, up: 0, seq: [
        '0 . 0 . 3 . 0 . 4 . 3 . 2 . 0 .',
        '0 . 0 . 3 . 0 . 6 . 5 . 4 . 2 .',
        '5 . 5 . 7 . 5 . 9 . 7 . 5 . 4 .',
        '6 . 6 . 8 . 6 . 10 - - . 9 . 8 .'] } }),
    // Mundo 11, LaDirectora corrupta: tráiler dramático en menor armónica
    boss10: mk({
      bpm: 92, tonic: 41, scale: 'hmin', prog: [0, 5, 3, 4], seven: true, dv: 1, crash: true,
      pad: { wave: 'sawtooth', vol: 0.2, lp: 1000, att: 0.15 },
      bass: { wave: 'sawtooth', vol: 0.5, lp: 520, seq: 'r - - - . . r . r - - - . . o .' },
      drums: { k: 'x.......x.x.....', t: '....x.......x.xx', s: '............x...' },
      lead: { wave: 'sawtooth', vol: 0.2, det: 10, lp: 2400, gate: 0.95, oct: 7, up: 7, seq: [
        '4 - - - 3 - 4 - 6 - - - 4 - - -',
        '5 - - - 4 - 2 - 4 - - - 2 - - -',
        '3 - - - 2 - 3 - 5 - - - 3 - - -',
        '4 - - - 6 - 7 - 6 - - - 4 - - -'] } }),
    // Mundo 12, el Presidente de Phony: el sonido de arranque de una consola… en versión malvada
    boss11: mk({
      bpm: 144, tonic: 46, scale: 'phr', prog: [0, 1, 0, 5], seven: true, dv: 1, crash: true,
      pad: { wave: 'sawtooth', vol: 0.2, lp: 900, att: 0.06 },
      bass: { wave: 'sawtooth', vol: 0.5, lp: 650, oct: 0, seq: 'r r . r r . r . r r . r . r o .' },
      drums: { k: 'x.x.x.x.x.xxx.x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
      arp: { wave: 'triangle', vol: 0.08, lp: 3000, oct: 14, gate: 0.4, seq: '3 2 1 0 3 2 1 0 3 2 1 0 2 1 0 1' },
      lead: { wave: 'sawtooth', vol: 0.21, det: 12, lp: 2700, gate: 0.85, oct: 7, up: 7, seq: [
        '0 . 1 . 0 . 4 - - . 3 . 1 . 0 .',
        '1 . 2 . 1 . 5 - - . 4 . 2 . 1 .',
        '0 . 1 . 3 . 4 - - . 6 . 7 - - .',
        '5 . 4 . 3 . 1 - - . 0 . 1 . 0 .'] } }),
    // jingles de final de partida (suenan una vez y vuelve el menú)
    win: mk({
      bpm: 132, tonic: 48, scale: 'maj', prog: [0, 3, 0], dv: 1, once: true, next: 'menu',
      pad: { wave: 'sawtooth', vol: 0.18, lp: 2500, att: 0.04 },
      bass: { wave: 'triangle', vol: 0.6, seq: 'r . . . . . . . r . . . . . . .' },
      drums: { k: 'x...x...x...x...', s: '..x...x...x.x.xx' },
      lead: { wave: 'square', vol: 0.22, det: 6, lp: 4000, gate: 0.9, oct: 7, up: 0, seq: [
        '0 . 2 . 4 . 7 - - - . . 4 . 7 .',
        '3 . 5 . 7 . 10 - - - . . 7 . 10 .',
        '7 - - - 4 - 7 - 9 - - - 11 - - -'] } }),
    lose: mk({
      bpm: 76, tonic: 45, scale: 'min', prog: [0, 0], dv: 1, once: true, next: 'menu',
      pad: { wave: 'sawtooth', vol: 0.18, lp: 600, att: 0.2 },
      bass: { wave: 'triangle', vol: 0.6, oct: 0, seq: 'r - - - - - - - - - - - - - - -' },
      drums: { k: 'x...............' },
      lead: { wave: 'sawtooth', vol: 0.2, lp: 1200, gate: 0.95, oct: 7, up: 0, seq: [
        '4 - - - 3 - - - 2 - - - 1 - - -',
        '0 - - - - - - - - - - - - - - -'] } }),
  };
  return T;
})();

