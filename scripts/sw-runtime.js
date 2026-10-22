/* offline runtime v1 */
// Generated BUILD pins all public shell bytes. This worker never reads workout storage.
const BASE = '/training-os/';
const CACHE = 'tos-shell-v1-' + BUILD.id;
const absolute = name => new URL(BASE + name, self.location.origin).href;
const entries = new Map(BUILD.assets.map(asset => [absolute(asset.name), asset]));
const validScope = self.registration.scope === new URL(BASE, self.location.origin).href;
const digest = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
async function verified(response, asset) {
  if (!response || response.status !== 200 || response.redirected || response.type === 'opaque') throw Error('shell-response');
  const type = (response.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (!asset.types.includes(type)) throw Error('shell-type');
  const bytes = await response.clone().arrayBuffer();
  if (bytes.byteLength !== asset.size || await digest(bytes) !== asset.sha256) throw Error('shell-integrity');
  return response;
}
async function complete() {
  if (!validScope || !await caches.has(CACHE)) return false;
  try {
    const cache = await caches.open(CACHE), keys = await cache.keys();
    if (keys.length !== entries.size || keys.some(key => !entries.has(key.url))) return false;
    for (const [url, asset] of entries) await verified(await cache.match(url), asset);
    return true;
  } catch (_) { return false; }
}
let installation;
function installShell() {
  if (!installation) installation = prepareShell().finally(() => { installation = null; });
  return installation;
}
async function prepareShell() {
  if (!validScope) throw Error('shell-scope');
  if (await complete()) return; // Re-registration after legacy cleanup reuses only verified bytes.
  try {
    await caches.delete(CACHE);
    const cache = await caches.open(CACHE);
    for (const [url, asset] of entries) {
      const response = await fetch(new Request(url, {cache: 'no-store', credentials: 'same-origin', redirect: 'error'}));
      await cache.put(url, await verified(response, asset));
    }
    if (!await complete()) throw Error('shell-readback');
  } catch (error) {
    await caches.delete(CACHE); // Only this incomplete candidate; never another version or origin data.
    throw error;
  }
}
self.addEventListener('install', event => event.waitUntil(installShell()));
// Browser lifecycle waits for every old controlled client to close. No forced cutover or reload.
self.addEventListener('activate', event => event.waitUntil((async () => {
  if (!await complete()) throw Error('shell-incomplete');
  // Retain validated predecessors for non-destructive recovery. No legacy/global cache cleanup.
})()));
self.addEventListener('fetch', event => {
  if (!validScope || event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const navigation = event.request.mode === 'navigate' && (url.pathname === BASE || url.pathname === BASE + 'index.html');
  const target = navigation ? absolute('index.html') : url.search === '?v=' + BUILD.release ? url.origin + url.pathname : url.href;
  if (!entries.has(target)) return; // Unknown routes, remote videos, APIs and other projects use the network.
  event.respondWith((async () => {
    try {
      // Never mix a network HTML/version with the active worker's pinned release.
      if (!await complete()) await installShell(); // Repair only this pinned version when online.
      return await verified(await (await caches.open(CACHE)).match(target), entries.get(target));
    } catch (_) {
      return new Response(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Training OS · Recuperación</title><h1>Training OS</h1><p>La instalación sin conexión está incompleta. Reconecta y vuelve a abrir para repararla. No borres los datos; conserva tu respaldo.</p><p id="update" role="status"></p><button onclick="location.reload()">Volver a intentar</button><script>
navigator.serviceWorker.getRegistration('/training-os/').then(async r=>{
 if(!r)return;
 const show=()=>{if(r.waiting)document.getElementById('update').textContent='Actualización lista. Guarda tu sesión y respaldo en las pestañas abiertas; después cierra todas las pestañas de Training OS y vuelve a abrir.'};
 r.addEventListener('updatefound',()=>r.installing?.addEventListener('statechange',show));
 try{await r.update()}catch(_){}show();
}).catch(()=>{});
</script></html>`, {status: 503, headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'}});
    }
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'TOS_OFFLINE_STATUS' || !event.ports?.[0]) return;
  const url = event.source?.url && new URL(event.source.url);
  if (!validScope || !url || url.origin !== self.location.origin || ![BASE, BASE + 'index.html'].includes(url.pathname)) return;
  event.waitUntil((async () => event.ports[0].postMessage({type: 'TOS_OFFLINE_STATUS', ready: await complete(), build: BUILD.id, release: BUILD.release}))());
});
