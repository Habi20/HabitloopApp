// PWA Utilities for HabitLoop
// Handles service worker registration, offline functionality, and PWA features

export interface PWAConfig {
  enableOfflineMode: boolean;
  enablePushNotifications: boolean;
  enableBackgroundSync: boolean;
  cacheStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
}

const defaultConfig: PWAConfig = {
  enableOfflineMode: true,
  enablePushNotifications: true,
  enableBackgroundSync: true,
  cacheStrategy: 'stale-while-revalidate'
};

class PWAManager {
  private config: PWAConfig;
  private registration: ServiceWorkerRegistration | null = null;
  private onlineStatus: boolean = navigator.onLine;

  constructor(config: Partial<PWAConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.init();
  }

  private async init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        console.log('✅ PWA: Service Worker registered successfully');
        
        // Handle service worker updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration?.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateNotification();
              }
            });
          }
        });
      } catch (error) {
        console.error('❌ PWA: Service Worker registration failed:', error);
      }
    }

    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.onlineStatus = true;
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.onlineStatus = false;
      this.handleOnlineStatusChange(false);
    });

    // Initialize IndexedDB for offline storage
    if (this.config.enableOfflineMode) {
      await this.initOfflineStorage();
    }

    // Request notification permission
    if (this.config.enablePushNotifications) {
      await this.requestNotificationPermission();
    }
  }

  private async initOfflineStorage() {
    return new Promise<void>((resolve) => {
      const request = indexedDB.open('HabitLoopOffline', 1);
      
      request.onerror = () => {
        console.error('❌ PWA: Failed to open IndexedDB');
        resolve();
      };
      
      request.onsuccess = () => {
        console.log('✅ PWA: IndexedDB initialized');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for offline data
        if (!db.objectStoreNames.contains('pendingCompletions')) {
          db.createObjectStore('pendingCompletions', { keyPath: 'id', autoIncrement: true });
        }
        
        if (!db.objectStoreNames.contains('habits')) {
          db.createObjectStore('habits', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('userSettings')) {
          db.createObjectStore('userSettings', { keyPath: 'userId' });
        }
      };
    });
  }

  private async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        console.log('🔔 PWA: Notification permission:', permission);
        return permission === 'granted';
      } catch (error) {
        console.error('❌ PWA: Failed to request notification permission:', error);
        return false;
      }
    }
    return Notification.permission === 'granted';
  }

  private handleOnlineStatusChange(isOnline: boolean) {
    // Trigger background sync when back online
    if (isOnline && this.registration && this.config.enableBackgroundSync) {
      // Background sync not available in all browsers
      if ('sync' in this.registration) {
        (this.registration as any).sync.register('habit-completion');
      }
    }

    // Show offline/online status to user
    this.showConnectionStatus(isOnline);
  }

  private showConnectionStatus(isOnline: boolean) {
    // You can customize this to show a toast or status indicator
    console.log(isOnline ? '🌐 PWA: Back online' : '📱 PWA: Offline mode');
    
    // Dispatch custom event for UI to listen to
    window.dispatchEvent(new CustomEvent('pwa-connection-change', {
      detail: { isOnline }
    }));
  }

  private showUpdateNotification() {
    // Show update notification to user
    if ('serviceWorker' in navigator && this.registration) {
      const newWorker = this.registration.waiting;
      if (newWorker) {
        // Send message to new worker to skip waiting
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        
        // Reload page to use new service worker
        window.location.reload();
      }
    }
  }

  // Public methods
  public async cacheHabitsData(habits: any[]) {
    if (this.registration && this.registration.active) {
      this.registration.active.postMessage({
        type: 'CACHE_HABITS',
        habits
      });
    }
  }

  public async storeOfflineCompletion(completion: any) {
    if (!this.config.enableOfflineMode) return;

    return new Promise<void>((resolve) => {
      const request = indexedDB.open('HabitLoopOffline', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['pendingCompletions'], 'readwrite');
        const store = transaction.objectStore('pendingCompletions');
        
        const offlineCompletion = {
          ...completion,
          timestamp: Date.now(),
          synced: false
        };
        
        store.add(offlineCompletion);
        resolve();
      };
      
      request.onerror = () => resolve();
    });
  }

  public async getOfflineCompletions() {
    if (!this.config.enableOfflineMode) return [];

    return new Promise<any[]>((resolve) => {
      const request = indexedDB.open('HabitLoopOffline', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['pendingCompletions'], 'readonly');
        const store = transaction.objectStore('pendingCompletions');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          resolve(getAllRequest.result || []);
        };
        
        getAllRequest.onerror = () => resolve([]);
      };
      
      request.onerror = () => resolve([]);
    });
  }

  public async clearOfflineCompletions() {
    if (!this.config.enableOfflineMode) return;

    return new Promise<void>((resolve) => {
      const request = indexedDB.open('HabitLoopOffline', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['pendingCompletions'], 'readwrite');
        const store = transaction.objectStore('pendingCompletions');
        store.clear();
        resolve();
      };
      
      request.onerror = () => resolve();
    });
  }

  public getOnlineStatus() {
    return this.onlineStatus;
  }

  public getRegistration() {
    return this.registration;
  }

  public async updateServiceWorker() {
    if (this.registration) {
      await this.registration.update();
    }
  }

  public async unregisterServiceWorker() {
    if (this.registration) {
      await this.registration.unregister();
      console.log('🗑️ PWA: Service Worker unregistered');
    }
  }
}

// Create singleton instance
export const pwaManager = new PWAManager();

// Utility functions
export const isPWASupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://');
};

export const getPWADisplayMode = (): string => {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if ((window.navigator as any).standalone === true) {
    return 'ios-standalone';
  }
  return 'browser';
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const showNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options
    });
  }
};

export default pwaManager;
