// Fans Of · Utilidades que el arte original necesita (copiadas de js/02-progresion.js de Fans of Rumble)
'use strict';
const OL = '#20102c';
const FONT_D = '"Luckiest Guy", "Arial Black", Impact, sans-serif';
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const pick = a => a[(Math.random() * a.length) | 0];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function rrPath(c, x, y, w, h, r) { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
// el original lo define en js/07-dibujo.js: luz suave sobre el fondo
function paintLight(x) {
  const v = x.createRadialGradient(W / 2, H * 0.47, H * 0.3, W / 2, H * 0.47, H * 0.7); v.addColorStop(0, 'rgba(20,6,36,0)'); v.addColorStop(1, 'rgba(20,6,36,.32)');
  x.fillStyle = v; x.fillRect(0, 0, W, H);
  const sl = x.createRadialGradient(70, 120, 0, 70, 120, 440); sl.addColorStop(0, 'rgba(255,238,200,.13)'); sl.addColorStop(1, 'rgba(255,238,200,0)');
  x.fillStyle = sl; x.fillRect(0, 0, W, H);
}
