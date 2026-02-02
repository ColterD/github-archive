// Homelab Hardware Platform Service Worker
// Provides offline functionality and caching for PWA

const STATIC_CACHE_NAME = "homelab-static-v1";
const DYNAMIC_CACHE_NAME = "homelab-dynamic-v1";

// Files to cache immediately
const STATIC_FILES = [
  "/",
  "/hardware",
  "/builds",
  "/build-creator",
  "/offline",
  "/manifest.json",
  "/favicon.svg",
];

// Install event - cache static files
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching static files");
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log("Service Worker: Static files cached successfully");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Service Worker: Failed to cache static files:", error);
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME
            ) {
              console.log("Service Worker: Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log("Service Worker: Activated successfully");
        return self.clients.claim();
      }),
  );
});

// Fetch event - handle requests with cache-first strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(handleRequest(request));
});

// Handle different types of requests
async function handleRequest(request) {
  const url = new URL(request.url);

  try {
    // Handle API requests
    if (url.pathname.startsWith("/api/")) {
      return await handleApiRequest(request);
    }

    // Handle static assets
    if (isStaticAsset(url.pathname)) {
      return await handleStaticRequest(request);
    }

    // Handle page requests
    return await handlePageRequest(request);
  } catch (error) {
    console.error("Service Worker: Request failed:", error);
    return await handleOfflineRequest(request);
  }
}

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const cacheName = DYNAMIC_CACHE_NAME;

  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for API requests
    return new Response(
      JSON.stringify({
        error: "Offline",
        message: "This feature requires an internet connection",
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Return a fallback for missing assets
    return new Response("Asset not available offline", {
      status: 404,
      statusText: "Not Found",
    });
  }
}

// Handle page requests with cache-first strategy
async function handlePageRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Update cache in background
    updateCacheInBackground(request);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Return offline page
    return await handleOfflineRequest(request);
  }
}

// Handle offline requests
async function handleOfflineRequest(request) {
  // Try to return cached version of the page
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Return offline page for navigation requests
  if (request.mode === "navigate") {
    const offlinePage = await caches.match("/offline");
    if (offlinePage) {
      return offlinePage;
    }

    // Fallback offline HTML
    return new Response(
      `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - Homelab Builder</title>
        <style>
          body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; }
          .offline-container { max-width: 400px; margin: 0 auto; }
          .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
          .offline-title { font-size: 1.5rem; margin-bottom: 1rem; color: #374151; }
          .offline-message { color: #6b7280; margin-bottom: 2rem; }
          .retry-button { 
            background: #2563eb; color: white; border: none; 
            padding: 0.75rem 1.5rem; border-radius: 0.5rem; 
            cursor: pointer; font-size: 1rem;
          }
          .retry-button:hover { background: #1d4ed8; }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">📡</div>
          <h1 class="offline-title">You're Offline</h1>
          <p class="offline-message">
            It looks like you're not connected to the internet. 
            Some features may not be available.
          </p>
          <button class="retry-button" onclick="window.location.reload()">
            Try Again
          </button>
        </div>
      </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    );
  }

  return new Response("Offline", { status: 503 });
}

// Update cache in background
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
  } catch {
    // Silently fail background updates
    console.log("Service Worker: Background cache update failed");
  }
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
  const staticExtensions = [
    ".js",
    ".css",
    ".png",
    ".jpg",
    ".jpeg",
    ".svg",
    ".ico",
    ".woff",
    ".woff2",
  ];
  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

// Handle push notifications (future feature)
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    data: data.data,
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clients) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }

      // If not, open a new window/tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    }),
  );
});

// Background sync (future feature)
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle background sync tasks
      console.log("Service Worker: Background sync triggered"),
    );
  }
});

console.log("Service Worker: Script loaded successfully");
