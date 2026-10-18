const CACHE='sunfuel-v1.0.0';
const URLS=['./','./index.html','./manifest.webmanifest','./css/styles.css','./js/app.js','./js/data.js','./js/engine.js','./js/charts.js','./js/storage.js','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/apple-touch-icon.png','./assets/icons/favicon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(URLS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
  if(response.ok){const duplicate=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,duplicate))}
  return response;
 }).catch(()=>caches.match('./index.html'))));
});
