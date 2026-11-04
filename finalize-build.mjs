import { copyFile, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const dist=new URL('./dist/',import.meta.url);
const file=name=>new URL(name,dist);
await rename(file('game.html'),file('index.html'));
for(const name of ['everfall-192.png','everfall-512.png'])await copyFile(new URL('./'+name,import.meta.url),file(name));
const manifest={name:'Everfall',short_name:'Everfall',start_url:'./',scope:'./',display:'standalone',background_color:'#100e18',theme_color:'#100e18',icons:[192,512].map(size=>({src:'./everfall-'+size+'.png',sizes:size+'x'+size,type:'image/png',purpose:'any'}))};
await writeFile(file('everfall.webmanifest'),JSON.stringify(manifest));
const html=await readFile(file('index.html'),'utf8');
await writeFile(file('index.html'),html.replace('</head>','<link rel="manifest" href="./everfall.webmanifest"><link rel="apple-touch-icon" href="./everfall-192.png"></head>').replace('</body>',`<script>if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./everfall-worker.js').catch(() => {}));</script></body>`));
await writeFile(file('.nojekyll'),'');
const assets=(await readdir(dist)).filter(name=>!name.startsWith('.')&&name!=='everfall-worker.js').sort();
const hash=createHash('sha256');for(const asset of assets)hash.update(await readFile(file(asset)));
const tag=hash.digest('hex').slice(0,12);
await writeFile(file('everfall-worker.js'),`const CACHE = 'everfall-' + self.registration.scope + '-${tag}';
const FILES = ${JSON.stringify(assets.map(name=>'./'+name))};
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
});`);
