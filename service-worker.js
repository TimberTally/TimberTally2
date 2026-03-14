// --- START OF FILE service-worker.js ---

// V IMPORTANT: Increment this version number with each update!
// Make sure this matches the version you intend to deploy.
const CACHE_NAME = 'timber-tally-cache-v1'; // <--- CHANGE THIS with each new deployment!

// List of files that make up the "app shell" - essential for offline loading.
const urlsToCache = [
  './', // Represents the root directory, often resolves to index.html
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon.png'
  // Add any other critical assets like fonts, core images, etc.
];

// --- Installation Event ---
// This event fires when the service worker is first registered or when a new version is detected.
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing new version...');
  // Prevent the worker from activating until the cache is populated.
  event.waitUntil(
    caches.open(CACHE_NAME) // Open the specific cache for this version.
      .then(cache => {
        console.log('[Service Worker] Caching app shell for new version:', CACHE_NAME);
        // Add all the specified URLs to the cache.
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] New version installation complete. App shell cached.');
        // IMPORTANT: We DON'T call self.skipWaiting() here automatically.
        // The UI prompt in script.js allows the user to control when the update is applied.
      })
      .catch(error => {
        // If any file fails to cache, the installation fails.
        console.error('[Service Worker] New version caching failed:', error);
      })
  );
});

// --- Activation Event ---
// This event fires after the 'install' event, when the new service worker takes control.
// It's a good place to clean up old caches.
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating new version...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      // Promise.all waits for all cache deletions to complete.
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete any cache that isn't the current version's cache.
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activation complete, old caches deleted.');
      // Force the activated service worker to take control of the page immediately.
      // This ensures the current page uses the new cache/worker logic right away,
      // especially important after the user clicks "Update Now".
      return self.clients.claim();
    })
  );
});

// --- Fetch Event ---
// This event intercepts network requests made from the pages controlled by the service worker.
// This is where the offline strategy (Cache-First) is implemented.
self.addEventListener('fetch', event => {
    // We only want to handle GET requests for our cache-first strategy.
    // Other requests (POST, PUT, etc.) should pass through to the network.
    if (event.request.method !== 'GET') {
        // console.log('[Service Worker] Ignoring non-GET request:', event.request.method, event.request.url);
        return; // Let the browser handle it normally.
    }

    // respondWith expects a Promise that resolves with a Response object.
    event.respondWith(
        caches.match(event.request) // 1. Check if the request URL exists in ANY cache.
            .then(cachedResponse => {
                // 2. If a cached response is found, return it directly.
                if (cachedResponse) {
                    // console.log('[Service Worker] Serving from cache:', event.request.url);
                    return cachedResponse;
                }

                // 3. If not found in cache, try fetching from the network.
                // console.log('[Service Worker] Not in cache, fetching from network:', event.request.url);
                return fetch(event.request).then(
                    networkResponse => {
                        // Optional: If the network fetch is successful, you could cache the response here
                        // dynamically. This is useful for assets not in the initial urlsToCache.
                        // Be careful what you cache here to avoid filling up storage unnecessarily.
                        // Example (use with caution):
                        /*
                        return caches.open(CACHE_NAME).then(cache => {
                            // Only cache successful GET requests and clone the response
                            // because response streams can only be read once.
                            if (networkResponse.ok) {
                                cache.put(event.request, networkResponse.clone());
                            }
                            return networkResponse;
                        });
                        */
                       // For now, just return the network response without dynamic caching.
                       // console.log('[Service Worker] Fetched from network:', event.request.url);
                       return networkResponse;
                    }
                ).catch(error => {
                    // 4. Network fetch failed (e.g., user is offline and resource isn't cached).
                    console.warn('[Service Worker] Fetch failed; user may be offline or resource unavailable:', event.request.url, error);

                    // At this point, for essential app shell files (HTML, CSS, JS),
                    // the request should have been served from the cache earlier.
                    // If we get here for an essential file, it means the install might have failed,
                    // or the file wasn't listed in urlsToCache.
                    // You could return a generic offline fallback page:
                    // return caches.match('/offline.html'); // Ensure 'offline.html' is in urlsToCache
                    // For this app, we'll let the browser show its default offline error
                    // for requests that fail and aren't cached.
                    throw error; // Propagate the error to the browser.
                });
            })
    );
});


// --- Message Event Listener ---
// Listens for messages sent from the client pages (e.g., from script.js).
self.addEventListener('message', (event) => {
  // Check if the message type is 'SKIP_WAITING'.
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Received SKIP_WAITING message. Activating new version immediately.');
    // self.skipWaiting() tells the waiting service worker to activate and take control.
    // This triggers the 'activate' event listener above.
    self.skipWaiting();
  }
});

// --- END OF FILE service-worker.js ---
