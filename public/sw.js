const CACHE = 'kainos-v1'
const PRECACHE_CACHE = 'kainos-precache-v1'
const RUNTIME_CACHE = 'kainos-runtime-v1'

const BASE = (() => {
  const path = self.location.pathname
  return path.substring(0, path.lastIndexOf('/') + 1)
})()

const PRECACHE_URLS = [
  'index.html',
  'admin.html',
  'tshirt-store.html',
  'css/style.css',
  'css/admin.css',
  'js/data.js',
  'js/cart.js',
  'js/app.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon.svg',
  'offline.html',
]

const PRECACHE = PRECACHE_URLS.map(url => BASE + url)

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE_CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  const currentCaches = [PRECACHE_CACHE, RUNTIME_CACHE]
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName))
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete)
      }))
    }).then(() => self.clients.claim())
  )
})

// Cache first network fallback strategy for static assets
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

// Network first cache fallback strategy for documents
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

// Stale-while-revalidate strategy for frequently updated content
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
  
  // Only handle GET requests
  if (request.method !== 'GET') return
  
  const url = new URL(request.url)
  
  // Handle same-origin requests
  if (url.origin === self.location.origin) {
    // Check if it's a precached asset
    if (PRECACHE_URLS.some(asset => url.pathname.endsWith(asset))) {
      event.respondWith(caches.match(request).then(cached => cached || fetch(request)))
      return
    }
    
    // Handle documents with network first
    if (request.destination === 'document') {
      event.respondWith(networkFirstCacheFallback(request))
      return
    }
    
    // Handle static assets with cache first
    if (['style', 'script', 'image', 'font'].includes(request.destination)) {
      event.respondWith(cacheFirstNetworkFallback(request))
      return
    }
    
    // Handle API requests and other fetches with stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request))
    return
  }
  
  // Handle third-party requests (CDNs, etc.) with cache first
  const CDN_ORIGINS = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://images.unsplash.com',
    'https://cdn.jsdelivr.net',
  ]
  
  if (CDN_ORIGINS.includes(url.origin)) {
    event.respondWith(cacheFirstNetworkFallback(request))
    return
  }
})

// Handle push notifications (placeholder for future implementation)
self.addEventListener('push', event => {
  const title = 'Kainos Tees'
  const options = {
    body: 'You have new notifications!',
    icon: BASE + 'icons/icon-192.png',
    badge: BASE + 'icons/icon-192.png'
  }
  
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  
  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === 'https://' + self.location.host + BASE && 'focus' in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(BASE)
        }
      })
  )
})

// Handle background sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart())
  }
})

async function syncCart() {
  try {
    // Get cart from IndexedDB or localStorage
    const cart = JSON.parse(localStorage.getItem('kainos_cart_sync') || '[]')
    
    if (cart.length === 0) return
    
    // Try to sync with server
    if (isSupabased() && supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Save cart items to database for this user
        const cartItems = cart.map(item => ({
          user_id: user.id,
          product_id: item.id,
          quantity: item.qty,
          size: item.size,
          color: item.color
        }))
        
        // Upsert cart items
        const { error } = await supabase
          .from('user_cart')
          .upsert(cartItems, { onConflict: ['user_id', 'product_id', 'size', 'color'] })
        
        if (!error) {
          // Clear synced cart
          localStorage.removeItem('kainos_cart_sync')
        }
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
    // Will retry on next sync event
  }
}

// Helper function to check if we're using Supabase
function isSupabased() {
  return typeof supabase !== 'undefined' && supabase !== null
}
