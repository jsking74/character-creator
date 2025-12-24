import { isElectron, electronQuery, electronRun, electronGet } from '../utils/electron';
import { v4 as uuidv4 } from 'uuid';

export interface OfflineCharacter {
  id: string;
  user_id: string;
  system_id: string;
  name: string;
  character_data: string;
  image_url?: string;
  is_public: boolean;
  share_token?: string;
  created_at: string;
  updated_at: string;
  sync_status?: 'pending' | 'synced' | 'conflict';
}

export interface OfflineSystemConfig {
  id: string;
  name: string;
  version: string;
  description?: string;
  config_data: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Offline storage service for Electron app
 * Provides local SQLite database access when offline
 */
export class OfflineStorageService {
  /**
   * Check if offline storage is available
   */
  isAvailable(): boolean {
    return isElectron();
  }

  /**
   * Get all characters for a user from local storage
   */
  async getCharacters(userId: string): Promise<OfflineCharacter[]> {
    if (!this.isAvailable()) {
      throw new Error('Offline storage not available');
    }

    const characters = await electronQuery<OfflineCharacter>(
      'SELECT * FROM characters WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );

    return characters;
  }

  /**
   * Get a single character by ID
   */
  async getCharacter(id: string): Promise<OfflineCharacter | null> {
    if (!this.isAvailable()) {
      throw new Error('Offline storage not available');
    }

    const character = await electronGet<OfflineCharacter>(
      'SELECT * FROM characters WHERE id = ?',
      [id]
    );

    return character || null;
  }

  /**
   * Create a new character in local storage
   */
  async createCharacter(
    userId: string,
    systemId: string,
    name: string,
    characterData: any
  ): Promise<OfflineCharacter> {
    if (!this.isAvailable()) {
      throw new Error('Offline storage not available');
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await electronRun(
      `INSERT INTO characters (
        id, user_id, system_id, name, character_data,
        is_public, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, systemId, name, JSON.stringify(characterData), 0, now, now]
    );

    const character = await this.getCharacter(id);
    if (!character) {
      throw new Error('Failed to create character');
    }

    return character;
  }

  /**
   * Update a character in local storage
   */
  async updateCharacter(
    id: string,
    updates: {
      name?: string;
      character_data?: any;
      image_url?: string;
      is_public?: boolean;
    }
  ): Promise<OfflineCharacter> {
    if (!this.isAvailable()) {
      throw new Error('Offline storage not available');
    }

    const setClauses: string[] = [];
    const params: any[] = [];

    if (updates.name !== undefined) {
      setClauses.push('name = ?');
      params.push(updates.name);
    }
    if (updates.character_data !== undefined) {
      setClauses.push('character_data = ?');
      params.push(JSON.stringify(updates.character_data));
    }
    if (updates.image_url !== undefined) {
      setClauses.push('image_url = ?');
      params.push(updates.image_url);
    }
    if (updates.is_public !== undefined) {
      setClauses.push('is_public = ?');
      params.push(updates.is_public ? 1 : 0);
    }

    setClauses.push('updated_at = ?');
    params.push(new Date().toISOString());

    params.push(id);

    await electronRun(
      `UPDATE characters SET ${setClauses.join(', ')} WHERE id = ?`,
      params
    );

    const character = await this.getCharacter(id);
    if (!character) {
      throw new Error('Character not found');
    }

    return character;
  }

  /**
   * Delete a character from local storage
   */
  async deleteCharacter(id: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Offline storage not available');
    }

    await electronRun('DELETE FROM characters WHERE id = ?', [id]);
  }

  /**
   * Get all system configs from local storage
   */
  async getSystemConfigs(): Promise<OfflineSystemConfig[]> {
    if (!this.isAvailable()) {
      throw new Error('Offline storage not available');
    }

    const systems = await electronQuery<OfflineSystemConfig>(
      'SELECT * FROM system_configs WHERE is_active = 1 ORDER BY is_default DESC, name ASC'
    );

    return systems;
  }

  /**
   * Get a system config by ID
   */
  async getSystemConfig(id: string): Promise<OfflineSystemConfig | null> {
    if (!this.isAvailable()) {
      throw new Error('Offline storage not available');
    }

    const system = await electronGet<OfflineSystemConfig>(
      'SELECT * FROM system_configs WHERE id = ? AND is_active = 1',
      [id]
    );

    return system || null;
  }

  /**
   * Sync system configs from server to local storage
   */
  async syncSystemConfigs(systems: any[]): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Offline storage not available');
    }

    for (const system of systems) {
      const exists = await electronGet(
        'SELECT id FROM system_configs WHERE id = ?',
        [system.id]
      );

      if (exists) {
        await electronRun(
          `UPDATE system_configs SET
            name = ?, version = ?, description = ?,
            config_data = ?, is_active = ?, is_default = ?,
            updated_at = ?
          WHERE id = ?`,
          [
            system.name,
            system.version,
            system.description,
            JSON.stringify(system.config),
            system.isActive ? 1 : 0,
            system.isDefault ? 1 : 0,
            new Date().toISOString(),
            system.id,
          ]
        );
      } else {
        await electronRun(
          `INSERT INTO system_configs (
            id, name, version, description, config_data,
            is_active, is_default, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            system.id,
            system.name,
            system.version,
            system.description,
            JSON.stringify(system.config),
            system.isActive ? 1 : 0,
            system.isDefault ? 1 : 0,
            new Date().toISOString(),
            new Date().toISOString(),
          ]
        );
      }
    }

    // Update sync metadata
    await this.updateSyncMetadata('system_configs');
  }

  /**
   * Sync characters from server to local storage
   */
  async syncCharactersFromServer(characters: any[]): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Offline storage not available');
    }

    for (const char of characters) {
      const exists = await electronGet('SELECT id FROM characters WHERE id = ?', [char.id]);

      if (exists) {
        await electronRun(
          `UPDATE characters SET
            name = ?, system_id = ?, character_data = ?,
            image_url = ?, is_public = ?, share_token = ?,
            updated_at = ?
          WHERE id = ?`,
          [
            char.name,
            char.system_id,
            JSON.stringify(char.character_data),
            char.image_url,
            char.is_public ? 1 : 0,
            char.share_token,
            char.updated_at,
            char.id,
          ]
        );
      } else {
        await electronRun(
          `INSERT INTO characters (
            id, user_id, system_id, name, character_data,
            image_url, is_public, share_token, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            char.id,
            char.user_id,
            char.system_id,
            char.name,
            JSON.stringify(char.character_data),
            char.image_url,
            char.is_public ? 1 : 0,
            char.share_token,
            char.created_at,
            char.updated_at,
          ]
        );
      }
    }

    // Update sync metadata
    await this.updateSyncMetadata('characters');
  }

  /**
   * Get characters that need to be synced to server
   */
  async getPendingSyncCharacters(): Promise<OfflineCharacter[]> {
    if (!this.isAvailable()) {
      throw new Error('Offline storage not available');
    }

    // For now, we'll consider all characters as potentially needing sync
    // In a more sophisticated implementation, we'd track sync_status
    const lastSync = await this.getLastSyncTime('characters');

    if (!lastSync) {
      return [];
    }

    const characters = await electronQuery<OfflineCharacter>(
      'SELECT * FROM characters WHERE updated_at > ?',
      [lastSync]
    );

    return characters;
  }

  /**
   * Update sync metadata
   */
  private async updateSyncMetadata(tableName: string): Promise<void> {
    const now = new Date().toISOString();

    await electronRun(
      `INSERT OR REPLACE INTO sync_metadata (table_name, last_sync, sync_status)
       VALUES (?, ?, ?)`,
      [tableName, now, 'synced']
    );
  }

  /**
   * Get last sync time for a table
   */
  private async getLastSyncTime(tableName: string): Promise<string | null> {
    const result = await electronGet<{ last_sync: string }>(
      'SELECT last_sync FROM sync_metadata WHERE table_name = ?',
      [tableName]
    );

    return result?.last_sync || null;
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService();
