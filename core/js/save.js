// Fans Of · Guardado: una sola partida guardada en el navegador, compartida por todos los juegos de esta web
// (oro, gemas, niveles de carta, inventario y opciones son los mismos en todos; cada juego añade sus propios campos).
'use strict';
const SAVE_KEY = 'fortd-save';
function loadSave() { try { const o = JSON.parse(localStorage.getItem(SAVE_KEY)); if (o && o.v === 1) return metaDefaults(o); } catch (e) { /* sin almacenamiento */ } return metaDefaults({ v: 1, stars: {}, muted: false }); }
let SAVE = loadSave();
function saveGame() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) { /* el progreso vive en memoria */ } }
