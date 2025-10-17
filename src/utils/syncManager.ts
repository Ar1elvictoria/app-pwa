// Gestor de sincronización automática
export class SyncManager {
  private static instance: SyncManager;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 30000; // 30 segundos

  private constructor() {}

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  // Iniciar sincronización automática
  startAutoSync() {
    if (this.syncInterval) return;

    console.log('🔄 Iniciando sincronización automática cada 30 segundos');
    
    this.syncInterval = setInterval(async () => {
      if (navigator.onLine) {
        await this.triggerSync();
      }
    }, this.SYNC_INTERVAL);

    // También sincronizar cuando se recupere la conexión
    window.addEventListener('online', this.handleOnline.bind(this));
  }

  // Detener sincronización automática
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Sincronización automática detenida');
    }
    window.removeEventListener('online', this.handleOnline.bind(this));
  }

  // Manejar evento de conexión recuperada
  private async handleOnline() {
    console.log('🌐 Conexión recuperada, iniciando sincronización');
    await this.triggerSync();
  }

  // Activar sincronización manual
  async triggerSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-entries');
        console.log('🔄 Sincronización activada manualmente');
      } catch (error) {
        console.error('Error activando sincronización:', error);
      }
    }
  }
}

// Instancia global del gestor de sincronización
export const syncManager = SyncManager.getInstance();