// El juego vivía antes en la raíz de esta web y dejó aquí su modo sin conexión. Ahora cada juego tiene el suyo en su carpeta
// (games/td/sw.js), así que este solo se borra a sí mismo y a sus copias guardadas para que nadie se quede con la versión vieja.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => self.registration.unregister()).then(() => self.clients.matchAll({ type: 'window' })).then(cs => cs.forEach(c => c.navigate(c.url))));
});
