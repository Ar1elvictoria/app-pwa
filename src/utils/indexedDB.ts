import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface Cliente {
  id?: number;
  _id?: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  plan: string;
  fechaRegistro: string;
}

export interface PendingSync {
  id?: number;
  type: 'cliente' | 'activity-report';
  data: any;
  timestamp: number;
  retryCount?: number;
}

interface MyDB extends DBSchema {
  clientes: {
    key: number;
    value: Cliente;
  };
  pendingSync: {
    key: number;
    value: PendingSync;
  };
}

let dbPromise: Promise<IDBPDatabase<MyDB>>;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MyDB>('MiBase', 3, {
      upgrade(db, oldVersion) {
        // Eliminar stores existentes si hay problemas de esquema
        if (oldVersion < 3) {
          if (db.objectStoreNames.contains('clientes')) {
            db.deleteObjectStore('clientes');
          }
          if (db.objectStoreNames.contains('pendingSync')) {
            db.deleteObjectStore('pendingSync');
          }
        }
        
        // Crear stores con el esquema correcto
        if (!db.objectStoreNames.contains('clientes')) {
          db.createObjectStore('clientes', { keyPath: 'id', autoIncrement: true });
        }
        
        if (!db.objectStoreNames.contains('pendingSync')) {
          db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export async function getClientes() {
  const db = await getDB();
  return db.getAll('clientes');
}

export async function getAllClientes() {
  const db = await getDB();
  return db.getAll('clientes');
}

export async function addCliente(nombre: string, email: string, telefono: string, direccion: string, plan: string = '') {
  const db = await getDB();
  const cliente: Cliente = {
    nombre,
    email,
    telefono,
    direccion,
    plan,
    fechaRegistro: new Date().toISOString()
  };
  
  // Guardar localmente primero
  const localId = await db.add('clientes', cliente);
  
  // Intentar sincronizar con el servidor
  try {
    if (navigator.onLine) {
      const response = await fetch('http://localhost:3000/api/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cliente)
      });
      
      if (response.ok) {
        console.log('✅ Cliente sincronizado inmediatamente con el servidor');
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } else {
      throw new Error('Sin conexión a internet');
    }
  } catch (error) {
    console.log('⏳ Guardando para sincronización posterior:', error);
    
    // Agregar a la cola de sincronización pendiente
    await addPendingSync('cliente', cliente);
    
    // Registrar background sync si está disponible
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-entries');
        console.log('🔄 Background sync registrado');
      } catch (syncError) {
        console.error('Error registrando background sync:', syncError);
      }
    }
  }
  
  return localId;
}

export async function removeCliente(id: number) {
  const db = await getDB();
  await db.delete('clientes', id);
}

// Funciones para manejar datos pendientes de sincronización
export async function addPendingSync(type: 'cliente' | 'activity-report', data: any) {
  const db = await getDB();
  const syncData: PendingSync = {
    type,
    data,
    timestamp: Date.now(),
    retryCount: 0
  };
  return await db.add('pendingSync', syncData);
}

export async function getPendingSync() {
  const db = await getDB();
  return db.getAll('pendingSync');
}

export async function removePendingSync(id: number) {
  const db = await getDB();
  await db.delete('pendingSync', id);
}

export async function updateRetryCount(id: number) {
  const db = await getDB();
  const tx = db.transaction('pendingSync', 'readwrite');
  const store = tx.objectStore('pendingSync');
  const item = await store.get(id);
  
  if (item) {
    item.retryCount = (item.retryCount || 0) + 1;
    await store.put(item);
  }
  await tx.done;
}

export async function clearAllPendingSync() {
  const db = await getDB();
  const tx = db.transaction('pendingSync', 'readwrite');
  await tx.objectStore('pendingSync').clear();
  await tx.done;
}

// Función para obtener estadísticas de sincronización
export async function getSyncStats() {
  const db = await getDB();
  const pendingItems = await db.getAll('pendingSync');
  
  return {
    total: pendingItems.length,
    byType: pendingItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    oldestTimestamp: pendingItems.length > 0 ? Math.min(...pendingItems.map(item => item.timestamp)) : null,
    highRetryCount: pendingItems.filter(item => (item.retryCount || 0) > 3).length
  };
}


