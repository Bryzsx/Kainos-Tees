const PRECACHE_CACHE = 'kainos-precache-v1'
const RUNTIME_CACHE = 'kainos-runtime-v1'

const BASE = (() => {
  const path = self.location.pathname
  return path.substring(0, path.lastIndexOf('/') + 1)
})()

const PRECACHE_URLS = [
  'index.html',
  'admin.html',
  'offline.html',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon.svg',
]

const PRECACHE = PRECACHE_URLS.map(url => BASE + url)

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE_CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .catch(err => {
        console.warn('Precache partial failure, continuing:', err)
        return caches.open(PRECACHE_CACHE)
          .then(cache => Promise.allSettled(
            PRECACHE.map(url =>
              cache.add(url).catch(() => {})
            )
          ))
      })
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  const currentCaches = [PRECACHE_CACHE, RUNTIME_CACHE]
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName))
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheName => caches.delete(cacheName)))
    }).then(() => self.clients.claim())
  )
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
            return caches.match(BASE + 'offline.html')
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
          if (request.destination === 'document') {
            return caches.match(BASE + 'offline.html')
          }
          return new Response('', { status: 503, statusText: 'Service Unavailable' })
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
        .catch(() => {
          return cachedResponse || new Response('', { status: 503, statusText: 'Service Unavailable' })
        })
      return cachedResponse || fetchPromise
    })
}

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

self.addEventListener('push', event => {
  const title = 'Kainos Tees'
  const options = {
    body: 'New drops just landed!',
    icon: BASE + 'icons/icon-192.png',
    badge: BASE + 'icons/icon-192.png',
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
