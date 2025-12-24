import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use ipcRenderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  db: {
    query: (sql: string, params?: any[]) => ipcRenderer.invoke('db:query', sql, params),
    run: (sql: string, params?: any[]) => ipcRenderer.invoke('db:run', sql, params),
    get: (sql: string, params?: any[]) => ipcRenderer.invoke('db:get', sql, params),
  },

  // App information
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    isElectron: () => ipcRenderer.invoke('app:isElectron'),
  },

  // Character operations
  characters: {
    create: (userId: string, input: any) => ipcRenderer.invoke('characters:create', userId, input),
    getById: (id: string, userId: string) => ipcRenderer.invoke('characters:getById', id, userId),
    getByUserId: (userId: string, filters?: any) => ipcRenderer.invoke('characters:getByUserId', userId, filters),
    update: (id: string, userId: string, updates: any) => ipcRenderer.invoke('characters:update', id, userId, updates),
    delete: (id: string, userId: string) => ipcRenderer.invoke('characters:delete', id, userId),
  },

  // Sync operations
  sync: {
    status: () => ipcRenderer.invoke('sync:status'),
    isOnline: () => ipcRenderer.invoke('sync:isOnline'),
    now: () => ipcRenderer.invoke('sync:now'),
    setAuthToken: (token: string) => ipcRenderer.invoke('sync:setAuthToken', token),
    setOnlineStatus: (isOnline: boolean) => ipcRenderer.invoke('sync:setOnlineStatus', isOnline),
    startAuto: (intervalMs?: number) => ipcRenderer.invoke('sync:startAuto', intervalMs),
    stopAuto: () => ipcRenderer.invoke('sync:stopAuto'),
  },
});

// Type definitions for TypeScript
export interface ElectronAPI {
  db: {
    query: (sql: string, params?: any[]) => Promise<any[]>;
    run: (sql: string, params?: any[]) => Promise<{ changes: number; lastID: number }>;
    get: (sql: string, params?: any[]) => Promise<any>;
  };
  app: {
    getVersion: () => Promise<string>;
    isElectron: () => Promise<boolean>;
  };
  characters: {
    create: (userId: string, input: any) => Promise<any>;
    getById: (id: string, userId: string) => Promise<any | null>;
    getByUserId: (userId: string, filters?: any) => Promise<{ characters: any[]; total: number }>;
    update: (id: string, userId: string, updates: any) => Promise<any>;
    delete: (id: string, userId: string) => Promise<boolean>;
  };
  sync: {
    status: () => Promise<{
      lastSync: Date | null;
      pendingChanges: number;
      status: 'idle' | 'syncing' | 'error';
      errorMessage?: string;
    }>;
    isOnline: () => Promise<boolean>;
    now: () => Promise<{
      success: boolean;
      pulledCount: number;
      pushedCount: number;
      conflicts: number;
      errorMessage?: string;
    }>;
    setAuthToken: (token: string) => Promise<void>;
    setOnlineStatus: (isOnline: boolean) => Promise<void>;
    startAuto: (intervalMs?: number) => Promise<void>;
    stopAuto: () => Promise<void>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
