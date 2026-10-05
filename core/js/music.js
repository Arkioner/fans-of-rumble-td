// Fans of Rumble TD · Música: el mismo motor y las mismas canciones del original (vendor/05-musica.js), con un ajuste:
// cuando la canción ya ha sonado entera una vez, en vez de volver a empezar igual sigue subiendo de tono para siempre
// con la paradoja de Shepard, así que no se nota el momento en que se repite.
'use strict';
/* =========================================================
   PARADOJA DE SHEPARD
   Cada nota suena en dos octavas a la vez. Según sube el tono, la de arriba se va apagando y la de abajo va entrando.
   Al subir una octava entera, la de abajo está justo donde empezó la de arriba: el oído cree que la música no ha
   dejado de subir, pero en realidad está en el mismo sitio.
   ========================================================= */
const SHEP = {
  startLoop: 8,          // las 8 primeras vueltas (32 compases) suenan exactamente como en el original
  barsPerSemitone: 4,    // después sube un semitono cada 4 compases, repartido poco a poco entre ellos
};
const MUS_VOL = 0.3;     // volumen de la música respecto a los efectos

const M = { name: null, trk: null, out: null, bus: null, lp: null, step: 0, bar: 0, next: 0, tm: 1, tmT: 1, want: undefined, duck: false, timer: null, shx: 0 };
let noiseBuf = null;
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
function degMidi(T, d) { const n = T.sc.length, o = Math.floor(d / n); return T.tonic + T.sc[d - o * n] + 12 * o; }
function musicInit() {
  M.bus = AC.createGain(); M.bus.gain.value = MUS_VOL; M.lp = AC.createBiquadFilter(); M.lp.type = 'lowpass'; M.lp.frequency.value = 18000;
  M.bus.connect(M.lp);
  try { const comp = AC.createDynamicsCompressor(); comp.threshold.value = -12; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.18; M.lp.connect(comp); comp.connect(AC.destination); } catch (e) { M.lp.connect(AC.destination); }
  noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
function mnote(out, f, t, dur, type, vol, o = {}) {
  const osc = AC.createOscillator(), g = AC.createGain(); osc.type = type; osc.frequency.value = f;
  const a = o.att || 0.01, r = o.rel || 0.08, tEnd = t + dur, tA = Math.min(t + a, tEnd);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, tA);
  if (o.dec) { const tD = Math.min(tA + o.dec, tEnd); if (tD > tA) g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * Math.pow(o.sus == null ? 0.3 : o.sus, (tD - tA) / o.dec)), tD); }
  g.gain.exponentialRampToValueAtTime(0.0001, tEnd + r);
  let node = osc;
  if (o.lp) { const fl = AC.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; osc.connect(fl); node = fl; }
  node.connect(g); g.connect(out);
  osc.start(t); osc.stop(tEnd + r + 0.05);
  if (o.det) { // segundo oscilador desafinado: sonido más grueso
    const o2 = AC.createOscillator(); o2.type = type; o2.frequency.value = f; o2.detune.value = o.det; let n2 = o2;
    if (o.lp) { const f2 = AC.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = o.lp; o2.connect(f2); n2 = f2; }
    n2.connect(g); o2.start(t); o2.stop(tEnd + r + 0.05);
  }
}
// una nota con la paradoja de Shepard: la misma nota y su octava de abajo, con el volumen repartido según lo que haya subido el tono
function snote(out, f, t, dur, type, vol, o) {
  const x = M.shx; if (x < 0.004) { mnote(out, f, t, dur, type, vol, o); return; }
  const up = Math.cos(x * Math.PI / 2), lo = Math.sin(x * Math.PI / 2);
  if (up > 0.03) mnote(out, f, t, dur, type, vol * up, o);
  if (lo > 0.03) mnote(out, f / 2, t, dur, type, vol * lo, o);
}
function mnoise(out, t, dur, vol, freq, type = 'bandpass') {
  const s = AC.createBufferSource(); s.buffer = noiseBuf; const f = AC.createBiquadFilter(); f.type = type; f.frequency.value = freq; const g = AC.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 0.08); s.stop(t + dur + 0.02);
}
const MDRUM = {
  k: (o, t, v) => { const os = AC.createOscillator(), g = AC.createGain(); os.type = 'sine'; os.frequency.setValueAtTime(165, t); os.frequency.exponentialRampToValueAtTime(48, t + 0.14);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.9 * v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); os.connect(g); g.connect(o); os.start(t); os.stop(t + 0.26); },
  s: (o, t, v) => { mnoise(o, t, 0.13, 0.5 * v, 1900); mnote(o, 190, t, 0.07, 'triangle', 0.3 * v, { rel: 0.05 }); },
  c: (o, t, v) => { [0, 0.012, 0.024].forEach(d => mnoise(o, t + d, 0.05, 0.3 * v, 1500)); mnoise(o, t + 0.036, 0.16, 0.35 * v, 1300); },
  h: (o, t, v) => mnoise(o, t, 0.04, 0.16 * v, 7500, 'highpass'),
  o: (o, t, v) => mnoise(o, t, 0.2, 0.16 * v, 7000, 'highpass'),
  t: (o, t, v) => { const os = AC.createOscillator(), g = AC.createGain(); os.type = 'sine'; os.frequency.setValueAtTime(190, t); os.frequency.exponentialRampToValueAtTime(95, t + 0.25);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.55 * v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); os.connect(g); g.connect(o); os.start(t); os.stop(t + 0.4); },
  X: (o, t, v) => mnoise(o, t, 0.9, 0.3 * v, 4500, 'highpass'),
};
// cuánto ha subido el tono en este compás: [semitonos de la nota de arriba, reparto entre las dos octavas (0 a 1)]
function shepardOf(T, bar, loop) {
  const orig = Math.floor(loop / 4) % 2 === 1 ? (T.mod == null ? 2 : T.mod) : 0;
  if (T.once || loop < SHEP.startLoop) return [orig, 0];                        // el principio, como en el original
  const base = Math.floor((SHEP.startLoop - 1) / 4) % 2 === 1 ? (T.mod == null ? 2 : T.mod) : 0;   // el tono en el que acaba el original
  const rise = (bar - SHEP.startLoop * T.prog.length) / SHEP.barsPerSemitone, r = ((rise % 12) + 12) % 12;
  return [base + r, r / 12];
}
// Como en el original, cada tema es una canción de 4 vueltas que se van alternando:
//   vuelta 0 = tema tal cual · 1 = más agudo y con segunda voz · 2 = pregunta y respuesta (la melodía se da la vuelta)
//   3 = respiro (melodía suelta, sin bombo al principio) y redoble para volver
function musicStep(T, out, step, bar, loop, t, sd) {
  const bi = bar % T.prog.length, d = T.prog[bi], song = !T.once, sec = song ? loop % 4 : 0, odd = song ? sec === 1 : loop % 2 === 1;
  const [mod, shx] = song ? shepardOf(T, bar, loop) : [0, 0], hz = deg => midiHz(degMidi(T, deg) + mod);
  M.shx = shx;
  const last = bi === T.prog.length - 1, n7 = T.sc.length, tones = [d, d + 2, d + 4, d + n7];
  if (step === 0) {
    if (T.pad) { const vs = T.seven ? [d, d + 2, d + 4, d + 6] : [d, d + 2, d + 4]; vs.forEach(x => snote(out, hz(x), t, sd * 16 * 0.98, T.pad.wave, T.pad.vol / vs.length * (sec === 3 ? 2 : 1.6), { att: T.pad.att, rel: 0.3, lp: T.pad.lp, det: 6 })); }
    if (T.crash && bi === 0) MDRUM.X(out, t, 1);
  }
  // bajo
  for (const ev of T.B) if (ev.s === step) {
    const sh = T.bass.oct == null ? -n7 : T.bass.oct, deg = ev.v === 'r' ? d + sh : ev.v === 'f' ? d + 4 + sh : ev.v === 'o' ? d + sh + n7 : d + sh - n7;
    snote(out, hz(deg), t, ev.n * sd * 0.92, T.bass.wave, T.bass.vol, { att: 0.012, rel: 0.06, lp: T.bass.lp });
  }
  // batería (en el respiro, los dos primeros compases sin bombo; en el último, redoble para volver)
  if (T.drums) {
    const dv = (T.dv || 1) * (M.rush ? 1.1 : 1), brk = sec === 3 && bi < 2;
    for (const k in T.drums) if (T.drums[k][step] === 'x' && !(brk && (k === 'k' || k === 's' || k === 'c'))) MDRUM[k](out, t, dv);
    if (M.rush && !T.drums.h && step % 2 === 0) MDRUM.h(out, t, dv);       // en la última oleada se añaden hi-hats
    if (M.rush && T.drums.h && step % 2 === 1 && step % 4 !== 3) MDRUM.h(out, t, dv * 0.7);
    if (song && sec === 3 && last && step >= 12 && T.drums.k) MDRUM.s(out, t, dv * (0.55 + (step - 12) * 0.15));
    if (song && sec === 3 && last && step === 14 && T.drums.k) MDRUM.s(out, t + sd / 2, dv * 0.8);
  }
  // arpegio
  if (T.A && T.A[step] !== '.') snote(out, hz(tones[+T.A[step]] + (T.arp.oct || 0)), t, sd * T.arp.gate, T.arp.wave, T.arp.vol, { att: 0.005, rel: 0.05, lp: T.arp.lp });
  // melodía
  const Ld = T.lead, resp = sec === 2 && bi % 2 === 1, src = T.L[(resp ? bi + 2 : bi) % T.L.length];
  for (const ev of src) if (ev.s === step) {
    if (sec === 3 && ev.s % 4 !== 0) continue;   // respiro: solo las notas fuertes
    let v = ev.v === '?' ? pick([0, 1, 2, 4, 5, 7, 8, 9]) : ev.v;
    if (resp) v = 8 - v;                          // respuesta: la frase de otro compás, dada la vuelta
    const deg = v + (Ld.oct || 0) + (odd ? (Ld.up || 0) : 0);
    const dur = Math.max(ev.n * sd * (Ld.gate || 0.9) * (sec === 3 ? 2 : 1), Ld.min || 0), f = hz(deg);
    if (Ld.bell) { snote(out, f, t, dur, 'sine', Ld.vol, { att: 0.004, rel: 0.4, dec: dur * 0.9, sus: 0.05 }); snote(out, f * 2.01, t, dur * 0.4, 'sine', Ld.vol * 0.3, { att: 0.002, rel: 0.2, dec: 0.2, sus: 0.05 }); }
    else snote(out, f, t, dur, Ld.wave, Ld.vol, { att: Ld.att || 0.012, rel: 0.07, lp: Ld.lp, det: Ld.det });
    if (sec === 1) snote(out, hz(deg + 2), t, dur, Ld.bell ? 'sine' : Ld.wave, Ld.vol * 0.38, { att: Ld.att || 0.012, rel: 0.07, lp: Ld.lp });   // segunda voz, una tercera por encima
  }
}
function musicSet(name, at) {
  if (!AC || !M.bus) return;
  const now = AC.currentTime, t0 = Math.max(now + 0.03, at || 0), old = M.out;
  if (old) { old.gain.setTargetAtTime(0, Math.max(now, at || now), 0.12); setTimeout(() => { try { old.disconnect(); } catch (e) { /* ya desconectado */ } }, Math.max(0, t0 - now) * 1000 + 2500); }
  M.name = name; M.trk = name ? TRACKS[name] : null; M.out = null;
  if (!M.trk) return;
  M.out = AC.createGain(); M.out.gain.setValueAtTime(0.0001, t0); M.out.gain.linearRampToValueAtTime(1, t0 + (M.trk.once ? 0.02 : 0.5)); M.out.connect(M.bus);
  M.step = 0; M.bar = 0; M.next = t0 + 0.02;
}
// programa las notas con un poco de antelación (así no se corta aunque el juego vaya justo)
function musicPump() {
  if (!AC || !M.trk) return;
  const T = M.trk, now = AC.currentTime;
  if (SAVE.muted || document.hidden) { M.next = Math.max(M.next, now + 0.05); return; }
  if (M.next < now - 0.1) M.next = now + 0.03;
  const limit = now + 0.3;
  while (M.next < limit && M.trk === T) {
    const sd = 60 / (T.bpm * M.tm) / 4, loop = Math.floor(M.bar / T.prog.length);
    M.rush = M.tmT > 1;
    musicStep(T, M.out, M.step, M.bar, loop, M.next + (M.step % 2 === 1 ? (T.swing || 0) * sd : 0), sd);
    M.next += sd; M.step++; M.tm += (M.tmT - M.tm) * 0.06;
    if (M.step >= 16) { M.step = 0; M.bar++; if (T.once && M.bar >= T.prog.length) { musicSet(T.next || null, M.next + 0.6); return; } }
  }
}
// decide qué suena según lo que pasa en el juego
function musicUpdate() {
  if (!AC) return;
  if (!M.bus) musicInit();
  const s = G.screen, L = G.level, lastWave = s === 'play' && !G.vs && L && G.wave >= G.waves && G.inWave;
  let want = SAVE.menuMus && TRACKS[SAVE.menuMus] ? SAVE.menuMus : 'menu';   // la del menú la eliges en Opciones
  if (s === 'play') want = G.over ? M.want : lastWave && L.boss ? (TRACKS['boss' + L.wi] ? 'boss' + L.wi : 'boss') : TRACKS[G.fac] ? G.fac : 'menu';   // tu raza; el jefe del mundo cuando sale
  else if (s === 'result') want = document.querySelector('#end-title').classList.contains('win') ? 'win' : 'lose';
  if (want !== M.want) { M.want = want; musicSet(want); }
  M.tmT = lastWave ? 1.18 : 1;                                // la última oleada va más rápida
  const duck = s === 'play' && G.paused;                      // en pausa suena apagada
  if (duck !== M.duck) { M.duck = duck; M.lp.frequency.setTargetAtTime(duck ? 600 : 18000, AC.currentTime, 0.08); }
  M.bus.gain.setTargetAtTime(SAVE.muted ? 0 : MUS_VOL * (SAVE.vol == null ? 1 : SAVE.vol) * (SAVE.mus == null ? 1 : SAVE.mus), AC.currentTime, 0.05);
}
// el navegador solo deja sonar después del primer toque
function musicWake() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { /* sin sonido */ } }
addEventListener('pointerdown', musicWake, true); addEventListener('keydown', musicWake, true);
setInterval(() => { try { musicUpdate(); musicPump(); } catch (e) { /* la música nunca debe parar el juego */ } }, 40);
