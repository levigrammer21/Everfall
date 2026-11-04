const CACHE = 'everfall-' + self.registration.scope + '-af61369703ea';
const FILES = ["./biome-1-BkXkbiy8.webp","./biome-2-B6EoaSpZ.webp","./biome-3-Cj7dixuU.webp","./biome-4-BmlRKHUR.webp","./biome-5-Dpjuq45e.webp","./biome-6-4iJkqM5n.webp","./biome-7-DvzI3hvg.webp","./biome-8-CbKP3khB.webp","./biome-9-DsOa5EcR.webp","./dungeon-0-aqC-sQf1.webp","./dungeon-1-hg2rTq8i.webp","./dungeon-2-CtjZ082M.webp","./dungeon-3-BTRImDe1.webp","./everfall-192.png","./everfall-512.png","./everfall-icon-C4Kh3j6a.svg","./everfall.webmanifest","./firebase-oYufzmIt.js","./game-CA0Ky62G.js","./game-D4UUU1rm.css","./index.html","./phaser-Jt__PiWe.js","./whispering-forest-DoiTLMPw.webp"];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('everfall-' + self.registration.scope + '-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
 const url = new URL(event.request.url);
 if (event.request.method !== 'GET' || !url.href.startsWith(self.registration.scope)) return;
 if (event.request.mode === 'navigate') {
  event.respondWith(fetch(event.request).catch(() => caches.open(CACHE).then(cache => cache.match('./index.html'))));
  return;
 }
 if (!FILES.includes('./' + url.pathname.slice(new URL(self.registration.scope).pathname.length))) return;
 event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request).then(hit => hit || fetch(event.request))));
});