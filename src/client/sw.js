self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
  e.waitUntil(
    (async () => {
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }
    })(),
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    (async () => {
      try {
        const response = await e.preloadResponse;
        if (response) {
          return response;
        }
        return fetch(e.request);
      } catch {
        return new Response('Offline');
      }
    })(),
  );
});
