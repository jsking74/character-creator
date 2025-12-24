// Type definitions for Electron API
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
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

/**
 * Check if the app is running in Electron
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
}

/**
 * Get the Electron API if available
 */
export function getElectronAPI(): ElectronAPI | null {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return window.electronAPI;
  }
  return null;
}

/**
 * Execute a database query in Electron
 */
export async function electronQuery<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const api = getElectronAPI();
  if (!api) {
    throw new Error('Electron API not available');
  }
  return api.db.query(sql, params);
}

/**
 * Execute a database run command in Electron
 */
export async function electronRun(
  sql: string,
  params?: any[]
): Promise<{ changes: number; lastID: number }> {
  const api = getElectronAPI();
  if (!api) {
    throw new Error('Electron API not available');
  }
  return api.db.run(sql, params);
}

/**
 * Get a single row from database in Electron
 */
export async function electronGet<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
  const api = getElectronAPI();
  if (!api) {
    throw new Error('Electron API not available');
  }
  return api.db.get(sql, params);
}

/**
 * Get app version
 */
export async function getAppVersion(): Promise<string> {
  const api = getElectronAPI();
  if (!api) {
    return 'Web';
  }
  return api.app.getVersion();
}
