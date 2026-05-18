const CACHE = 'kainos-v1'

const BASE = (() => {
  const path = self.location.pathname
  return path.substring(0, path.lastIndexOf('/') + 1)
})()

const PRECACHE = [
  BASE + 'index.html',
  BASE + 'admin.html',
  BASE + 'tshirt-store.html',
  BASE + 'css/style.css',
  BASE + 'css/admin.css',
  BASE + 'js/data.js',
  BASE + 'js/cart.js',
  BASE + 'js/app.js',
  BASE + 'manifest.json',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png',
  BASE + 'icons/icon.svg',
  BASE + 'offline.html',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  )
  e.waitUntil(clients.claim())
})

const CDN_ORIGINS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://images.unsplash.com',
  'https://cdn.jsdelivr.net',
]

self.addEventListener('fetch', e => {
  const { request } = e
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (url.origin === self.location.origin && url.pathname.startsWith(BASE)) {
    if (['style', 'script', 'image', 'font', 'manifest'].includes(request.destination)) {
      e.respondWith(cacheFirst(request))
      return
    }
    if (request.destination === 'document') {
      e.respondWith(networkFirst(request))
      return
    }
  }

  if (CDN_ORIGINS.includes(url.origin)) {
    e.respondWith(cacheFirst(request))
    return
  }
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const res = await fetch(request)
    if (res.ok) {
      const clone = res.clone()
      caches.open(CACHE).then(c => c.put(request, clone))
    }
    return res
  } catch {
    if (request.destination === 'document') return caches.match(BASE + 'offline.html')
    return new Response('', { status: 503 })
  }
}

async function networkFirst(request) {
  try {
    const res = await fetch(request)
    if (res.ok) {
      const clone = res.clone()
      caches.open(CACHE).then(c => c.put(request, clone))
    }
    return res
  } catch {
    const cached = await caches.match(request)
    return cached || caches.match(BASE + 'offline.html')
  }
}
