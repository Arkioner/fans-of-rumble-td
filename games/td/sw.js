// Fans of TD · modo sin conexión (igual que en el original)
// El juego (su carpeta y lo común de core/) se pide primero a internet para tener siempre la última versión;
// si no hay conexión, se usa la copia guardada. Iconos y letras se guardan la primera vez.
// La versión llega en la dirección con la que se registra (sw.js?v=…), así que no hay que tocar este archivo al publicar.
const CACHE = 'fortd-v' + (new URL(self.location).searchParams.get('v') || '0');
const CORE = ['./', './index.html', './manifest.webmanifest', '../../core/img/icon-192.png', '../../core/img/icon-512.png', '../../core/img/icon-maskable.png',
  '../../core/css/base.css', '../../core/css/menus.css', '../../core/js/audio.js', '../../core/js/idle.js', '../../core/js/menus.js', '../../core/js/meta.js', '../../core/js/music.js', '../../core/js/save.js', '../../core/js/utils.js', '../../core/js/vendor/01-config.js', '../../core/js/vendor/02-chat.js', '../../core/js/vendor/03-arte.js', '../../core/js/vendor/05-musica.js', '../../core/js/vendor/08-textos.js', './css/td.css', './js/data.js', './js/extras.js', './js/game.js', './js/pantallas.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const page = req.mode === 'navigate' || (url.origin === location.origin && (url.pathname.endsWith('/') || /\.(html|js|css)$/.test(url.pathname)));
  if (page) {
    // los scripts y estilos llevan ?v=versión: sin conexión vale la copia guardada aunque el número no coincida
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(m => m || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(m => m || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
