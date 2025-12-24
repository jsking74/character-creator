/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Electron API types
interface ElectronAPI {
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
    electronAPI?: ElectronAPI;
  }
}
