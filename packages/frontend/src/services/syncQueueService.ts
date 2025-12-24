import { syncQueueStore, SyncQueueItem, LocalCharacter, LocalParty } from './indexedDb';

export type EntityType = 'character' | 'party';
export type SyncAction = 'create' | 'update' | 'delete';

export interface QueuedOperation {
  entityType: EntityType;
  entityId: string;
  action: SyncAction;
  data: LocalCharacter | LocalParty | Record<string, unknown>;
}

class SyncQueueService {
  private maxRetries: number = 3;

  /**
   * Add an operation to the sync queue
   */
  async enqueue(operation: QueuedOperation): Promise<string> {
    // Remove any existing operations for the same entity
    // This prevents duplicate syncs for the same entity
    await syncQueueStore.removeByEntityId(operation.entityId);

    // Add the new operation
    const id = await syncQueueStore.add({
      entityType: operation.entityType,
      entityId: operation.entityId,
      action: operation.action,
      data: operation.data,
      timestamp: Date.now(),
      retryCount: 0,
    });

    return id;
  }

  /**
   * Get all pending operations
   */
  async getPending(): Promise<SyncQueueItem[]> {
    const items = await syncQueueStore.getAll();
    return items.filter((item) => item.retryCount < this.maxRetries);
  }

  /**
   * Get operations that have exceeded retry limit
   */
  async getFailed(): Promise<SyncQueueItem[]> {
    const items = await syncQueueStore.getAll();
    return items.filter((item) => item.retryCount >= this.maxRetries);
  }

  /**
   * Mark an operation as having failed (increment retry count)
   */
  async markFailed(id: string, error: string): Promise<void> {
    const items = await syncQueueStore.getAll();
    const item = items.find((i) => i.id === id);
    if (item) {
      item.retryCount += 1;
      item.lastError = error;
      await syncQueueStore.update(item);
    }
  }

  /**
   * Remove an operation from the queue (after successful sync)
   */
  async dequeue(id: string): Promise<void> {
    await syncQueueStore.remove(id);
  }

  /**
   * Remove all operations for an entity
   */
  async removeByEntity(entityId: string): Promise<void> {
    await syncQueueStore.removeByEntityId(entityId);
  }

  /**
   * Get the count of pending operations
   */
  async getPendingCount(): Promise<number> {
    return syncQueueStore.count();
  }

  /**
   * Clear all operations
   */
  async clear(): Promise<void> {
    await syncQueueStore.clear();
  }

  /**
   * Process the queue and return operations in order
   */
  async getOrderedQueue(): Promise<SyncQueueItem[]> {
    const items = await this.getPending();
    // Sort by timestamp (oldest first)
    return items.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Check if there are operations for a specific entity
   */
  async hasOperationsFor(entityId: string): Promise<boolean> {
    const items = await syncQueueStore.getAll();
    return items.some((item) => item.entityId === entityId);
  }

  /**
   * Get the latest operation for an entity
   */
  async getLatestFor(entityId: string): Promise<SyncQueueItem | null> {
    const items = await syncQueueStore.getAll();
    const entityItems = items
      .filter((item) => item.entityId === entityId)
      .sort((a, b) => b.timestamp - a.timestamp);
    return entityItems[0] || null;
  }
}

// Singleton instance
export const syncQueueService = new SyncQueueService();

// Export class for testing
export { SyncQueueService };
