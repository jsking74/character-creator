import { useState, useEffect, useCallback } from 'react';
import { offlineService } from '../services/offlineService';

export interface UseOfflineReturn {
  isOnline: boolean;
  checkConnection: () => Promise<boolean>;
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState<boolean>(offlineService.getStatus());

  useEffect(() => {
    // Subscribe to offline service
    const unsubscribe = offlineService.subscribe((online) => {
      setIsOnline(online);
    });

    // Start periodic checks
    offlineService.startPeriodicCheck();

    return () => {
      unsubscribe();
    };
  }, []);

  const checkConnection = useCallback(async () => {
    return offlineService.forceCheck();
  }, []);

  return {
    isOnline,
    checkConnection,
  };
}
