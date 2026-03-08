// sw.js — self-unregistering
// This service worker immediately unregisters itself and clears all caches.
// The old Supabase-era SW was caching API responses (including error responses),
// breaking the app. This version cleans up all existing registrations.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll())
      .then(clients => clients.forEach(c => c.navigate(c.url)))
  );
});
