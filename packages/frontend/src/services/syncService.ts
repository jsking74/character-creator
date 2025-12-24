import { axiosInstance } from './authService';
import { offlineService } from './offlineService';
import { syncQueueService } from './syncQueueService';
import {
  characterStore,
  partyStore,
  conflictStore,
  metadataStore,
  LocalCharacter,
  LocalParty,
  SyncQueueItem,
} from './indexedDb';
import { store } from '../store';
import {
  setOnlineStatus,
  setSyncing,
  setLastSyncedAt,
  setSyncError,
  loadSyncState,
  addConflict,
} from '../store/syncSlice';

type SyncCallback = (status: SyncStatus) => void;

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  conflictCount: number;
  lastSyncedAt: string | null;
  error: string | null;
}

class SyncService {
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private syncIntervalMs: number = 60000; // 1 minute
  private isSyncing: boolean = false;
  private listeners: Set<SyncCallback> = new Set();
  private unsubscribeOffline: (() => void) | null = null;

  /**
   * Initialize the sync service
   */
  async initialize(): Promise<void> {
    // Load initial sync state
    await store.dispatch(loadSyncState());

    // Subscribe to online/offline changes
    this.unsubscribeOffline = offlineService.subscribe((isOnline) => {
      store.dispatch(setOnlineStatus(isOnline));
      if (isOnline) {
        // When coming back online, trigger a sync
        this.sync();
      }
    });

    // Set initial online status
    store.dispatch(setOnlineStatus(offlineService.getStatus()));

    // Start periodic sync checks
    this.startPeriodicSync();
  }

  /**
   * Clean up the sync service
   */
  destroy(): void {
    this.stopPeriodicSync();
    if (this.unsubscribeOffline) {
      this.unsubscribeOffline();
    }
    this.listeners.clear();
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(callback: SyncCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync(): void {
    if (this.syncInterval) {
      return;
    }

    this.syncInterval = setInterval(() => {
      if (offlineService.getStatus()) {
        this.sync();
      }
    }, this.syncIntervalMs);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform a full sync
   */
  async sync(): Promise<void> {
    if (this.isSyncing || !offlineService.getStatus()) {
      return;
    }

    this.isSyncing = true;
    store.dispatch(setSyncing(true));
    store.dispatch(setSyncError(null));

    try {
      // Process the sync queue
      await this.processSyncQueue();

      // Pull latest data from server
      await this.pullFromServer();

      // Update last synced timestamp
      const now = new Date().toISOString();
      store.dispatch(setLastSyncedAt(now));
      await metadataStore.set('lastSyncedAt', now);

      // Reload sync state
      await store.dispatch(loadSyncState());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      store.dispatch(setSyncError(errorMessage));
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
      store.dispatch(setSyncing(false));
    }
  }

  /**
   * Process all pending operations in the sync queue
   */
  private async processSyncQueue(): Promise<void> {
    const queue = await syncQueueService.getOrderedQueue();

    for (const item of queue) {
      try {
        await this.processQueueItem(item);
        await syncQueueService.dequeue(item.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Operation failed';
        await syncQueueService.markFailed(item.id, errorMessage);

        // Check if this is a conflict (409 status)
        if (this.isConflictError(error)) {
          await this.handleConflict(item);
        }
      }
    }
  }

  /**
   * Process a single queue item
   */
  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    const { entityType, entityId, action, data } = item;

    switch (entityType) {
      case 'character':
        await this.syncCharacter(entityId, action, data);
        break;
      case 'party':
        await this.syncParty(entityId, action, data);
        break;
    }
  }

  /**
   * Sync a character operation
   */
  private async syncCharacter(
    id: string,
    action: 'create' | 'update' | 'delete',
    data: LocalCharacter | LocalParty | Record<string, unknown>
  ): Promise<void> {
    switch (action) {
      case 'create':
        await axiosInstance.post('/api/characters', data);
        break;
      case 'update':
        await axiosInstance.put(`/api/characters/${id}`, data);
        break;
      case 'delete':
        await axiosInstance.delete(`/api/characters/${id}`);
        break;
    }

    // Update local sync status
    const localCharacter = await characterStore.getById(id);
    if (localCharacter && action !== 'delete') {
      localCharacter.syncStatus = 'synced';
      localCharacter.lastSyncedAt = new Date().toISOString();
      await characterStore.save(localCharacter);
    }
  }

  /**
   * Sync a party operation
   */
  private async syncParty(
    id: string,
    action: 'create' | 'update' | 'delete',
    data: LocalCharacter | LocalParty | Record<string, unknown>
  ): Promise<void> {
    switch (action) {
      case 'create':
        await axiosInstance.post('/api/parties', data);
        break;
      case 'update':
        await axiosInstance.put(`/api/parties/${id}`, data);
        break;
      case 'delete':
        await axiosInstance.delete(`/api/parties/${id}`);
        break;
    }

    // Update local sync status
    const localParty = await partyStore.getById(id);
    if (localParty && action !== 'delete') {
      localParty.syncStatus = 'synced';
      localParty.lastSyncedAt = new Date().toISOString();
      await partyStore.save(localParty);
    }
  }

  /**
   * Pull latest data from server
   */
  private async pullFromServer(): Promise<void> {
    try {
      // Fetch characters
      const charactersResponse = await axiosInstance.get('/api/characters');
      const serverCharacters = charactersResponse.data;

      // Get local characters
      const state = store.getState();
      const userId = state.auth.user?.id;
      if (!userId) return;

      const localCharacters = await characterStore.getAll(userId);

      // Merge server data with local data
      for (const serverChar of serverCharacters) {
        const localChar = localCharacters.find((c) => c.id === serverChar.id);

        if (!localChar || localChar.syncStatus === 'synced') {
          // No local version or local is synced - use server version
          await characterStore.save(this.serverToLocal(serverChar, 'synced'));
        } else if (localChar.syncStatus === 'pending') {
          // Local has pending changes - check for conflict
          const serverUpdated = new Date(serverChar.updatedAt).getTime();
          const lastSynced = localChar.lastSyncedAt
            ? new Date(localChar.lastSyncedAt).getTime()
            : 0;

          if (serverUpdated > lastSynced) {
            // Server was updated after our last sync - conflict!
            await this.createConflict('character', localChar, this.serverToLocal(serverChar, 'synced'));
          }
        }
      }

      // Handle deleted characters (present locally but not on server)
      for (const localChar of localCharacters) {
        const stillExists = serverCharacters.some((s: { id: string }) => s.id === localChar.id);
        if (!stillExists && localChar.syncStatus === 'synced') {
          // Server deleted this character and we haven't modified it
          await characterStore.delete(localChar.id);
        }
      }

      // Do the same for parties
      const partiesResponse = await axiosInstance.get('/api/parties');
      const serverParties = partiesResponse.data;
      const localParties = await partyStore.getAll(userId);

      for (const serverParty of serverParties) {
        const localParty = localParties.find((p) => p.id === serverParty.id);

        if (!localParty || localParty.syncStatus === 'synced') {
          await partyStore.save(this.serverPartyToLocal(serverParty, 'synced'));
        }
      }

      for (const localParty of localParties) {
        const stillExists = serverParties.some((s: { id: string }) => s.id === localParty.id);
        if (!stillExists && localParty.syncStatus === 'synced') {
          await partyStore.delete(localParty.id);
        }
      }
    } catch (error) {
      console.error('Error pulling from server:', error);
      throw error;
    }
  }

  /**
   * Convert server character to local format
   */
  private serverToLocal(
    serverChar: Record<string, unknown>,
    syncStatus: 'synced' | 'pending' | 'conflict'
  ): LocalCharacter {
    return {
      id: serverChar.id as string,
      userId: serverChar.userId as string,
      name: serverChar.name as string,
      system: serverChar.system as string,
      class: serverChar.class as string,
      race: serverChar.race as string,
      level: serverChar.level as number,
      alignment: serverChar.alignment as string | undefined,
      background: serverChar.background as string | undefined,
      backstory: serverChar.backstory as string | undefined,
      abilityScores: serverChar.abilityScores as LocalCharacter['abilityScores'],
      abilityModifiers: serverChar.abilityModifiers as LocalCharacter['abilityModifiers'],
      health: serverChar.health as LocalCharacter['health'],
      gold: serverChar.gold as number,
      isPublic: serverChar.isPublic as boolean,
      imageUrl: serverChar.imageUrl as string | undefined,
      createdAt: serverChar.createdAt as string,
      updatedAt: serverChar.updatedAt as string,
      syncStatus,
      lastSyncedAt: new Date().toISOString(),
      localUpdatedAt: serverChar.updatedAt as string,
    };
  }

  /**
   * Convert server party to local format
   */
  private serverPartyToLocal(
    serverParty: Record<string, unknown>,
    syncStatus: 'synced' | 'pending' | 'conflict'
  ): LocalParty {
    return {
      id: serverParty.id as string,
      userId: serverParty.userId as string,
      name: serverParty.name as string,
      description: serverParty.description as string | undefined,
      maxSize: serverParty.maxSize as number,
      isPublic: serverParty.isPublic as boolean,
      members: serverParty.members as LocalParty['members'],
      createdAt: serverParty.createdAt as string,
      updatedAt: serverParty.updatedAt as string,
      syncStatus,
      lastSyncedAt: new Date().toISOString(),
      localUpdatedAt: serverParty.updatedAt as string,
    };
  }

  /**
   * Create a conflict record
   */
  private async createConflict(
    entityType: 'character' | 'party',
    localVersion: LocalCharacter | LocalParty,
    serverVersion: LocalCharacter | LocalParty
  ): Promise<void> {
    const conflictId = await conflictStore.add({
      entityType,
      entityId: localVersion.id,
      localVersion,
      serverVersion,
      detectedAt: new Date().toISOString(),
    });

    // Update local entity to conflict status
    if (entityType === 'character') {
      const char = localVersion as LocalCharacter;
      char.syncStatus = 'conflict';
      await characterStore.save(char);
    } else {
      const party = localVersion as LocalParty;
      party.syncStatus = 'conflict';
      await partyStore.save(party);
    }

    // Dispatch conflict to store
    const conflict = await conflictStore.getById(conflictId);
    if (conflict) {
      store.dispatch(addConflict(conflict));
    }
  }

  /**
   * Handle a conflict from a sync operation
   */
  private async handleConflict(item: SyncQueueItem): Promise<void> {
    const { entityType, entityId } = item;

    try {
      // Fetch the server version
      let serverData: Record<string, unknown>;
      if (entityType === 'character') {
        const response = await axiosInstance.get(`/api/characters/${entityId}`);
        serverData = response.data;
      } else {
        const response = await axiosInstance.get(`/api/parties/${entityId}`);
        serverData = response.data;
      }

      // Get local version
      let localVersion: LocalCharacter | LocalParty | undefined;
      if (entityType === 'character') {
        localVersion = await characterStore.getById(entityId);
      } else {
        localVersion = await partyStore.getById(entityId);
      }

      if (localVersion) {
        const serverVersion = entityType === 'character'
          ? this.serverToLocal(serverData, 'synced')
          : this.serverPartyToLocal(serverData, 'synced');
        await this.createConflict(entityType, localVersion, serverVersion);
      }
    } catch (error) {
      console.error('Error handling conflict:', error);
    }
  }

  /**
   * Check if an error is a conflict error (409)
   */
  private isConflictError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } };
      return axiosError.response?.status === 409;
    }
    return false;
  }

  /**
   * Resolve a conflict by choosing local or server version
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'server'
  ): Promise<void> {
    const conflict = await conflictStore.getById(conflictId);
    if (!conflict) {
      throw new Error('Conflict not found');
    }

    const { entityType, entityId, localVersion, serverVersion } = conflict;

    if (resolution === 'server') {
      // Use server version
      if (entityType === 'character') {
        await characterStore.save(serverVersion as LocalCharacter);
      } else {
        await partyStore.save(serverVersion as LocalParty);
      }
      // Remove from sync queue
      await syncQueueService.removeByEntity(entityId);
    } else {
      // Use local version - re-queue for sync
      const localData = localVersion as LocalCharacter | LocalParty;
      localData.syncStatus = 'pending';

      if (entityType === 'character') {
        await characterStore.save(localData as LocalCharacter);
        await syncQueueService.enqueue({
          entityType: 'character',
          entityId,
          action: 'update',
          data: localData,
        });
      } else {
        await partyStore.save(localData as LocalParty);
        await syncQueueService.enqueue({
          entityType: 'party',
          entityId,
          action: 'update',
          data: localData,
        });
      }
    }

    // Mark conflict as resolved
    await conflictStore.resolve(conflictId, resolution);

    // Reload sync state
    await store.dispatch(loadSyncState());

    // If we chose local, trigger a sync
    if (resolution === 'local' && offlineService.getStatus()) {
      this.sync();
    }
  }

  /**
   * Save a character locally and queue for sync
   */
  async saveCharacterOffline(
    character: LocalCharacter,
    action: 'create' | 'update'
  ): Promise<void> {
    character.syncStatus = offlineService.getStatus() ? 'pending' : 'pending';
    character.localUpdatedAt = new Date().toISOString();

    await characterStore.save(character);
    await syncQueueService.enqueue({
      entityType: 'character',
      entityId: character.id,
      action,
      data: character,
    });

    // If online, trigger sync immediately
    if (offlineService.getStatus()) {
      this.sync();
    }
  }

  /**
   * Delete a character locally and queue for sync
   */
  async deleteCharacterOffline(characterId: string): Promise<void> {
    await characterStore.delete(characterId);
    await syncQueueService.enqueue({
      entityType: 'character',
      entityId: characterId,
      action: 'delete',
      data: {},
    });

    // If online, trigger sync immediately
    if (offlineService.getStatus()) {
      this.sync();
    }
  }

  /**
   * Save a party locally and queue for sync
   */
  async savePartyOffline(
    party: LocalParty,
    action: 'create' | 'update'
  ): Promise<void> {
    party.syncStatus = 'pending';
    party.localUpdatedAt = new Date().toISOString();

    await partyStore.save(party);
    await syncQueueService.enqueue({
      entityType: 'party',
      entityId: party.id,
      action,
      data: party,
    });

    // If online, trigger sync immediately
    if (offlineService.getStatus()) {
      this.sync();
    }
  }

  /**
   * Delete a party locally and queue for sync
   */
  async deletePartyOffline(partyId: string): Promise<void> {
    await partyStore.delete(partyId);
    await syncQueueService.enqueue({
      entityType: 'party',
      entityId: partyId,
      action: 'delete',
      data: {},
    });

    // If online, trigger sync immediately
    if (offlineService.getStatus()) {
      this.sync();
    }
  }

  /**
   * Get all local characters
   */
  async getLocalCharacters(userId: string): Promise<LocalCharacter[]> {
    return characterStore.getAll(userId);
  }

  /**
   * Get all local parties
   */
  async getLocalParties(userId: string): Promise<LocalParty[]> {
    return partyStore.getAll(userId);
  }
}

// Singleton instance
export const syncService = new SyncService();

// Export class for testing
export { SyncService };
