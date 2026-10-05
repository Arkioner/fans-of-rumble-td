// Fans of Rumble · iconos de las pasivas, estrella y frases del final de partida: copiados sin cambios de js/08-controles.js y js/09-menus.js del original
'use strict';
const FLAME_SVG = '<svg viewBox="0 0 16 20" aria-hidden="true"><path d="M8 1c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 3-6 0 2 1 3 2 3 0-3-1-5 1-8z" fill="#ffcb3d" style="stroke: var(--outline)" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 10c1 2 3 3 3 5a3 3 0 0 1-6 0c0-1 1-2 1.5-3 .5 1 1 1.5 1.5 1.5 0-1.5-.5-2.5 0-3.5z" fill="#ff5a2a"/></svg>';
const SOUL_SVG = '<svg viewBox="0 0 16 20" aria-hidden="true"><path d="M2 18V8a6 6 0 0 1 12 0v10l-2.5-2-2 2-1.5-2-1.5 2-2-2z" fill="#c8ffe9" style="stroke: var(--outline)" stroke-width="1.5" stroke-linejoin="round"/><circle cx="6" cy="9" r="1.4" fill="#20102c"/><circle cx="10" cy="9" r="1.4" fill="#20102c"/></svg>';
const ICONS = {
  flame: FLAME_SVG, soul: SOUL_SVG,
  chat: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 4v-4H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="#f5f3ff" style="stroke: var(--outline)" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 12.4c-3-2-4.4-3.4-4.4-4.8 0-1.3 1-2.1 2.1-2.1.9 0 1.6.5 2.3 1.3.7-.8 1.4-1.3 2.3-1.3 1.1 0 2.1.8 2.1 2.1 0 1.4-1.4 2.8-4.4 4.8z" fill="#c026d3"/></svg>',
  star: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.9z" fill="#ffe07a" style="stroke: var(--outline)" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  shield: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.5l7 2.6v5.2c0 4.4-3 7.6-7 9.2-4-1.6-7-4.8-7-9.2V4.1z" fill="#8ef6ff" style="stroke: var(--outline)" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 5v9M6.5 8.5h7" stroke="#0e6f8f" stroke-width="2" stroke-linecap="round"/></svg>',
  dice: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="2" width="16" height="16" rx="4" fill="#fff" style="stroke: var(--outline)" stroke-width="1.5"/><circle cx="6.5" cy="6.5" r="1.6" fill="#20102c"/><circle cx="13.5" cy="13.5" r="1.6" fill="#20102c"/><circle cx="10" cy="10" r="1.6" fill="#20102c"/><circle cx="13.5" cy="6.5" r="1.6" fill="#20102c"/><circle cx="6.5" cy="13.5" r="1.6" fill="#20102c"/></svg>',
  box: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 7l8-4 8 4v8l-8 4-8-4z" fill="#e8c48a" style="stroke: var(--outline)" stroke-width="1.5" stroke-linejoin="round"/><path d="M2 7l8 4 8-4M10 11v8" fill="none" stroke="#8a6a3a" stroke-width="1.4"/><path d="M6 5l8 4" stroke="#8a6a3a" stroke-width="1.2"/></svg>',
  clap: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="8" width="16" height="10" rx="1.5" fill="#2b2d3a" style="stroke: var(--outline)" stroke-width="1.5"/><path d="M2 8l1-5 15 0-1 5z" fill="#fff" style="stroke: var(--outline)" stroke-width="1.5" stroke-linejoin="round"/><path d="M5 3l2 5M10 3l2 5M15 3l1.5 5" stroke="#20102c" stroke-width="1.6"/><path d="M5 12h10M5 15h7" stroke="#ff6b9a" stroke-width="1.4"/></svg>',
  pad: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5h10a4 4 0 0 1 4 4.5l-.5 4a2.5 2.5 0 0 1-4.3 1.4L12.5 13h-5l-1.7 1.9A2.5 2.5 0 0 1 1.5 13.5l-.5-4A4 4 0 0 1 5 5z" fill="#d1fae5" style="stroke: var(--outline)" stroke-width="1.5" stroke-linejoin="round"/><path d="M5.5 7.6v3.2M3.9 9.2h3.2" stroke="#20102c" stroke-width="1.5" stroke-linecap="round"/><circle cx="13.6" cy="8.4" r="1.2" fill="#16a34a"/><circle cx="15.6" cy="10.4" r="1.2" fill="#ff3348"/></svg>',
};
const STAR_SVG = '<svg viewBox="0 0 24 22"><path d="M12 1.5l3.1 6.4 7 1-5.1 4.9 1.2 7L12 17.5l-6.2 3.3 1.2-7L1.9 8.9l7-1z" fill="currentColor" style="stroke: var(--outline)" stroke-width="1.8" stroke-linejoin="round"/></svg>';
const QUOTES = {
  p: ['Microblizz anuncia que cerrará otro juego para recuperar el dinero.', 'SurvivalBot ha sido cancelado. Otra vez.', 'Microblizz promete arreglar su robot… dentro de diez años.'],
  e: ['Microblizz ha cerrado tu facción. Tus cosas están en esa caja.', 'Microblizz te da las gracias por tu dinero.', 'Error 37: no se pudo conectar con la victoria.'],
  d: ['Empate. Microblizz dirá que ha ganado.'],
};
const QUOTES_PH = {
  p: ['Phony anuncia que subirá la suscripción para compensar la derrota.', 'La PayStation ha sido devuelta. Sin ticket.', 'Phony promete volver a poner lector de discos… en la PayStation 7.'],
  e: ['Phony te ha quitado la licencia de la victoria.', 'Phony te da las gracias por tu suscripción.', 'Error de conexión: no se pudo cargar la victoria.'],
  d: ['Empate. Phony te cobrará la revancha.'],
};
