// Service Worker for HisaabKitaab PWA
const CACHE_NAME = 'hisaabkitaab-v3.5-pwa';
const BASE_PATH = '/AajKaHisaab/'; // Updated for GitHub Pages

const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'css/style.css',
  BASE_PATH + 'js/script.js',
  BASE_PATH + 'js/profile-manager.js',
  BASE_PATH + 'js/pdf-generator.js',
  BASE_PATH + 'js/firebase-sync.js',
  BASE_PATH + 'js/pwa-install.js',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'icons/icon-192x192.png',
  BASE_PATH + 'icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell for GitHub Pages:', BASE_PATH);
        return cache.addAll(urlsToCache.map(url => 
          url.startsWith('http') ? url : new URL(url, self.location.origin).href
        ));
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  // Skip Firebase URLs
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis') ||
      event.request.url.includes('gstatic')) {
    return fetch(event.request);
  }

  // For GitHub Pages, handle the BASE_PATH
  let requestUrl = event.request.url;
  const url = new URL(requestUrl);
  
  // If request is for root but we're in AajKaHisaab folder, redirect
  if (url.pathname === '/' || url.pathname === '/AajKaHisaab') {
    event.respondWith(
      caches.match(BASE_PATH + 'index.html').then(response => {
        if (response) {
          return response;
        }
        return fetch(BASE_PATH + 'index.html');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200) {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        }).catch(() => {
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match(BASE_PATH + 'index.html');
          }
        });
      })
  );
});