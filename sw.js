// Service worker: fast repeat visits and offline support. Also handles notification clicks.
const V='mir4-v6',SHELL=['./','index.html','classes.html','changelog.html','offline.html','manifest.json',
'icons/ui/listed.svg','nav.js?v=21','age.js?v=5','strength.js?v=1','extras.js?v=12','premium.js?v=24','share.js?v=1','icons/ui/share.svg','pricehist.js?v=2','trend.js?v=1','wemix1h.js?v=4','topup.js?v=2','top20.js?v=37','boss.js?v=17','soldsearch.js?v=5',
'icons/banner-m.jpg?v=1','icons/app-192.png?v=4'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('mir4-')&&k!==V&&k!==V+'-data').map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
const isData=u=>u.pathname.endsWith('.json');
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
 if(u.origin!==location.origin){if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname))e.respondWith(swr(r,V));return}
 if(isData(u)){e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(V+'-data').then(x=>x.put(u.origin+u.pathname,c))}return res}).catch(()=>caches.open(V+'-data').then(x=>x.match(u.origin+u.pathname)).then(m=>m||new Response('{}',{headers:{'Content-Type':'application/json'}}))));return}
 if(r.mode==='navigate'){e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put(r,c));return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('offline.html'))));return}
 e.respondWith(swr(r,V))});
function swr(r,v){return caches.open(v).then(c=>c.match(r).then(m=>{const n=fetch(r).then(res=>{if(res.ok||res.type==='opaque')c.put(r,res.clone());return res}).catch(()=>m);return m||n}))}
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(c=>c.length?c[0].focus():self.clients.openWindow('./')))});
