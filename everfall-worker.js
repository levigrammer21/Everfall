const CACHE = 'everfall-' + self.registration.scope + '-fa264565722f';
const FILES = ["./everfall-192.png","./everfall-512.png","./everfall-icon-C4Kh3j6a.svg","./everfall.webmanifest","./firebase-oYufzmIt.js","./game-D5MCz_Cj.css","./game-DJucyY1Y.js","./index.html","./phaser-Jt__PiWe.js","./whispering-forest-DoiTLMPw.webp"];
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