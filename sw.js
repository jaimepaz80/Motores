// sw.js (Service Worker para PWA)
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Instalado');
});

self.addEventListener('fetch', (e) => {
    // Permite que la app funcione aunque no haya caché programada
});
