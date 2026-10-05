// Fans Of · Efectos de sonido sintetizados, comunes a todos los juegos. La música va aparte, en music.js.
'use strict';
/* =========================================================
   SONIDO (sintetizado, como en el original)
   ========================================================= */
let AC = null;
function sfx(k) {
  if (SAVE.muted) return;
  if (typeof sfxSilent === 'function' && sfxSilent()) return;   // cada juego puede callar los efectos cuando le convenga
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  if (AC.state === 'suspended') AC.resume();
  const S = { shot: [880, 660, 0.05, 'square', 0.03], hit: [300, 160, 0.07, 'square', 0.05], crit: [520, 900, 0.12, 'sawtooth', 0.06], lob: [300, 520, 0.12, 'triangle', 0.05], boom: [140, 40, 0.3, 'sawtooth', 0.09],
    stomp: [90, 40, 0.22, 'square', 0.08], pop: [600, 900, 0.06, 'triangle', 0.04], coin: [990, 1320, 0.12, 'square', 0.05], place: [220, 440, 0.12, 'triangle', 0.08], up: [440, 880, 0.25, 'triangle', 0.08],
    leak: [220, 110, 0.35, 'sawtooth', 0.09], horn: [196, 262, 0.45, 'sawtooth', 0.07], jump: [300, 1000, 0.3, 'triangle', 0.07], zap: [1200, 300, 0.12, 'sawtooth', 0.05], womp: [200, 80, 0.4, 'square', 0.08], boss: [110, 70, 0.8, 'sawtooth', 0.1], win: [523, 1046, 0.6, 'triangle', 0.1] }[k];
  if (!S) return; const [f0, f1, d, type, vol] = S, t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d);
  const v = vol * (SAVE.vol == null ? 1 : SAVE.vol); if (v <= 0) return;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + 0.02);
}
