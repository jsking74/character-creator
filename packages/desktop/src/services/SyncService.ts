import { DatabaseManager } from '../database/DatabaseManager.js';

export interface SyncOptions {
  apiBaseUrl: string;
  authToken?: string;
}

export interface SyncStatus {
  lastSync: Date | null;
  pendingChanges: number;
  status: 'idle' | 'syncing' | 'error';
  errorMessage?: string;
}

export interface SyncResult {
  success: boolean;
  pulledCount: number;
  pushedCount: number;
  conflicts: number;
  errorMessage?: string;
}

/**
 * SyncService handles bidirectional synchronization between local SQLite
 * database and remote API. Implements offline-first strategy where local
 * data is always accessible and syncs when online.
 */
export class SyncService {
  private db: DatabaseManager;
  private options: SyncOptions;
  private syncStatus: SyncStatus;
  private isOnline: boolean = true; // Assume online by default
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(db: DatabaseManager, options: SyncOptions) {
    this.db = db;
    this.options = options;
    this.syncStatus = {
      lastSync: null,
      pendingChanges: 0,
      status: 'idle',
    };
  }

  /**
   * Set online status (called from renderer process)
   */
  setOnlineStatus(isOnline: boolean): void {
    const wasOffline = !this.isOnline;
    this.isOnline = isOnline;

    // If we just came online, trigger a sync
    if (wasOffline && isOnline) {
      this.sync();
    }
  }

  /**
   * Start automatic sync every interval (default 5 minutes)
   */
  startAutoSync(intervalMs: number = 5 * 60 * 1000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.sync();
      }
    }, intervalMs);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform full bidirectional sync
   */
  async sync(): Promise<SyncResult> {
    if (!this.isOnline) {
      return {
        success: false,
        pulledCount: 0,
        pushedCount: 0,
        conflicts: 0,
        errorMessage: 'Device is offline',
      };
    }

    if (this.syncStatus.status === 'syncing') {
      return {
        success: false,
        pulledCount: 0,
        pushedCount: 0,
        conflicts: 0,
        errorMessage: 'Sync already in progress',
      };
    }

    this.syncStatus.status = 'syncing';

    try {
      // Step 1: Push local changes to server
      const pushedCount = await this.pushLocalChanges();

      // Step 2: Pull remote changes from server
      const pulledCount = await this.pullRemoteChanges();

      // Update sync status
      this.syncStatus.lastSync = new Date();
      this.syncStatus.pendingChanges = 0;
      this.syncStatus.status = 'idle';
      this.syncStatus.errorMessage = undefined;

      // Update sync metadata
      await this.updateSyncMetadata();

      return {
        success: true,
        pulledCount,
        pushedCount,
        conflicts: 0,
      };
    } catch (error: any) {
      this.syncStatus.status = 'error';
      this.syncStatus.errorMessage = error.message;

      return {
        success: false,
        pulledCount: 0,
        pushedCount: 0,
        conflicts: 0,
        errorMessage: error.message,
      };
    }
  }

  /**
   * Push local changes to remote server
   */
  private async pushLocalChanges(): Promise<number> {
    if (!this.options.authToken) {
      throw new Error('Authentication token required for sync');
    }

    let pushedCount = 0;

    // Get all local characters that haven't been synced or have been modified
    const localCharacters = await this.db.query(
      `SELECT * FROM characters
       WHERE updated_at > (
         SELECT last_sync FROM sync_metadata WHERE table_name = 'characters'
       ) OR id NOT IN (
         SELECT id FROM characters WHERE id IN (SELECT id FROM sync_metadata)
       )`
    );

    for (const character of localCharacters) {
      try {
        // Check if character exists on server
        const existsResponse = await fetch(
          `${this.options.apiBaseUrl}/characters/${character.id}`,
          {
            headers: {
              'Authorization': `Bearer ${this.options.authToken}`,
            },
          }
        );

        if (existsResponse.ok) {
          // Update existing character
          const response = await fetch(
            `${this.options.apiBaseUrl}/characters/${character.id}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.options.authToken}`,
              },
              body: JSON.stringify({
                name: character.name,
                character_data: JSON.parse(character.character_data),
                image_url: character.image_url,
                is_public: Boolean(character.is_public),
              }),
            }
          );

          if (response.ok) {
            pushedCount++;
          }
        } else if (existsResponse.status === 404) {
          // Create new character
          const response = await fetch(
            `${this.options.apiBaseUrl}/characters`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.options.authToken}`,
              },
              body: JSON.stringify({
                name: character.name,
                system_id: character.system_id,
                character_data: JSON.parse(character.character_data),
                image_url: character.image_url,
                is_public: Boolean(character.is_public),
              }),
            }
          );

          if (response.ok) {
            pushedCount++;
          }
        }
      } catch (error) {
        console.error(`Failed to push character ${character.id}:`, error);
      }
    }

    return pushedCount;
  }

  /**
   * Pull remote changes from server
   */
  private async pullRemoteChanges(): Promise<number> {
    if (!this.options.authToken) {
      throw new Error('Authentication token required for sync');
    }

    let pulledCount = 0;

    try {
      // Get all characters from server
      const response = await fetch(
        `${this.options.apiBaseUrl}/characters`,
        {
          headers: {
            'Authorization': `Bearer ${this.options.authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch characters: ${response.statusText}`);
      }

      const data = (await response.json()) as { characters?: any[] };
      const remoteCharacters = data.characters || [];

      for (const character of remoteCharacters) {
        try {
          // Check if character exists locally
          const localCharacter = await this.db.get(
            'SELECT * FROM characters WHERE id = ?',
            [character.id]
          );

          if (localCharacter) {
            // Compare timestamps and update if remote is newer
            const localUpdated = new Date(localCharacter.updated_at);
            const remoteUpdated = new Date(character.updatedAt);

            if (remoteUpdated > localUpdated) {
              await this.db.run(
                `UPDATE characters
                 SET name = ?,
                     system_id = ?,
                     character_data = ?,
                     image_url = ?,
                     is_public = ?,
                     updated_at = ?
                 WHERE id = ?`,
                [
                  character.name,
                  character.system,
                  JSON.stringify(character),
                  character.imageUrl || null,
                  character.isPublic ? 1 : 0,
                  character.updatedAt,
                  character.id,
                ]
              );
              pulledCount++;
            }
          } else {
            // Insert new character
            await this.db.run(
              `INSERT INTO characters (
                id, user_id, system_id, name, character_data,
                image_url, is_public, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                character.id,
                'local-user', // TODO: Get actual user ID
                character.system,
                character.name,
                JSON.stringify(character),
                character.imageUrl || null,
                character.isPublic ? 1 : 0,
                character.createdAt,
                character.updatedAt,
              ]
            );
            pulledCount++;
          }
        } catch (error) {
          console.error(`Failed to pull character ${character.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to pull remote changes:', error);
      throw error;
    }

    return pulledCount;
  }

  /**
   * Update sync metadata table
   */
  private async updateSyncMetadata(): Promise<void> {
    await this.db.run(
      `INSERT OR REPLACE INTO sync_metadata (table_name, last_sync, sync_status)
       VALUES ('characters', datetime('now'), 'synced')`,
      []
    );
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Check if device is online
   */
  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Force sync now (if online)
   */
  async forceSyncNow(): Promise<SyncResult> {
    return this.sync();
  }
}
