// Versiones de caché
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `gestionnet-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `gestionnet-dynamic-${CACHE_VERSION}`;
const IMAGES_CACHE = `gestionnet-images-${CACHE_VERSION}`;

// Recursos estáticos del App Shell (cache-first)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-180x180.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
];

// Patrones de URLs para diferentes estrategias
const API_PATTERNS = [
  /\/api\/clientes/,
  /\/api\/activity-reports/,
  /\/api\/health/
];

const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/i
];

const STATIC_PATTERNS = [
  /\.(?:js|css|html)$/i,
  /\/static\//,
  /\/assets\//
];

// Instalar SW y cachear recursos estáticos
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Cacheando recursos estáticos del App Shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Recursos estáticos cacheados exitosamente');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Error al cachear recursos estáticos:', error);
      })
  );
});

// Activar SW y limpiar caches antiguos
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activando...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Eliminar caches que no coincidan con la versión actual
            if (!cacheName.includes(CACHE_VERSION)) {
              console.log('🗑️ Eliminando caché antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activado y caches limpiados');
        return self.clients.claim();
      })
  );
});

// Background Sync - Escuchar evento sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-entries') {
    console.log('🔄 Background Sync activado:', event.tag);
    event.waitUntil(syncPendingData());
  }
});

// Función para sincronizar datos pendientes
async function syncPendingData() {
  try {
    console.log('🔄 Iniciando sincronización de datos pendientes...');
    
    const pendingData = await getPendingSyncData();
    
    if (!pendingData || pendingData.length === 0) {
      console.log('✅ No hay datos pendientes para sincronizar');
      return;
    }

    console.log(`📊 Sincronizando ${pendingData.length} elementos pendientes`);
    let successCount = 0;
    let errorCount = 0;

    for (const item of pendingData) {
      try {
        // Evitar reintentos excesivos
        if ((item.retryCount || 0) > 5) {
          console.warn(`⚠️ Elemento ${item.id} excedió límite de reintentos, omitiendo`);
          continue;
        }

        let endpoint = '';
        if (item.type === 'cliente') {
          endpoint = '/api/clientes';
        } else if (item.type === 'activity-report') {
          endpoint = '/api/activity-reports';
        }

        const response = await fetch(`http://localhost:3000/api/clientes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item.data)
        });

        if (response.ok) {
          console.log(`✅ Sincronizado exitosamente: ${item.type}`, item.data);
          await removePendingSyncData(item.id);
          successCount++;

          // Mostrar notificación de éxito
          await showSyncNotification(item.type, item.data, 'background');

        } else {
          console.error(`❌ Error al sincronizar ${item.type}:`, response.status);
          await updatePendingSyncRetryCount(item.id);
          errorCount++;
        }

      } catch (error) {
        console.error(`❌ Error de red al sincronizar ${item.type}:`, error);
        await updatePendingSyncRetryCount(item.id);
        errorCount++;
      }
    }

    console.log(`🎉 Sincronización completada: ${successCount} exitosos, ${errorCount} errores`);

    // Mostrar notificación resumen si hubo sincronizaciones exitosas
    if (successCount > 0) {
      await self.registration.showNotification('Sincronización Completada', {
        body: `${successCount} elemento(s) sincronizado(s) exitosamente con el servidor`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: 'sync-complete',
        data: { successCount, errorCount }
      });
    }

  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
  }
}

// Funciones auxiliares para IndexedDB en service worker
async function getPendingSyncData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MiBase', 3);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingSync'], 'readonly');
      const store = transaction.objectStore('pendingSync');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

async function removePendingSyncData(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MiBase', 3);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingSync'], 'readwrite');
      const store = transaction.objectStore('pendingSync');
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

async function updatePendingSyncRetryCount(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MiBase', 3);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingSync'], 'readwrite');
      const store = transaction.objectStore('pendingSync');
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.retryCount = (item.retryCount || 0) + 1;
          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    };
  });
}

// Función para mostrar notificaciones de sincronización
async function showSyncNotification(type, data, source) {
  let title = '';
  let body = '';
  
  if (type === 'cliente') {
    title = 'Cliente Guardado';
    body = `Cliente "${data.nombre}" guardado exitosamente en el servidor`;
  } else if (type === 'activity-report') {
    title = 'Reporte Guardado';
    body = `Reporte de actividad guardado exitosamente en el servidor`;
  }
  
  if (title && body) {
    await self.registration.showNotification(title, {
      body: body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: `sync-${type}-${Date.now()}`,
      data: { type, data, source },
      actions: [
        {
          action: 'view',
          title: 'Ver detalles'
        }
      ]
    });
  }
}

// Listener para mensajes desde la aplicación principal
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === 'SHOW_SYNC_NOTIFICATION') {
    const { syncType, data, source } = event.data.payload;
    showSyncNotification(syncType, data, source);
  }
});

// Listener para clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    // Abrir o enfocar la aplicación
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Estrategias de caché
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('📦 Cache hit (cache-first):', request.url);
    return cachedResponse;
  }

  console.log('🌐 Cache miss, fetching from network (cache-first):', request.url);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('❌ Network error in cache-first:', error);
    // Intentar servir página offline para navegación
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

async function networkFirstStrategy(request, cacheName) {
  try {
    console.log('🌐 Network first attempt:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('✅ Network success, cached (network-first):', request.url);
    }

    return networkResponse;
  } catch (error) {
    console.log('📦 Network failed, trying cache (network-first):', request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('📦 Cache hit after network failure:', request.url);
      return cachedResponse;
    }

    console.error('❌ Both network and cache failed:', error);
    throw error;
  }
}

async function staleWhileRevalidateStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);

  // Fetch en background para actualizar caché
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('🔄 Background update completed (stale-while-revalidate):', request.url);
    }
    return networkResponse;
  }).catch((error) => {
    console.log('❌ Background fetch failed (stale-while-revalidate):', error);
  });

  if (cachedResponse) {
    console.log('📦 Serving from cache, updating in background:', request.url);
    return cachedResponse;
  }

  console.log('🌐 No cache, waiting for network (stale-while-revalidate):', request.url);
  return fetchPromise;
}

// Determinar qué estrategia usar según el tipo de recurso
function getStrategyForRequest(request) {
  const url = new URL(request.url);

  // API requests - Network First (datos frescos)
  if (API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return { strategy: 'network-first', cache: DYNAMIC_CACHE };
  }

  // Imágenes - Stale While Revalidate
  if (IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return { strategy: 'stale-while-revalidate', cache: IMAGES_CACHE };
  }

  // Recursos estáticos - Cache First
  if (STATIC_PATTERNS.some(pattern => pattern.test(url.pathname)) ||
    STATIC_ASSETS.includes(url.pathname)) {
    return { strategy: 'cache-first', cache: STATIC_CACHE };
  }

  // Por defecto - Network First para contenido dinámico
  return { strategy: 'network-first', cache: DYNAMIC_CACHE };
}

// Manejar todas las peticiones fetch
self.addEventListener('fetch', (event) => {
  // Solo manejar peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Manejar navegación especialmente
  if (event.request.mode === 'navigate') {
    event.respondWith(
      cacheFirstStrategy(event.request, STATIC_CACHE)
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  const { strategy, cache } = getStrategyForRequest(event.request);

  event.respondWith(
    (async () => {
      try {
        switch (strategy) {
          case 'cache-first':
            return await cacheFirstStrategy(event.request, cache);
          case 'network-first':
            return await networkFirstStrategy(event.request, cache);
          case 'stale-while-revalidate':
            return await staleWhileRevalidateStrategy(event.request, cache);
          default:
            return await networkFirstStrategy(event.request, cache);
            scope
        }
      } catch (error) {
        console.error('❌ Error in fetch handler:', error);

        // Para navegación, servir página offline
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }

        // Para otros recursos, intentar desde caché
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        throw error;
      }
    })()
  );
});


// Event listener para notificaciones push
self.addEventListener('push', (event) => {
  console.log('📱 Push notification recibida:', event);
  console.log('📱 Event data:', event.data);
  
  let notificationData = {
    title: 'GestionNet',
    body: 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: 'gestionnet-notification',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: 'Ver'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };

  // Si hay datos en el push, los usamos
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('📱 Push data parsed:', pushData);
      notificationData = {
        ...notificationData,
        ...pushData,
        data: {
          ...notificationData.data,
          ...pushData.data
        }
      };
    } catch (e) {
      console.log('❌ Error parsing push data:', e);
      notificationData.body = event.data.text();
    }
  }

  console.log('📱 Showing notification with data:', notificationData);

  const showNotificationPromise = self.registration.showNotification(
    notificationData.title, 
    notificationData
  ).then(() => {
    console.log('✅ Notification shown successfully');
  }).catch((error) => {
    console.error('❌ Error showing notification:', error);
  });

  event.waitUntil(showNotificationPromise);
});

self.addEventListener("message", (event) => {
  console.log("Mensaje recibido:", event.data);
});



// // Mensaje de depuración
// console.log('🚀 Service Worker cargado con estrategias de caché avanzadas');
// console.log('📦 Estrategias disponibles:');
// console.log('  - Cache First: App Shell (HTML, CSS, JS)');
// console.log('  - Network First: APIs y datos dinámicos');
// console.log('  - Stale While Revalidate: Imágenes y recursos no críticos');