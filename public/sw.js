const CACHE_PREFIX = 'kainos'
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-v1`

const BASE = (() => {
  const path = self.location.pathname
  return path.substring(0, path.lastIndexOf('/') + 1)
})()

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(`${CACHE_PREFIX}-precache-v1`)
      .then(cache => cache.addAll(self.__WB_MANIFEST.map(entry => entry.url)))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  const currentCaches = [`${CACHE_PREFIX}-precache-v1`, RUNTIME_CACHE]
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName))
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheName => caches.delete(cacheName)))
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (url.origin === self.location.origin) {
    if (request.destination === 'document') {
      event.respondWith(networkFirstCacheFallback(request))
      return
    }
    if (['style', 'script', 'image', 'font'].includes(request.destination)) {
      event.respondWith(cacheFirstNetworkFallback(request))
      return
    }
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  const CDN_ORIGINS = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://images.unsplash.com',
    'https://cdn.jsdelivr.net',
  ]

  if (CDN_ORIGINS.includes(url.origin)) {
    event.respondWith(cacheFirstNetworkFallback(request))
  }
})

function cacheFirstNetworkFallback(request) {
  return caches.match(request)
    .then(cachedResponse => {
      return cachedResponse || fetch(request)
        .then(networkResponse => {
          return caches.open(RUNTIME_CACHE)
            .then(cache => {
              cache.put(request, networkResponse.clone())
              return networkResponse
            })
        })
        .catch(() => {
          if (request.destination === 'document') {
            return caches.match('./offline.html')
          }
          return new Response('', { status: 503, statusText: 'Service Unavailable' })
        })
    })
}

function networkFirstCacheFallback(request) {
  return fetch(request)
    .then(networkResponse => {
      return caches.open(RUNTIME_CACHE)
        .then(cache => {
          cache.put(request, networkResponse.clone())
          return networkResponse
        })
    })
    .catch(() => {
      return caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) return cachedResponse
          return caches.match('./offline.html')
        })
    })
}

function staleWhileRevalidate(request) {
  return caches.match(request)
    .then(cachedResponse => {
      const fetchPromise = fetch(request)
        .then(networkResponse => {
          return caches.open(RUNTIME_CACHE)
            .then(cache => {
              cache.put(request, networkResponse.clone())
              return networkResponse
            })
        })
      return cachedResponse || fetchPromise
    })
}

self.addEventListener('push', event => {
  const title = 'Kainos Tees'
  const options = {
    body: 'New drops just landed!',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus()
        }
        if (clients.openWindow) return clients.openWindow(BASE)
      })
  )
})

self.addEventListener('sync', event => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart())
  }
})

async function syncCart() {
  try {
    const cart = JSON.parse(localStorage.getItem('kainos_cart_sync') || '[]')
    if (cart.length === 0) return
    localStorage.removeItem('kainos_cart_sync')
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}
