/* SmartTV+ service worker — caches the app shell only. Video streams, logos and the Cast SDK are never cached. */
const VERSION = 'smarttv-shell-v2';
const BASE = new URL(self.registration.scope).pathname; // e.g. /SmartTV/
const SHELL = [BASE, `${BASE}manifest.webmanifest`, `${BASE}icons/icon-192.png`, `${BASE}icons/icon.svg`];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(fallbackUrl ?? request, res.clone());
    return res;
  } catch {
    const hit = await cache.match(fallbackUrl ?? request);
    if (hit) return hit;
    throw new Error('offline');
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // streams, logos, Cast SDK: straight to the network
  if (/\.(m3u8|ts|m4s|aac|mp4)$/i.test(url.pathname)) return;

  if (req.mode === 'navigate') event.respondWith(networkFirst(req, BASE));
  else if (url.pathname.startsWith(`${BASE}data/`)) event.respondWith(networkFirst(req)); // freshest verified list, offline = last one
  else if (url.pathname.startsWith(`${BASE}assets/`) || url.pathname.startsWith(`${BASE}icons/`)) event.respondWith(cacheFirst(req));
});
