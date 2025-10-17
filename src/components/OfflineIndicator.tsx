import { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [showIndicator, setShowIndicator] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Check connection quality
  useEffect(() => {
    if (!isOnline) {
      setConnectionQuality('offline');
      return;
    }

    const checkConnectionQuality = async () => {
      try {
        const start = Date.now();
        await fetch('/manifest.json', { cache: 'no-cache' });
        const duration = Date.now() - start;
        setConnectionQuality(duration > 1000 ? 'poor' : 'good');
      } catch {
        setConnectionQuality('poor');
      }
    };

    checkConnectionQuality();
    const interval = setInterval(checkConnectionQuality, 30000);
    return () => clearInterval(interval);
  }, [isOnline]);

  // Check for pending sync items
  useEffect(() => {
    const checkPendingSync = async () => {
      try {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('MiBase', 2);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        const transaction = db.transaction(['pendingSync'], 'readonly');
        const store = transaction.objectStore('pendingSync');

        const count = await new Promise<number>((resolve) => {
          const request = store.count();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(0);
        });

        setPendingSyncCount(count);
        db.close();
      } catch (error) {
        console.error('Error checking pending sync:', error);
        setPendingSyncCount(0);
      }
    };

    checkPendingSync();
    const interval = setInterval(checkPendingSync, 10000);
    return () => clearInterval(interval);
  }, []);

  // Show indicator logic
  useEffect(() => {
    if (!isOnline || connectionQuality === 'poor' || pendingSyncCount > 0) {
      setShowIndicator(true);
    } else {
      const timer = setTimeout(() => setShowIndicator(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, connectionQuality, pendingSyncCount]);

  if (!showIndicator) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: isOnline ? '#4caf50' : '#f44336',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '4px',
        fontSize: '14px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span>{isOnline ? '🟢' : '🔴'}</span>
      <span>
        {!isOnline 
          ? 'Sin conexión' 
          : connectionQuality === 'poor' 
            ? 'Conexión lenta' 
            : pendingSyncCount > 0 
              ? `${pendingSyncCount} elementos pendientes`
              : 'Conectado'
        }
      </span>
      {!isOnline && <span style={{ fontSize: '12px', opacity: 0.8 }}>Reintentando...</span>}
    </div>
  );
}