type OnlineStatusCallback = (isOnline: boolean) => void;

class OfflineService {
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<OnlineStatusCallback> = new Set();
  private pingUrl: string = '/api/health';
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private pingIntervalMs: number = 30000; // 30 seconds

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = (): void => {
    // Browser says we're online, verify with a ping
    this.verifyConnection().then((actuallyOnline) => {
      if (actuallyOnline && !this.isOnline) {
        this.isOnline = true;
        this.notifyListeners();
      }
    });
  };

  private handleOffline = (): void => {
    if (this.isOnline) {
      this.isOnline = false;
      this.notifyListeners();
    }
  };

  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.isOnline);
      } catch (error) {
        console.error('Error in offline listener callback:', error);
      }
    });
  }

  /**
   * Verify the connection by pinging the server
   */
  async verifyConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(this.pingUrl, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get current online status
   */
  getStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Subscribe to online/offline status changes
   */
  subscribe(callback: OnlineStatusCallback): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Start periodic connection checks
   */
  startPeriodicCheck(): void {
    if (this.pingInterval) {
      return;
    }

    this.pingInterval = setInterval(async () => {
      const wasOnline = this.isOnline;
      const nowOnline = await this.verifyConnection();

      if (wasOnline !== nowOnline) {
        this.isOnline = nowOnline;
        this.notifyListeners();
      }
    }, this.pingIntervalMs);
  }

  /**
   * Stop periodic connection checks
   */
  stopPeriodicCheck(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Force a connection check
   */
  async forceCheck(): Promise<boolean> {
    const wasOnline = this.isOnline;
    const nowOnline = await this.verifyConnection();

    if (wasOnline !== nowOnline) {
      this.isOnline = nowOnline;
      this.notifyListeners();
    }

    return nowOnline;
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.stopPeriodicCheck();
    this.listeners.clear();
  }
}

// Singleton instance
export const offlineService = new OfflineService();

// Export class for testing
export { OfflineService };
