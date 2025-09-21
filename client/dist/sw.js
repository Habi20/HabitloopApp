// HabitLoop Service Worker
// Version 1.0.2

const CACHE_NAME = 'habitloop-v1.0.2';
const STATIC_CACHE = 'habitloop-static-v1.0.2';
const DYNAMIC_CACHE = 'habitloop-dynamic-v1.0.2';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints that should work offline
const OFFLINE_ENDPOINTS = [
  '/api/habits',
  '/api/session/status',
  '/api/user/settings'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Skip external API calls (like dicebear.com) - let them go through normally
  if (!url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
    return;
  }
  
  // Skip OAuth callback routes and Google Calendar API routes - these should go directly to the backend
  if (url.pathname.startsWith('/auth/') || 
      url.pathname.startsWith('/google-callback') || 
      url.pathname.startsWith('/callback') ||
      url.pathname.startsWith('/api/google-calendar/') ||
      url.search.includes('code=') ||
      url.search.includes('state=')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('📱 Service Worker: Serving from cache', request.url);
          return cachedResponse;
        }
        
        // Try to fetch from network with retry logic
        return fetchWithRetry(request, 3)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response for caching
            const responseToCache = response.clone();
            
            // Cache API responses for offline use
            if (url.pathname.startsWith('/api/') && OFFLINE_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                  console.log('💾 Service Worker: Cached API response', request.url);
                })
                .catch((cacheError) => {
                  console.error('❌ Service Worker: Failed to cache response', cacheError);
                });
            }
            
            return response;
          })
          .catch((error) => {
            console.log('🌐 Service Worker: Network failed, serving offline fallback', request.url);
            
            // Return offline fallback for specific routes
            if (url.pathname === '/' || url.pathname === '/index.html') {
              return caches.match('/index.html');
            }
            
            // Return offline page for other routes
            return new Response(
              JSON.stringify({
                error: 'Offline',
                message: 'You are offline. Some features may not be available.',
                offline: true
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
          });
      })
  );
});

// Retry logic for network requests
async function fetchWithRetry(request, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        return response;
      }
      // If response is not ok, wait before retry
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    } catch (error) {
      console.log(`🔄 Service Worker: Retry ${i + 1}/${maxRetries} failed for`, request.url, error.message);
      if (i === maxRetries - 1) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Background sync for habit completions
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'habit-completion') {
    event.waitUntil(
      syncHabitCompletions()
    );
  }
});

// Sync habit completions when back online
async function syncHabitCompletions() {
  try {
    // Get pending completions from IndexedDB
    const pendingCompletions = await getPendingCompletions();
    
    for (const completion of pendingCompletions) {
      try {
        const response = await fetch('/api/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${completion.token}`
          },
          body: JSON.stringify({
            habitId: completion.habitId,
            value: completion.value
          })
        });
        
        if (response.ok) {
          console.log('✅ Service Worker: Synced habit completion', completion.habitId);
          await removePendingCompletion(completion.id);
        }
      } catch (error) {
        console.error('❌ Service Worker: Failed to sync completion', error);
      }
    }
  } catch (error) {
    console.error('❌ Service Worker: Background sync failed', error);
  }
}

// IndexedDB helpers for offline data
async function getPendingCompletions() {
  return new Promise((resolve) => {
    const request = indexedDB.open('HabitLoopOffline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingCompletions'], 'readonly');
      const store = transaction.objectStore('pendingCompletions');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
      
      getAllRequest.onerror = () => {
        resolve([]);
      };
    };
    
    request.onerror = () => {
      resolve([]);
    };
  });
}

async function removePendingCompletion(id) {
  return new Promise((resolve) => {
    const request = indexedDB.open('HabitLoopOffline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingCompletions'], 'readwrite');
      const store = transaction.objectStore('pendingCompletions');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => resolve();
    };
    
    request.onerror = () => resolve();
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Time to check your habits!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Open HabitLoop',
        icon: '/icons/action-open.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('HabitLoop Reminder', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Service Worker: Notification clicked', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_HABITS') {
    cacheHabitsData(event.data.habits);
  }
});

// Cache habits data for offline use
async function cacheHabitsData(habits) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const response = new Response(JSON.stringify(habits), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put('/api/habits', response);
    console.log('💾 Service Worker: Cached habits data for offline use');
  } catch (error) {
    console.error('❌ Service Worker: Failed to cache habits data', error);
  }
}
