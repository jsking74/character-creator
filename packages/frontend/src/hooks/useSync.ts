/// <reference types="vite/client" />
import { useEffect, useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { syncService } from '../services/syncService';
import { loadSyncState, resolveConflict } from '../store/syncSlice';
import { ConflictRecord } from '../services/indexedDb';

export interface UseSyncReturn {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  conflictCount: number;
  conflicts: ConflictRecord[];
  lastSyncedAt: string | null;
  error: string | null;
  sync: () => Promise<void>;
  resolveConflict: (conflictId: string, resolution: 'local' | 'server') => Promise<void>;
}

/**
 * useSync hook - handles both web (IndexedDB + service workers) and
 * desktop (Electron IPC) synchronization automatically
 */
export function useSync(): UseSyncReturn {
  const dispatch = useAppDispatch();
  const webSyncState = useAppSelector((state) => state.sync);

  // Electron-specific state
  const [isElectron, setIsElectron] = useState(false);
  const [electronSyncStatus, setElectronSyncStatus] = useState({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingChanges: 0,
    lastSync: null as Date | null,
    error: null as string | null,
  });

  // Check if running in Electron
  useEffect(() => {
    const checkElectron = async () => {
      if (window.electronAPI) {
        try {
          const isElectronApp = await window.electronAPI.app.isElectron();
          setIsElectron(isElectronApp);

          if (isElectronApp) {
            const electronAPI = window.electronAPI as any;
            if (electronAPI.sync) {
              // Start auto-sync (every 5 minutes)
              await electronAPI.sync.startAuto();
            }
          }
        } catch (error) {
          console.error('Failed to check Electron status:', error);
        }
      }
    };

    checkElectron();
  }, []);

  // Web-based sync initialization
  useEffect(() => {
    if (isElectron) return; // Skip web sync if in Electron

    // Initialize sync service on mount
    syncService.initialize();

    // Load initial sync state
    dispatch(loadSyncState());

    return () => {
      // Clean up sync service on unmount
      syncService.destroy();
    };
  }, [dispatch, isElectron]);

  // Electron sync status polling
  useEffect(() => {
    if (!isElectron) return;

    const updateElectronSyncStatus = async () => {
      const electronAPI = window.electronAPI as any;
      if (!electronAPI?.sync) return;

      try {
        const status = await electronAPI.sync.status();
        const isOnline = await electronAPI.sync.isOnline();

        setElectronSyncStatus({
          isOnline,
          isSyncing: status.status === 'syncing',
          pendingChanges: status.pendingChanges,
          lastSync: status.lastSync,
          error: status.errorMessage || null,
        });
      } catch (error) {
        console.error('Failed to get Electron sync status:', error);
      }
    };

    // Initial update
    updateElectronSyncStatus();

    // Poll every 5 seconds
    const interval = setInterval(updateElectronSyncStatus, 5000);

    return () => clearInterval(interval);
  }, [isElectron]);

  // Online/offline detection for Electron
  useEffect(() => {
    if (!isElectron) return;

    const handleOnline = () => {
      setElectronSyncStatus(prev => ({ ...prev, isOnline: true }));
      const electronAPI = window.electronAPI as any;
      if (electronAPI?.sync) {
        electronAPI.sync.setOnlineStatus(true);
      }
    };

    const handleOffline = () => {
      setElectronSyncStatus(prev => ({ ...prev, isOnline: false }));
      const electronAPI = window.electronAPI as any;
      if (electronAPI?.sync) {
        electronAPI.sync.setOnlineStatus(false);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isElectron]);

  const triggerSync = useCallback(async () => {
    const electronAPI = window.electronAPI as any;
    if (isElectron && electronAPI?.sync) {
      // Electron sync
      try {
        setElectronSyncStatus(prev => ({ ...prev, isSyncing: true }));
        const result = await electronAPI.sync.now();

        if (!result.success) {
          setElectronSyncStatus(prev => ({
            ...prev,
            isSyncing: false,
            error: result.errorMessage || 'Sync failed'
          }));
        } else {
          setElectronSyncStatus(prev => ({
            ...prev,
            isSyncing: false,
            error: null,
            pendingChanges: 0,
            lastSync: new Date(),
          }));
        }
      } catch (error) {
        console.error('Electron sync failed:', error);
        setElectronSyncStatus(prev => ({
          ...prev,
          isSyncing: false,
          error: error instanceof Error ? error.message : 'Sync failed'
        }));
      }
    } else {
      // Web sync
      await syncService.sync();
    }
  }, [isElectron]);

  const handleResolveConflict = useCallback(
    async (conflictId: string, resolution: 'local' | 'server') => {
      if (isElectron) {
        // Electron doesn't have conflict resolution UI yet
        console.warn('Conflict resolution not implemented for Electron');
        return;
      }

      await syncService.resolveConflict(conflictId, resolution);
      dispatch(resolveConflict({ id: conflictId, resolution }));
    },
    [dispatch, isElectron]
  );

  // Return appropriate state based on environment
  if (isElectron) {
    return {
      isOnline: electronSyncStatus.isOnline,
      isSyncing: electronSyncStatus.isSyncing,
      pendingCount: electronSyncStatus.pendingChanges,
      conflictCount: 0, // Electron uses last-write-wins, no conflicts
      conflicts: [],
      lastSyncedAt: electronSyncStatus.lastSync?.toISOString() || null,
      error: electronSyncStatus.error,
      sync: triggerSync,
      resolveConflict: handleResolveConflict,
    };
  }

  return {
    isOnline: webSyncState.isOnline,
    isSyncing: webSyncState.isSyncing,
    pendingCount: webSyncState.pendingCount,
    conflictCount: webSyncState.conflictCount,
    conflicts: webSyncState.conflicts,
    lastSyncedAt: webSyncState.lastSyncedAt,
    error: webSyncState.error,
    sync: triggerSync,
    resolveConflict: handleResolveConflict,
  };
}
