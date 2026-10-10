/* ¡Diay! Santa Ana — service worker. Lo genera plantilla/generar.py. */
var VERSION = 'diay-20261009190250';
var PRECARGA = ["/", "/ediciones/", "/assets/boletin.css", "/assets/boletin.js", "/assets/logo-claro.png", "/assets/logo-oscuro.png", "/assets/icono-192.png", "/ediciones/2026-09/", "/ediciones/2026-09/portada.html", "/ediciones/2026-09/desde-el-concejo.html", "/ediciones/2026-09/desde-los-barrios.html", "/ediciones/2026-09/entrevista-del-mes.html", "/ediciones/2026-09/opinion.html", "/ediciones/2026-09/opinion-crimen-organizado.html", "/ediciones/2026-09/agenda.html", "/ediciones/2026-09/sabias-que.html"];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return Promise.all(PRECARGA.map(function (u) { return c.add(u).catch(function () {}); }));
  }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (claves) {
    return Promise.all(claves.filter(function (k) { return k !== VERSION; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* Primero la red; sin conexion, la copia. Solo lo del propio sitio. */
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(function (resp) {
    if (resp.ok) {
      var copia = resp.clone();
      caches.open(VERSION).then(function (c) { c.put(r, copia); });
    }
    return resp;
  }).catch(function () {
    return caches.match(r, { ignoreSearch: true }).then(function (guardada) {
      return guardada || (r.mode === 'navigate' ? caches.match('/') : undefined);
    });
  }));
});
